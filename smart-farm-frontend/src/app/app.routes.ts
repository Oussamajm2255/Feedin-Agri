import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { adminGuard } from './admin/core/guards/admin.guard';
import { farmerGuard } from './core/guards/farmer.guard';
import { pendingGuard } from './core/guards/pending.guard';

export const routes: Routes = [
  // ================================
  // PUBLIC LANDING PAGE (Default Route)
  // No authentication required
  // ================================
  {
    path: '',
    redirectTo: '/landing',
    pathMatch: 'full'
  },
  {
    path: 'landing',
    loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent)
  },
  // ================================
  // AUTHENTICATION ROUTES
  // ================================
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
    canActivate: [guestGuard]
  },
  // Alias: /request-access → same as /register (semantic URL for CTA links)
  {
    path: 'request-access',
    redirectTo: '/register',
    pathMatch: 'full'
  },
  // ================================
  // ONBOARDING / PENDING APPROVAL
  // Only accessible to authenticated users with PENDING status
  // ================================
  {
    path: 'onboarding/pending',
    loadComponent: () => import('./features/landing/pending/pending').then(m => m.Pending),
    canActivate: [pendingGuard]
  },
  // ================================
  // ADMIN DASHBOARD ROUTES
  // ================================
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/layout/admin-shell/admin-shell.component').then(m => m.AdminShellComponent),
    canActivate: [authGuard, adminGuard],
    children: [
      {
        path: '',
        redirectTo: 'overview',
        pathMatch: 'full'
      },
      {
        path: 'overview',
        loadComponent: () => import('./features/admin/pages/overview/overview.component').then(m => m.OverviewComponent)
      },
      {
        path: 'devices',
        loadComponent: () => import('./features/admin/pages/admin-devices/admin-devices.component').then(m => m.AdminDevicesComponent)
      },
      {
        path: 'system-health',
        loadComponent: () => import('./features/admin/pages/system-health/system-health.component').then(m => m.SystemHealthComponent)
      },
      {
        path: 'logs',
        loadComponent: () => import('./features/admin/pages/logs/logs.component').then(m => m.LogsComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./features/admin/pages/users/users.component').then(m => m.UsersComponent)
      },
      {
        path: 'farms',
        loadComponent: () => import('./features/admin/pages/admin-farms/admin-farms.component').then(m => m.AdminFarmsComponent)
      },
      {
        path: 'farmers',
        loadComponent: () => import('./features/admin/pages/farmers/farmers.component').then(m => m.FarmersComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/admin/pages/admin-settings/admin-settings.component').then(m => m.AdminSettingsComponent)
      },
      {
        path: 'notifications',
        loadComponent: () => import('./features/admin/pages/admin-notifications/admin-notifications.component').then(m => m.AdminNotificationsComponent)
      },
      {
        path: 'sensor-analytics',
        loadComponent: () => import('./features/sensor-analytics/sensor-analytics.component').then(m => m.SensorAnalyticsComponent)
      }
    ]
  },
  // ================================
  // FARMER DASHBOARD ROUTES
  // Only accessible to users with 'farmer' role
  // Admins are redirected to /admin
  // ================================
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [farmerGuard]
  },
  {
    path: 'farms',
    loadComponent: () => import('./features/farms/farms.component').then(m => m.FarmsComponent),
    canActivate: [farmerGuard]
  },
  {
    path: 'devices',
    loadComponent: () => import('./features/devices/devices.component').then(m => m.DevicesComponent),
    canActivate: [farmerGuard]
  },
  {
    path: 'sensors',
    loadComponent: () => import('./features/sensors/sensors.component').then(m => m.SensorsComponent),
    canActivate: [farmerGuard],
    pathMatch: 'full'
  },
  {
    path: 'sensors/analytics',
    loadComponent: () => import('./features/sensor-analytics/sensor-analytics.component').then(m => m.SensorAnalyticsComponent),
    canActivate: [farmerGuard]
  },
  {
    path: 'sensor-readings',
    loadComponent: () => import('./features/sensors/sensor-readings/sensor-readings.component').then(m => m.SensorReadingsComponent),
    canActivate: [farmerGuard]
  },
  {
    path: 'actions',
    loadComponent: () => import('./features/actions/actions.component').then(m => m.ActionsComponent),
    canActivate: [farmerGuard]
  },
  {
    path: 'crops',
    canActivate: [farmerGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/crops/crops-dashboard').then(m => m.CropDashboardComponent)
      },
      {
        path: 'create',
        loadComponent: () => import('./features/crops/crop-form/crop-form.component').then(m => m.CropFormComponent)
      },
      {
        path: ':id/dashboard',
        loadComponent: () => import('./features/crops/crops-dashboard').then(m => m.CropDashboardComponent)
      },
      {
        path: ':id/edit',
        loadComponent: () => import('./features/crops/crop-form/crop-form.component').then(m => m.CropFormComponent)
      }
    ]
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard]
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'notifications',
    loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent),
    canActivate: [farmerGuard]
  },
  {
    path: 'settings/notifications',
    loadComponent: () => import('./features/settings/notification-settings/notification-settings.component').then(m => m.NotificationSettingsComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    loadComponent: () => import('./shared/components/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
