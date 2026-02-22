import { HttpInterceptorFn } from '@angular/common/http';

// Attach credentials (cookies) to all API requests. Do not inject Authorization header.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Skip credentials for external APIs (like OpenWeatherMap) that don't support CORS with credentials
  const isExternalApi = req.url.startsWith('https://api.openweathermap.org');
  
  // Always send credentials (cookies) for internal API requests
  let modified = req.clone({ withCredentials: !isExternalApi });

  // Attach CSRF token from cookie when performing state-changing requests
  const method = req.method.toUpperCase();
  const safe = method === 'GET' || method === 'HEAD' || method === 'OPTIONS';
  if (!safe && !isAuthOrRegister(modified.url)) {
    const csrf = getCsrfFromCookie('sf_csrf');
    if (csrf) {
      modified = modified.clone({ setHeaders: { 'X-CSRF-Token': csrf } });
    }
  }

  return next(modified);
};

function getCsrfFromCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return m ? decodeURIComponent(m[2]) : null;
}

function isAuthOrRegister(url: string): boolean {
  try {
    const u = new URL(url);
    return u.pathname.includes('/auth/login') || 
           u.pathname.includes('/auth/logout') || 
           u.pathname.includes('/users/register');
  } catch {
    // Fallback for relative URLs
    return url.includes('/auth/login') || 
           url.includes('/auth/logout') || 
           url.includes('/users/register');
  }
}
