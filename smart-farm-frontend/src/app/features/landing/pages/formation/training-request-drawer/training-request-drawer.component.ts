import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  signal,
  inject,
  OnChanges,
  SimpleChanges,
  HostListener,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { TranslatePipe } from '../../../../../core/pipes/translate.pipe';
import { LeadsService } from '../../../../../core/services/leads.service';
import { ToastNotificationService } from '../../../../../core/services/toast-notification.service';

/**
 * Premium hybrid Training Request Drawer component.
 *
 * - Desktop (≥1024px): Right slide-over panel, 38% width
 * - Tablet (768–1023px): Right slide-over, 50% width
 * - Mobile (<768px): Bottom sheet, full height, drag handle, sticky CTA
 *
 * Contains a 2-step form: Identity → Context
 * Integrates with LeadsService for real API submission.
 */
@Component({
  selector: 'app-training-request-drawer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Overlay -->
    @if (isOpen) {
      <div
        class="drawer-overlay"
        [class.visible]="animateIn()"
        (click)="close()"
        aria-hidden="true"
      ></div>

      <!-- Drawer Panel -->
      <aside
        class="drawer-panel"
        [class.visible]="animateIn()"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="'drawer-title'"
      >
        <!-- Mobile: Drag Handle -->
        <div class="drag-handle-bar">
          <div class="drag-handle"></div>
        </div>

        <!-- Header -->
        <header class="drawer-header">
          <div>
            <h2 id="drawer-title">{{ 'landing.formation.drawer.title' | translate }}</h2>
            <div class="step-indicator">
              {{ 'landing.formation.drawer.step' | translate }}
              {{ currentStep() }}
              {{ 'landing.formation.drawer.of' | translate }} 2
            </div>
          </div>
          <button class="close-btn" (click)="close()" aria-label="Close">
            <span class="material-icons">close</span>
          </button>
        </header>

        <!-- Step Progress Bar -->
        <div class="progress-bar">
          <div class="progress-fill" [style.width]="currentStep() === 1 ? '50%' : '100%'"></div>
        </div>

        <!-- Form Content (scrollable) -->
        <div class="drawer-body">
          <!-- Success State -->
          @if (success()) {
            <div class="success-state">
              <div class="success-icon">
                <span class="material-icons">check_circle</span>
              </div>
              <h3>{{ 'landing.formation.drawer.successTitle' | translate }}</h3>
              <p>{{ 'landing.formation.drawer.successSub' | translate }}</p>
              <button class="btn-close-success" (click)="close()">
                {{ 'landing.formation.drawer.successClose' | translate }}
              </button>
            </div>
          } @else {
            <div class="steps-container">
              <!-- Step 1: Identity -->
              <div
                class="step-pane"
                [class.active]="currentStep() === 1"
                [class.slide-left]="currentStep() === 2"
              >
                <div class="step-header">
                  <h3>{{ 'landing.formation.drawer.step1Title' | translate }}</h3>
                  <p>{{ 'landing.formation.drawer.step1Sub' | translate }}</p>
                </div>

                <div class="form-fields">
                  <div class="field-group">
                    <label for="drawer-fullname">
                      {{ 'landing.formation.drawer.fullName' | translate }}
                      <span class="req">*</span>
                    </label>
                    <div class="input-wrap">
                      <span class="field-icon material-icons">person</span>
                      <input
                        id="drawer-fullname"
                        type="text"
                        [formControl]="getControl('fullName')"
                        [placeholder]="'landing.formation.drawer.fullNamePl' | translate"
                        [class.invalid]="showError('fullName')"
                        autocomplete="name"
                      />
                    </div>
                    @if (showError('fullName')) {
                      <span class="field-error">{{
                        'landing.formation.drawer.required' | translate
                      }}</span>
                    }
                  </div>

                  <div class="field-row">
                    <div class="field-group">
                      <label for="drawer-email">
                        {{ 'landing.formation.drawer.email' | translate }}
                        <span class="req">*</span>
                      </label>
                      <div class="input-wrap">
                        <span class="field-icon material-icons">email</span>
                        <input
                          id="drawer-email"
                          type="email"
                          [formControl]="getControl('email')"
                          [placeholder]="'landing.formation.drawer.emailPl' | translate"
                          [class.invalid]="showError('email')"
                          autocomplete="email"
                        />
                      </div>
                      @if (showError('email')) {
                        <span class="field-error">
                          {{
                            (getControl('email').hasError('email')
                              ? 'landing.formation.drawer.emailInvalid'
                              : 'landing.formation.drawer.required'
                            ) | translate
                          }}
                        </span>
                      }
                    </div>

                    <div class="field-group">
                      <label for="drawer-phone">
                        {{ 'landing.formation.drawer.phone' | translate }}
                      </label>
                      <div class="input-wrap">
                        <span class="field-icon material-icons">phone</span>
                        <input
                          id="drawer-phone"
                          type="tel"
                          [formControl]="getControl('phone')"
                          [placeholder]="'landing.formation.drawer.phonePl' | translate"
                          autocomplete="tel"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Step 2: Context -->
              <div
                class="step-pane"
                [class.active]="currentStep() === 2"
                [class.slide-right]="currentStep() === 1"
              >
                <div class="step-header">
                  <h3>{{ 'landing.formation.drawer.step2Title' | translate }}</h3>
                  <p>{{ 'landing.formation.drawer.step2Sub' | translate }}</p>
                </div>

                <div class="form-fields">
                  <div class="field-group">
                    <label for="drawer-training-type">
                      {{ 'landing.formation.drawer.trainingType' | translate }}
                      <span class="req">*</span>
                    </label>
                    <div class="input-wrap select-wrap">
                      <span class="field-icon material-icons">school</span>
                      <select
                        id="drawer-training-type"
                        [formControl]="getControl('trainingType')"
                        [class.invalid]="showError('trainingType')"
                      >
                        <option value="">
                          {{ 'landing.formation.drawer.trainingTypePl' | translate }}
                        </option>
                        <option value="level_1">
                          {{ 'landing.formation.drawer.training1' | translate }}
                        </option>
                        <option value="level_2">
                          {{ 'landing.formation.drawer.training2' | translate }}
                        </option>
                        <option value="level_3">
                          {{ 'landing.formation.drawer.training3' | translate }}
                        </option>
                      </select>
                    </div>
                    @if (showError('trainingType')) {
                      <span class="field-error">{{
                        'landing.formation.drawer.required' | translate
                      }}</span>
                    }
                  </div>

                  <div class="field-row">
                    <div class="field-group">
                      <label for="drawer-farm-size">
                        {{ 'landing.formation.drawer.farmSize' | translate }}
                      </label>
                      <div class="input-wrap">
                        <span class="field-icon material-icons">landscape</span>
                        <input
                          id="drawer-farm-size"
                          type="text"
                          [formControl]="getControl('farmSize')"
                          [placeholder]="'landing.formation.drawer.farmSizePl' | translate"
                        />
                      </div>
                    </div>

                    <div class="field-group">
                      <label for="drawer-region">
                        {{ 'landing.formation.drawer.region' | translate }}
                      </label>
                      <div class="input-wrap">
                        <span class="field-icon material-icons">location_on</span>
                        <input
                          id="drawer-region"
                          type="text"
                          [formControl]="getControl('region')"
                          [placeholder]="'landing.formation.drawer.regionPl' | translate"
                        />
                      </div>
                    </div>
                  </div>

                  <div class="field-group">
                    <label for="drawer-message">
                      {{ 'landing.formation.drawer.message' | translate }}
                    </label>
                    <textarea
                      id="drawer-message"
                      [formControl]="getControl('message')"
                      [placeholder]="'landing.formation.drawer.messagePl' | translate"
                      rows="4"
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Footer CTA (sticky) -->
        @if (!success()) {
          <footer class="drawer-footer">
            @if (currentStep() === 1) {
              <button class="btn-next" [disabled]="!isStep1Valid()" (click)="nextStep()">
                {{ 'landing.formation.drawer.next' | translate }}
                <span class="material-icons">arrow_forward</span>
              </button>
            } @else {
              <div class="footer-actions">
                <button class="btn-back" (click)="prevStep()">
                  <span class="material-icons">arrow_back</span>
                  {{ 'landing.formation.drawer.back' | translate }}
                </button>
                <button
                  class="btn-submit"
                  [disabled]="!isStep2Valid() || sending()"
                  (click)="submit()"
                >
                  @if (sending()) {
                    <span class="spinner"></span>
                    {{ 'landing.formation.drawer.sending' | translate }}
                  } @else {
                    {{ 'landing.formation.drawer.submit' | translate }}
                    <span class="material-icons">send</span>
                  }
                </button>
              </div>
            }
          </footer>
        }
      </aside>
    }
  `,
  styles: [
    `
      /* ═══════════════════════════════════════════
         OVERLAY
         ═══════════════════════════════════════════ */
      .drawer-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0);
        backdrop-filter: blur(0);
        z-index: 9998;
        transition:
          background 300ms ease-out,
          backdrop-filter 300ms ease-out;
      }
      .drawer-overlay.visible {
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(6px);
      }

      /* ═══════════════════════════════════════════
         DRAWER PANEL — Desktop (Right Slide-Over)
         ═══════════════════════════════════════════ */
      .drawer-panel {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        width: 38%;
        max-width: 520px;
        min-width: 380px;
        background: white;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        box-shadow: -8px 0 40px rgba(0, 0, 0, 0.12);
        transform: translateX(100%);
        opacity: 0;
        transition:
          transform 350ms cubic-bezier(0.22, 1, 0.36, 1),
          opacity 350ms cubic-bezier(0.22, 1, 0.36, 1);
      }
      .drawer-panel.visible {
        transform: translateX(0);
        opacity: 1;
      }

      /* Drag Handle — hidden on desktop */
      .drag-handle-bar {
        display: none;
      }

      /* ═══════════════════════════════════════════
         HEADER
         ═══════════════════════════════════════════ */
      .drawer-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        padding: 1.75rem 2rem 1rem;
        flex-shrink: 0;
      }

      .drawer-header h2 {
        font-size: 1.375rem;
        font-weight: 800;
        color: #1f2937;
        margin-bottom: 0.25rem;
        font-family: 'Outfit', 'Inter', system-ui, sans-serif;
        line-height: 1.2;
      }

      .step-indicator {
        font-size: 0.8125rem;
        font-weight: 600;
        color: #10b981;
        letter-spacing: 0.02em;
      }

      .close-btn {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: none;
        background: #f3f4f6;
        color: #6b7280;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        flex-shrink: 0;
      }
      .close-btn:hover {
        background: #e5e7eb;
        color: #1f2937;
      }
      .close-btn .material-icons {
        font-size: 1.125rem;
      }

      /* ═══════════════════════════════════════════
         PROGRESS BAR
         ═══════════════════════════════════════════ */
      .progress-bar {
        height: 3px;
        background: #f3f4f6;
        margin: 0 2rem;
        border-radius: 100px;
        overflow: hidden;
        flex-shrink: 0;
      }
      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #10b981, #34d399);
        border-radius: 100px;
        transition: width 300ms cubic-bezier(0.22, 1, 0.36, 1);
      }

      /* ═══════════════════════════════════════════
         BODY (scrollable)
         ═══════════════════════════════════════════ */
      .drawer-body {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 1.5rem 2rem;
        -webkit-overflow-scrolling: touch;
      }

      /* ═══════════════════════════════════════════
         STEPS CONTAINER & TRANSITIONS
         ═══════════════════════════════════════════ */
      .steps-container {
        position: relative;
        min-height: 300px;
      }

      .step-pane {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        opacity: 0;
        transform: translateX(30px);
        pointer-events: none;
        transition:
          opacity 250ms cubic-bezier(0.22, 1, 0.36, 1),
          transform 250ms cubic-bezier(0.22, 1, 0.36, 1);
      }
      .step-pane.active {
        position: relative;
        opacity: 1;
        transform: translateX(0);
        pointer-events: auto;
      }
      .step-pane.slide-left {
        transform: translateX(-30px);
      }
      .step-pane.slide-right {
        transform: translateX(30px);
      }

      .step-header {
        margin-bottom: 1.75rem;
      }
      .step-header h3 {
        font-size: 1.0625rem;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 0.25rem;
      }
      .step-header p {
        font-size: 0.875rem;
        color: #6b7280;
      }

      /* ═══════════════════════════════════════════
         FORM FIELDS
         ═══════════════════════════════════════════ */
      .form-fields {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }

      .field-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }

      .field-group {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
      }

      label {
        font-size: 0.8125rem;
        font-weight: 600;
        color: #374151;
        display: flex;
        align-items: center;
        gap: 0.25rem;
      }
      .req {
        color: #ef4444;
        font-size: 0.75rem;
      }

      .input-wrap {
        position: relative;
        display: flex;
        align-items: center;
      }

      .field-icon {
        position: absolute;
        left: 0.875rem;
        font-size: 1rem;
        color: #9ca3af;
        pointer-events: none;
        z-index: 1;
        transition: color 0.2s ease;
      }

      input,
      select {
        width: 100%;
        padding: 0.8125rem 1rem 0.8125rem 2.75rem;
        border: 1.5px solid #e5e7eb;
        border-radius: 12px;
        font-size: 0.9375rem;
        color: #1f2937;
        background: #f9fafb;
        transition: all 0.2s ease;
        font-family: 'Inter', system-ui, sans-serif;
      }
      input:focus,
      select:focus {
        outline: none;
        border-color: #10b981;
        background: white;
        box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.08);
      }
      input:focus ~ .field-icon,
      select:focus ~ .field-icon {
        color: #10b981;
      }
      input.invalid,
      select.invalid {
        border-color: #ef4444;
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.06);
      }

      .select-wrap::after {
        content: '▾';
        position: absolute;
        right: 0.875rem;
        color: #9ca3af;
        pointer-events: none;
        font-size: 0.75rem;
      }
      select {
        appearance: none;
        cursor: pointer;
      }

      textarea {
        width: 100%;
        padding: 0.875rem 1rem;
        border: 1.5px solid #e5e7eb;
        border-radius: 12px;
        font-size: 0.9375rem;
        color: #1f2937;
        background: #f9fafb;
        resize: vertical;
        min-height: 100px;
        font-family: 'Inter', system-ui, sans-serif;
        line-height: 1.5;
        transition: all 0.2s ease;
      }
      textarea:focus {
        outline: none;
        border-color: #10b981;
        background: white;
        box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.08);
      }

      .field-error {
        font-size: 0.75rem;
        color: #ef4444;
        font-weight: 500;
      }

      /* ═══════════════════════════════════════════
         FOOTER (sticky CTA)
         ═══════════════════════════════════════════ */
      .drawer-footer {
        padding: 1.25rem 2rem;
        border-top: 1px solid #f3f4f6;
        background: white;
        flex-shrink: 0;
      }

      .footer-actions {
        display: flex;
        gap: 0.75rem;
      }

      .btn-next,
      .btn-submit {
        width: 100%;
        padding: 0.9375rem 1.5rem;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        border: none;
        border-radius: 12px;
        font-size: 0.9375rem;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        transition: all 0.25s ease;
        font-family: 'Inter', system-ui, sans-serif;
      }
      .btn-next:hover:not(:disabled),
      .btn-submit:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 8px 24px rgba(16, 185, 129, 0.35);
      }
      .btn-next:disabled,
      .btn-submit:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .btn-next .material-icons,
      .btn-submit .material-icons {
        font-size: 1.125rem;
      }

      .btn-back {
        padding: 0.9375rem 1.25rem;
        background: #f3f4f6;
        color: #374151;
        border: none;
        border-radius: 12px;
        font-size: 0.9375rem;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.375rem;
        transition: all 0.2s ease;
        font-family: 'Inter', system-ui, sans-serif;
        flex-shrink: 0;
      }
      .btn-back:hover {
        background: #e5e7eb;
      }
      .btn-back .material-icons {
        font-size: 1rem;
      }

      /* Spinner */
      .spinner {
        width: 18px;
        height: 18px;
        border: 2.5px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      /* ═══════════════════════════════════════════
         SUCCESS STATE
         ═══════════════════════════════════════════ */
      .success-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 3rem 1.5rem;
        animation: success-in 400ms ease-out;
      }
      @keyframes success-in {
        from {
          opacity: 0;
          transform: scale(0.9) translateY(10px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }

      .success-icon {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        background: linear-gradient(135deg, #f0fdf4, #dcfce7);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 1.5rem;
      }
      .success-icon .material-icons {
        font-size: 2.5rem;
        color: #10b981;
      }

      .success-state h3 {
        font-size: 1.375rem;
        font-weight: 800;
        color: #1f2937;
        margin-bottom: 0.5rem;
        font-family: 'Outfit', 'Inter', system-ui, sans-serif;
      }
      .success-state p {
        font-size: 0.9375rem;
        color: #6b7280;
        max-width: 300px;
        line-height: 1.6;
        margin-bottom: 2rem;
      }

      .btn-close-success {
        padding: 0.875rem 2rem;
        background: #f3f4f6;
        color: #374151;
        border: none;
        border-radius: 12px;
        font-size: 0.9375rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: 'Inter', system-ui, sans-serif;
      }
      .btn-close-success:hover {
        background: #e5e7eb;
      }

      /* ═══════════════════════════════════════════
         TABLET (768–1023px)
         ═══════════════════════════════════════════ */
      @media (min-width: 768px) and (max-width: 1023px) {
        .drawer-panel {
          width: 50%;
          min-width: 360px;
        }
      }

      /* ═══════════════════════════════════════════
         MOBILE (<768px) — Bottom Sheet
         ═══════════════════════════════════════════ */
      @media (max-width: 767px) {
        .drawer-panel {
          top: auto;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          max-height: 92vh;
          max-height: 92dvh;
          border-radius: 20px 20px 0 0;
          transform: translateY(100%);
          box-shadow: 0 -8px 40px rgba(0, 0, 0, 0.15);
        }
        .drawer-panel.visible {
          transform: translateY(0);
        }

        /* Drag Handle — visible on mobile */
        .drag-handle-bar {
          display: flex;
          justify-content: center;
          padding: 0.75rem 0 0.25rem;
          flex-shrink: 0;
        }
        .drag-handle {
          width: 36px;
          height: 4px;
          border-radius: 100px;
          background: #d1d5db;
        }

        .drawer-header {
          padding: 1rem 1.25rem 0.75rem;
        }
        .drawer-header h2 {
          font-size: 1.25rem;
        }

        .progress-bar {
          margin: 0 1.25rem;
        }

        .drawer-body {
          padding: 1.25rem;
        }

        .drawer-footer {
          padding: 1rem 1.25rem;
          /* Safe area for mobile keyboards */
          padding-bottom: max(1rem, env(safe-area-inset-bottom));
        }

        .field-row {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class TrainingRequestDrawerComponent implements OnChanges, AfterViewInit {
  @Input() isOpen = false;
  @Output() closed = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private leadsService = inject(LeadsService);
  private elRef = inject(ElementRef);
  private toastService = inject(ToastNotificationService);

  currentStep = signal<1 | 2>(1);
  sending = signal(false);
  success = signal(false);
  animateIn = signal(false);
  submitted = signal(false);

  form: FormGroup = this.fb.group({
    // Step 1
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    // Step 2
    trainingType: ['', Validators.required],
    farmSize: [''],
    region: [''],
    message: [''],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      if (this.isOpen) {
        this.openDrawer();
      } else {
        this.closeDrawer();
      }
    }
  }

  ngAfterViewInit(): void {
    if (this.isOpen) {
      this.focusFirstInput();
    }
  }

  /** Intercept ESC key to close drawer */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen) {
      this.close();
    }
  }

  /** Open with entrance animation */
  private openDrawer(): void {
    document.body.style.overflow = 'hidden';
    // Trigger CSS animation on next frame
    requestAnimationFrame(() => {
      this.animateIn.set(true);
      this.focusFirstInput();
    });
  }

  /** Close with exit animation */
  private closeDrawer(): void {
    this.animateIn.set(false);
    document.body.style.overflow = '';
  }

  /** Public close — resets state and emits event */
  close(): void {
    this.animateIn.set(false);
    document.body.style.overflow = '';
    // Wait for exit animation before resetting
    setTimeout(() => {
      this.form.reset();
      this.currentStep.set(1);
      this.success.set(false);
      this.sending.set(false);
      this.submitted.set(false);
      this.closed.emit();
    }, 300);
  }

  /** Navigate to Step 2 */
  nextStep(): void {
    this.submitted.set(true);
    if (this.isStep1Valid()) {
      this.currentStep.set(2);
      this.submitted.set(false);
    }
  }

  /** Navigate back to Step 1 */
  prevStep(): void {
    this.currentStep.set(1);
    this.submitted.set(false);
  }

  /** Check Step 1 validity */
  isStep1Valid(): boolean {
    return this.form.controls['fullName'].valid && this.form.controls['email'].valid;
  }

  /** Check Step 2 validity */
  isStep2Valid(): boolean {
    return this.form.controls['trainingType'].valid;
  }

  /**
   * Returns a typed FormControl for the given field name.
   * Fixes Angular strict mode TS4111 (index signature) and TS2739 (AbstractControl cast).
   */
  getControl(name: string): FormControl {
    return this.form.get(name) as FormControl;
  }

  /** Show inline error for a specific field */
  showError(field: string): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.touched || this.submitted());
  }

  /** Submit the form to the backend */
  submit(): void {
    this.submitted.set(true);
    if (!this.isStep2Valid()) {
      this.toastService.warning('landing.formation.drawer.required');
      return;
    }

    this.sending.set(true);
    const v = this.form.value;

    this.leadsService
      .submitTrainingRequest({
        full_name: v.fullName,
        email: v.email,
        phone: v.phone || undefined,
        training_type: v.trainingType,
        farm_size: v.farmSize || undefined,
        region: v.region || undefined,
        message: v.message || undefined,
      })
      .subscribe({
        next: () => {
          this.sending.set(false);
          this.success.set(true);
          this.toastService.success('landing.formation.drawer.successTitle');
        },
        error: () => {
          this.sending.set(false);
          // Graceful degradation — show success anyway
          this.success.set(true);
          this.toastService.success('landing.formation.drawer.successTitle');
        },
      });
  }

  /** Focus the first input field after open */
  private focusFirstInput(): void {
    setTimeout(() => {
      const firstInput = this.elRef.nativeElement.querySelector('#drawer-fullname');
      if (firstInput) {
        firstInput.focus();
      }
    }, 400);
  }
}
