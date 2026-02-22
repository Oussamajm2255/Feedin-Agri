import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AlertService } from '../services/alert.service';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const alertService = inject(AlertService);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = '';
      let shouldLogout = false;
      const isAuthMeEndpoint = req.url.includes('/auth/me');
      const isAuthLoginEndpoint = req.url.includes('/auth/login');
      const isAuthCsrfEndpoint = req.url.includes('/auth/csrf');

      // Never show toasts for /auth/me or /auth/csrf - these are silent checks
      if (isAuthMeEndpoint || isAuthCsrfEndpoint) {
        return throwError(() => error);
      }

      if (error.error instanceof ErrorEvent) {
        // Client-side error (network issues)
        if (isAuthLoginEndpoint) {
          errorMessage = 'Connection error. Try again.';
        }
      } else if (error.status === 0) {
        // Connection refused or network error
        if (isAuthLoginEndpoint) {
          errorMessage = 'Connection error. Try again.';
        }
      } else {
        // Server-side error
        switch (error.status) {
          case 401:
            // Only show error for /auth/login with 400 or 401
            if (isAuthLoginEndpoint) {
              errorMessage = 'Invalid email or password';
            } else {
              // For other endpoints, show session expired message
              errorMessage = 'Session expired. Please log in.';
            }
            break;
          case 400:
            // Only show for /auth/login
            if (isAuthLoginEndpoint) {
              errorMessage = 'Invalid email or password';
            }
            break;
          case 403:
            errorMessage = 'Access forbidden';
            break;
          case 404:
            errorMessage = 'Resource not found';
            break;
          case 500:
            errorMessage = 'Internal server error';
            break;
          default:
            // Only show generic errors for non-auth endpoints
            if (!isAuthLoginEndpoint) {
              errorMessage = error.error?.message || `Error ${error.status}: ${error.statusText}`;
            }
        }
      }

      // Only show error message for login endpoint or non-auth endpoints
      // Never show for /auth/me (already handled above)
      if (errorMessage && (isAuthLoginEndpoint || !req.url.includes('/auth/'))) {
        alertService.error('Error', errorMessage);
      }

      // Logout only when explicitly needed
      if (shouldLogout) {
        authService.logout();
      }

      return throwError(() => error);
    })
  );
};
