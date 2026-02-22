import { Component, OnInit, signal, computed, inject, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { trigger, transition, style, animate, state } from '@angular/animations';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CropListDialogComponent } from './component/crop-list-dialog.component';
import { CropFormDialogComponent } from './component/crop-form-dialog.component';

import { CropService, CropDashboardData, KPIFilter } from '../../core/services/crop.service';
import { CropKpiHeaderComponent, KPIThresholds, DEFAULT_KPI_THRESHOLDS } from './component/crop-kpi-header.component';
import { CropHealthAnalyticsComponent } from './component/crop-health-analytics.component';
import { CropSustainabilityMetricsComponent } from './component/crop-sustainability-metrics.component';
import { CropSmartRecommendationsComponent } from './component/crop-smart-recommendations.component';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader.component';
import { Crop } from '../../core/models/farm.model';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { LanguageService } from '../../core/services/language.service';
import { FarmManagementService } from '../../core/services/farm-management.service';
import { ApiService } from '../../core/services/api.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

/**
 * 🌾 Crops Dashboard Component - TerraFlow Design System
 *
 * A modern, responsive dashboard for crop monitoring with real-time analytics.
 * Features:
 * - Clean TerraFlow-inspired design with primary green (#10b981) theme
 * - Inline template & styles for better component encapsulation
 * - OnPush change detection for optimal performance
 * - Dark/Light mode support via CSS variables
 * - Full i18n support (ready for translation pipes)
 * - Accessible with ARIA labels and focus indicators
 * - Smooth animations and micro-interactions
 */
@Component({
  selector: 'app-crop-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatRippleModule,
    MatChipsModule,
    CropKpiHeaderComponent,
    CropHealthAnalyticsComponent,
    CropSustainabilityMetricsComponent,
    CropSmartRecommendationsComponent,
    SkeletonLoaderComponent,
    TranslatePipe,
    MatSnackBarModule,
    MatDialogModule
  ],
  animations: [
    // Fade in animation for container
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('400ms ease-in', style({ opacity: 1 }))
      ])
    ]),
    // Slide in animation for content
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('500ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    // Expand/collapse animation for collapsible panels
    trigger('expandCollapse', [
      state('collapsed', style({
        height: '0',
        opacity: '0',
        overflow: 'hidden',
        padding: '0'
      })),
      state('expanded', style({
        height: '*',
        opacity: '1',
        overflow: 'visible'
      })),
      transition('collapsed <=> expanded', [
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)')
      ])
    ])
  ],
  template: `
    <!-- 🎨 Main Container - TerraFlow Theme -->
    <div class="crop-dashboard-container" [@fadeIn] [attr.dir]="languageService.getCurrentLanguage().direction">

      <!-- ⏳ Loading State - Skeleton Loaders -->
      <div *ngIf="loading()" class="skeleton-dashboard" role="status" aria-live="polite">
        <!-- Header Skeleton -->
        <div class="skeleton-header">
          <app-skeleton-loader variant="line" width="200px" height="40px"></app-skeleton-loader>
          <app-skeleton-loader variant="line" width="150px" height="36px"></app-skeleton-loader>
        </div>

        <!-- KPI Cards Skeleton -->
        <div class="skeleton-kpi-grid">
          <app-skeleton-loader variant="kpi"></app-skeleton-loader>
          <app-skeleton-loader variant="kpi"></app-skeleton-loader>
          <app-skeleton-loader variant="kpi"></app-skeleton-loader>
          <app-skeleton-loader variant="kpi"></app-skeleton-loader>
          <app-skeleton-loader variant="kpi"></app-skeleton-loader>
          <app-skeleton-loader variant="kpi"></app-skeleton-loader>
        </div>

        <!-- Main Content Skeleton -->
        <div class="skeleton-main-grid">
          <app-skeleton-loader variant="chart"></app-skeleton-loader>
          <app-skeleton-loader variant="card"></app-skeleton-loader>
        </div>

        <!-- Loading Message -->
        <div class="loading-message">
          <mat-spinner [diameter]="32" color="primary"></mat-spinner>
          <span>{{ 'crops.dashboard.states.loading.subtitle' | translate }}</span>
        </div>
      </div>

      <!-- ❌ Error State - User-Friendly Error Display -->
      <div *ngIf="error() && !loading()" class="state-container error-state" role="alert" aria-live="assertive">
        <div class="error-icon-wrapper">
          <mat-icon class="error-icon">error_outline</mat-icon>
        </div>
        <h3 class="state-title">{{ 'crops.dashboard.states.error.title' | translate }}</h3>
        <p class="state-subtitle">{{ error() }}</p>
        <button
          mat-raised-button
          color="primary"
          (click)="refreshDashboard()"
          [attr.aria-label]="'crops.dashboard.states.error.retryAria' | translate">
          <mat-icon>refresh</mat-icon>
          {{ 'crops.dashboard.states.error.cta' | translate }}
        </button>
      </div>

      <!-- 🚫 No Farms State - Request Access -->
      <div *ngIf="!loading() && !error() && !hasFarms()" class="state-container empty-state">
        <div class="empty-icon-wrapper">
          <mat-icon class="empty-icon">domain_disabled</mat-icon>
          <div class="icon-decoration"></div>
        </div>
        <h2 class="state-title">No Farm Assigned</h2>
        <p class="state-subtitle">You need to add a farm before you can start tracking crops. Please request access from an administrator.</p>
        <button
          mat-raised-button
          color="primary"
          (click)="requestAccess()"
          class="cta-button">
          <mat-icon>send</mat-icon>
          Request Farm Access
        </button>
      </div>

      <!-- 📭 Empty State - Onboarding Experience -->
      <div *ngIf="!loading() && !error() && hasFarms() && !hasCrops()" class="state-container empty-state">
        <div class="empty-icon-wrapper">
          <mat-icon class="empty-icon">agriculture</mat-icon>
          <div class="icon-decoration"></div>
        </div>
        <h2 class="state-title">{{ 'crops.dashboard.states.empty.title' | translate }}</h2>
        <p class="state-subtitle">{{ 'crops.dashboard.states.empty.subtitle' | translate }}</p>
        <button
          mat-raised-button
          color="primary"
          routerLink="/crops/create"
          class="cta-button"
          [attr.aria-label]="'crops.dashboard.states.empty.ctaAria' | translate">
          <mat-icon>add_circle</mat-icon>
          {{ 'crops.dashboard.states.empty.cta' | translate }}
        </button>
      </div>

      <!-- 📊 Main Dashboard Content - Data-Rich Interface -->
      <div *ngIf="!loading() && !error() && dashboardData()" class="dashboard-content" [@slideIn]>

        <!-- 🎯 Header Section - Crop Selector & Actions -->
        <header class="dashboard-header" role="banner">
          <div class="header-content">

            <!-- Left: Crop Selector & Info -->
            <div class="header-left">
              <mat-form-field appearance="outline" class="crop-selector" subscriptSizing="dynamic">
                <mat-label>
                  <mat-icon class="selector-icon">agriculture</mat-icon>
                  {{ 'crops.dashboard.header.selectCrop' | translate }}
                </mat-label>
                <mat-select
                  [value]="selectedCropId()"
                  (selectionChange)="onCropChange($event.value)"
                  [attr.aria-label]="'crops.dashboard.header.selectAria' | translate">
                  <mat-option
                    *ngFor="let crop of crops(); trackBy: trackByCropId"
                    [value]="crop.crop_id">
                    <div class="crop-option">
                      <span class="crop-name">{{ crop.name }}</span>
                      <span class="crop-variety" *ngIf="crop.variety">({{ crop.variety }})</span>
                    </div>
                  </mat-option>
                </mat-select>
              </mat-form-field>

              <!-- Crop Title & Status Badge -->
              <div class="crop-header-info" *ngIf="dashboardData()?.crop">
                <h1 class="crop-title">
                  <mat-icon class="title-icon">eco</mat-icon>
                  {{ dashboardData()!.crop.name }}
                </h1>
                <mat-chip
                  [class]="'status-chip status-' + dashboardData()!.crop.status"
                [attr.aria-label]="('crops.dashboard.aria.status' | translate:{ status: getStatusLabel(dashboardData()!.crop.status) })">
                  <mat-icon class="chip-icon">{{ getStatusIcon(dashboardData()!.crop.status) }}</mat-icon>
                  {{ getStatusLabel(dashboardData()!.crop.status) }}
                </mat-chip>
              </div>
            </div>

            <!-- Right: Quick Actions -->

            <div class="header-actions">
              <button
                mat-icon-button
                (click)="refreshDashboard()"
                [matTooltip]="'crops.dashboard.header.actions.refresh' | translate"
                class="action-btn refresh-btn"
                [attr.aria-label]="'crops.dashboard.header.actions.refreshAria' | translate">
                <mat-icon>refresh</mat-icon>
              </button>
              
              <button
                mat-icon-button
                (click)="editCrop()"
                [matTooltip]="'crops.dashboard.header.actions.edit' | translate"
                class="action-btn edit-btn"
                [attr.aria-label]="'crops.dashboard.header.actions.editAria' | translate">
                <mat-icon>edit</mat-icon>
              </button>
              
              <button
                mat-icon-button
                color="warn"
                (click)="deleteCurrentCrop()"
                matTooltip="Delete Crop"
                class="action-btn delete-btn">
                <mat-icon>delete_outline</mat-icon>
              </button>

              <button
                mat-stroked-button
                color="primary"
                (click)="openManageCrops()"
                class="view-all-btn"
                [attr.aria-label]="'crops.dashboard.header.actions.viewAllAria' | translate">
                <mat-icon>view_list</mat-icon>
                {{ 'crops.dashboard.header.actions.viewAll' | translate }}
              </button>
              
              <button
                mat-raised-button
                color="primary"
                (click)="openCreateCrop()"
                class="create-btn"
                [attr.aria-label]="'crops.dashboard.header.actions.createAria' | translate">
                <mat-icon>add</mat-icon>
                {{ 'crops.dashboard.header.actions.create' | translate }}
              </button>
            </div>
          </div>
        </header>

        <!-- 📈 KPI Header - Key Performance Indicators -->
        <section class="kpi-section" role="region" [attr.aria-label]="'crops.dashboard.kpi.ariaLabel' | translate">
          <app-crop-kpi-header
            [kpis]="dashboardData()!.kpis"
            [healthStatus]="dashboardData()!.healthStatus"
            [activeFilter]="activeKPIFilter()"
            [thresholds]="cropThresholds()"
            (filterChange)="onKPIFilterChange($event)">
          </app-crop-kpi-header>
        </section>

        <!-- 🤖 Smart Recommendations Section - AI-Powered Insights -->
        <section class="recommendations-section" role="region" [attr.aria-label]="'ai.recommendations.title' | translate">
          <app-crop-smart-recommendations
            [cropId]="selectedCropId()!"
            [sensors]="dashboardData()!.sensors"
            [cropContext]="{
              cropId: selectedCropId()!,
              cropName: dashboardData()!.crop.name || 'Crop',
              variety: dashboardData()!.crop.variety,
              status: dashboardData()!.crop.status || 'growing',
              plantingDate: dashboardData()!.crop.planting_date,
              expectedHarvestDate: dashboardData()!.crop.expected_harvest_date
            }"
            (actionExecuted)="onRecommendationAction($event)"
            (refreshRequested)="refreshDashboard()">
          </app-crop-smart-recommendations>
        </section>

        <!-- 🏗️ Main Grid Layout - Analytics & Details -->
        <section class="main-grid" role="main">

          <!-- Left: Health Analytics Panel -->
          <div class="health-panel">
            <app-crop-health-analytics
              [cropId]="selectedCropId()!"
              [sensors]="dashboardData()!.sensors"
              [activeFilter]="activeKPIFilter()">
            </app-crop-health-analytics>
          </div>

          <!-- Right: Details Sidebar -->
          <aside class="details-sidebar" role="complementary" [attr.aria-label]="'crops.dashboard.details.ariaLabel' | translate">

            <!-- Crop Details Card -->
            <mat-card class="details-card" appearance="outlined">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon class="card-icon">info</mat-icon>
                  {{ 'crops.dashboard.details.title' | translate }}
                </mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <dl class="details-list">
                  <div class="detail-row">
                    <dt class="detail-label">{{ 'crops.dashboard.details.variety' | translate }}</dt>
                    <dd class="detail-value">{{ dashboardData()?.crop?.variety || ('crops.dashboard.details.notAvailable' | translate) }}</dd>
                  </div>
                  <div class="detail-row">
                    <dt class="detail-label">{{ 'crops.dashboard.details.planted' | translate }}</dt>
                    <dd class="detail-value">
                      {{ dashboardData()?.crop?.planting_date ? (dashboardData()!.crop.planting_date | date:'mediumDate') : ('crops.dashboard.details.notAvailable' | translate) }}
                    </dd>
                  </div>
                  <div class="detail-row">
                    <dt class="detail-label">{{ 'crops.dashboard.details.expectedHarvest' | translate }}</dt>
                    <dd class="detail-value">
                      {{ dashboardData()?.crop?.expected_harvest_date ? (dashboardData()!.crop.expected_harvest_date | date:'mediumDate') : ('crops.dashboard.details.notAvailable' | translate) }}
                    </dd>
                  </div>
                  <div class="detail-row">
                    <dt class="detail-label">{{ 'crops.dashboard.details.status' | translate }}</dt>
                    <dd class="detail-value">
                      <span class="status-badge" *ngIf="dashboardData()?.crop" [class]="'status-' + dashboardData()!.crop.status">
                        {{ getStatusLabel(dashboardData()!.crop.status) }}
                      </span>
                    </dd>
                  </div>
                  <div class="detail-row full-width" *ngIf="dashboardData()?.crop?.description">
                    <dt class="detail-label">{{ 'crops.dashboard.details.description' | translate }}</dt>
                    <dd class="detail-value description-text">{{ dashboardData()!.crop.description }}</dd>
                  </div>
                  <div class="detail-row full-width" *ngIf="dashboardData()?.crop?.notes">
                    <dt class="detail-label">{{ 'crops.dashboard.details.notes' | translate }}</dt>
                    <dd class="detail-value notes-text">{{ dashboardData()!.crop.notes }}</dd>
                  </div>
                </dl>
              </mat-card-content>
            </mat-card>

            <!-- Connected Sensors Card -->
            <mat-card class="sensors-card" appearance="outlined">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon class="card-icon sensors-icon">sensors</mat-icon>
                  {{ 'crops.dashboard.sensors.title' | translate }}
                  <span class="sensor-count" *ngIf="dashboardData()?.sensors?.length">
                    ({{ dashboardData()!.sensors.length }})
                  </span>
                </mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <!-- No Sensors State -->
                <div *ngIf="dashboardData()?.sensors?.length === 0" class="no-sensors">
                  <mat-icon class="no-sensors-icon">sensors_off</mat-icon>
                  <p class="no-sensors-text">{{ 'crops.dashboard.sensors.empty' | translate }}</p>
                </div>

                <!-- Sensors List -->
                <ul class="sensor-list" *ngIf="dashboardData()?.sensors?.length" role="list">
                  <li
                    *ngFor="let sensor of dashboardData()!.sensors; trackBy: trackBySensorId"
                    class="sensor-item"
                    matRipple
                    [matRippleColor]="'rgba(16, 185, 129, 0.1)'"
                    role="listitem">
                    <mat-icon class="sensor-icon" [class]="'sensor-type-' + getSensorIconClass(sensor.type)">
                      {{ getSensorIcon(sensor.type) }}
                    </mat-icon>
                    <div class="sensor-info">
                      <span class="sensor-type">{{ sensor.type }}</span>
                      <span class="sensor-location">{{ sensor.location || ('crops.common.noLocation' | translate) }}</span>
                    </div>
                    <span class="sensor-unit">{{ sensor.unit }}</span>
                  </li>
                </ul>
              </mat-card-content>
            </mat-card>
          </aside>
        </section>



        <!-- 🌱 Sustainability Metrics Section -->
        <section class="sustainability-section" role="region" [attr.aria-label]="'crops.dashboard.sustainability.ariaLabel' | translate">
          <app-crop-sustainability-metrics
            [cropId]="selectedCropId()!"
            [sensors]="dashboardData()!.sensors"
            [dashboardData]="dashboardData()">
          </app-crop-sustainability-metrics>
        </section>
      </div>
    </div>
  `,
  styles: [`
    /* ========================================
       🎨 TERRAFLOW DESIGN SYSTEM - CROPS DASHBOARD
       ======================================== */

    /* === ANIMATIONS === */
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
        opacity: 1;
      }
      50% {
        transform: scale(1.05);
        opacity: 0.8;
      }
    }

    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    /* === SKELETON LOADING STATE === */
    .skeleton-dashboard {
      display: flex;
      flex-direction: column;
      gap: 2rem;
      padding: 2rem;
      animation: fadeIn 0.3s ease;
    }

    .skeleton-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }

    .skeleton-kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
    }

    .skeleton-main-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1.5rem;

      @media (max-width: 1200px) {
        grid-template-columns: 1fr;
      }
    }

    .loading-message {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 1.5rem;
      color: var(--text-secondary, #6b7280);
      font-size: 0.95rem;
    }

    /* === MAIN CONTAINER === */
    .crop-dashboard-container {
      padding: 2rem;
      max-width: 1600px;
      margin: 0 auto;
      min-height: calc(100vh - 80px);
      background: var(--light-bg, #f9fafb);
      animation: fadeIn 0.4s ease;
    }

    /* === STATE CONTAINERS (Loading, Error, Empty) === */
    .state-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      text-align: center;
      gap: 1.5rem;
      padding: 3rem;
      animation: fadeIn 0.6s ease;
    }

    .state-title {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 600;
      color: var(--text-primary, #1f2937);
    }

    .state-subtitle {
      margin: 0;
      font-size: 1rem;
      color: var(--text-secondary, #6b7280);
      max-width: 500px;
      line-height: 1.6;
    }

    /* Loading State */
    .loading-state {
      .spinner-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .loading-pulse {
        position: absolute;
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(16, 185, 129, 0.2), transparent);
        animation: pulse 2s infinite;
      }
    }

    /* Error State */
    .error-state {
      .error-icon-wrapper {
        position: relative;
        width: 100px;
        height: 100px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05));
        border-radius: 50%;
        border: 2px solid rgba(239, 68, 68, 0.2);
      }

      .error-icon {
        font-size: 56px;
        width: 56px;
        height: 56px;
        color: var(--danger, #ef4444);
      }
    }

    /* Empty State */
    .empty-state {
      .empty-icon-wrapper {
        position: relative;
        width: 120px;
        height: 120px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .empty-icon {
        font-size: 72px;
        width: 72px;
        height: 72px;
        color: var(--primary-green, #10b981);
        z-index: 1;
      }

      .icon-decoration {
        position: absolute;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle, rgba(16, 185, 129, 0.15), transparent 70%);
        border-radius: 50%;
        animation: pulse 3s infinite;
      }

      .cta-button {
        margin-top: 1rem;
        padding: 0.75rem 2rem;
        font-size: 1.05rem;
        border-radius: 12px;
        background: var(--primary-green, #10b981) !important;
        color: white !important;
        box-shadow: var(--shadow-md, 0 4px 12px rgba(16, 185, 129, 0.25));
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border: none;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
          background: #059669 !important; /* darker green on hover */
        }
      }
    }

    /* === DASHBOARD HEADER === */
    .dashboard-header {
      margin-bottom: 2rem;
      animation: slideIn 0.5s ease;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      background: var(--card-bg, #ffffff);
      border-radius: 16px;
      border: 1px solid var(--border-color, #e5e7eb);
      box-shadow: var(--shadow-md, 0 4px 12px rgba(0, 0, 0, 0.08));
      transition: all 0.3s ease;

      &:hover {
        box-shadow: 0 8px 20px rgba(16, 185, 129, 0.12);
      }
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 2rem;
      flex: 1;
    }

    /* Crop Selector */
    .crop-selector {
      min-width: 280px;
      margin: 0;

      .selector-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        margin-right: 0.5rem;
        vertical-align: middle;
        color: var(--primary-green, #10b981);
      }

      ::ng-deep .mat-mdc-form-field-focus-overlay {
        background-color: rgba(16, 185, 129, 0.05);
      }

      /* Form Field Outline */
      ::ng-deep .mat-mdc-text-field-wrapper {
        background: var(--card-bg, #ffffff);
        border-radius: 12px;
        transition: all 0.3s ease;
      }

      ::ng-deep .mdc-notched-outline__leading,
      ::ng-deep .mdc-notched-outline__notch,
      ::ng-deep .mdc-notched-outline__trailing {
        border-color: var(--border-color, #e5e7eb) !important;
        transition: border-color 0.3s ease;
      }

      /* Focused State */
      ::ng-deep .mat-focused .mdc-notched-outline__leading,
      ::ng-deep .mat-focused .mdc-notched-outline__notch,
      ::ng-deep .mat-focused .mdc-notched-outline__trailing {
        border-color: var(--primary-green, #10b981) !important;
        border-width: 2px !important;
      }

      /* Label */
      ::ng-deep .mat-mdc-form-field-label {
        color: var(--text-secondary, #6b7280);
      }

      ::ng-deep .mat-focused .mat-mdc-form-field-label {
        color: var(--primary-green, #10b981) !important;
      }

      /* Input Text */
      ::ng-deep .mat-mdc-select-value,
      ::ng-deep .mat-mdc-select-placeholder {
        color: var(--text-primary, #1f2937);
      }

      /* Arrow Icon */
      ::ng-deep .mat-mdc-select-arrow {
        color: var(--primary-green, #10b981);
      }
    }

    /* Dropdown Panel Styles */
    ::ng-deep .mat-mdc-select-panel {
      background: var(--card-bg, #ffffff);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      margin-top: 8px;
    }

    /* Option Styles */
    ::ng-deep .mat-mdc-option {
      color: var(--text-primary, #1f2937);
      transition: all 0.2s ease;

      &:hover {
        background: rgba(16, 185, 129, 0.08);
      }

      &.mat-mdc-option-active,
      &.mdc-list-item--selected {
        background: rgba(16, 185, 129, 0.12);
        color: var(--primary-green, #10b981);

        .crop-name {
          font-weight: 600;
        }
      }
    }

    .crop-option {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .crop-name {
        font-weight: 500;
        color: var(--text-primary, #1f2937);
      }

      .crop-variety {
        font-size: 0.875rem;
        color: var(--text-secondary, #6b7280);
      }
    }

    /* Crop Header Info */
    .crop-header-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .crop-title {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 600;
      color: var(--text-primary, #1f2937);
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .title-icon {
        color: var(--primary-green, #10b981);
        font-size: 28px;
        width: 28px;
        height: 28px;
      }
    }

    /* Status Chip */
    .status-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.875rem;
      border-radius: 16px;
      font-size: 0.8125rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border: 2px solid transparent;
      transition: all 0.2s ease;

      .chip-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      &.status-planted {
        background: linear-gradient(135deg, #dbeafe, #bfdbfe);
        color: #1e40af;
        border-color: #93c5fd;
      }

      &.status-growing {
        background: linear-gradient(135deg, #d1fae5, #a7f3d0);
        color: #065f46;
        border-color: #6ee7b7;
      }

      &.status-harvested {
        background: linear-gradient(135deg, #fed7aa, #fdba74);
        color: #92400e;
        border-color: #fb923c;
      }

      &.status-failed {
        background: linear-gradient(135deg, #fecaca, #fca5a5);
        color: #991b1b;
        border-color: #f87171;
      }
    }

    /* Header Actions */
    .header-actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .action-btn {
      transition: all 0.2s ease;
      border-radius: 12px;
      color: var(--text-secondary, #6b7280);
      background: transparent;
      border: 1px solid transparent;

      &:hover {
        background: rgba(16, 185, 129, 0.1);
        color: var(--primary-green, #10b981);
        border-color: rgba(16, 185, 129, 0.2);
        transform: translateY(-1px);
      }

      &.refresh-btn:hover mat-icon {
        animation: spin 0.6s ease;
      }
      
      &.delete-btn:hover {
        background: rgba(239, 68, 68, 0.1);
        color: var(--warn, #ef4444);
        border-color: rgba(239, 68, 68, 0.2);
      }
    }

    .view-all-btn {
      border: 1px solid var(--primary-green, #10b981);
      color: var(--primary-green, #10b981);
      border-radius: 12px;
      padding: 0 1.25rem;
      height: 42px;
      font-weight: 500;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(16, 185, 129, 0.1);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
      }
    }

    .create-btn {
      background: var(--primary-green, #10b981) !important;
      color: white !important;
      border-radius: 12px;
      padding: 0 1.5rem;
      height: 42px;
      font-weight: 600;
      letter-spacing: 0.3px;
      box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      border: none;

      &:hover {
        background: #059669 !important;
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
      }
      
      mat-icon {
        margin-right: 8px;
      }
    }

    /* === KPI SECTION === */
    .kpi-section {
      margin-bottom: 2rem;
      animation: slideIn 0.6s ease 0.1s both;
    }

    /* === MAIN GRID LAYOUT === */
    .main-grid {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 1.5rem;
      margin-bottom: 2rem;
      animation: slideIn 0.7s ease 0.2s both;
    }

    .health-panel {
      min-width: 0; /* Prevent grid overflow */
    }

    /* === DETAILS SIDEBAR === */
    .details-sidebar {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* Details Card */
    .details-card,
    .sensors-card {
      background: var(--card-bg, #ffffff);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 16px;
      box-shadow: var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05));
      transition: all 0.3s ease;

      &:hover {
        box-shadow: var(--shadow-md, 0 4px 12px rgba(0, 0, 0, 0.08));
        border-color: rgba(16, 185, 129, 0.3);
      }

      mat-card-header {
        padding: 1.25rem 1.25rem 0;

        mat-card-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary, #1f2937);

          .card-icon {
            color: var(--primary-green, #10b981);
            font-size: 22px;
            width: 22px;
            height: 22px;
          }

          .sensors-icon {
            color: var(--primary-blue, #3b82f6);
          }

          .sensor-count {
            font-size: 0.875rem;
            color: var(--text-secondary, #6b7280);
            font-weight: 500;
          }
        }
      }

      mat-card-content {
        padding: 1.25rem;
      }
    }

    /* Details List */
    .details-list {
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--border-color, #e5e7eb);

      &:last-child {
        border-bottom: none;
      }

      &.full-width {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }
    }

    .detail-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-secondary, #6b7280);
      margin: 0;
    }

    .detail-value {
      font-weight: 600;
      color: var(--text-primary, #1f2937);
      margin: 0;

      &.description-text,
      &.notes-text {
        font-weight: 400;
        line-height: 1.6;
        color: var(--text-secondary, #6b7280);
      }
    }

    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.625rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;

      &.status-planted {
        background: #dbeafe;
        color: #1e40af;
      }

      &.status-growing {
        background: #d1fae5;
        color: #065f46;
      }

      &.status-harvested {
        background: #fed7aa;
        color: #92400e;
      }

      &.status-failed {
        background: #fecaca;
        color: #991b1b;
      }
    }

    /* === SENSORS CARD === */
    .no-sensors {
      text-align: center;
      padding: 2.5rem 1rem;
      color: var(--text-secondary, #6b7280);

      .no-sensors-icon {
        font-size: 56px;
        width: 56px;
        height: 56px;
        margin-bottom: 0.75rem;
        opacity: 0.4;
      }

      .no-sensors-text {
        margin: 0;
        font-size: 0.9375rem;
      }
    }

    .sensor-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .sensor-item {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 1rem;
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.03), rgba(16, 185, 129, 0.01));
      border-radius: 12px;
      border: 1px solid rgba(16, 185, 129, 0.15);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;

      &:hover {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(16, 185, 129, 0.04));
        border-color: rgba(16, 185, 129, 0.3);
        transform: translateX(4px);
        box-shadow: 0 2px 8px rgba(16, 185, 129, 0.15);
      }

      .sensor-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
        color: var(--primary-green, #10b981);
        flex-shrink: 0;

        &.sensor-type-temperature {
          color: #f59e0b;
        }

        &.sensor-type-humidity {
          color: #3b82f6;
        }

        &.sensor-type-light {
          color: #eab308;
        }
      }

      .sensor-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        min-width: 0;

        .sensor-type {
          font-weight: 600;
          font-size: 0.9375rem;
          color: var(--text-primary, #1f2937);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sensor-location {
          font-size: 0.8125rem;
          color: var(--text-secondary, #6b7280);
        }
      }

      .sensor-unit {
        font-size: 0.875rem;
        color: var(--text-secondary, #6b7280);
        font-weight: 500;
        flex-shrink: 0;
      }
    }

    /* === COLLAPSIBLE SECTION STYLES === */
    .collapsible-section {
      margin-bottom: 1.5rem;
      animation: slideIn 0.8s ease 0.3s both;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      background: var(--card-bg, #ffffff);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 16px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      user-select: none;

      &.collapsible:hover {
        background: rgba(16, 185, 129, 0.05);
        border-color: rgba(16, 185, 129, 0.3);
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: 0.75rem;

        .section-icon {
          color: var(--primary-green, #10b981);
          font-size: 24px;
          width: 24px;
          height: 24px;
        }

        h2 {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary, #1f2937);
        }
      }

      .toggle-btn {
        transition: all 0.3s ease;

        .toggle-icon {
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          color: var(--primary-green, #10b981);

          &.rotated {
            transform: rotate(180deg);
          }
        }

        &:hover {
          background: rgba(16, 185, 129, 0.1);
        }
      }
    }

    .section-content {
      border: 1px solid var(--border-color, #e5e7eb);
      border-top: none;
      border-radius: 0 0 16px 16px;
      overflow: hidden;
      margin-top: -1px;
    }

    /* When section is expanded, adjust header border radius */
    .collapsible-section:has(.section-content[style*="height"]:not([style*="height: 0"])) .section-header,
    .collapsible-section .section-header:has(+ .section-content:not([style*="height: 0"])) {
      border-radius: 16px 16px 0 0;
    }

    /* Dark mode for collapsible sections */
    :host-context(body.dark-theme) {
      .section-header {
        background: var(--card-bg, #1e293b);
        border-color: var(--border-color, #334155);

        &.collapsible:hover {
          background: rgba(16, 185, 129, 0.12);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
        }

        .header-left h2 {
          color: var(--text-primary, #f1f5f9);
        }

        .toggle-btn:hover {
          background: rgba(16, 185, 129, 0.15);
        }
      }

      .section-content {
        border-color: var(--border-color, #334155);
      }
    }

    /* === ACTIONS & EVENTS SECTIONS === */
    .actions-section,
    .events-section {
      margin-bottom: 1.5rem;
    }

    /* === 🤖 SMART RECOMMENDATIONS SECTION === */
    .recommendations-section {
      margin-bottom: 2rem;
      animation: slideIn 0.6s ease 0.15s both;
    }

    /* === MAP & COMPARISON SECTION === */
    .map-comparison-section {
      margin-bottom: 1.5rem;
      animation: slideIn 0.85s ease 0.35s both;
    }

    /* === SUSTAINABILITY SECTION === */
    .sustainability-section {
      margin-bottom: 1.5rem;
      animation: slideIn 0.9s ease 0.4s both;
    }

    /* === 📱 RESPONSIVE DESIGN & ADAPTIVE LAYOUTS === */
    
    /* Desktop & Large Tablet Adjustments (max-width: 1200px) */
    @media (max-width: 1200px) {
      .main-grid {
        grid-template-columns: 1fr;
        gap: 1.5rem;

        .details-sidebar {
          order: -1;
        }
      }
    }

    /* Tablet Adjustments (769px - 1024px) */
    @media (min-width: 769px) and (max-width: 1024px) {
      .crop-dashboard-container {
        padding: 1.5rem;
      }
    }

    /* Mobile Adjustments (max-width: 768px) */
    @media (max-width: 768px) {
      .crop-dashboard-container {
        padding: 1rem;
      }

      /* === Enhanced Header Responsiveness === */
      .header-content {
        flex-direction: column;
        align-items: stretch;
        gap: 1.5rem;
        padding: 1.25rem;
        height: auto;
      }

      .header-left {
        flex-direction: column;
        align-items: flex-start;
        gap: 1.25rem;
        width: 100%;
      }

      /* Crop Selector Full Width */
      .crop-selector {
        width: 100%;
        min-width: 0;
        margin: 0;
      }

      .crop-selector ::ng-deep .mat-mdc-text-field-wrapper {
        border-radius: 12px;
      }

      /* Crop Header Info - Wrap nicely */
      .crop-header-info {
        width: 100%;
        flex-wrap: wrap;
        gap: 0.75rem;
        justify-content: space-between;
        border-bottom: 1px solid var(--border-color, #e5e7eb);
        padding-bottom: 1rem;
      }

      .crop-title {
        font-size: 1.5rem;
      }

      /* Actions Bar - Grid for better alignment */
      .header-actions {
        width: 100%;
        display: grid;
        grid-template-columns: auto auto 1fr;
        gap: 0.75rem;
        
        button {
          min-height: 48px;
        }
      }

      .view-all-btn {
        width: 100%;
        justify-content: center;
      }

      /* === Section & Card Adjustments === */
      .section-header {
        padding: 0.875rem 1rem;

        .header-left h2 {
          font-size: 1rem;
        }
      }

      .details-card,
      .sensors-card {
        margin-bottom: 1rem;
      }

      .sensors-card mat-card-content {
        padding: 0.5rem;
      }

      .sensor-item {
        padding: 0.875rem 1rem;
        
        .sensor-info {
           max-width: 100%;
        }
      }

      /* State Containers */
      .state-container {
        padding: 2rem 1rem;
        min-height: 50vh;
      }

      .state-title {
        font-size: 1.5rem;
      }
    }

    /* === GLASSMORPHISM & VISUAL EFFECTS === */
    .glass-panel {
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 20px;
      box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.08),
        inset 0 0 0 1px rgba(255, 255, 255, 0.5);
    }

    .neumorphic-card {
      background: var(--card-bg, #ffffff);
      border-radius: 16px;
      box-shadow:
        6px 6px 12px rgba(0, 0, 0, 0.08),
        -6px -6px 12px rgba(255, 255, 255, 0.8);
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        box-shadow:
          8px 8px 16px rgba(0, 0, 0, 0.1),
          -8px -8px 16px rgba(255, 255, 255, 0.9);
        transform: translateY(-2px);
      }
    }

    /* === 🌙 DARK MODE SUPPORT === */
    :host-context(body.dark-theme) {
      .crop-dashboard-container {
        background: var(--light-bg, #0f172a);
      }

      /* Enhanced Header Dark Mode */
      .header-content {
        background: var(--card-bg, #1e293b);
        border-color: var(--border-color, #334155);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);

        &:hover {
          box-shadow: 0 8px 20px rgba(16, 185, 129, 0.15);
        }
      }

      .crop-header-info {
        border-color: var(--border-color, #334155);
      }

      /* Form Fields */
      .crop-selector {
        ::ng-deep .mat-mdc-text-field-wrapper {
          background: var(--card-bg, #1e293b);
        }

        ::ng-deep .mdc-notched-outline__leading,
        ::ng-deep .mdc-notched-outline__notch,
        ::ng-deep .mdc-notched-outline__trailing {
          border-color: var(--border-color, #334155) !important;
        }

        ::ng-deep .mat-mdc-form-field-label {
          color: var(--text-secondary, #94a3b8);
        }

        ::ng-deep .mat-mdc-select-value {
          color: var(--text-primary, #f1f5f9);
        }

        ::ng-deep .mat-mdc-select-arrow {
          color: var(--primary-green, #10b981);
        }
      }

      /* Dropdowns */
      ::ng-deep .mat-mdc-select-panel {
        background: var(--card-bg, #1e293b);
        border-color: var(--border-color, #334155);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      }

      ::ng-deep .mat-mdc-option {
        color: var(--text-primary, #f1f5f9);

        &:hover {
          background: rgba(16, 185, 129, 0.15);
        }

        &.mat-mdc-option-active,
        &.mdc-list-item--selected {
          background: rgba(16, 185, 129, 0.2);
          color: var(--primary-green, #10b981);
        }
      }

      /* Text Colors */
      .crop-title,
      .state-title,
      .detail-value,
      .sensor-name {
        color: var(--text-primary, #f1f5f9);
      }

      .state-subtitle,
      .detail-label,
      .sensor-location,
      .crop-variety {
        color: var(--text-secondary, #94a3b8);
      }

      /* Cards & Containers */
      .details-card,
      .sensors-card,
      .section-header,
      .neumorphic-card {
        background: var(--card-bg, #1e293b);
        border-color: var(--border-color, #334155);
      }

      .section-content {
        border-color: var(--border-color, #334155);
      }

      /* Interactive Elements */
      .sensor-item {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(16, 185, 129, 0.04));
        border-color: rgba(16, 185, 129, 0.2);

        &:hover {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.08));
          border-color: rgba(16, 185, 129, 0.4);
        }
      }
    }

    /* === ACCESSIBILITY ENHANCEMENTS === */
    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }

    /* Focus visible for keyboard navigation */
    button:focus-visible,
    .sensor-item:focus-visible {
      outline: 2px solid var(--primary-green, #10b981);
      outline-offset: 2px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush // CRITICAL: OnPush for performance
})
export class CropDashboardComponent implements OnInit {
  private cropService: CropService = inject(CropService);
  private route: ActivatedRoute = inject(ActivatedRoute);
  private router: Router = inject(Router);
  private destroyRef: DestroyRef = inject(DestroyRef);
  protected languageService = inject(LanguageService);
  private farmManagement = inject(FarmManagementService);
  private apiService = inject(ApiService);
  private snackBar = inject(MatSnackBar);

  // Local component state (Signals)
  dashboardData = signal<CropDashboardData | null>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  selectedCropId = signal<string | null>(null);
  activeKPIFilter = signal<KPIFilter>('all');
  actionsExpanded = signal<boolean>(true);

  // Per-crop configurable thresholds
  cropThresholds = signal<KPIThresholds>(DEFAULT_KPI_THRESHOLDS);

  // Expose service state (with proper typing)
  crops = computed<Crop[]>(() => this.cropService.crops());
  totalCrops = computed<number>(() => this.cropService.totalCrops());

  // Computed helpers
  hasFarms = computed(() => this.farmManagement.farms().length > 0);
  hasCrops = computed(() => this.crops().length > 0);
  isHealthy = computed(() =>
    this.dashboardData()?.healthStatus === 'healthy'
  );

  ngOnInit(): void {
    // Load all crops first
    this.loadInitialData();

    // Listen to route params for crop selection
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const cropId = params.get('id');
        if (cropId) {
          this.loadCropDashboard(cropId);
        }
      });
  }

  /**
   * Load initial data (all crops)
   */
  private loadInitialData(): void {
    (this.cropService.loadCrops() as Observable<Crop[]>)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (crops: Crop[]) => {
          console.log('Crops loaded:', crops.length);

          // Handle case with no crops - stop loading to show empty state
          if (crops.length === 0) {
            this.loading.set(false);
            return;
          }

          // If no crop selected but crops exist, select first one
          if (crops.length > 0 && !this.selectedCropId()) {
            const firstCropId = crops[0].crop_id;
            this.router.navigate(['/crops', firstCropId, 'dashboard']);
          }
        },
        error: (err: any) => {
          this.error.set(this.languageService.translate('crops.dashboard.errors.loadCrops'));
          console.error('Error loading crops:', err);
        }
      });
  }

  /**
   * Load dashboard data for specific crop
   */
  private loadCropDashboard(cropId: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.selectedCropId.set(cropId);

    (this.cropService.getCropDashboard(cropId, false) as Observable<CropDashboardData>) // Use cache
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: CropDashboardData) => {
          this.dashboardData.set(data);
          this.loading.set(false);

          // Load crop-specific thresholds if available
          this.loadCropThresholds(data);

          console.log('Dashboard data loaded:', data);
        },
        error: (err: any) => {
          this.error.set(this.languageService.translate('crops.dashboard.errors.loadDashboard'));
          this.loading.set(false);
          console.error('Error loading dashboard:', err);
        }
      });
  }

  /**
   * Load crop-specific KPI thresholds
   * Falls back to defaults if not available
   */
  private loadCropThresholds(data: CropDashboardData): void {
    // Check if crop has custom thresholds stored
    const crop = data.crop as any;

    if (crop?.thresholds) {
      // Merge with defaults to ensure all values exist
      const customThresholds: KPIThresholds = {
        moisture: { ...DEFAULT_KPI_THRESHOLDS.moisture, ...crop.thresholds.moisture },
        temperature: { ...DEFAULT_KPI_THRESHOLDS.temperature, ...crop.thresholds.temperature },
        humidity: { ...DEFAULT_KPI_THRESHOLDS.humidity, ...crop.thresholds.humidity }
      };
      this.cropThresholds.set(customThresholds);
    } else {
      // Use crop-type specific defaults based on crop name/variety
      const cropTypeThresholds = this.getThresholdsForCropType(crop?.name, crop?.variety);
      this.cropThresholds.set(cropTypeThresholds);
    }
  }

  /**
   * Get recommended thresholds based on crop type
   * Can be extended with more crop-specific presets
   */
  private getThresholdsForCropType(cropName?: string, variety?: string): KPIThresholds {
    const name = (cropName || '').toLowerCase();

    // Tomatoes - need higher temperatures and consistent moisture
    if (name.includes('tomato') || name.includes('tomate')) {
      return {
        moisture: { warningLow: 40, warningHigh: 65, criticalLow: 30, criticalHigh: 80 },
        temperature: { warningLow: 15, warningHigh: 30, criticalLow: 10, criticalHigh: 35 },
        humidity: { warningLow: 50, warningHigh: 70, criticalLow: 40, criticalHigh: 80 }
      };
    }

    // Lettuce - prefers cooler temps and higher moisture
    if (name.includes('lettuce') || name.includes('laitue') || name.includes('salad')) {
      return {
        moisture: { warningLow: 50, warningHigh: 75, criticalLow: 40, criticalHigh: 85 },
        temperature: { warningLow: 10, warningHigh: 22, criticalLow: 5, criticalHigh: 28 },
        humidity: { warningLow: 50, warningHigh: 80, criticalLow: 40, criticalHigh: 90 }
      };
    }

    // Peppers - similar to tomatoes but slightly more tolerant
    if (name.includes('pepper') || name.includes('poivron') || name.includes('piment')) {
      return {
        moisture: { warningLow: 35, warningHigh: 60, criticalLow: 25, criticalHigh: 75 },
        temperature: { warningLow: 18, warningHigh: 32, criticalLow: 12, criticalHigh: 38 },
        humidity: { warningLow: 45, warningHigh: 75, criticalLow: 35, criticalHigh: 85 }
      };
    }

    // Wheat/Grains - more drought tolerant
    if (name.includes('wheat') || name.includes('blé') || name.includes('grain') || name.includes('corn') || name.includes('maïs')) {
      return {
        moisture: { warningLow: 25, warningHigh: 60, criticalLow: 15, criticalHigh: 75 },
        temperature: { warningLow: 12, warningHigh: 30, criticalLow: 5, criticalHigh: 38 },
        humidity: { warningLow: 35, warningHigh: 70, criticalLow: 25, criticalHigh: 85 }
      };
    }

    // Default thresholds for unknown crops
    return DEFAULT_KPI_THRESHOLDS;
  }

  /**
   * Handle crop selection change
   */
  onCropChange(cropId: string): void {
    this.router.navigate(['/crops', cropId, 'dashboard']);
  }

  /**
   * Handle KPI filter change - propagates to child components via inputs
   */
  onKPIFilterChange(filter: KPIFilter): void {
    // Toggle filter - if clicking same filter, reset to 'all'
    if (this.activeKPIFilter() === filter && filter !== 'all') {
      this.activeKPIFilter.set('all');
    } else {
      this.activeKPIFilter.set(filter);
    }
  }

  /**
   * Refresh dashboard data
   */
  refreshDashboard(): void {
    const cropId = this.selectedCropId();
    if (cropId) {
      // Clear cache and reload
      this.cropService.clearCache();
      this.loadCropDashboard(cropId);
    }
  }

  /**
   * 🤖 Handle AI recommendation action execution
   */
  onRecommendationAction(event: { recommendation: any; success: boolean }): void {
    console.log('Recommendation action executed:', event);
    // The smart actions component will handle the actual device control
    // This is for logging and potential future analytics
    if (event.success) {
      // Optionally refresh dashboard data after action
      // this.refreshDashboard();
    }
  }



  /**
   * Navigate to crop edit
   */
  private dialog = inject(MatDialog);

  /**
   * Open dialog to manage all crops (list/bulk delete)
   */
  openManageCrops(): void {
    this.dialog.open(CropListDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      panelClass: 'glass-dialog',
      backdropClass: 'cdk-overlay-dark-backdrop',
      autoFocus: false
    });
  }

  /**
   * Open dialog to create new crop
   */
  openCreateCrop(): void {
    const dialogRef = this.dialog.open(CropFormDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      panelClass: 'glass-dialog',
      backdropClass: 'cdk-overlay-dark-backdrop',
      data: { editId: null }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Reload crops to get the new one in the list
        this.cropService.loadCrops().subscribe(() => {
          this.loadCropDashboard(result.crop_id);
        });
      }
    });
  }

  /**
   * Navigate to crop edit (via Dialog)
   */
  editCrop(): void {
    const cropId = this.selectedCropId();
    if (cropId) {
      const dialogRef = this.dialog.open(CropFormDialogComponent, {
        width: '800px',
        maxWidth: '95vw',
        panelClass: 'glass-dialog',
        backdropClass: 'cdk-overlay-dark-backdrop',
        data: { editId: cropId }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.refreshDashboard();
        }
      });
    }
  }

  /**
   * Delete the currently viewed crop
   */
  deleteCurrentCrop(): void {
    const cropId = this.selectedCropId();
    if (!cropId) return;

    if (confirm('Are you sure you want to delete this crop? This action cannot be undone.')) {
      this.cropService.deleteCrop(cropId).subscribe({
        next: () => {
          this.snackBar.open('Crop deleted successfully', 'Close', { 
            duration: 3000,
            panelClass: ['success-snackbar'] 
          });
          
          // Refresh list and navigate to first available or empty
          this.cropService.loadCrops().subscribe(crops => {
             if (crops.length > 0) {
               this.router.navigate(['/crops', crops[0].crop_id, 'dashboard']);
             } else {
               this.router.navigate(['/crops']);
               this.dashboardData.set(null); // Clear view
             }
          });
        },
        error: () => this.snackBar.open('Failed to delete crop', 'Close', { 
          duration: 3000,
          panelClass: ['error-snackbar']
        })
      });
    }
  }

  /**
   * Get health status icon
   */
  getHealthIcon(status: string): string {
    switch (status) {
      case 'healthy': return 'check_circle';
      case 'warning': return 'warning';
      case 'critical': return 'error';
      default: return 'help_outline';
    }
  }

  /**
   * Get health status color
   */
  getHealthColor(status: string): string {
    switch (status) {
      case 'healthy': return 'success';
      case 'warning': return 'warn';
      case 'critical': return 'error';
      default: return 'default';
    }
  }

  /**
   * 🎨 UX Helper: Get status icon for visual feedback
   */
  getStatusIcon(status: string): string {
    switch (status?.toLowerCase()) {
      case 'planted': return 'spa';
      case 'growing': return 'eco';
      case 'harvested': return 'check_circle';
      case 'failed': return 'error';
      default: return 'help_outline';
    }
  }

  /**
   * 🌍 Translation Helper: Get translated status label
   */
  getStatusLabel(status: string): string {
    if (!status) return '';
    const statusKey = status.toLowerCase();
    const translationKey = `crops.statuses.${statusKey}`;
    const translated = this.languageService.translate(translationKey);
    // If translation not found, return the original status with titlecase as fallback
    return translated !== translationKey ? translated : status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }

  /**
   * 🎨 UX Helper: Get sensor icon based on type
   */
  getSensorIcon(type: string): string {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('temp')) return 'thermostat';
    if (lowerType.includes('moisture') || lowerType.includes('water')) return 'water_drop';
    if (lowerType.includes('humidity') || lowerType.includes('humid')) return 'cloud';
    if (lowerType.includes('light')) return 'wb_sunny';
    if (lowerType.includes('ph')) return 'science';
    if (lowerType.includes('ec') || lowerType.includes('conductivity')) return 'electrical_services';
    return 'sensors';
  }

  /**
   * 🎨 UX Helper: Get sensor icon class for color coding
   */
  getSensorIconClass(type: string): string {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('temp')) return 'temperature';
    if (lowerType.includes('humidity') || lowerType.includes('humid')) return 'humidity';
    if (lowerType.includes('light')) return 'light';
    return 'default';
  }

  /**
   * 🚀 Performance: TrackBy function for crops list
   */
  trackByCropId(index: number, crop: Crop): string {
    return crop.crop_id;
  }

  /**
   * 🚀 Performance: TrackBy function for sensors list
   */
  trackBySensorId(index: number, sensor: any): string {
    return sensor.sensor_id;
  }
  requestAccess(): void {
    this.apiService.requestFarmAccess().subscribe({
      next: () => {
        this.snackBar.open('Request sent directly to administrator', 'Close', { 
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['success-snackbar']
        });
      },
      error: () => {
        this.snackBar.open('Failed to send request', 'Retry', { duration: 3000 });
      }
    });
  }
}
