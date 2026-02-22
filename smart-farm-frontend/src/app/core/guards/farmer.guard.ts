import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserStatus } from '../models/user.model';

/**
 * Farmer Guard
 * Protects farmer routes - only allows users with farmer role AND active status.
 * Admins are redirected to admin dashboard.
 * Pending users are redirected to onboarding status page.
 */
export const farmerGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Wait for auth initialization to complete
  const isAuthenticated = await authService.waitForInit();

  // Check if user is authenticated
  if (!isAuthenticated) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  const currentUser = authService.getCurrentUser();

  // PENDING users must NOT access any dashboard — redirect to pending page
  if (currentUser?.status === UserStatus.PENDING) {
    router.navigate(['/onboarding/pending']);
    return false;
  }

  // Check if user has farmer role (not admin)
  if (currentUser?.role === 'farmer') {
    return true;
  }

  // Redirect admin users to admin dashboard
  if (currentUser?.role === 'admin') {
    router.navigate(['/admin']);
    return false;
  }

  // For any other role, redirect to login
  router.navigate(['/login']);
  return false;
};
