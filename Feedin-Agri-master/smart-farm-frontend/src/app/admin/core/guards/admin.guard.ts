import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserStatus } from '../../../core/models/user.model';

/**
 * Admin Guard
 * Protects admin routes - only allows users with admin role AND active status
 * 
 * Moved to admin/core/guards/ to separate admin logic from shared core
 */
export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const currentUser = authService.getCurrentUser();

  // Check if user is authenticated
  if (!authService.isAuthenticated()) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  // PENDING users must NOT access admin routes
  if (currentUser?.status === UserStatus.PENDING) {
    router.navigate(['/onboarding/pending']);
    return false;
  }

  // Check if user has admin role
  if (currentUser?.role === 'admin') {
    return true;
  }

  // Redirect non-admin users to farmer dashboard
  // (This handles farmers trying to access admin routes)
  router.navigate(['/dashboard']);
  return false;
};
