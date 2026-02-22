import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { WeatherResponse, CurrentWeather, HourlyWeather, DailyWeather, WeatherCondition } from '../models/weather.model';

// Free API response types
interface FreeCurrentWeatherResponse {
  coord: { lon: number; lat: number };
  weather: WeatherCondition[];
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  visibility: number;
  wind: { speed: number; deg: number; gust?: number };
  clouds: { all: number };
  dt: number;
  sys: { sunrise: number; sunset: number; country: string };
  timezone: number;
  name: string;
}

interface FreeForecastResponse {
  list: {
    dt: number;
    main: {
      temp: number;
      feels_like: number;
      temp_min: number;
      temp_max: number;
      pressure: number;
      humidity: number;
    };
    weather: WeatherCondition[];
    clouds: { all: number };
    wind: { speed: number; deg: number; gust?: number };
    visibility: number;
    pop: number;
    rain?: { '3h': number };
    snow?: { '3h': number };
    dt_txt: string;
  }[];
  city: {
    timezone: number;
    sunrise: number;
    sunset: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  private readonly CURRENT_API_URL = 'https://api.openweathermap.org/data/2.5/weather';
  private readonly FORECAST_API_URL = 'https://api.openweathermap.org/data/2.5/forecast';

  constructor(private http: HttpClient) {}

  /**
   * Get weather data for a specific location using OpenWeatherMap Free API
   * Combines current weather and 5-day forecast into a unified response
   * @param lat Latitude of the location
   * @param lon Longitude of the location
   * @returns Observable of weather data
   */
  getWeather(lat: number, lon: number): Observable<WeatherResponse> {
    const params = new HttpParams()
      .set('lat', lat.toString())
      .set('lon', lon.toString())
      .set('units', 'metric')
      .set('appid', environment.openWeather.apiKey);

    const currentWeather$ = this.http.get<FreeCurrentWeatherResponse>(this.CURRENT_API_URL, { 
      params,
      withCredentials: false 
    });

    const forecast$ = this.http.get<FreeForecastResponse>(this.FORECAST_API_URL, { 
      params,
      withCredentials: false 
    });

    // Combine both API responses and transform to expected format
    return forkJoin([currentWeather$, forecast$]).pipe(
      map(([current, forecast]) => this.transformToWeatherResponse(current, forecast))
    );
  }

  /**
   * Transform free API responses to the expected WeatherResponse format
   */
  private transformToWeatherResponse(
    current: FreeCurrentWeatherResponse, 
    forecast: FreeForecastResponse
  ): WeatherResponse {
    // Transform current weather
    const currentWeather: CurrentWeather = {
      dt: current.dt,
      sunrise: current.sys.sunrise,
      sunset: current.sys.sunset,
      temp: current.main.temp,
      feels_like: current.main.feels_like,
      pressure: current.main.pressure,
      humidity: current.main.humidity,
      dew_point: 0, // Not available in free API
      uvi: 0, // Not available in free API
      clouds: current.clouds.all,
      visibility: current.visibility,
      wind_speed: current.wind.speed,
      wind_deg: current.wind.deg,
      wind_gust: current.wind.gust,
      weather: current.weather
    };

    // Transform forecast to hourly (3-hour intervals from free API)
    const hourlyWeather: HourlyWeather[] = forecast.list.map(item => ({
      dt: item.dt,
      temp: item.main.temp,
      feels_like: item.main.feels_like,
      pressure: item.main.pressure,
      humidity: item.main.humidity,
      dew_point: 0,
      uvi: 0,
      clouds: item.clouds.all,
      visibility: item.visibility,
      wind_speed: item.wind.speed,
      wind_deg: item.wind.deg,
      wind_gust: item.wind.gust,
      weather: item.weather,
      pop: item.pop,
      rain: item.rain ? { '1h': item.rain['3h'] / 3 } : undefined,
      snow: item.snow ? { '1h': item.snow['3h'] / 3 } : undefined
    }));

    // Group forecast by day to create daily weather
    const dailyMap = new Map<string, typeof forecast.list>();
    forecast.list.forEach(item => {
      const date = item.dt_txt.split(' ')[0];
      if (!dailyMap.has(date)) {
        dailyMap.set(date, []);
      }
      dailyMap.get(date)!.push(item);
    });

    const dailyWeather: DailyWeather[] = Array.from(dailyMap.entries()).map(([_, items]) => {
      const temps = items.map(i => i.main.temp);
      const maxTemp = Math.max(...temps);
      const minTemp = Math.min(...temps);
      const avgPop = items.reduce((sum, i) => sum + i.pop, 0) / items.length;
      const midDayItem = items[Math.floor(items.length / 2)];
      
      return {
        dt: items[0].dt,
        sunrise: forecast.city.sunrise,
        sunset: forecast.city.sunset,
        moonrise: 0,
        moonset: 0,
        moon_phase: 0,
        summary: midDayItem.weather[0]?.description || '',
        temp: {
          day: midDayItem.main.temp,
          min: minTemp,
          max: maxTemp,
          night: items[items.length - 1]?.main.temp || minTemp,
          eve: items[Math.floor(items.length * 0.75)]?.main.temp || midDayItem.main.temp,
          morn: items[0].main.temp
        },
        feels_like: {
          day: midDayItem.main.feels_like,
          night: items[items.length - 1]?.main.feels_like || minTemp,
          eve: items[Math.floor(items.length * 0.75)]?.main.feels_like || midDayItem.main.feels_like,
          morn: items[0].main.feels_like
        },
        pressure: midDayItem.main.pressure,
        humidity: midDayItem.main.humidity,
        dew_point: 0,
        wind_speed: midDayItem.wind.speed,
        wind_deg: midDayItem.wind.deg,
        wind_gust: midDayItem.wind.gust,
        weather: midDayItem.weather,
        clouds: midDayItem.clouds.all,
        pop: avgPop,
        rain: items.reduce((sum, i) => sum + (i.rain?.['3h'] || 0), 0),
        snow: items.reduce((sum, i) => sum + (i.snow?.['3h'] || 0), 0),
        uvi: 0
      };
    });

    return {
      lat: current.coord.lat,
      lon: current.coord.lon,
      timezone: current.name,
      timezone_offset: current.timezone,
      current: currentWeather,
      hourly: hourlyWeather,
      daily: dailyWeather
    };
  }
}
