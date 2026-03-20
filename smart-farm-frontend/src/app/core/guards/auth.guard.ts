import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { UserStatus } from '../models/user.model';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Wait for auth initialization to complete
  const isAuthenticated = await authService.waitForInit();

  if (!isAuthenticated) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  // PENDING users must NOT access authenticated routes — redirect to pending page
  const currentUser = authService.getCurrentUser();
  if (currentUser?.status === UserStatus.PENDING) {
    router.navigate(['/onboarding/pending']);
    return false;
  }

  // Redirect admins accessing standard farmer routes to their admin equivalent
  if (currentUser?.role === 'admin') {
    if (state.url === '/profile') {
      router.navigate(['/admin/profile']);
      return false;
    }
  }

  return true;
};
