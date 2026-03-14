import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { UserStatus } from '../models/user.model';

export const guestGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Wait for auth initialization to complete
  const isAuthenticated = await authService.waitForInit();

  if (!isAuthenticated) {
    return true;
  }

  // PENDING users should be redirected to onboarding status page
  const currentUser = authService.getCurrentUser();
  if (currentUser?.status === UserStatus.PENDING) {
    router.navigate(['/onboarding/pending']);
    return false;
  }

  // Redirect active users based on role
  if (currentUser?.role === 'admin') {
    router.navigate(['/admin']);
  } else {
    router.navigate(['/dashboard']);
  }
  return false;
};
