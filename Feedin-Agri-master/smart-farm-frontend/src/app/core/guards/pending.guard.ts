import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { UserStatus } from '../models/user.model';

/**
 * Pending Guard
 * Only allows users with PENDING status to access onboarding routes.
 * Active users are redirected to their dashboard.
 * Unauthenticated users are redirected to the landing page.
 */
export const pendingGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthenticated = await authService.waitForInit();

  if (!isAuthenticated) {
    router.navigate(['/landing']);
    return false;
  }

  const currentUser = authService.getCurrentUser();

  // Only allow PENDING users
  if (currentUser?.status === UserStatus.PENDING) {
    return true;
  }

  // Active users go to their dashboard
  if (currentUser?.role === 'admin') {
    router.navigate(['/admin']);
  } else {
    router.navigate(['/dashboard']);
  }
  return false;
};
