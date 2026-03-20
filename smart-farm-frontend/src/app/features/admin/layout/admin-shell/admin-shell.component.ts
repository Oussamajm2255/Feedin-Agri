import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Subject, takeUntil, firstValueFrom } from 'rxjs';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { AdminSidebar } from '../admin-sidebar/admin-sidebar';
import { AdminHeader } from '../admin-header/admin-header';
import { AdminWorkspace } from '../admin-workspace/admin-workspace';
import { LanguageService } from '../../../../core/services/language.service';
import { AdminApiService } from '../../../../admin/core/services/admin-api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { User } from '../../../../core/models/user.model';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
    AdminSidebar,
    AdminHeader,
    AdminWorkspace,
  ],
  templateUrl: './admin-shell.component.html',
  styleUrl: './admin-shell.component.scss',
  animations: [
    trigger('staggeredPopIn', [
      transition('* => visible', [
        query(
          '.bento-card',
          [
            style({ opacity: 0, transform: 'translateY(20px) scale(0.95)' }),
            stagger('50ms', [
              animate(
                '0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                style({ opacity: 1, transform: 'translateY(0) scale(1)' }),
              ),
            ]),
          ],
          { optional: true },
        ),
      ]),
    ]),
  ],
})
export class AdminShellComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  public languageService = inject(LanguageService);
  private router = inject(Router);
  private adminApiService = inject(AdminApiService);
  private authService = inject(AuthService);

  // Layout state
  isSidebarCollapsed = true;
  isSidebarHovered = false;
  isMobile = false;
  isTablet = false;
  isDesktop = true;

  // Mobile Bento state
  isBentoOpen = false;

  // Data for Bento
  currentUser: User | null = null;
  farmCount = 0;
  deviceCount = 0;

  constructor(private breakpointObserver: BreakpointObserver) {}

  isRTL(): boolean {
    return this.languageService.isRTL();
  }

  ngOnInit(): void {
    this.observeBreakpoints();
    this.loadBentoData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private observeBreakpoints(): void {
    this.breakpointObserver
      .observe([
        '(max-width: 767px)',
        '(min-width: 768px) and (max-width: 1023px)',
        '(min-width: 1024px)',
      ])
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        this.isMobile = result.breakpoints['(max-width: 767px)'];
        this.isTablet = result.breakpoints['(min-width: 768px) and (max-width: 1023px)'];
        this.isDesktop = result.breakpoints['(min-width: 1024px)'];

        if (this.isDesktop) {
          this.isBentoOpen = false;
        }
      });
  }

  private loadBentoData(): void {
    // Reactive user assignment
    this.currentUser = this.authService.user();

    // Load simple data for the mobile bento dashboard
    this.adminApiService
      .getFarms()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response && response.total !== undefined) {
            this.farmCount = response.total;
          }
        },
        error: () => {},
      });

    this.adminApiService
      .getDevices()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response && response.total !== undefined) {
            this.deviceCount = response.total;
          }
        },
        error: () => {},
      });
  }

  toggleMobileBento(): void {
    if (this.isDesktop) return;
    this.isBentoOpen = !this.isBentoOpen;
  }

  onSidebarHover(isHovered: boolean): void {
    this.isSidebarHovered = isHovered;
  }

  navigateTo(route: string): void {
    this.isBentoOpen = false;
    this.router.navigate([route]);
  }
}
