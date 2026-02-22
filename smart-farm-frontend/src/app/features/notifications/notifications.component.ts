// notifications.component.ts - REDESIGNED FOR 2025

import { Component, inject, OnInit, OnDestroy, computed, signal, effect, ElementRef, ViewChild, ChangeDetectorRef, untracked, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ConfirmDeleteDialogComponent } from './confirm-delete-dialog.component';
import { NotificationService } from '../../core/services/notification.service';
import { ApiService } from '../../core/services/api.service';
import { FarmManagementService } from '../../core/services/farm-management.service';
import { LanguageService } from '../../core/services/language.service';
import { LoggerService } from '../../core/services/logger.service';
import { AuthService } from '../../core/services/auth.service';
import { AppNotification } from '../../core/models/notification.model';
import { NOTIFICATION_CONFIG } from '../../core/config/notification.config';

// Date grouping helper
type DateGroup = 'today-morning' | 'today-afternoon' | 'yesterday' | 'this-week' | 'older';

interface GroupedNotifications {
  group: DateGroup;
  label: string;
  notifications: AppNotification[];
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatDialogModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  template: `
    <div class="insight-stream-container" [attr.dir]="currentDirection()">
      <!-- ADMIN GUARD STATE -->
      <div class="empty-state glass-panel" *ngIf="authService.hasRole('admin')">
        <div class="empty-icon">
          <mat-icon>admin_panel_settings</mat-icon>
          <div class="icon-glow"></div>
        </div>
        <h3>{{ languageService.t()('notifications.adminTitle') }}</h3>
        <p class="calm-message">{{ languageService.t()('notifications.adminMessage') }}</p>
      </div>

      <!-- ACCESS DENIED STATE (for non-farmer/moderator users) -->
      <div class="empty-state glass-panel" *ngIf="!canViewNotifications() && !authService.hasRole('admin')">
        <div class="empty-icon">
          <mat-icon>lock</mat-icon>
          <div class="icon-glow"></div>
        </div>
        <h3>{{ languageService.t()('notifications.accessDenied') || 'Access Denied' }}</h3>
        <p class="calm-message">{{ languageService.t()('notifications.accessDeniedMessage') || 'Only farmers and moderators can view notifications.' }}</p>
      </div>

      <ng-container *ngIf="canViewNotifications()">

      <!-- NEW HEADER SECTION - Page Title + Filters + Actions -->
      <div class="notifications-header glass-panel">
        <div class="header-left">
          <h1 class="page-title">
            <mat-icon>notifications</mat-icon>
            <span>{{ languageService.t()('notifications.title') || 'Notifications' }}</span>
            <span class="unread-badge" *ngIf="kpiStats().unread > 0">
              {{ kpiStats().unread }}
            </span>
          </h1>
        </div>

        <div class="header-right">
          <div class="kpi-stats">
            <div class="kpi-item"
                 [class.zero-state]="kpiStats().total === 0"
                 [matTooltip]="kpiStats().total === 0 ? languageService.t()('notifications.noNotificationsYet') : languageService.t()('notifications.totalNotifications')">
              <mat-icon>{{ kpiStats().total === 0 ? 'notifications_none' : 'notifications' }}</mat-icon>
              <div class="kpi-value">
                <span class="number">{{ kpiStats().total }}</span>
                <span class="label">{{ languageService.t()('notifications.total') }}</span>
                <span class="status-text" *ngIf="kpiStats().total === 0">{{ languageService.t()('notifications.allClear') }}</span>
              </div>
            </div>

            <div class="kpi-item unread"
                 [class.zero-state]="kpiStats().unread === 0"
                 [matTooltip]="kpiStats().unread === 0 ? languageService.t()('notifications.allCaughtUp') : languageService.t()('notifications.unread')">
              <mat-icon>{{ kpiStats().unread === 0 ? 'mark_email_read' : 'mark_email_unread' }}</mat-icon>
              <div class="kpi-value">
                <span class="number">{{ kpiStats().unread }}</span>
                <span class="label">{{ languageService.t()('notifications.unread') }}</span>
                <span class="status-text" *ngIf="kpiStats().unread === 0">{{ languageService.t()('notifications.upToDate') }}</span>
              </div>
            </div>

            <div class="kpi-item critical"
                 [class.zero-state]="kpiStats().critical === 0"
                 [matTooltip]="kpiStats().critical === 0 ? languageService.t()('notifications.noCriticalIssues') : languageService.t()('notifications.critical')">
              <mat-icon>{{ kpiStats().critical === 0 ? 'check_circle' : 'priority_high' }}</mat-icon>
              <div class="kpi-value">
                <span class="number">{{ kpiStats().critical }}</span>
                <span class="label">{{ languageService.t()('notifications.critical') }}</span>
                <span class="status-text" *ngIf="kpiStats().critical === 0">{{ languageService.t()('notifications.allGood') }}</span>
              </div>
            </div>

            <div class="kpi-item updated" [matTooltip]="languageService.t()('notifications.lastUpdated')">
              <mat-icon>schedule</mat-icon>
              <div class="kpi-value">
                <span class="time-label">{{ kpiStats().lastUpdated }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>


      <!-- 2️⃣ COMPACT FILTER & VIEW MODE SECTION -->
      <div class="filter-section" *ngIf="cacheReady">
        <!-- Compact Horizontal Filter Bar -->
        <div class="filter-bar">
          <!-- Quick Filter Chips -->
          <div class="filter-chips">
            <mat-chip-listbox [(ngModel)]="activeFilters" [multiple]="false" class="glass-chips">
              <mat-chip-option
                *ngFor="let filter of availableFilters()"
                [value]="filter.value"
                [selected]="activeFilters === filter.value"
                (click)="onFilterChange(filter.value)">
                <mat-icon>{{ filter.icon }}</mat-icon>
                {{ filter.label }}
                <span class="chip-badge">{{ filter.count }}</span>
              </mat-chip-option>
            </mat-chip-listbox>
          </div>

          <!-- View Switcher (Map view removed) -->
          <div class="view-switcher">
            <button mat-icon-button
                    class="view-button"
                    [class.active]="activeView() === 'list'"
                    (click)="setView('list')"
                    [matTooltip]="languageService.t()('notifications.listView')">
              <mat-icon>view_list</mat-icon>
            </button>
            <button mat-icon-button
                    class="view-button"
                    [class.active]="activeView() === 'timeline'"
                    (click)="setView('timeline')"
                    [matTooltip]="languageService.t()('notifications.timelineView')">
              <mat-icon>timeline</mat-icon>
            </button>
          </div>

          <!-- Enhanced Refresh Button with Status Centered at Bottom -->
          <button mat-button
                  class="refresh-button enhanced"
                  (click)="refreshNotifications()"
                  [disabled]="loading"
                  [matTooltip]="languageService.t()('notifications.refresh')">
            <div class="refresh-icon-wrapper">
              <mat-icon [class.spinning]="loading">refresh</mat-icon>
            </div>
            <span class="refresh-time" *ngIf="getLastRefreshTime() && !loading">{{ getLastRefreshTime() }}</span>
          </button>

          <!-- Advanced Filters Toggle -->
          <button class="filter-toggle"
                  [class.expanded]="filterPanelExpanded()"
                  (click)="toggleFilterPanel()">
            <mat-icon>{{ filterPanelExpanded() ? 'expand_less' : 'expand_more' }}</mat-icon>
            <span>{{ languageService.t()('notifications.advanced') }}</span>
          </button>
        </div>

        <!-- Collapsible Advanced Filter Panel - Enhanced Structure -->
        <div class="filter-panel" [class.expanded]="filterPanelExpanded()">
          <div class="filter-panel-header">
            <div class="filter-header-content">
              <mat-icon class="filter-header-icon">tune</mat-icon>
              <h3 class="filter-header-title">{{ languageService.t()('notifications.advancedFilters') }}</h3>
            </div>
            <div class="filter-header-info">
              <span class="active-filters-count" *ngIf="getActiveFiltersCount() > 0">
                {{ getActiveFiltersCount() }} {{ languageService.t()('notifications.activeFilters') }}
              </span>
            </div>
          </div>

          <div class="filter-controls-wrapper">
            <!-- Filter Inputs Grid -->
            <div class="filter-controls-grid">
              <!-- First Row: Sensor, Device, Start Date, End Date (4 equal columns) -->
              <!-- Sensor Filter -->
              <div class="filter-group">
                <label class="filter-group-label">
                  <mat-icon>sensors</mat-icon>
                  <span>{{ languageService.t()('notifications.sensor') }}</span>
                </label>
                <mat-form-field appearance="outline" class="filter-field">
                  <mat-select [ngModel]="selectedSensor()" (ngModelChange)="selectedSensor.set($event); onSensorChange()" [placeholder]="languageService.t()('notifications.selectSensor')">
                    <mat-option [value]="null">{{ languageService.t()('notifications.allSensors') }}</mat-option>
                    <mat-option *ngFor="let sensor of availableSensors()" [value]="sensor">
                      {{ sensor }}
                    </mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

              <!-- Device Filter -->
              <div class="filter-group">
                <label class="filter-group-label">
                  <mat-icon>devices</mat-icon>
                  <span>{{ languageService.t()('notifications.device') }}</span>
                </label>
                <mat-form-field appearance="outline" class="filter-field">
                  <mat-select [(ngModel)]="selectedDevice" (selectionChange)="onDeviceChange()" [placeholder]="languageService.t()('notifications.selectDevice')">
                    <mat-option [value]="null">{{ languageService.t()('notifications.allDevices') }}</mat-option>
                    <mat-option *ngFor="let device of availableDevices()" [value]="device">
                      {{ device }}
                    </mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

              <!-- Date Range Filter - Start Date -->
              <div class="filter-group">
                <label class="filter-group-label">
                  <mat-icon>event</mat-icon>
                  <span>{{ languageService.t()('notifications.startDate') }}</span>
                </label>
                <mat-form-field appearance="outline" class="filter-field">
                  <mat-datepicker-toggle matIconSuffix [for]="startDatePicker"></mat-datepicker-toggle>
                  <mat-datepicker #startDatePicker></mat-datepicker>
                  <input matInput
                         [matDatepicker]="startDatePicker"
                         [ngModel]="dateRangeStart()"
                         (ngModelChange)="dateRangeStart.set($event); onDateRangeChange()"
                         [placeholder]="languageService.t()('notifications.selectStartDate')">
                </mat-form-field>
              </div>

              <!-- Date Range Filter - End Date -->
              <div class="filter-group">
                <label class="filter-group-label">
                  <mat-icon>event</mat-icon>
                  <span>{{ languageService.t()('notifications.endDate') }}</span>
                </label>
                <mat-form-field appearance="outline" class="filter-field">
                  <mat-datepicker-toggle matIconSuffix [for]="endDatePicker"></mat-datepicker-toggle>
                  <mat-datepicker #endDatePicker></mat-datepicker>
                  <input matInput
                         [matDatepicker]="endDatePicker"
                         [ngModel]="dateRangeEnd()"
                         (ngModelChange)="dateRangeEnd.set($event); onDateRangeChange()"
                         [placeholder]="languageService.t()('notifications.selectEndDate')">
                </mat-form-field>
              </div>

              <!-- Second Row: Search Filter (Full Width) -->
              <div class="filter-group search-group search-full-width">
                <label class="filter-group-label">
                  <mat-icon>search</mat-icon>
                  <span>{{ languageService.t()('notifications.search') }}</span>
                </label>
                <mat-form-field appearance="outline" class="filter-field search-field">
                  <mat-icon matPrefix>search</mat-icon>
                  <input matInput
                         [(ngModel)]="searchQuery"
                         (ngModelChange)="onSearchChange()"
                         [placeholder]="languageService.t()('notifications.searchPlaceholder')">
                  <button mat-icon-button matSuffix *ngIf="searchQuery" (click)="clearSearch()" class="clear-search-btn">
                    <mat-icon>close</mat-icon>
                  </button>
                </mat-form-field>
              </div>
            </div>

            <!-- Action Buttons Row -->
            <div class="filter-actions">
              <button mat-raised-button
                      class="mark-read-filter-button"
                      (click)="markFilteredAsRead()"
                      [disabled]="getFilteredUnreadCount() === 0"
                      [matTooltip]="languageService.t()('notifications.markFilteredAsRead')">
                <mat-icon>done_all</mat-icon>
                <span>{{ languageService.t()('notifications.markFilteredAsRead') }}</span>
                <span class="button-badge" *ngIf="getFilteredUnreadCount() > 0">{{ getFilteredUnreadCount() }}</span>
              </button>
              <button mat-raised-button
                      class="clear-filters-button"
                      (click)="clearAllFilters()"
                      [disabled]="!hasActiveFilters()"
                      [matTooltip]="languageService.t()('notifications.clearAllFilters')">
                <mat-icon>clear_all</mat-icon>
                <span>{{ languageService.t()('notifications.clearAllFilters') }}</span>
              </button>
              <button mat-stroked-button
                      class="apply-filters-button"
                      (click)="applyFilters()"
                      [matTooltip]="languageService.t()('notifications.applyFilters')">
                <mat-icon>check_circle</mat-icon>
                <span>{{ languageService.t()('notifications.apply') }}</span>
              </button>
              <button mat-stroked-button
                      class="clear-all-notifications-button"
                      (click)="clearAllNotifications()"
                      *ngIf="list().length > 0"
                      [matTooltip]="languageService.t()('notifications.clearAll') || 'Clear all notifications'">
                <mat-icon>delete_sweep</mat-icon>
                <span>{{ languageService.t()('notifications.clearAll') || 'Clear All' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- LOADING STATE -->
      <div class="loading-state glass-panel" *ngIf="!cacheReady">
        <div class="loading-spinner">
          <mat-spinner diameter="60"></mat-spinner>
        </div>
        <p class="loading-text">{{ languageService.t()('notifications.loadingFarmData') }}</p>
        <p class="loading-subtext">{{ languageService.t()('notifications.preparingInsights') }}</p>
      </div>

      <!-- 3️⃣ NOTIFICATION STREAM - LIST VIEW -->
      <div class="notification-stream" *ngIf="cacheReady && activeView() === 'list'">
        <div *ngFor="let group of groupedNotifications()" class="date-group">
          <div class="date-group-header"
               (click)="toggleDateGroup(group.group)"
               [class.expanded]="isDateGroupExpanded(group.group)"
               [attr.aria-expanded]="isDateGroupExpanded(group.group)"
               role="button"
               tabindex="0"
               (keydown.enter)="toggleDateGroup(group.group)"
               (keydown.space)="toggleDateGroup(group.group); $event.preventDefault()">
            <mat-icon class="expand-icon chevron">{{ isDateGroupExpanded(group.group) ? 'expand_less' : 'expand_more' }}</mat-icon>
            <span class="date-label">{{ group.label }}</span>
            <span class="date-count">{{ group.notifications.length }}</span>
          </div>

          <div class="notifications-grid"
               [class.collapsed]="!isDateGroupExpanded(group.group)">
            <div *ngFor="let n of group.notifications; let i = index; trackBy: trackById"
                 class="notification-card glass-card"
                 [class.unread]="!n.read"
                 [class.expanded]="expandedCardId() === n.id"
                 [class.first-notification]="isFirstNotification(group, i)"
                 [attr.data-level]="n.level"
                 (click)="toggleCardExpansion(n.id)">

              <!-- Card Glow Effect -->
              <div class="card-glow" [attr.data-level]="n.level"></div>

              <!-- Left Border Indicator (Unread) -->
              <div class="card-indicator" *ngIf="!n.read"></div>

              <!-- First/Latest Badge -->
              <div class="first-badge" *ngIf="isFirstNotification(group, i)">
                <mat-icon>new_releases</mat-icon>
                <span>Latest</span>
              </div>

              <!-- Left Icon -->
              <div class="card-icon" [class]="getIconClass(n)">
                <mat-icon>{{ getFarmerIcon(n) }}</mat-icon>
                <div class="pulse-ring" *ngIf="!n.read"></div>
              </div>

              <!-- Middle Content -->
              <div class="card-content">
                <div class="card-header">
                  <div class="card-title-wrapper">
                    <h3 class="card-title" [class.unread-title]="!n.read">{{ getFarmerTitle(n) }}</h3>
                    <!-- Unread Dot Indicator -->
                    <div class="unread-dot" *ngIf="!n.read"></div>
                  </div>
                  <div class="card-time-wrapper">
                    <mat-icon class="time-icon">schedule</mat-icon>
                    <span class="card-time">{{ notificationTimes().get(n.id) || 'Just now' }}</span>
                  </div>
                </div>

                <p class="card-message" [class.unread-message]="!n.read">{{ getFarmerMessage(n) }}</p>

                <!-- CTA Button or Tag -->
                <div class="card-cta" *ngIf="getFarmerAction(n) && expandedCardId() !== n.id">
                  <button mat-stroked-button class="cta-button">
                    <mat-icon>lightbulb</mat-icon>
                    <span>{{ getFarmerAction(n) }}</span>
                  </button>
                </div>

                <div class="card-meta">
                  <mat-chip [class]="getPriorityChipClass(n)" size="small">
                    {{ getFarmerPriority(n) }}
                  </mat-chip>
                  <span class="meta-location" *ngIf="getLocation(n) as location">
                    <mat-icon>location_on</mat-icon>
                    {{ location }}
                  </span>
                </div>

                <!-- EXPANDED DETAILS -->
                <div class="card-expanded" *ngIf="expandedCardId() === n.id">
                  <mat-divider></mat-divider>

                  <div class="expanded-content">
                    <div class="expanded-row">
                      <mat-icon>schedule</mat-icon>
                      <span class="expanded-label">{{ languageService.t()('notifications.created') }}:</span>
                      <span class="expanded-value">{{ formatFullDate(n.createdAt) }}</span>
                    </div>

                    <div class="expanded-row" *ngIf="getLocation(n) as location">
                      <mat-icon>location_on</mat-icon>
                      <span class="expanded-label">{{ languageService.t()('notifications.location') }}:</span>
                      <span class="expanded-value">{{ location }}</span>
                    </div>

                    <div class="expanded-row" *ngIf="n.source">
                      <mat-icon>source</mat-icon>
                      <span class="expanded-label">{{ languageService.t()('notifications.source') }}:</span>
                      <span class="expanded-value">{{ n.source }}</span>
                    </div>

                    <div class="expanded-action" *ngIf="getFarmerAction(n)">
                      <mat-icon>lightbulb</mat-icon>
                      <div>
                        <strong>{{ languageService.t()('notifications.suggestedAction') }}:</strong>
                        <p>{{ getFarmerAction(n) }}</p>
                      </div>
                    </div>

                    <div class="expanded-context" *ngIf="n.context">
                      <mat-icon>info</mat-icon>
                      <div>
                        <strong>{{ languageService.t()('notifications.context') }}:</strong>
                        <p>{{ formatContext(n.context) }}</p>
                      </div>
                    </div>
                  </div>

                  <!-- Expanded Actions -->
                  <div class="expanded-actions">
                    <button mat-raised-button
                            class="mark-read-expanded-button"
                            (click)="markRead(n); $event.stopPropagation()"
                            *ngIf="!n.read"
                            [matTooltip]="languageService.t()('notifications.markAsRead')">
                      <mat-icon>check_circle</mat-icon>
                      <span>{{ languageService.t()('notifications.markAsRead') }}</span>
                    </button>
                    <button mat-stroked-button
                            class="mark-unread-expanded-button"
                            (click)="markUnread(n); $event.stopPropagation()"
                            *ngIf="n.read"
                            [matTooltip]="languageService.t()('notifications.markAsUnread')">
                      <mat-icon>mark_email_unread</mat-icon>
                      <span>{{ languageService.t()('notifications.markAsUnread') }}</span>
                    </button>
                    <button mat-stroked-button
                            class="dismiss-expanded-button"
                            (click)="remove(n); $event.stopPropagation()"
                            [matTooltip]="languageService.t()('notifications.dismiss')">
                      <mat-icon>delete_outline</mat-icon>
                      <span>{{ languageService.t()('notifications.dismiss') }}</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Right Actions -->
              <div class="card-actions">
                <button mat-icon-button
                        class="action-button"
                        (click)="markRead(n); $event.stopPropagation()"
                        *ngIf="!n.read"
                        [matTooltip]="languageService.t()('notifications.markAsRead')">
                  <mat-icon>check</mat-icon>
                </button>
                <button mat-icon-button
                        class="action-button delete"
                        (click)="remove(n); $event.stopPropagation()"
                        [matTooltip]="languageService.t()('notifications.dismiss')">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 3️⃣ NOTIFICATION STREAM - TIMELINE VIEW -->
      <div class="notification-timeline" *ngIf="cacheReady && activeView() === 'timeline'">
        <div class="timeline-container">
          <div *ngFor="let n of filteredNotifications(); let i = index; trackBy: trackById"
               class="timeline-item"
               [class.unread]="!n.read"
               [attr.data-level]="n.level">

            <div class="timeline-marker">
              <div class="marker-dot" [attr.data-level]="n.level">
                <mat-icon>{{ getFarmerIcon(n) }}</mat-icon>
              </div>
              <div class="timeline-line" *ngIf="i < filteredNotifications().length - 1"></div>
            </div>

            <div class="timeline-content glass-card">
              <div class="timeline-time">{{ notificationTimes().get(n.id) || 'Just now' }}</div>
              <h4>{{ getFarmerTitle(n) }}</h4>
              <p>{{ getFarmerMessage(n) }}</p>

              <div class="timeline-meta">
                <mat-chip [class]="getPriorityChipClass(n)" size="small">
                  {{ getFarmerPriority(n) }}
                </mat-chip>
                <span *ngIf="getLocation(n) as location">
                  <mat-icon>location_on</mat-icon>
                  {{ location }}
                </span>
              </div>

              <div class="timeline-actions">
                <button mat-icon-button (click)="markRead(n)" *ngIf="!n.read">
                  <mat-icon>check</mat-icon>
                </button>
                <button mat-icon-button (click)="remove(n)">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 4️⃣ INFINITE SCROLL SENTINEL -->
      <div #scrollSentinel class="scroll-sentinel" *ngIf="hasMoreNotifications && !loading"></div>

      <!-- LOAD MORE BUTTON (Fallback) -->
      <div class="load-more-section" *ngIf="hasMoreNotifications && !loading">
        <button mat-raised-button
                class="glass-button load-more"
                (click)="loadMore()"
                [disabled]="loadingMore">
          <mat-spinner *ngIf="loadingMore" diameter="20"></mat-spinner>
          <mat-icon *ngIf="!loadingMore">expand_more</mat-icon>
          {{ loadingMore ? languageService.t()('notifications.loading') : languageService.t()('notifications.showMore') }}
        </button>
        <p class="load-info">
          {{ languageService.t()('notifications.showing') }} {{ list().length }} {{ languageService.t()('notifications.of') }} {{ total }}
        </p>
      </div>

      <!-- LOADING MORE SPINNER -->
      <div class="loading-more-spinner" *ngIf="loadingMore">
        <div class="gradient-spinner"></div>
      </div>

      <!-- 6️⃣ EMPTY STATE -->
      <div class="empty-state glass-panel" *ngIf="cacheReady && filteredNotifications().length === 0 && !loading">
        <div class="empty-icon">
          <mat-icon>notifications_off</mat-icon>
          <div class="icon-glow"></div>
        </div>
        <h3>{{ languageService.t()('notifications.noNotifications') }}</h3>
        <p class="calm-message">{{ languageService.t()('notifications.everythingCalm') }} 🌿</p>

        <div class="empty-tips" *ngIf="list().length === 0">
          <p>{{ languageService.t()('notifications.youWillGetNotified') }}</p>
        </div>
      </div>

      <!-- THEME/LANGUAGE TRANSITION OVERLAY -->
      <div class="transition-overlay" *ngIf="showTransition"></div>
      </ng-container>
    </div>
  `,
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit, OnDestroy {
  // Destroy subject for cleanup
  private destroy$ = new Subject<void>();

  constructor() {
    this.logger.debug('🏗️ [NOTIFICATIONS] Component constructor called');

    // React to language changes
    effect(() => {
      const lang = this.languageService.currentLanguage();
      this.triggerTransition();
      this.logger.debug('🌐 Language changed to:', lang);
    });
  }

  // INJECTED SERVICES (PRESERVED)
  private svc = inject(NotificationService);
  private api = inject(ApiService);
  private farmManagement = inject(FarmManagementService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  public languageService = inject(LanguageService);
  private logger = inject(LoggerService);
  public authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  // EXISTING DATA STATE (PRESERVED)
  list = signal<AppNotification[]>([]);
  total = 0;
  pageSize = NOTIFICATION_CONFIG.CACHE.PAGE_SIZE;
  loading = false;
  loadingMore = false;
  hasMoreNotifications = false;
  cacheReady = false;

  private farmDeviceCache = new Map<string, string>();
  private deviceLocationCache = new Map<string, string>();
  private locationCache = new Map<string, string>();

  // NEW UI STATE SIGNALS
  activeView = signal<'list' | 'timeline' | 'map'>('list');
  activeFilters = 'all';
  selectedFarm = signal<string | null>(null);
  selectedDevice = signal<string | null>(null);
  selectedSensor = signal<string | null>(null);
  dateRangeStart = signal<Date | null>(null);
  dateRangeEnd = signal<Date | null>(null);
  searchQuery = '';
  expandedCardId = signal<string | null>(null);
  showTransition = signal(false);
  isAdmin = signal(false);
  filterPanelExpanded = signal(false); // Default: collapsed
  expandedDateGroups = signal<Set<DateGroup>>(new Set()); // Track expanded date groups

  // Computed property to check if user can view notifications
  canViewNotifications = computed(() => {
    return this.authService.hasAnyRole(['farmer', 'moderator']);
  });

  @ViewChild('scrollSentinel') scrollSentinel?: ElementRef;
  private intersectionObserver?: IntersectionObserver;

  // Auto-refresh functionality
  private autoRefreshInterval?: number;
  public autoRefreshEnabled = signal(true);
  private lastRefreshTime = signal<Date | null>(null);

  // Search debouncing
  private searchTimeout?: number;

  // Time update signal to prevent ExpressionChangedAfterItHasBeenCheckedError
  private currentTime = signal<Date>(new Date());
  private timeUpdateInterval?: number;
  private timeCache = new Map<string, string>();
  
  // Signal to hold formatted times map - updated only after render
  private notificationTimesMap = signal<Map<string, string>>(new Map());
  
  // Computed map of notification IDs to formatted times - uses stable map
  notificationTimes = computed(() => {
    return this.notificationTimesMap();
  });

  // COMPUTED SIGNALS FOR UI
  kpiStats = computed(() => {
    const notifications = this.list();
    const unread = notifications.filter(n => !n.read).length;
    const critical = notifications.filter(n => n.level === 'critical').length;
    const lastNotification = notifications[0];
    const lastUpdated = lastNotification
      ? (this.notificationTimes().get(lastNotification.id) || this.languageService.t()('notifications.never'))
      : this.languageService.t()('notifications.never');

    return {
      total: notifications.length,
      unread,
      critical,
      lastUpdated
    };
  });

  availableFilters = computed(() => {
    const t = this.languageService.t();
    const notifications = this.list();
    return [
      { value: 'all', label: t('notifications.all'), icon: 'apps', count: notifications.length },
      { value: 'critical', label: t('notifications.critical'), icon: 'priority_high', count: notifications.filter(n => n.level === 'critical').length },
      { value: 'warning', label: t('notifications.warning'), icon: 'warning', count: notifications.filter(n => n.level === 'warning').length },
      { value: 'unread', label: t('notifications.unread'), icon: 'mark_email_unread', count: notifications.filter(n => !n.read).length },
      { value: 'read', label: t('notifications.read'), icon: 'mark_email_read', count: notifications.filter(n => n.read).length },
    ];
  });

  availableFarms = computed(() => {
    const farms = new Set<string>();
    this.farmDeviceCache.forEach(farmName => farms.add(farmName));
    return Array.from(farms).sort();
  });

  availableDevices = computed(() => {
    const devices = new Set<string>();
    this.farmDeviceCache.forEach((_, deviceId) => devices.add(deviceId));
    return Array.from(devices).sort();
  });

  availableSensors = signal<string[]>([]);

  filteredNotifications = computed(() => {
    let filtered = [...this.list()];

    // Filter by level or read status
    if (this.activeFilters !== 'all') {
      if (this.activeFilters === 'unread') {
        filtered = filtered.filter(n => !n.read);
      } else if (this.activeFilters === 'read') {
        filtered = filtered.filter(n => n.read);
      } else {
        filtered = filtered.filter(n => n.level === this.activeFilters);
      }
    }

    // Filter by farm
    const farm = this.selectedFarm();
    if (farm) {
      filtered = filtered.filter(n => {
        const location = this.getLocation(n);
        return location?.includes(farm);
      });
    }

    // Filter by device
    const device = this.selectedDevice();
    if (device) {
      filtered = filtered.filter(n => {
        const deviceId = n.context?.deviceId || n.context?.device_id;
        return deviceId === device;
      });
    }

    // Filter by sensor
    const sensor = this.selectedSensor();
    if (sensor) {
      filtered = filtered.filter(n => {
        const sensorId = n.context?.sensorId || n.context?.sensor_id || n.context?.sensor?.sensor_id;
        return sensorId === sensor;
      });
    }

    // Filter by date range
    const startDate = this.dateRangeStart();
    const endDate = this.dateRangeEnd();
    if (startDate || endDate) {
      filtered = filtered.filter(n => {
        const notificationDate = new Date(n.createdAt);
        if (startDate && notificationDate < startDate) return false;
        if (endDate) {
          const endDateWithTime = new Date(endDate);
          endDateWithTime.setHours(23, 59, 59, 999); // Include entire end date
          if (notificationDate > endDateWithTime) return false;
        }
        return true;
      });
    }

    // Filter by search query
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(n => {
        const title = this.getFarmerTitle(n).toLowerCase();
        const message = this.getFarmerMessage(n).toLowerCase();
        return title.includes(query) || message.includes(query);
      });
    }

    return filtered;
  });

  groupedNotifications = computed(() => {
    const notifications = this.filteredNotifications();
    const groups: GroupedNotifications[] = [];
    const t = this.languageService.t();

    const todayMorning: AppNotification[] = [];
    const todayAfternoon: AppNotification[] = [];
    const yesterday: AppNotification[] = [];
    const thisWeek: AppNotification[] = [];
    const older: AppNotification[] = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);

    notifications.forEach(n => {
      const date = new Date(n.createdAt);
      const hours = date.getHours();

      if (date >= todayStart) {
        if (hours < 12) {
          todayMorning.push(n);
        } else {
          todayAfternoon.push(n);
        }
      } else if (date >= yesterdayStart) {
        yesterday.push(n);
      } else if (date >= weekStart) {
        thisWeek.push(n);
      } else {
        older.push(n);
      }
    });

    // Sort each group by date (newest first)
    const sortByDate = (a: AppNotification, b: AppNotification) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    };
    
    todayMorning.sort(sortByDate);
    todayAfternoon.sort(sortByDate);
    yesterday.sort(sortByDate);
    thisWeek.sort(sortByDate);
    older.sort(sortByDate);

    if (todayMorning.length > 0) {
      groups.push({
        group: 'today-morning',
        label: t('notifications.todayMorning'),
        notifications: todayMorning
      });
    }

    if (todayAfternoon.length > 0) {
      groups.push({
        group: 'today-afternoon',
        label: t('notifications.todayAfternoon'),
        notifications: todayAfternoon
      });
    }

    if (yesterday.length > 0) {
      groups.push({
        group: 'yesterday',
        label: t('notifications.yesterday'),
        notifications: yesterday
      });
    }

    if (thisWeek.length > 0) {
      groups.push({
        group: 'this-week',
        label: t('notifications.thisWeek'),
        notifications: thisWeek
      });
    }

    if (older.length > 0) {
      groups.push({
        group: 'older',
        label: t('notifications.older'),
        notifications: older
      });
    }

    return groups;
  });

  currentDirection = computed(() => {
    return this.languageService.currentLanguage().startsWith('ar') ? 'rtl' : 'ltr';
  });

  // PRESERVED LIFECYCLE
  async ngOnInit() {
    this.logger.debug('🏗️ [NOTIFICATIONS] ngOnInit called');

    // Check for admin role
    if (this.authService.hasRole('admin')) {
      this.isAdmin.set(true);
      this.loading = false;
      this.cacheReady = true; // Show the admin message immediately
      return;
    }

    // Check if user has permission to view notifications (only farmer or moderator)
    if (!this.canViewNotifications()) {
      this.loading = false;
      this.cacheReady = true; // Show the access denied message immediately
      return;
    }

    // Initialize expanded date groups (all expanded by default)
    if (this.expandedDateGroups().size === 0) {
      const expanded = new Set<DateGroup>(['today-morning', 'today-afternoon', 'yesterday', 'this-week', 'older']);
      this.expandedDateGroups.set(expanded);
    }

    // Only skip if we already have notifications AND cache is ready (already initialized)
    if (this.list().length > 0 && this.cacheReady) {
      this.logger.debug('🏗️ [NOTIFICATIONS] Notifications already loaded, skipping');
      return;
    }

    this.locationCache.clear();
    this.farmDeviceCache.clear();
    this.deviceLocationCache.clear();

    // Start with cache ready = true to allow UI to display
    this.cacheReady = true;

    this.logger.debug('🏗️ [NOTIFICATIONS] Building farm device cache in background...');
    // Build cache in background - don't await to avoid blocking
    this.buildFarmDeviceCache().catch(err => {
      this.logger.error('❌ [NOTIFICATIONS] Cache build error (non-blocking)', err);
    });

    this.logger.debug('🏗️ [NOTIFICATIONS] Loading notifications immediately...');
    await this.loadDefaultNotifications();
    this.loadSensors();
    this.setupIntersectionObserver();

    // ✅ FIX: Add takeUntil to prevent memory leak
    this.svc.newNotification$
      .pipe(takeUntil(this.destroy$))
      .subscribe(n => {
        this.logger.debug('🔔 [NOTIFICATIONS] New notification received:', n);
        this.locationCache.delete(n.id);
        this.list.set([n, ...this.list()]);
        this.showNotificationSnackbar(n);
      });

    // Setup auto-refresh
    this.setupAutoRefresh();
    
    // Setup time update interval to prevent change detection errors
    this.setupTimeUpdates();
  }

  ngOnDestroy() {
    // ✅ FIX: Complete the destroy$ subject to unsubscribe all
    this.destroy$.next();
    this.destroy$.complete();

    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }

    // Clean up auto-refresh
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }

    // Clean up time update interval
    if (this.timeUpdateInterval) {
      clearTimeout(this.timeUpdateInterval);
    }

    // Clear time cache
    this.timeCache.clear();
  }

  // PRESERVED CACHE BUILD LOGIC
  private async buildFarmDeviceCache() {
    try {
      this.logger.debug('🏗️ [NOTIFICATIONS] Building farm device cache...');
      this.locationCache.clear();

      const farms = await this.farmManagement.farms();
      this.logger.debug('🏗️ [NOTIFICATIONS] Farms from farm management:', farms);

      if (!farms || farms.length === 0) {
        this.logger.debug('🏗️ [NOTIFICATIONS] No farms from farm management, trying API...');
        try {
          const directFarms = await this.api.getFarms().toPromise();
          this.logger.debug('🏗️ [NOTIFICATIONS] Farms from API:', directFarms);

          if (directFarms && directFarms.length > 0) {
            await this.processFarmsForCache(directFarms);
          } else {
            this.logger.debug('🏗️ [NOTIFICATIONS] No farms found, marking cache ready');
            this.cacheReady = true;
            return;
          }
        } catch (apiError) {
          this.logger.error('🏗️ [NOTIFICATIONS] Error getting farms from API', apiError);
          this.cacheReady = true;
          return;
        }
      } else {
        await this.processFarmsForCache(farms);
      }

      this.cacheReady = true;
      this.logger.debug('🏗️ [NOTIFICATIONS] Farm device cache built successfully');

    } catch (error) {
      this.logger.error('❌ [NOTIFICATIONS] Error building farm-device cache', error);
      this.cacheReady = false;
    }
  }

  private async processFarmsForCache(farms: any[]) {
    for (const farm of farms) {
      try {
        const farmDevices = await this.api.getDevicesByFarm(farm.farm_id).toPromise();

        if (farmDevices && farmDevices.length > 0) {
          farmDevices.forEach(device => {
            this.farmDeviceCache.set(device.device_id, farm.name);
            if (device.location) {
              this.deviceLocationCache.set(device.device_id, device.location);
            }
          });
        }
      } catch (deviceError) {
        this.logger.error(`Error getting devices for farm ${farm.name}`, deviceError);
      }
    }
  }

  // PRESERVED LOAD LOGIC
  async load(offset = 0, append = false) {
    // Allow loading regardless of cache state - cache is for enriching data, not blocking loads

    if (append) {
      this.loadingMore = true;
    } else {
      this.loading = true;
    }

    try {
      this.logger.debug('📡 [NOTIFICATIONS] Loading notifications from API...');
      const res = await this.api.getNotifications({ limit: this.pageSize, offset }).toPromise();
      this.logger.debug('📡 [NOTIFICATIONS] API response:', res);

      const items = res?.items ?? [];
      this.logger.debug('📡 [NOTIFICATIONS] Raw items:', items);

      const mappedItems = items.map((n: any) => ({
        id: n.id,
        level: n.level,
        title: n.title,
        message: n.message,
        createdAt: n.created_at || n.createdAt,
        read: !!(n.is_read ?? n.read),
        source: n.source,
        context: n.context,
      }));

      this.logger.debug('📡 [NOTIFICATIONS] Mapped items:', mappedItems);

      if (append) {
        this.list.set([...this.list(), ...mappedItems]);
      } else {
        this.list.set(mappedItems);
      }

      this.total = res?.total ?? 0;
      this.hasMoreNotifications = this.list().length < this.total;

      this.logger.debug('📡 [NOTIFICATIONS] Final list length:', this.list().length);
      this.logger.debug('📡 [NOTIFICATIONS] Total notifications:', this.total);

    } catch (error) {
      this.logger.error('❌ [NOTIFICATIONS] Error loading notifications', error);
    } finally {
      this.loading = false;
      this.loadingMore = false;
    }
  }

  async loadMore() {
    if (this.loadingMore || !this.hasMoreNotifications) return;
    const currentOffset = this.list().length;
    await this.load(currentOffset, true);
  }

  // NEW: Auto-load all notifications without filters
  async loadDefaultNotifications() {
    try {
      // Ensure no filters are applied - load all notifications directly
      this.selectedFarm.set(null);
      this.selectedDevice.set(null);
      this.activeFilters = 'all';
      this.searchQuery = '';

      this.logger.debug('🏗️ [NOTIFICATIONS] Loading all notifications without filters');

      // Load notifications without any filters
      await this.load();
    } catch (error) {
      this.logger.error('❌ [NOTIFICATIONS] Error in loadDefaultNotifications', error);
      // Fallback to loading all notifications
      this.selectedFarm.set(null);
      this.selectedDevice.set(null);
      await this.load();
    }
  }

  async refreshNotifications() {
    await this.load(0, false);
    this.lastRefreshTime.set(new Date());
    this.scrollToTop();
  }

  // Auto-refresh functionality
  private setupAutoRefresh() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }

    // Auto-refresh using config
    this.autoRefreshInterval = window.setInterval(() => {
      if (this.autoRefreshEnabled() && !this.loading) {
        this.refreshNotifications();
      }
    }, NOTIFICATION_CONFIG.AUTO_REFRESH.INTERVAL_MS);
  }

  toggleAutoRefresh() {
    this.autoRefreshEnabled.set(!this.autoRefreshEnabled());
    this.setupAutoRefresh();
  }

  getLastRefreshTime(): string {
    const lastRefresh = this.lastRefreshTime();
    if (!lastRefresh) return '';

    const now = new Date();
    const diffMs = now.getTime() - lastRefresh.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);

    if (diffSeconds < 60) {
      return `${diffSeconds}s ago`;
    } else if (diffSeconds < 3600) {
      return `${Math.floor(diffSeconds / 60)}m ago`;
    } else {
      return lastRefresh.toLocaleTimeString();
    }
  }

  notifications() { return this.list(); }
  trackById(index: number, n: AppNotification) { return n.id; }

  /**
   * Check if a notification is the first one in the first visible group
   */
  public isFirstNotification(group: GroupedNotifications, index: number): boolean {
    if (index !== 0) return false;
    
    const groups = this.groupedNotifications();
    if (groups.length === 0) return false;
    
    // Check if this is the first group and first notification in that group
    return groups[0].group === group.group;
  }

  // PRESERVED FARMER-FRIENDLY METHODS
  getUrgentCount(): number {
    return this.list().filter(n => n.level === 'critical').length;
  }

  getUnreadCount(): number {
    return this.list().filter(n => !n.read).length;
  }

  getNotificationClass(n: AppNotification): string {
    const classes = [];
    if (!n.read) classes.push('unread');
    if (n.level === 'critical') classes.push('urgent');
    else if (n.level === 'warning') classes.push('warning');
    else if (n.level === 'success') classes.push('success');
    return classes.join(' ');
  }

  getFarmerIcon(n: AppNotification): string {
    if (n.source === 'sensor') {
      if (n.title?.toLowerCase().includes('temperature')) return 'thermostat';
      if (n.title?.toLowerCase().includes('humidity')) return 'water_drop';
      if (n.title?.toLowerCase().includes('light')) return 'wb_sunny';
      return 'sensors';
    }

    if (n.source === 'device') {
      if (n.title?.toLowerCase().includes('irrigation')) return 'water';
      if (n.title?.toLowerCase().includes('ventilator') || n.title?.toLowerCase().includes('fan')) return 'air';
      if (n.title?.toLowerCase().includes('heater')) return 'local_fire_department';
      return 'devices';
    }

    if (n.source === 'action') {
      if (n.level === 'critical') return 'error';
      if (n.level === 'success') return 'check_circle';
      return 'play_arrow';
    }

    switch (n.level) {
      case 'critical': return 'warning';
      case 'warning': return 'info';
      case 'success': return 'check_circle';
      default: return 'notifications';
    }
  }

  getIconClass(n: AppNotification): string {
    switch (n.level) {
      case 'critical': return 'icon-urgent';
      case 'warning': return 'icon-warning';
      case 'success': return 'icon-success';
      default: return 'icon-info';
    }
  }

  getFarmerTitle(n: AppNotification): string {
    const title = n.title || '';

    if (title.includes('temperature') || title.includes('Temperature')) {
      if (title.includes('high') || title.includes('HIGH')) {
        return this.languageService.t()('notifications.temperatureTooHigh');
      }
      if (title.includes('low') || title.includes('LOW')) {
        return this.languageService.t()('notifications.temperatureTooLow');
      }
      return this.languageService.t()('notifications.temperatureAlert');
    }

    if (title.includes('humidity') || title.includes('Humidity')) {
      if (title.includes('high') || title.includes('HIGH')) {
        return this.languageService.t()('notifications.humidityTooHigh');
      }
      if (title.includes('low') || title.includes('LOW')) {
        return this.languageService.t()('notifications.humidityTooLow');
      }
      return this.languageService.t()('notifications.humidityAlert');
    }

    if (title.includes('device') || title.includes('Device')) {
      if (title.includes('offline') || title.includes('disconnected')) {
        return this.languageService.t()('notifications.deviceConnectionLost');
      }
      if (title.includes('online') || title.includes('connected')) {
        return this.languageService.t()('notifications.deviceConnected');
      }
      return this.languageService.t()('notifications.deviceUpdate');
    }

    if (title.includes('Action') || title.includes('action')) {
      if (title.includes('failed') || title.includes('error')) {
        return this.languageService.t()('notifications.actionFailed');
      }
      if (title.includes('success') || title.includes('executed')) {
        return this.languageService.t()('notifications.actionCompleted');
      }
      return this.languageService.t()('notifications.actionUpdate');
    }

    if (title.includes('System') || title.includes('system')) {
      return this.languageService.t()('notifications.systemUpdate');
    }

    if (title.includes('threshold') || title.includes('Threshold') || title.includes('warning') || title.includes('Warning')) {
      return this.languageService.t()('notifications.thresholdWarning');
    }

    return title.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getFarmerMessage(n: AppNotification): string {
    const message = n.message || '';
    const title = n.title || '';

    // First, try to format MQTT messages
    if (message.includes('Mqtt:') || message.includes('mqtt:') || message.includes('›')) {
      return this.formatMqttMessage(message);
    }

    if (title.includes('temperature') || title.includes('Temperature')) {
      if (message.includes('°C') || message.includes('°F')) {
        const temp = message.match(/(\d+\.?\d*)\s*°[CF]/)?.[0];
        if (title.includes('high')) {
          return this.languageService.t()('notifications.temperatureHigh', { temp: temp });
        }
        if (title.includes('low')) {
          return this.languageService.t()('notifications.temperatureLow', { temp: temp });
        }
        return this.languageService.t()('notifications.temperatureNormal', { temp: temp });
      }
      return this.languageService.t()('notifications.temperatureAttention');
    }

    if (title.includes('humidity') || title.includes('Humidity')) {
      if (message.includes('%')) {
        const humidity = message.match(/(\d+\.?\d*)\s*%/)?.[0];
        if (title.includes('high')) {
          return this.languageService.t()('notifications.humidityHigh', { humidity: humidity });
        }
        if (title.includes('low')) {
          return this.languageService.t()('notifications.humidityLow', { humidity: humidity });
        }
        return this.languageService.t()('notifications.humidityNormal', { humidity: humidity });
      }
      return this.languageService.t()('notifications.humidityAttention');
    }

    if (title.includes('device') || title.includes('Device')) {
      if (message.includes('offline') || message.includes('disconnected')) {
        return this.languageService.t()('notifications.deviceOffline');
      }
      if (message.includes('online') || message.includes('connected')) {
        return this.languageService.t()('notifications.deviceOnline');
      }
      return this.languageService.t()('notifications.deviceUpdate');
    }

    if (title.includes('Action') || title.includes('action')) {
      if (message.includes('failed') || message.includes('error')) {
        return this.languageService.t()('notifications.actionFailed');
      }
      if (message.includes('success') || message.includes('executed')) {
        return this.languageService.t()('notifications.actionSuccess');
      }
      return this.languageService.t()('notifications.actionUpdate');
    }

    let cleanMessage = message
      .replace(/mqtt:/g, '')
      .replace(/smartfarm\//g, '')
      .replace(/actuators\//g, '')
      .replace(/sensors\//g, '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());

    return cleanMessage || this.languageService.t()('notifications.somethingHappened');
  }

  /**
   * Format MQTT messages into human-friendly text
   * Example: "Mqtt:smartfarm › Actuators › Dht11h › Ventilator Off"
   * Becomes: "Ventilator turned off on Actuator DHT11H (via MQTT)"
   */
  private formatMqttMessage(message: string): string {
    if (!message) return '';

    // Remove MQTT prefix and normalize separators
    let clean = message
      .replace(/^[Mm]qtt:/i, '')
      .replace(/smartfarm\s*/i, '')
      .trim();

    // Split by › or / or |
    const parts = clean.split(/[›\/|]/).map(p => p.trim()).filter(p => p);

    if (parts.length === 0) return message;

    // Extract components
    let deviceType = '';
    let deviceName = '';
    let action = '';

    // Find device type (Actuators, Sensors, etc.)
    const deviceTypeIndex = parts.findIndex(p =>
      /actuators?/i.test(p) || /sensors?/i.test(p) || /devices?/i.test(p)
    );

    if (deviceTypeIndex >= 0) {
      deviceType = parts[deviceTypeIndex];
      // Device name is usually after device type
      if (deviceTypeIndex + 1 < parts.length) {
        deviceName = parts[deviceTypeIndex + 1];
      }
      // Action is usually the last part
      if (parts.length > deviceTypeIndex + 2) {
        action = parts[parts.length - 1];
      } else if (parts.length > deviceTypeIndex + 1) {
        action = parts[parts.length - 1];
      }
    } else {
      // Fallback: assume last part is action, second-to-last is device
      if (parts.length >= 2) {
        deviceName = parts[parts.length - 2];
        action = parts[parts.length - 1];
      } else if (parts.length === 1) {
        action = parts[0];
      }
    }

    // Format device name (capitalize and handle common patterns)
    const formattedDeviceName = deviceName
      .split(/[-_\s]/)
      .map(word => {
        // Handle patterns like "dht11h" -> "DHT11H"
        if (/^[a-z]+\d+[a-z]*$/i.test(word)) {
          return word.toUpperCase();
        }
        // Handle camelCase
        if (/^[a-z][A-Z]/.test(word)) {
          return word;
        }
        // Capitalize first letter
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');

    // Format action (convert snake_case and camelCase to Title Case)
    const formattedAction = action
      .split(/[-_\s]/)
      .map(word => {
        // Handle on/off states
        if (word.toLowerCase() === 'on') return 'turned on';
        if (word.toLowerCase() === 'off') return 'turned off';
        // Capitalize
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');

    // Build human-friendly message
    let result = '';

    if (formattedAction) {
      result = formattedAction;
    }

    if (formattedDeviceName) {
      const deviceLabel = /actuators?/i.test(deviceType) ? 'Actuator' :
                         /sensors?/i.test(deviceType) ? 'Sensor' : 'Device';
      if (result) {
        result += ` on ${deviceLabel} ${formattedDeviceName}`;
      } else {
        result = `${deviceLabel} ${formattedDeviceName}`;
      }
    }

    // Add MQTT source indicator
    if (message.toLowerCase().includes('mqtt')) {
      result += ' (via MQTT)';
    }

    return result || message;
  }

  getFarmerAction(n: AppNotification): string | null {
    const title = n.title || '';
    const message = n.message || '';
    const t = this.languageService.t();

    if (title.includes('temperature') && title.includes('high')) {
      return t('notifications.suggestedActions.checkVentilation');
    }
    if (title.includes('temperature') && title.includes('low')) {
      return t('notifications.suggestedActions.checkHeating');
    }

    if (title.includes('humidity') && title.includes('high')) {
      return t('notifications.suggestedActions.improveCirculation');
    }
    if (title.includes('humidity') && title.includes('low')) {
      return t('notifications.suggestedActions.checkWater');
    }

    if (title.includes('device') && (message.includes('offline') || message.includes('disconnected'))) {
      return t('notifications.suggestedActions.checkDevicePower');
    }

    if (title.includes('Action') && message.includes('failed')) {
      return t('notifications.suggestedActions.retryAction');
    }

    return null;
  }

  /**
   * Setup time updates to prevent ExpressionChangedAfterItHasBeenCheckedError
   * Updates the notificationTimesMap signal using setTimeout(0) to push updates
   * to the next tick, ensuring they happen after change detection completes
   */
  private setupTimeUpdates(): void {
    // Initialize the map
    this.updateNotificationTimes();
    
    // Use setTimeout to update outside change detection cycle
    const updateTime = () => {
      // Calculate new times
      const newTimes = this.calculateNotificationTimes();
      
      // Use setTimeout(0) to push signal update to next tick
      // This ensures it happens after current change detection cycle
      setTimeout(() => {
        this.notificationTimesMap.set(newTimes);
      }, 0);
      
      // Schedule next update after 1 second
      this.timeUpdateInterval = window.setTimeout(() => {
        updateTime();
      }, 1000) as any;
    };
    
    // Start the update cycle after initial render
    // Use setTimeout to ensure this runs after the current change detection cycle
    setTimeout(() => {
      this.timeUpdateInterval = window.setTimeout(() => {
        updateTime();
      }, 1000) as any;
    }, 0);
  }

  /**
   * Calculate notification times without updating the signal
   * Called outside Angular zone
   */
  private calculateNotificationTimes(): Map<string, string> {
    const notifications = untracked(() => this.list());
    const now = new Date();
    const times = new Map<string, string>();
    const t = this.languageService.t();
    
    notifications.forEach(n => {
      const cacheKey = n.createdAt;
      
      // Check cache first
      if (this.timeCache.has(cacheKey)) {
        times.set(n.id, this.timeCache.get(cacheKey)!);
        return;
      }
      
      const date = new Date(n.createdAt);
      const diffMs = now.getTime() - date.getTime();
      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      let formattedTime: string;
      
      if (diffSeconds < 60) {
        formattedTime = diffSeconds < 10
          ? t('notifications.time.justNow') || 'Just now'
          : `${diffSeconds}s ago`;
      } else if (diffMinutes < 60) {
        formattedTime = `${diffMinutes}m ago`;
      } else if (diffHours < 24) {
        formattedTime = `${diffHours}h ago`;
      } else if (diffDays < 7) {
        formattedTime = `${diffDays}d ago`;
      } else {
        formattedTime = date.toLocaleDateString(this.languageService.currentLanguage(), {
          month: 'short',
          day: 'numeric',
          year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
        // Cache formatted dates as they don't change
        this.timeCache.set(cacheKey, formattedTime);
      }
      
      times.set(n.id, formattedTime);
    });
    
    // Clear cache for relative times (under 1 hour) to force recalculation next time
    const keysToDelete: string[] = [];
    this.timeCache.forEach((value, key) => {
      const date = new Date(key);
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      // Mark cache entries less than 1 hour old for deletion
      if (diffHours < 1) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.timeCache.delete(key));
    
    return times;
  }

  /**
   * Update the notification times map
   * Called during initialization
   */
  private updateNotificationTimes(): void {
    const times = this.calculateNotificationTimes();
    this.notificationTimesMap.set(times);
  }

  /**
   * Get formatted time for a notification (kept for backward compatibility)
   * Now uses the computed notificationTimes map instead
   */
  getFarmerTime(dateStr: string): string {
    if (!dateStr) return '';
    
    // Find notification by createdAt to get its ID
    const notification = this.list().find(n => n.createdAt === dateStr);
    if (notification) {
      return this.notificationTimes().get(notification.id) || 'Just now';
    }
    
    // Fallback for direct date string (shouldn't happen in normal flow)
    const now = this.currentTime();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const t = this.languageService.t();

    if (diffSeconds < 60) {
      return diffSeconds < 10
        ? t('notifications.time.justNow') || 'Just now'
        : `${diffSeconds}s ago`;
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString(this.languageService.currentLanguage(), {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  }

  getFarmerPriority(n: AppNotification): string {
    switch (n.level) {
      case 'critical': return this.languageService.t()('notifications.urgent');
      case 'warning': return this.languageService.t()('notifications.important');
      case 'success': return this.languageService.t()('notifications.success');
      default: return this.languageService.t()('notifications.normal');
    }
  }

  getPriorityChipClass(n: AppNotification): string {
    switch (n.level) {
      case 'critical': return 'priority-urgent';
      case 'warning': return 'priority-important';
      case 'success': return 'priority-low';
      default: return 'priority-normal';
    }
  }

  extractDeviceIdFromMessage(message: string): string | null {
    if (!message) return null;

    const cacheKeys = Array.from(this.farmDeviceCache.keys());
    for (const deviceId of cacheKeys) {
      if (message.includes(deviceId)) {
        return deviceId;
      }
    }

    const extractedId = this.extractPartialDeviceId(message);
    if (extractedId) {
      for (const deviceId of cacheKeys) {
        if (deviceId.toLowerCase().startsWith(extractedId.toLowerCase())) {
          return deviceId;
        }
      }
      return extractedId;
    }

    return null;
  }

  private extractPartialDeviceId(message: string): string | null {
    const deviceIdMatch = message.match(/([a-zA-Z0-9]+[Hh]?)\s*[•·]\s*/);
    if (deviceIdMatch) {
      return deviceIdMatch[1];
    }

    const startMatch = message.match(/^([a-zA-Z0-9]+[Hh]?)\s*\(/);
    if (startMatch) {
      return startMatch[1];
    }

    const fallbackMatch = message.match(/^([a-zA-Z0-9]+[Hh]?)/);
    if (fallbackMatch) {
      return fallbackMatch[1];
    }

    return null;
  }

  getLocation(n: AppNotification): string | null {
    if (!this.cacheReady) {
      return null;
    }

    if (this.locationCache.has(n.id)) {
      const cached = this.locationCache.get(n.id)!;
      if (cached.startsWith('Device ')) {
        this.locationCache.delete(n.id);
      } else {
        return cached;
      }
    }

    const notificationDeviceId = n.context?.deviceId ||
                               n.context?.device_id ||
                               this.extractDeviceIdFromMessage(n.message || '');

    if (!notificationDeviceId) {
      this.locationCache.set(n.id, 'System');
      return 'System';
    }

    const farmName = this.farmDeviceCache.get(notificationDeviceId);
    const deviceLocation = this.deviceLocationCache.get(notificationDeviceId);

    let result: string;
    if (farmName && deviceLocation) {
      result = `${farmName} - ${deviceLocation}`;
    } else if (farmName) {
      result = farmName;
    } else if (deviceLocation) {
      result = deviceLocation;
    } else {
      result = `Device ${notificationDeviceId}`;
    }

    this.locationCache.set(n.id, result);
    return result;
  }

  // PRESERVED ACTIONS
  async markRead(n: AppNotification) {
    try {
      await this.api.markNotificationsRead([n.id]).toPromise();
      this.list.update(list => list.map(item => item.id === n.id ? { ...item, read: true } : item));
      this.svc.decrementUnread(1);
      this.snackBar.open(
        this.languageService.t()('notifications.markedAsRead'),
        '',
        { duration: 2000, panelClass: 'success-snackbar' }
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      this.snackBar.open(
        this.languageService.t()('notifications.markAsReadError'),
        '',
        { duration: 3000, panelClass: 'error-snackbar' }
      );
    }
  }

  async markUnread(n: AppNotification) {
    try {
      // Note: This assumes there's an API endpoint to mark as unread
      // If not available, we'll just update locally
      this.list.update(list => list.map(item => item.id === n.id ? { ...item, read: false } : item));
      this.svc.incrementUnread(1);
      this.snackBar.open(
        this.languageService.t()('notifications.markedAsUnread'),
        '',
        { duration: 2000, panelClass: 'info-snackbar' }
      );
    } catch (error) {
      console.error('Error marking notification as unread:', error);
      this.snackBar.open(
        this.languageService.t()('notifications.markAsUnreadError'),
        '',
        { duration: 3000, panelClass: 'error-snackbar' }
      );
    }
  }

  async markFilteredAsRead() {
    const unreadFiltered = this.filteredNotifications().filter(n => !n.read);
    if (unreadFiltered.length === 0) return;

    try {
      const ids = unreadFiltered.map(n => n.id);
      await this.api.markNotificationsRead(ids).toPromise();

      // Update all filtered notifications
      const idsSet = new Set(ids);
      this.list.update(list => list.map(item => idsSet.has(item.id) ? { ...item, read: true } : item));
      this.svc.decrementUnread(unreadFiltered.length);

      this.snackBar.open(
        this.languageService.t()('notifications.markedFilteredAsRead', { count: unreadFiltered.length }),
        '',
        { duration: 2500, panelClass: 'success-snackbar' }
      );
    } catch (error) {
      console.error('Error marking filtered notifications as read:', error);
      this.snackBar.open(
        this.languageService.t()('notifications.markFilteredAsReadError'),
        '',
        { duration: 3000, panelClass: 'error-snackbar' }
      );
    }
  }

  getFilteredUnreadCount(): number {
    return this.filteredNotifications().filter(n => !n.read).length;
  }

  toggleDateGroup(groupId: DateGroup) {
    const expanded = this.expandedDateGroups();
    if (expanded.has(groupId)) {
      expanded.delete(groupId);
    } else {
      expanded.add(groupId);
    }
    this.expandedDateGroups.set(new Set(expanded));
  }

  isDateGroupExpanded(groupId: DateGroup): boolean {
    return this.expandedDateGroups().has(groupId);
  }

  async remove(n: AppNotification) {
    const ref = this.dialog.open(ConfirmDeleteDialogComponent, { width: '360px' });
    const confirmed = await ref.afterClosed().toPromise();
    if (!confirmed) return;
    await this.api.deleteNotification(n.id).toPromise();
    this.list.set(this.list().filter(x => x.id !== n.id));
    this.snackBar.open(
      this.languageService.t()('notifications.dismissed'),
      '',
      { duration: 2000, panelClass: 'success-snackbar' }
    );
  }

  async clearAllNotifications() {
    const ref = this.dialog.open(ConfirmDeleteDialogComponent, {
      width: '360px',
      data: {
        title: this.languageService.t()('notifications.clearAllConfirmTitle') || 'Clear All Notifications?',
        message: this.languageService.t()('notifications.clearAllConfirmMessage') || 'Are you sure you want to delete all notifications? This action cannot be undone.'
      }
    });
    const confirmed = await ref.afterClosed().toPromise();
    if (!confirmed) return;

    try {
      // Delete all notifications one by one (or use bulk delete if API supports it)
      const notifications = this.list();
      for (const n of notifications) {
        try {
          await this.api.deleteNotification(n.id).toPromise();
        } catch (err) {
          this.logger.error('Error deleting notification:', err);
        }
      }
      this.list.set([]);
      this.snackBar.open(
        this.languageService.t()('notifications.allCleared') || 'All notifications cleared',
        '',
        { duration: 2000, panelClass: 'success-snackbar' }
      );
    } catch (error) {
      this.logger.error('Error clearing all notifications:', error);
      this.snackBar.open(
        this.languageService.t()('notifications.clearAllError') || 'Failed to clear all notifications',
        '',
        { duration: 3000, panelClass: 'error-snackbar' }
      );
    }
  }

  async markAllRead() {
    // Check if user is authenticated before making the request
    if (!this.authService.isAuthenticated()) {
      this.snackBar.open(
        this.languageService.t()('notifications.authenticationRequired') || 'Please log in to mark notifications as read',
        '',
        { duration: 3000, panelClass: 'error-snackbar' }
      );
      return;
    }

    try {
      await this.api.markAllNotificationsRead().toPromise();
      this.list.set(this.list().map(n => ({ ...n, read: true })));
      this.svc.setUnreadCountFromApi(0);
      this.snackBar.open(
        this.languageService.t()('notifications.allMarkedRead'),
        '',
        { duration: 2000, panelClass: 'success-snackbar' }
      );
    } catch (error: any) {
      this.logger.error('❌ [NOTIFICATIONS] Error marking all as read:', error);

      if (error?.status === 401) {
        this.snackBar.open(
          this.languageService.t()('notifications.authenticationRequired') || 'Please log in to mark notifications as read',
          '',
          { duration: 3000, panelClass: 'error-snackbar' }
        );
      } else {
        this.snackBar.open(
          this.languageService.t()('notifications.markAllReadError') || 'Failed to mark all notifications as read',
          '',
          { duration: 3000, panelClass: 'error-snackbar' }
        );
      }
    }
  }

  // NEW UI METHODS
  toggleCardExpansion(id: string) {
    this.expandedCardId.set(this.expandedCardId() === id ? null : id);
  }

  setView(view: 'list' | 'timeline' | 'map') {
    this.activeView.set(view);
  }

  onFilterChange(filter: string) {
    this.activeFilters = filter;
    this.logger.debug('🔍 [FILTER] Active filter changed to:', filter);

    // Scroll to top when filter changes for better UX
    this.scrollToTop();

    // Show filter feedback
    this.snackBar.open(
      this.languageService.t()('notifications.filterApplied', { filter: this.getFilterLabel(filter) }),
      '',
      { duration: 1500, panelClass: 'info-snackbar' }
    );
  }

  onFarmChange() {
    this.logger.debug('🏡 [FILTER] Farm changed to:', this.selectedFarm());

    // Scroll to top when farm filter changes
    this.scrollToTop();

    // Show farm filter feedback
    const farmName = this.selectedFarm() || this.languageService.t()('notifications.allFarms');
    this.snackBar.open(
      this.languageService.t()('notifications.farmFilterApplied', { farm: farmName }),
      '',
      { duration: 1500, panelClass: 'info-snackbar' }
    );
  }

  onDeviceChange() {
    this.logger.debug('📱 [FILTER] Device changed to:', this.selectedDevice());

    // Scroll to top when device filter changes
    this.scrollToTop();

    // Show device filter feedback
    const deviceName = this.selectedDevice() || this.languageService.t()('notifications.allDevices');
    this.snackBar.open(
      this.languageService.t()('notifications.deviceFilterApplied', { device: deviceName }),
      '',
      { duration: 1500, panelClass: 'info-snackbar' }
    );
  }

  onSensorChange() {
    this.logger.debug('🔬 [FILTER] Sensor changed to:', this.selectedSensor());

    // Scroll to top when sensor filter changes
    this.scrollToTop();

    // Show sensor filter feedback
    const sensorName = this.selectedSensor() || this.languageService.t()('notifications.allSensors');
    this.snackBar.open(
      this.languageService.t()('notifications.sensorFilterApplied', { sensor: sensorName }),
      '',
      { duration: 1500, panelClass: 'info-snackbar' }
    );
  }

  onDateRangeChange() {
    this.logger.debug('📅 [FILTER] Date range changed:', {
      start: this.dateRangeStart(),
      end: this.dateRangeEnd()
    });

    // Scroll to top when date range changes
    this.scrollToTop();
  }

  onSearchChange() {
    this.logger.debug('🔍 [FILTER] Search query changed to:', this.searchQuery);

    // Debounce search to avoid too many updates
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      if (this.searchQuery.trim()) {
        this.snackBar.open(
          this.languageService.t()('notifications.searchResults', { query: this.searchQuery }),
          '',
          { duration: 1500, panelClass: 'info-snackbar' }
        );
      }
    }, NOTIFICATION_CONFIG.UI.SEARCH_DEBOUNCE_MS);
  }

  clearSearch() {
    this.searchQuery = '';
    this.logger.debug('🔍 [FILTER] Search cleared');

    // Clear any pending search timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.snackBar.open(
      this.languageService.t()('notifications.searchCleared'),
      '',
      { duration: 1000, panelClass: 'info-snackbar' }
    );
  }

  // Helper method to get filter label
  private getFilterLabel(filter: string): string {
    const filterMap: { [key: string]: string } = {
      'all': this.languageService.t()('notifications.all'),
      'critical': this.languageService.t()('notifications.critical'),
      'warning': this.languageService.t()('notifications.warning'),
      'unread': this.languageService.t()('notifications.unread'),
      'read': this.languageService.t()('notifications.read')
    };
    return filterMap[filter] || filter;
  }

  // Clear all filters
  clearAllFilters() {
    this.activeFilters = 'all';
    this.selectedFarm.set(null);
    this.selectedDevice.set(null);
    this.selectedSensor.set(null);
    this.dateRangeStart.set(null);
    this.dateRangeEnd.set(null);
    this.searchQuery = '';

    this.logger.debug('🔍 [FILTER] All filters cleared');

    this.snackBar.open(
      this.languageService.t()('notifications.allFiltersCleared'),
      '',
      { duration: 1500, panelClass: 'success-snackbar' }
    );

    this.scrollToTop();
  }

  toggleFilterPanel() {
    this.filterPanelExpanded.set(!this.filterPanelExpanded());
  }

  getActiveFiltersCount(): number {
    let count = 0;
    if (this.selectedFarm()) count++;
    if (this.selectedDevice()) count++;
    if (this.selectedSensor()) count++;
    if (this.dateRangeStart()) count++;
    if (this.dateRangeEnd()) count++;
    if (this.searchQuery && this.searchQuery.trim().length > 0) count++;
    return count;
  }

  hasActiveFilters(): boolean {
    return this.getActiveFiltersCount() > 0;
  }

  applyFilters() {
    // Filters are already applied automatically via computed signals
    // This method provides visual feedback
    this.snackBar.open(
      this.languageService.t()('notifications.filtersApplied'),
      '',
      { duration: 1500, panelClass: 'success-snackbar' }
    );
    this.scrollToTop();
  }

  formatFullDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString(this.languageService.currentLanguage(), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatContext(context: any): string {
    if (!context) return '';
    return JSON.stringify(context, null, 2);
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  triggerTransition() {
    this.showTransition.set(true);
    setTimeout(() => this.showTransition.set(false), 300);
  }

  showNotificationSnackbar(n: AppNotification) {
    this.snackBar.open(
      this.getFarmerTitle(n),
      this.languageService.t()('notifications.view'),
      { duration: 4000, panelClass: 'new-notification-snackbar' }
    );
  }

  setupIntersectionObserver() {
    if (!this.scrollSentinel) return;

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !this.loadingMore && this.hasMoreNotifications) {
            this.loadMore();
          }
        });
      },
      { threshold: 0.1 }
    );

    this.intersectionObserver.observe(this.scrollSentinel.nativeElement);
  }

  // Load available sensors for filtering
  private async loadSensors() {
    try {
      const sensors = await this.api.getSensors().toPromise();
      if (sensors && sensors.length > 0) {
        const sensorIds = sensors.map((s: any) => s.sensor_id || s.id).filter(Boolean);
        this.availableSensors.set(sensorIds);
        this.logger.debug('🔬 [NOTIFICATIONS] Loaded sensors for filtering:', sensorIds.length);
      }
    } catch (error) {
      this.logger.error('❌ [NOTIFICATIONS] Error loading sensors:', error);
      // Don't show error to user, just log it
    }
  }
}
