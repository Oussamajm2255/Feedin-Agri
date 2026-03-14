export const environment = {
  production: true,
  apiUrl: 'https://thorough-optimism-production.up.railway.app/api/v1',
  wsUrl: 'https://thorough-optimism-production.up.railway.app',
  appName: 'FEEDIN',
  version: '1.0.0',
  enableAnalytics: true,
  enableErrorReporting: true,
  logLevel: 'error',
  
  // API Configuration
  apiTimeout: 60000, // 60 seconds for production
  
  // Auth configuration
  auth: {
    loginSuccessDelay: 1500,
    emailValidationDebounce: 300,
    emailValidationDelay: 500,
    maxLoginAttempts: 5,
    loginAttemptWindow: 900000 // 15 minutes in ms
  },
  
  // Asset paths
  assets: {
    loginVideo: 'assets/vids/login-optimized.mp4',
    loginVideoWebm: 'assets/vids/login.webm',
    loginVideoPoster: 'assets/vids/login-poster.webp',
    loginVideoFallback: 'assets/images/login-bg.jpg',
    logo: 'assets/images/logos/Feedin_pnglogo.png'
  },
  
  // UI Configuration
  ui: {
    searchDebounceMs: 300,
    refreshAnimationMs: 1000
  },
  
  // OpenWeatherMap Configuration
  // ⚠️ API key should be stored on the backend and proxied via /api/v1/weather
  // Never hardcode API keys in frontend code
  openWeather: {
    apiKey: '' // Fetched from backend proxy
  },
  
  // Notification System Configuration
  notifications: {
    // WebSocket settings
    wsTimeout: 15000, // Longer timeout for production
    wsMaxRetries: 10, // More retries for production
    wsRetryDelay: 2000,
    wsFallbackTimeout: 10000,
    
    // Polling settings
    pollingInterval: 10000, // Less frequent in production
    pollingEnabled: true,
    
    // Cache settings
    maxCacheSize: 100,
    pageSize: 20,
    
    // Auto-refresh
    autoRefreshEnabled: true,
    autoRefreshInterval: 60000, // 1 minute in production
    
    // Cooldown and quiet hours
    cooldownMs: 900000, // 15 minutes
    quietHoursEnabled: true,
    quietHoursStart: 22,
    quietHoursEnd: 6
  }
};
