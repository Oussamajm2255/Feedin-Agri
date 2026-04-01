import {
  Component,
  inject,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  signal,
  computed,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { trigger, transition, style, animate } from '@angular/animations';

import { AuthService } from '../../../core/services/auth.service';
import { LoginRequest, UserRole, UserStatus } from '../../../core/models/user.model';
import { LanguageService } from '../../../core/services/language.service';
import { AlertService } from '../../../core/services/alert.service';
import { environment } from '../../../../environments/environment';

/**
 * LoginComponent - Concept A: Single Canvas Experience
 *
 * A cinematic agricultural scene that naturally transforms into an 
 * interactive login surface — not two stacked sections.
 *
 * Key Features:
 * - Video hero (45-50% viewport) with gradient fade into form
 * - Seamless surface continuation (no card boundaries)
 * - Single headline hierarchy
 * - Keyboard-safe scrollable layout
 * - Linen/neumorphic brand identity
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatTooltipModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('0.5s ease-out', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class LoginComponent implements AfterViewInit, OnDestroy {
  // =============================================================================
  // DEPENDENCY INJECTION
  // =============================================================================

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly alertService = inject(AlertService);
  private readonly cdr = inject(ChangeDetectorRef);
  public readonly languageService = inject(LanguageService);

  // =============================================================================
  // REFERENCES & CLEANUP
  // =============================================================================

  @ViewChild('bgVideo', { static: false }) bgVideo!: ElementRef<HTMLVideoElement>;

  private keyboardHandler!: (e: KeyboardEvent) => void;
  private resizeHandler!: () => void;
  private autofillInterval: ReturnType<typeof setInterval> | null = null;
  private videoAbortController: AbortController | null = null;
  private initialViewportHeight: number = 0;

  // =============================================================================
  // FORM STATE
  // =============================================================================

  loginForm: FormGroup;

  // =============================================================================
  // SIGNALS - UI State
  // =============================================================================

  readonly isLoading = signal(false);
  readonly hidePassword = signal(true);
  readonly isVideoLoaded = signal(false);
  readonly loginSuccess = signal(false);
  readonly showFallbackIcon = signal(false);
  readonly videoError = signal(false);
  readonly loginAttempts = signal(0);
  readonly isRateLimited = signal(false);
  readonly isCardActive = signal(false);
  readonly hasLoginError = signal(false);
  readonly capsLockOn = signal(false);
  readonly isKeyboardOpen = signal(false);

  // =============================================================================
  // CONFIGURATION
  // =============================================================================

  public readonly config = environment;

  // =============================================================================
  // COMPUTED PROPERTIES
  // =============================================================================

  readonly isFormValid = computed(() => this.loginForm?.valid ?? false);
  readonly canSubmit = computed(() => !this.isLoading() && this.isFormValid() && !this.isRateLimited());

  // Password strength calculation
  readonly passwordStrength = computed(() => {
    const pw = this.loginForm.get('password')?.value || '';
    if (!pw) return 0;

    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    return Math.min(score, 5);
  });

  // Password strength label
  readonly passwordStrengthLabel = computed(() => {
    const s = this.passwordStrength();
    if (s === 0) return '';
    if (s <= 2) return this.languageService.t()('auth.strengthWeak') || 'Weak';
    if (s <= 3) return this.languageService.t()('auth.strengthFair') || 'Fair';
    if (s <= 4) return this.languageService.t()('auth.strengthGood') || 'Good';
    return this.languageService.t()('auth.strengthStrong') || 'Strong';
  });

  // =============================================================================
  // CONSTRUCTOR
  // =============================================================================

  constructor() {
    this.loginForm = this.createLoginForm();
    this.initializeFormState();
    this.initialViewportHeight = window.visualViewport?.height || window.innerHeight;
  }

  // =============================================================================
  // FORM INITIALIZATION
  // =============================================================================

  private createLoginForm(): FormGroup {
    return this.fb.group({
      email: this.fb.control('', {
        validators: [Validators.required, Validators.email],
        updateOn: 'blur'
      }),
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  private initializeFormState(): void {
    this.loadFormData();
    this.loadRememberedEmail();
    this.checkRateLimit();
    this.setupFormAutoSave();
  }

  private setupFormAutoSave(): void {
    this.loginForm.valueChanges.subscribe(() => this.saveFormData());
  }

  // =============================================================================
  // LIFECYCLE HOOKS
  // =============================================================================

  ngAfterViewInit(): void {
    this.setupVideoPlayback();
    this.setupKeyboardShortcuts();
    this.setupKeyboardDetection();
    this.setupAutofillDetection();
    this.focusInitialField();
  }

  ngOnDestroy(): void {
    this.videoAbortController?.abort();
    this.cleanupVideoListeners();

    if (this.keyboardHandler) {
      document.removeEventListener('keydown', this.keyboardHandler);
    }

    if (this.resizeHandler) {
      window.visualViewport?.removeEventListener('resize', this.resizeHandler);
      window.removeEventListener('resize', this.resizeHandler);
    }

    if (this.autofillInterval) {
      clearInterval(this.autofillInterval);
      this.autofillInterval = null;
    }
  }

  // =============================================================================
  // KEYBOARD DETECTION (for mobile keyboard-safe layout)
  // =============================================================================

  private setupKeyboardDetection(): void {
    // Store initial viewport height
    this.initialViewportHeight = window.visualViewport?.height || window.innerHeight;

    // Use visualViewport API for more accurate keyboard detection
    this.resizeHandler = () => {
      const currentHeight = window.visualViewport?.height || window.innerHeight;
      const heightDiff = this.initialViewportHeight - currentHeight;
      
      // If viewport shrinks by more than 150px, keyboard is likely open
      const keyboardOpen = heightDiff > 150;
      
      if (this.isKeyboardOpen() !== keyboardOpen) {
        this.isKeyboardOpen.set(keyboardOpen);
        this.cdr.markForCheck();
      }
    };

    window.visualViewport?.addEventListener('resize', this.resizeHandler);
    window.addEventListener('resize', this.resizeHandler);
  }

  // Alternative: Detect focus on input fields
  @HostListener('focusin', ['$event'])
  onFocusIn(event: FocusEvent): void {
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      // Small delay to let keyboard animate in
      setTimeout(() => {
        const currentHeight = window.visualViewport?.height || window.innerHeight;
        const heightDiff = this.initialViewportHeight - currentHeight;
        if (heightDiff > 150) {
          this.isKeyboardOpen.set(true);
          this.cdr.markForCheck();
        }
      }, 100);
    }
  }

  @HostListener('focusout', ['$event'])
  onFocusOut(event: FocusEvent): void {
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      // Small delay to let keyboard animate out
      setTimeout(() => {
        const currentHeight = window.visualViewport?.height || window.innerHeight;
        const heightDiff = this.initialViewportHeight - currentHeight;
        if (heightDiff <= 150) {
          this.isKeyboardOpen.set(false);
          this.cdr.markForCheck();
        }
      }, 100);
    }
  }

  // =============================================================================
  // VIDEO BACKGROUND
  // =============================================================================

  private setupVideoPlayback(): void {
    const connection = (navigator as any)?.connection;
    const isSlow = connection?.effectiveType === '2g'
      || connection?.effectiveType === 'slow-2g'
      || connection?.saveData;

    if (isSlow) {
      this.videoError.set(true);
      return;
    }

    const video = this.bgVideo?.nativeElement;
    if (!video) {
      this.videoError.set(true);
      return;
    }

    this.videoAbortController = new AbortController();

    // Defer video load for better initial render performance
    setTimeout(() => {
      if (this.videoAbortController?.signal.aborted) return;

      video.preload = 'metadata';
      this.attachVideoListeners(video);
      video.muted = true;
      video.load();
      this.playVideo();
    }, 300);
  }

  private attachVideoListeners(video: HTMLVideoElement): void {
    video.addEventListener('loadeddata', this.onVideoLoaded.bind(this));
    video.addEventListener('ended', this.onVideoEnded.bind(this));
    video.addEventListener('error', this.onVideoError.bind(this));
  }

  private cleanupVideoListeners(): void {
    const video = this.bgVideo?.nativeElement;
    if (!video) return;

    video.removeEventListener('loadeddata', this.onVideoLoaded);
    video.removeEventListener('ended', this.onVideoEnded);
    video.removeEventListener('error', this.onVideoError);
  }

  private onVideoLoaded(): void {
    this.isVideoLoaded.set(true);
    this.cdr.markForCheck();
  }

  private onVideoEnded(): void {
    this.bgVideo?.nativeElement?.pause();
  }

  private onVideoError(): void {
    this.videoError.set(true);
    console.warn('Video failed to load, using fallback background');
    this.cdr.markForCheck();
  }

  private playVideo(): void {
    const video = this.bgVideo?.nativeElement;
    if (!video) return;

    video.play()?.catch(() => {
      console.warn('Video autoplay prevented by browser');
      video.currentTime = 0;
    });
  }

  // =============================================================================
  // FORM SUBMISSION
  // =============================================================================

  onSubmit(): void {
    if (this.isRateLimited()) {
      this.showRateLimitWarning();
      return;
    }

    if (!this.loginForm.valid) {
      this.markFormGroupTouched();
      return;
    }

    this.performLogin();
  }

  private performLogin(): void {
    this.isLoading.set(true);
    this.loginSuccess.set(false);

    const credentials = this.getLoginCredentials();

    this.authService.login(credentials).subscribe({
      next: () => this.handleLoginSuccess(credentials.email),
      error: (error) => this.handleLoginError(error)
    });
  }

  private getLoginCredentials(): LoginRequest {
    return {
      email: this.loginForm.get('email')?.value?.trim(),
      password: this.loginForm.get('password')?.value
    };
  }

  private handleLoginSuccess(email: string): void {
    this.isLoading.set(false);
    this.loginSuccess.set(true);

    this.trackLoginAttempt(email, true);
    this.resetLoginAttempts();
    this.handleRememberMe(email);
    this.showSuccessMessage();
    this.clearFormData();

    this.navigateAfterDelay();
  }

  private handleLoginError(error: any): void {
    this.isLoading.set(false);
    this.loginSuccess.set(false);
    this.hasLoginError.set(true);

    // Reset error state after animation
    setTimeout(() => this.hasLoginError.set(false), 600);

    this.trackLoginAttempt(this.loginForm.get('email')?.value, false);
    this.incrementLoginAttempts();
    this.clearPasswordField();

    // Focus password field for retry
    setTimeout(() => document.getElementById('password-input')?.focus(), 100);

    this.showErrorMessage(error);
    this.announceToScreenReader(error);

    console.error('Login error:', error);
  }

  private announceToScreenReader(error: any): void {
    const statusEl = document.getElementById('login-status');
    if (statusEl) {
      statusEl.textContent = '';
      requestAnimationFrame(() => {
        statusEl.textContent = this.getSpecificErrorMessage(error);
      });
    }
  }

  private handleRememberMe(email: string): void {
    if (this.loginForm.get('rememberMe')?.value) {
      this.saveUserCredentials(email);
    }
  }

  private clearPasswordField(): void {
    this.loginForm.patchValue({ password: '' });
  }

  private showSuccessMessage(): void {
    this.alertService.success(
      this.languageService.t()('auth.loginSuccess') || 'Success',
      this.languageService.t()('auth.loginSuccessMessage') || 'Login successful'
    );
  }

  private showErrorMessage(error: any): void {
    const errorMessage = this.getSpecificErrorMessage(error);
    this.alertService.error(
      this.languageService.t()('auth.loginError') || 'Error',
      errorMessage
    );
  }

  private showRateLimitWarning(): void {
    this.alertService.warning(
      this.languageService.t()('auth.warning') || 'Warning',
      this.languageService.t()('auth.tooManyAttempts') || 'Too many attempts. Please wait before trying again.'
    );
  }

  private navigateAfterDelay(): void {
    setTimeout(() => {
      const currentUser = this.authService.getCurrentUser();

      // PENDING users → redirect to onboarding status page
      if (currentUser?.status === UserStatus.PENDING) {
        this.router.navigate(['/onboarding/pending']);
        return;
      }

      // Active users → redirect based on role
      const redirectPath = currentUser?.role === UserRole.ADMIN ? '/admin' : '/dashboard';
      this.router.navigate([redirectPath]);
    }, this.config.auth.loginSuccessDelay);
  }

  private markFormGroupTouched(): void {
    Object.values(this.loginForm.controls).forEach(control => {
      control.markAsTouched();
      control.updateValueAndValidity();
    });
  }

  // =============================================================================
  // FORM VALIDATION
  // =============================================================================

  getErrorMessage(fieldName: string): string {
    const control = this.loginForm.get(fieldName);
    if (!control) return '';

    if (control.hasError('required')) {
      return this.getRequiredErrorMessage(fieldName);
    }

    if (control.hasError('email')) {
      return this.languageService.t()('auth.invalidEmail') || 'Please enter a valid email address';
    }

    if (control.hasError('minlength')) {
      const minLength = control.getError('minlength').requiredLength;
      return this.languageService.t()('auth.passwordTooShort')?.replace('{min}', minLength)
        || `Password must be at least ${minLength} characters`;
    }

    return '';
  }

  private getRequiredErrorMessage(fieldName: string): string {
    const errorMap: Record<string, string> = {
      email: this.languageService.t()('auth.emailRequired') || 'Email is required',
      password: this.languageService.t()('auth.passwordRequired') || 'Password is required'
    };
    return errorMap[fieldName] || `${fieldName} is required`;
  }

  hasError(fieldName: string): boolean {
    const control = this.loginForm.get(fieldName);
    return !!(control?.invalid && control.touched);
  }

  // =============================================================================
  // UI INTERACTIONS
  // =============================================================================

  togglePasswordVisibility(): void {
    this.hidePassword.update(value => !value);
  }

  onLogoError(event: Event): void {
    this.showFallbackIcon.set(true);
  }

  onFocus(event: FocusEvent): void {
    this.isCardActive.set(true);
  }

  onBlur(event: FocusEvent): void {
    setTimeout(() => {
      if (!this.isAnyFormFieldFocused()) {
        this.isCardActive.set(false);
      }
    }, 100);
  }

  private isAnyFormFieldFocused(): boolean {
    const activeElement = document.activeElement;
    return activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA';
  }

  private focusInitialField(): void {
    const emailControl = this.loginForm.get('email');
    if (!emailControl?.value) {
      document.getElementById('email-input')?.focus();
    } else {
      document.getElementById('password-input')?.focus();
    }
  }

  checkCapsLock(event: KeyboardEvent): void {
    if (typeof event.getModifierState === 'function') {
      const capsLockActive = event.getModifierState('CapsLock');
      this.capsLockOn.set(capsLockActive);
    }
  }

  clearEmail(): void {
    this.loginForm.get('email')?.setValue('');
    this.loginForm.get('email')?.markAsTouched();
    document.getElementById('email-input')?.focus();
  }

  trimEmail(): void {
    const emailControl = this.loginForm.get('email');
    if (emailControl?.value) {
      emailControl.setValue(emailControl.value.trim(), { emitEvent: false });
    }
  }

  // =============================================================================
  // ERROR HANDLING
  // =============================================================================

  private getSpecificErrorMessage(error: any): string {
    if (error.status === 0) {
      return navigator.onLine
        ? this.languageService.t()('auth.serverUnreachable') || 'Unable to reach the server. Please try again.'
        : this.languageService.t()('auth.offline') || 'You appear to be offline. Please check your connection.';
    }

    if (error.status === 400 || error.status === 401) {
      return this.languageService.t()('auth.invalidCredentials')
        || 'Invalid email or password.';
    }

    if (error.status === 403) {
      const code = error.error?.code;
      if (code === 'PENDING') {
        return this.languageService.t()('auth.pendingApproval')
          || 'Your account is pending approval. You will be notified by email.';
      }
    }

    if (error.status === 429) {
      return this.languageService.t()('auth.tooManyAttempts')
        || 'Too many attempts. Please wait before trying again.';
    }

    if (error.status >= 500) {
      return this.languageService.t()('auth.serverError') || 'Server error. Please try again later.';
    }

    return this.languageService.t()('auth.loginFailed') || 'Login failed. Please try again.';
  }

  // =============================================================================
  // FORM PERSISTENCE
  // =============================================================================

  private saveFormData(): void {
    const formData = {
      email: this.loginForm.get('email')?.value,
      rememberMe: this.loginForm.get('rememberMe')?.value
    };
    this.setStorageItem('session', 'loginFormData', formData);
  }

  private loadFormData(): void {
    const formData = this.getStorageItem('session', 'loginFormData');
    if (formData?.email) {
      this.loginForm.patchValue(
        { email: formData.email, rememberMe: formData.rememberMe || false },
        { emitEvent: false }
      );
    }
  }

  private clearFormData(): void {
    sessionStorage.removeItem('loginFormData');
  }

  // =============================================================================
  // REMEMBER ME
  // =============================================================================

  private saveUserCredentials(email: string): void {
    this.setStorageItem('local', 'rememberedEmail', email);
  }

  private loadRememberedEmail(): void {
    const email = this.getStorageItem('local', 'rememberedEmail');
    if (email) {
      this.loginForm.patchValue({ email, rememberMe: true });
    }
  }

  // =============================================================================
  // KEYBOARD SHORTCUTS
  // =============================================================================

  private setupKeyboardShortcuts(): void {
    this.keyboardHandler = this.handleKeyboardShortcut.bind(this);
    document.addEventListener('keydown', this.keyboardHandler);
  }

  private handleKeyboardShortcut(event: KeyboardEvent): void {
    // Alt+L to focus email field
    if (event.altKey && event.key.toLowerCase() === 'l') {
      event.preventDefault();
      document.getElementById('email-input')?.focus();
    }

    // Escape to reset form
    if (event.key === 'Escape') {
      this.resetForm();
    }

    // Enter to submit when in input field
    if (event.key === 'Enter' && event.target instanceof HTMLInputElement) {
      const form = event.target.closest('form');
      if (form && !this.isLoading()) {
        this.onSubmit();
      }
    }
  }

  private resetForm(): void {
    this.loginForm.reset({ rememberMe: false });
    this.hasLoginError.set(false);
  }

  // =============================================================================
  // RATE LIMITING
  // =============================================================================

  private checkRateLimit(): void {
    const attemptsData = this.getStorageItem('local', 'loginAttempts');
    if (!attemptsData) return;

    const { count, timestamp } = attemptsData;
    const isWithinWindow = Date.now() - timestamp < this.config.auth.loginAttemptWindow;

    if (isWithinWindow) {
      this.loginAttempts.set(count);
      if (count >= this.config.auth.maxLoginAttempts) {
        this.isRateLimited.set(true);
      }
    } else {
      this.resetLoginAttempts();
    }
  }

  private incrementLoginAttempts(): void {
    const newCount = this.loginAttempts() + 1;
    this.loginAttempts.set(newCount);

    const attemptsData = { count: newCount, timestamp: Date.now() };
    this.setStorageItem('local', 'loginAttempts', attemptsData);

    if (newCount >= this.config.auth.maxLoginAttempts) {
      this.handleRateLimitReached();
    }
  }

  private handleRateLimitReached(): void {
    this.isRateLimited.set(true);
    this.alertService.error(
      this.languageService.t()('auth.error') || 'Error',
      this.languageService.t()('auth.rateLimitReached') || 'Too many attempts. Please try again later.'
    );
  }

  private resetLoginAttempts(): void {
    this.loginAttempts.set(0);
    this.isRateLimited.set(false);
    localStorage.removeItem('loginAttempts');
  }

  // =============================================================================
  // AUTOFILL DETECTION
  // =============================================================================

  private setupAutofillDetection(): void {
    // Initial checks
    setTimeout(() => this.checkAndUpdateAutofill(), 100);
    setTimeout(() => this.checkAndUpdateAutofill(), 500);

    // Setup input listeners
    const emailInput = document.getElementById('email-input') as HTMLInputElement;
    const passwordInput = document.getElementById('password-input') as HTMLInputElement;

    if (emailInput) {
      emailInput.addEventListener('input', () => {
        this.syncInputToForm('email', emailInput.value);
      });

      emailInput.addEventListener('focus', () => {
        setTimeout(() => this.syncInputToForm('email', emailInput.value), 100);
      });

      emailInput.addEventListener('animationstart', (e: AnimationEvent) => {
        if (e.animationName === 'onAutoFillStart') {
          this.forceFloatLabel(emailInput);
          this.syncInputToForm('email', emailInput.value);
        }
      });
    }

    if (passwordInput) {
      passwordInput.addEventListener('input', () => {
        this.syncInputToForm('password', passwordInput.value);
      });

      passwordInput.addEventListener('focus', () => {
        setTimeout(() => this.syncInputToForm('password', passwordInput.value), 100);
      });

      passwordInput.addEventListener('animationstart', (e: AnimationEvent) => {
        if (e.animationName === 'onAutoFillStart') {
          this.forceFloatLabel(passwordInput);
          this.syncInputToForm('password', passwordInput.value);
        }
      });
    }

    // Periodic check
    let checkCount = 0;
    const maxChecks = 30;
    this.autofillInterval = setInterval(() => {
      checkCount++;
      if (this.hasAutofilledValues()) {
        this.checkAndUpdateAutofill();
        if (this.autofillInterval) {
          clearInterval(this.autofillInterval);
          this.autofillInterval = null;
        }
      } else if (checkCount >= maxChecks) {
        if (this.autofillInterval) {
          clearInterval(this.autofillInterval);
          this.autofillInterval = null;
        }
      }
    }, 100);
  }

  private syncInputToForm(controlName: 'email' | 'password', value: string): void {
    const control = this.loginForm.get(controlName);
    if (control && value && value !== control.value) {
      control.setValue(value, { emitEvent: false });
      control.markAsTouched();
      this.cdr.markForCheck();
    }
  }

  private hasAutofilledValues(): boolean {
    const emailInput = document.getElementById('email-input') as HTMLInputElement;
    const passwordInput = document.getElementById('password-input') as HTMLInputElement;

    if (!emailInput || !passwordInput) return false;

    const emailValue = emailInput.value;
    const passwordValue = passwordInput.value;
    const formEmail = this.loginForm.get('email')?.value;
    const formPassword = this.loginForm.get('password')?.value;

    return !!(emailValue && emailValue !== formEmail) ||
           !!(passwordValue && passwordValue !== formPassword);
  }

  private checkAndUpdateAutofill(): void {
    const emailInput = document.getElementById('email-input') as HTMLInputElement;
    const passwordInput = document.getElementById('password-input') as HTMLInputElement;

    if (!emailInput || !passwordInput) return;

    const emailValue = emailInput.value;
    const passwordValue = passwordInput.value;

    if (emailValue && emailValue !== this.loginForm.get('email')?.value) {
      this.loginForm.get('email')?.setValue(emailValue);
      this.loginForm.get('email')?.markAsTouched();
      this.forceFloatLabel(emailInput);
    }

    if (passwordValue && passwordValue !== this.loginForm.get('password')?.value) {
      this.loginForm.get('password')?.setValue(passwordValue);
      this.loginForm.get('password')?.markAsTouched();
      this.forceFloatLabel(passwordInput);
    }

    if (this.loginForm.dirty || this.loginForm.touched) {
      this.loginForm.updateValueAndValidity();
      this.cdr.markForCheck();
    }
  }

  private forceFloatLabel(input: HTMLInputElement): void {
    const formField = input.closest('mat-form-field');
    if (formField) {
      formField.classList.add('mat-form-field-has-value');
      formField.classList.add('mat-form-field-autofilled');

      const label = formField.querySelector('.mat-mdc-floating-label, .mdc-floating-label') as HTMLElement;
      if (label) {
        label.classList.add('mdc-floating-label--float-above');
        label.style.transform = 'translateY(-106%) scale(0.75)';
        label.style.color = '#10b981';
      }

      const notch = formField.querySelector('.mdc-notched-outline__notch') as HTMLElement;
      if (notch) {
        notch.style.borderTop = 'none';
      }

      // Handle password field autofill overlap
      if (input.type === 'password') {
        const originalDisplay = input.style.display;
        input.style.display = 'none';
        void input.offsetHeight; // Force reflow
        input.style.display = originalDisplay || '';
      }

      this.cdr.markForCheck();
    }
  }

  // =============================================================================
  // STORAGE HELPERS
  // =============================================================================

  private setStorageItem(type: 'local' | 'session', key: string, value: any): void {
    try {
      const storage = type === 'local' ? localStorage : sessionStorage;
      storage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Failed to save ${type} storage item:`, error);
    }
  }

  private getStorageItem(type: 'local' | 'session', key: string): any {
    try {
      const storage = type === 'local' ? localStorage : sessionStorage;
      const item = storage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.warn(`Failed to load ${type} storage item:`, error);
      return null;
    }
  }

  // =============================================================================
  // ANALYTICS
  // =============================================================================

  private trackLoginAttempt(email: string, success: boolean): void {
    if (!this.config.enableAnalytics) return;
    console.log(`Login attempt: ${email}, Success: ${success}`);
  }
}
