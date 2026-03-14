import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.scss'
})
export class NotFoundComponent {
  private authService = inject(AuthService);

  // Compute the home route based on user role
  homeRoute = computed(() => {
    const user = this.authService.getCurrentUser();
    if (!user) return '/login';
    return user.role === 'admin' ? '/admin' : '/dashboard';
  });

  homeLabel = computed(() => {
    const user = this.authService.getCurrentUser();
    if (!user) return 'Go to Login';
    return user.role === 'admin' ? 'Go to Admin Dashboard' : 'Go to Dashboard';
  });
}
