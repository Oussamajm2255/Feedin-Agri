import { Component, OnInit, OnDestroy, inject, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { interval, Subscription, forkJoin, of, Subject, BehaviorSubject, combineLatest } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, shareReplay, switchMap, tap, retry, takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../../core/services/api.service';
import { ActionLog } from '../../../../core/models/action-log.model';
import { Sensor, SensorReading } from '../../../../core/models/farm.model';
import { FarmManagementService } from '../../../../core/services/farm-management.service';

// ============================================================================
// INTERFACES
// ============================================================================

interface ActuatorPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface ActuatorPositions {
  fan: ActuatorPosition;
  roof: ActuatorPosition;
  light: ActuatorPosition;
  humidifier: ActuatorPosition;
}

interface ActuatorState {
  type: ActuatorType;
  isOn: boolean;
  lastUpdate: Date | null;
}

interface ActuatorReading {
  sensorType: string;
  value: number | null;
  unit: string;
  sensorName?: string;
  sensor?: Sensor;
  status?: ReadingStatus;
}

interface LatestStateInfo {
  isOn: boolean;
  timestamp: Date;
  status: string;
}

type ActuatorType = 'fan' | 'roof' | 'light' | 'humidifier';
type ReadingStatus = 'normal' | 'warning_low' | 'warning_high' | 'critical_low' | 'critical_high';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  REFRESH_INTERVAL: 10000,
  MAX_ACTION_LOGS: 500,
  RETRY_ATTEMPTS: 3,
  ICON_SCALES: {
    light: 1.5,
    default: 1.0
  },
  SENSOR_VALUE_PRECISION: 1
} as const;

const ACTUATOR_TYPES: ActuatorType[] = ['fan', 'roof', 'light', 'humidifier'];

// ============================================================================
// COMPONENT
// ============================================================================

@Component({
  selector: 'app-digital-twin',
  standalone: true,
  imports: [CommonModule, MatTooltipModule, MatIconModule],
  templateUrl: './digital-twin.component.html',
  styleUrl: './digital-twin.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DigitalTwinComponent implements OnInit, OnDestroy {
  // ============================================================================
  // SERVICES
  // ============================================================================
  private readonly apiService = inject(ApiService);
  private readonly farmManagement = inject(FarmManagementService);

  // ============================================================================
  // SIGNALS (Angular 16+ Reactive State)
  // ============================================================================
  readonly actuatorPositions = signal<ActuatorPositions | null>(null);
  readonly actuatorStates = signal<Map<ActuatorType, ActuatorState>>(this.createInitialStates());
   readonly actuatorReadings = signal<Map<ActuatorType, ActuatorReading>>(new Map());
   readonly isLoading = signal(false);
   readonly lastUpdateTime = signal<Date | null>(null);
   
   // Expose actuator types for template
   readonly actuatorTypes: ActuatorType[] = ACTUATOR_TYPES;

  // ============================================================================
  // COMPUTED SIGNALS
  // ============================================================================
  readonly hasPositions = computed(() => this.actuatorPositions() !== null);
  readonly actuatorCount = computed(() => this.actuatorStates().size);
  
  // Farm-specific asset base path
  readonly assetBasePath = computed(() => {
    const farm = this.farmManagement.getSelectedFarm();
    if (!farm || !farm.name) {
      return 'assets/digital-twin'; // Fallback to default
    }
    // Create folder name: digital-twin_FarmName
    const folderName = `digital-twin_${farm.name}`;
    return `assets/${folderName}`;
  });
  
  // Computed greenhouse image path
  readonly greenhouseImage = computed(() => {
    return `${this.assetBasePath()}/base/greenhouse.jpg`;
  });

  // ============================================================================
  // SUBJECTS & OBSERVABLES
  // ============================================================================
  private readonly destroy$ = new Subject<void>();
  private readonly stateUpdate$ = new Subject<ActionLog[]>();
  private readonly manualRefresh$ = new Subject<void>();
  private refreshSubscription?: Subscription;

  // ============================================================================
  // LIFECYCLE HOOKS
  // ============================================================================

  ngOnInit(): void {
    this.initializeComponent();
    this.setupReactiveUpdates();
    this.startRealTimeUpdates();
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  private initializeComponent(): void {
    // Subscribe to farm changes to reload assets when farm changes
    this.farmManagement.selectedFarm$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadActuatorPositions();
        this.loadActuatorStates();
        this.loadSensorReadings();
      });
    
    // Initial load
    this.loadActuatorPositions();
    this.loadActuatorStates();
    this.loadSensorReadings();
  }

  private setupReactiveUpdates(): void {
    // Debounce state updates to avoid excessive processing
    this.stateUpdate$.pipe(
      takeUntil(this.destroy$),
      debounceTime(300),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
    ).subscribe(logs => {
      this.processActionLogs(logs);
    });
  }

  private createInitialStates(): Map<ActuatorType, ActuatorState> {
    const states = new Map<ActuatorType, ActuatorState>();
    ACTUATOR_TYPES.forEach(type => {
      states.set(type, {
        type,
        isOn: false,
        lastUpdate: null
      });
    });
    return states;
  }

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  private loadActuatorPositions(): void {
    const basePath = this.assetBasePath();
    const positionsPath = `${basePath}/zones/actuators.json`;
    
    fetch(positionsPath)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((data: ActuatorPositions) => {
        this.actuatorPositions.set(data);
        this.debug(`Actuator positions loaded from ${positionsPath}`);
      })
      .catch(error => {
        this.error(`Failed to load actuator positions from ${positionsPath}`, error);
      });
  }

  private loadActuatorStates(): void {
    this.isLoading.set(true);
    
    this.apiService.getActions({ limit: CONFIG.MAX_ACTION_LOGS })
      .pipe(
        retry(CONFIG.RETRY_ATTEMPTS),
        catchError(error => {
          this.error('Failed to load actuator states', error);
          return of({ items: [] });
        })
      )
      .subscribe({
        next: (response) => {
          this.debug(`Received ${response.items.length} action logs`);
          this.stateUpdate$.next(response.items);
          this.lastUpdateTime.set(new Date());
          this.isLoading.set(false);
        }
      });
  }

  private loadSensorReadings(): void {
    const selectedFarm = this.farmManagement.getSelectedFarm();
    if (!selectedFarm) {
      this.debug('No farm selected, skipping sensor readings');
      return;
    }

    this.apiService.getSensorsByFarm(selectedFarm.farm_id)
      .pipe(
        retry(CONFIG.RETRY_ATTEMPTS),
        catchError(error => {
          this.error('Failed to load sensors', error);
          return of([]);
        })
      )
      .subscribe({
        next: (sensors) => {
          this.processSensorReadings(sensors);
        }
      });
  }

  // ============================================================================
  // ACTION LOG PROCESSING
  // ============================================================================

  private processActionLogs(actionLogs: ActionLog[]): void {
    if (!actionLogs.length) return;

    const sortedLogs = this.sortLogsByTimestamp(actionLogs);
    const latestStates = this.extractLatestStates(sortedLogs);
    this.updateActuatorStates(latestStates);
  }

  private sortLogsByTimestamp(logs: ActionLog[]): ActionLog[] {
    return [...logs].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  private extractLatestStates(logs: ActionLog[]): Map<ActuatorType, LatestStateInfo> {
    const latestStates = new Map<ActuatorType, LatestStateInfo>();

    for (const log of logs) {
      const actuatorInfo = this.parseActionUri(log.action_uri);
      if (!actuatorInfo) continue;

      const { type, isOn } = actuatorInfo;
      const logTimestamp = new Date(log.created_at);
      const existing = latestStates.get(type);

      if (!existing || this.shouldUpdateState(existing, logTimestamp, log.status)) {
        latestStates.set(type, {
          isOn,
          timestamp: logTimestamp,
          status: log.status
        });
        this.debug(`Latest state: ${type} = ${isOn ? 'ON' : 'OFF'} at ${log.created_at}`);
      }
    }

    return latestStates;
  }

  private shouldUpdateState(existing: LatestStateInfo, newTimestamp: Date, newStatus: string): boolean {
    const timeDiff = newTimestamp.getTime() - existing.timestamp.getTime();
    
    // Newer timestamp wins
    if (timeDiff > 0) return true;
    
    // Same timestamp: prefer 'ack' status
    if (timeDiff === 0 && newStatus === 'ack' && existing.status !== 'ack') {
      return true;
    }
    
    return false;
  }

  private updateActuatorStates(latestStates: Map<ActuatorType, LatestStateInfo>): void {
    const currentStates = new Map(this.actuatorStates());
    let hasChanges = false;

    latestStates.forEach((state, type) => {
      const currentState = currentStates.get(type);
      
      if (!currentState || currentState.isOn !== state.isOn) {
        hasChanges = true;
        currentStates.set(type, {
          type,
          isOn: state.isOn,
          lastUpdate: state.timestamp
        });
        this.debug(`Updated ${type}: ${state.isOn ? 'ON' : 'OFF'}`);
      }
    });

    if (hasChanges) {
      this.actuatorStates.set(currentStates);
    }
  }

  // ============================================================================
  // ACTION URI PARSING
  // ============================================================================

  private parseActionUri(actionUri: string): { type: ActuatorType; isOn: boolean } | null {
    const parts = actionUri.split('/');
    if (parts.length < 4) return null;

    const action = parts[parts.length - 1].toLowerCase().trim();
    
    // Use action mapping for cleaner logic
    return this.mapActionToState(action);
  }

  private mapActionToState(action: string): { type: ActuatorType; isOn: boolean } | null {
    // Fan/Ventilator
    if (action === 'ventilator_off' || action === 'fan_off') {
      return { type: 'fan', isOn: false };
    }
    if (action === 'ventilator_on' || action === 'fan_on') {
      return { type: 'fan', isOn: true };
    }
    
    // Roof
    if (action === 'close_roof') {
      return { type: 'roof', isOn: false };
    }
    if (action === 'open_roof') {
      return { type: 'roof', isOn: true };
    }
    
    // Light
    if (action === 'light_off' || action === 'lights_off') {
      return { type: 'light', isOn: false };
    }
    if (action === 'light_on' || action === 'lights_on') {
      return { type: 'light', isOn: true };
    }
    
    // Humidifier
    if (action === 'humidifier_off') {
      return { type: 'humidifier', isOn: false };
    }
    if (action === 'humidifier_on') {
      return { type: 'humidifier', isOn: true };
    }

    // Fallback pattern matching
    return this.parseActionPattern(action);
  }

  private parseActionPattern(action: string): { type: ActuatorType; isOn: boolean } | null {
    const patterns = [
      { keywords: ['ventilator', 'fan'], type: 'fan' as ActuatorType },
      { keywords: ['roof'], type: 'roof' as ActuatorType },
      { keywords: ['light'], type: 'light' as ActuatorType },
      { keywords: ['humidifier'], type: 'humidifier' as ActuatorType }
    ];

    for (const pattern of patterns) {
      if (pattern.keywords.some(kw => action.includes(kw))) {
        const isOn = action.includes('_on') || action.includes('open');
        return { type: pattern.type, isOn };
      }
    }

    return null;
  }

  // ============================================================================
  // SENSOR PROCESSING
  // ============================================================================

  private processSensorReadings(sensors: Sensor[]): void {
    const actuatorSensorMap = this.getActuatorSensorMapping();
    const readingRequests = this.createReadingRequests(sensors, actuatorSensorMap);

    if (readingRequests.length === 0) return;

    forkJoin(readingRequests.map(r => r.request))
      .pipe(
        catchError(error => {
          this.error('Failed to load sensor readings', error);
          return of([]);
        })
      )
      .subscribe({
        next: (readings) => {
          this.updateActuatorReadings(readings, readingRequests);
        }
      });
  }

  private getActuatorSensorMapping(): Record<ActuatorType, { types: string[]; actionKeywords: string[] }> {
    return {
      fan: { 
        types: ['temperature', 'temp'],
        actionKeywords: ['fan', 'ventilator']
      },
      roof: { 
        types: ['temperature', 'temp', 'humidity', 'humid'],
        actionKeywords: ['roof', 'open_roof', 'close_roof']
      },
      light: { 
        types: ['light', 'luminosity', 'lux'],
        actionKeywords: ['light', 'lights']
      },
      humidifier: { 
        types: ['humidity', 'humid', 'moisture'],
        actionKeywords: ['humidifier']
      }
    };
  }

  private createReadingRequests(
    sensors: Sensor[], 
    mapping: Record<ActuatorType, { types: string[]; actionKeywords: string[] }>
  ): Array<{ actuatorType: ActuatorType; sensor: Sensor; request: any }> {
    const requests: Array<{ actuatorType: ActuatorType; sensor: Sensor; request: any }> = [];

    ACTUATOR_TYPES.forEach(actuatorType => {
      const config = mapping[actuatorType];
      const matchingSensor = this.findMatchingSensor(sensors, config);
      
      if (matchingSensor) {
        requests.push({
          actuatorType,
          sensor: matchingSensor,
          request: this.apiService.getLatestReading(matchingSensor.sensor_id).pipe(
            retry(2),
            catchError(() => of(null))
          )
        });
      }
    });

    return requests;
  }

  private findMatchingSensor(
    sensors: Sensor[], 
    config: { types: string[]; actionKeywords: string[] }
  ): Sensor | null {
    return sensors.find(sensor => {
      const sensorTypeLower = sensor.type.toLowerCase();
      const typeMatches = config.types.some(t => sensorTypeLower.includes(t));
      
      if (!typeMatches) return false;
      
      const actionLow = (sensor.action_low || '').toLowerCase();
      const actionHigh = (sensor.action_high || '').toLowerCase();
      const actionMatches = config.actionKeywords.some(keyword => 
        actionLow.includes(keyword.toLowerCase()) || 
        actionHigh.includes(keyword.toLowerCase())
      );
      
      return actionMatches;
    }) || null;
  }

  private updateActuatorReadings(
    readings: (SensorReading | null)[], 
    requests: Array<{ actuatorType: ActuatorType; sensor: Sensor; request: any }>
  ): void {
    const newReadings = new Map(this.actuatorReadings());

    readings.forEach((reading, index) => {
      if (reading) {
        const { actuatorType, sensor } = requests[index];
        const value = this.extractSensorValue(reading, sensor);
        const status = this.calculateReadingStatus(value, sensor);
        
        newReadings.set(actuatorType, {
          sensorType: sensor.type,
          value,
          unit: sensor.unit,
          sensorName: sensor.type,
          sensor,
          status
        });
      }
    });

    this.actuatorReadings.set(newReadings);
  }

  private extractSensorValue(reading: SensorReading, sensor: Sensor): number | null {
    const typeLower = sensor.type.toLowerCase();
    const unitLower = sensor.unit.toLowerCase();
    const normalize = (v: any): number | null => {
      if (v === null || v === undefined) return null;
      const n = Number(v);
      return Number.isNaN(n) ? null : n;
    };
    const fallbackValue = normalize((reading as any)?.value);

    // Temperature: prefer value1
    if (typeLower.includes('temp') || unitLower.includes('c') || unitLower.includes('°')) {
      return normalize(reading.value1) ?? normalize(reading.value2) ?? fallbackValue;
    }

    // Humidity: prefer value2
    if (typeLower.includes('humid') || unitLower.includes('%')) {
      return normalize(reading.value2) ?? normalize(reading.value1) ?? fallbackValue;
    }

    // Light: prefer value1
    if (typeLower.includes('light') || typeLower.includes('lux')) {
      return normalize(reading.value1) ?? normalize(reading.value2) ?? fallbackValue;
    }

    return normalize(reading.value1) ?? normalize(reading.value2) ?? fallbackValue;
  }

  private calculateReadingStatus(value: number | null, sensor: Sensor): ReadingStatus {
    if (value === null || value === undefined) return 'normal';

    const minCritical = sensor.min_critical != null ? Number(sensor.min_critical) : null;
    const maxCritical = sensor.max_critical != null ? Number(sensor.max_critical) : null;
    const minWarning = sensor.min_warning != null ? Number(sensor.min_warning) : null;
    const maxWarning = sensor.max_warning != null ? Number(sensor.max_warning) : null;

    // Critical thresholds
    if (minCritical !== null && !isNaN(minCritical) && value < minCritical) {
      return 'critical_low';
    }
    if (maxCritical !== null && !isNaN(maxCritical) && value > maxCritical) {
      return 'critical_high';
    }

    // Warning thresholds
    if (minWarning !== null && !isNaN(minWarning) && value < minWarning) {
      return 'warning_low';
    }
    if (maxWarning !== null && !isNaN(maxWarning) && value > maxWarning) {
      return 'warning_high';
    }

    return 'normal';
  }

  // ============================================================================
  // REAL-TIME UPDATES
  // ============================================================================

  private startRealTimeUpdates(): void {
    this.refreshSubscription = interval(CONFIG.REFRESH_INTERVAL)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadActuatorStates();
        this.loadSensorReadings();
      });
  }

  // ============================================================================
  // PUBLIC API (for template)
  // ============================================================================

   getActuatorIcon(type: string | ActuatorType): string {
     const actuatorType = this.normalizeActuatorType(type);
     if (!actuatorType) return '';
     
     const state = this.actuatorStates().get(actuatorType);
     const isOn = state?.isOn ?? false;
     const basePath = this.assetBasePath();

     const iconMap: Record<ActuatorType, string> = {
       fan: `${basePath}/icons/fan_circle_${isOn ? 'green' : 'red'}.svg`,
       roof: `${basePath}/icons/roof_${isOn ? 'open' : 'closed'}_${isOn ? 'green' : 'red'}.svg`,
       light: `${basePath}/icons/light_${isOn ? 'on' : 'off'}_${isOn ? 'green' : 'red'}.svg`,
       humidifier: `${basePath}/icons/humidifier_${isOn ? 'on' : 'off'}_${isOn ? 'green' : 'red'}.svg`
     };

     return iconMap[actuatorType] || '';
   }

   getActuatorStyle(type: string | ActuatorType): { [key: string]: string } {
     const actuatorType = this.normalizeActuatorType(type);
     if (!actuatorType) return { display: 'none' };
     
     const positions = this.actuatorPositions();
     if (!positions) return { display: 'none' };

     const position = positions[actuatorType];
     if (!position) return { display: 'none' };

     const scale = actuatorType === 'light' ? CONFIG.ICON_SCALES.light : CONFIG.ICON_SCALES.default;

     return {
       position: 'absolute',
       left: `${position.x * 100}%`,
       top: `${position.y * 100}%`,
       width: `${position.w * 100 * scale}%`,
       height: `${position.h * 100 * scale}%`,
       transform: `translate(-50%, -50%) scale(${scale})`,
       pointerEvents: 'auto'
     };
   }

   getActuatorState(type: string | ActuatorType): ActuatorState | undefined {
     const actuatorType = this.normalizeActuatorType(type);
     return actuatorType ? this.actuatorStates().get(actuatorType) : undefined;
   }

   getActuatorReading(type: string | ActuatorType): ActuatorReading | undefined {
     const actuatorType = this.normalizeActuatorType(type);
     return actuatorType ? this.actuatorReadings().get(actuatorType) : undefined;
   }

  getReadingDisplay(reading: ActuatorReading | undefined): string {
    if (!reading || reading.value === null) return 'N/A';
    
    const label = this.getSensorLabel(reading.sensorType, reading.unit);
    return `${reading.value.toFixed(CONFIG.SENSOR_VALUE_PRECISION)} ${label}`;
  }

  private getSensorLabel(sensorType: string, unit: string): string {
    const typeLower = sensorType?.toLowerCase() || '';
    const unitLower = unit?.toLowerCase() || '';
    
    if (typeLower.includes('temp') || unitLower.includes('c') || unitLower.includes('°')) {
      return 'Temperature';
    }
    if (typeLower.includes('humid') || unitLower.includes('%')) {
      return 'Humidity';
    }
    if (typeLower.includes('light') || typeLower.includes('lux')) {
      return 'Light';
    }
    if (typeLower.includes('soil') || typeLower.includes('moisture')) {
      return 'Soil Moisture';
    }
    if (typeLower.includes('ph')) return 'pH';
    if (typeLower.includes('pressure')) return 'Pressure';
    
    return sensorType || unit || 'Reading';
  }

  getReadingStatusClass(reading: ActuatorReading | undefined): string {
    return reading?.status ? `reading-${reading.status}` : 'reading-normal';
  }

  getReadingArrowIcon(reading: ActuatorReading | undefined): string {
    if (!reading?.status) return '';
    
    if (reading.status === 'critical_low' || reading.status === 'warning_low') {
      return 'arrow_downward';
    }
    if (reading.status === 'critical_high' || reading.status === 'warning_high') {
      return 'arrow_upward';
    }
    return '';
  }

   getActuatorTooltip(type: string | ActuatorType): string {
     const actuatorType = this.normalizeActuatorType(type);
     if (!actuatorType) return '';
     
     const state = this.getActuatorState(actuatorType);
     const reading = this.getActuatorReading(actuatorType);
     const status = state?.isOn ? 'ON' : 'OFF';
     
     let tooltip = `${actuatorType.charAt(0).toUpperCase() + actuatorType.slice(1)}: ${status}`;
     
     if (reading && reading.value !== null) {
       tooltip += `\n${reading.sensorType}: ${this.getReadingDisplay(reading)}`;
     } else {
       tooltip += `\nSensor: N/A`;
     }
     
     return tooltip;
   }

  // Manual refresh trigger
  refresh(): void {
    this.loadActuatorStates();
    this.loadSensorReadings();
  }

   // ============================================================================
   // UTILITIES
   // ============================================================================

   private normalizeActuatorType(type: string | ActuatorType): ActuatorType | null {
     const normalized = type.toLowerCase() as ActuatorType;
     return ACTUATOR_TYPES.includes(normalized) ? normalized : null;
   }

   private debug(message: string, ...args: any[]): void {
     // Only log in development (you can use environment.production check)
     if (typeof console !== 'undefined') {
       console.log(`[Digital Twin] ${message}`, ...args);
     }
   }

   private error(message: string, error?: any): void {
     console.error(`[Digital Twin Error] ${message}`, error);
   }

   private cleanup(): void {
     this.destroy$.next();
     this.destroy$.complete();
     this.refreshSubscription?.unsubscribe();
   }
 }