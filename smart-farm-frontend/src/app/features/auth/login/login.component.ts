import { Component, inject, ViewChild, ElementRef, AfterViewInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Observable, of, timer } from 'rxjs';
import { map, switchMap, catchError, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { trigger, transition, style, animate } from '@angular/animations';
import { AuthService } from '../../../core/services/auth.service';
import { LoginRequest, UserRole, UserStatus } from '../../../core/models/user.model';
import { LanguageService } from '../../../core/services/language.service';
import { AlertService } from '../../../core/services/alert.service';
import { environment } from '../../../../environments/environment';

/**
 * LoginComponent - A glassmorphism-styled login form with video background
 *
 * Features:
 * - Reactive form validation with Angular FormBuilder
 * - Video background that plays once and pauses on final frame
 * - Glassmorphism UI with backdrop-filter effects
 * - Fully responsive design (mobile, tablet, desktop)
 * - Accessibility features (ARIA labels, keyboard navigation)
 * - Loading states with smooth animations
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
    MatCheckboxModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeInDown', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-30px)' }),
        animate('0.8s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})

export class LoginComponent implements AfterViewInit, OnDestroy {
  // Dependency injection using modern Angular inject()
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly alertService = inject(AlertService);
  private readonly cdr = inject(ChangeDetectorRef);
  public readonly languageService = inject(LanguageService);

  // Reference to video element
  @ViewChild('bgVideo', { static: false }) bgVideo!: ElementRef<HTMLVideoElement>;

  // Form state
  loginForm: FormGroup;

  // UI state signals
  readonly isLoading = signal(false);
  readonly hidePassword = signal(true);
  readonly isVideoLoaded = signal(false);
  readonly loginSuccess = signal(false);
  readonly showFallbackIcon = signal(false);
  readonly videoError = signal(false);
  readonly loginAttempts = signal(0);
  readonly isRateLimited = signal(false);
  readonly isCardActive = signal(false);

  // Configuration
  public readonly config = environment;

  // Computed properties
  readonly isFormValid = computed(() => this.loginForm?.valid ?? false);
  readonly canSubmit = computed(() => !this.isLoading() && this.isFormValid() && !this.isRateLimited());

  constructor() {
    this.loginForm = this.createLoginForm();
    this.initializeFormState();
  }

  // Form initialization
  private createLoginForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email], [this.emailExistsValidator()]],
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

  ngAfterViewInit(): void {
    this.setupVideoPlayback();
    this.setupKeyboardShortcuts();
    this.setupAutofillDetection();
    this.focusInitialField();
  }

  private focusInitialField(): void {
    const emailControl = this.loginForm.get('email');
    if (!emailControl?.value) {
      document.getElementById('email-input')?.focus();
    } else {
      document.getElementById('password-input')?.focus();
    }
  }

  ngOnDestroy(): void {
    this.cleanupVideoListeners();
  }



  private cleanupVideoListeners(): void {
    const video = this.bgVideo?.nativeElement;
    if (!video) return;

    video.removeEventListener('loadeddata', this.onVideoLoaded);
    video.removeEventListener('ended', this.onVideoEnded);
    video.removeEventListener('error', this.onVideoError);
  }

  // Video playback setup
  private setupVideoPlayback(): void {
    const video = this.bgVideo?.nativeElement;
    if (!video) {
      this.handleVideoNotFound();
      return;
    }

    this.attachVideoListeners(video);
    video.muted = true; // Required for autoplay
    this.playVideo();
  }

  private handleVideoNotFound(): void {
    console.warn('Video element not found');
    this.videoError.set(true);
  }

  private attachVideoListeners(video: HTMLVideoElement): void {
    video.addEventListener('loadeddata', this.onVideoLoaded.bind(this));
    video.addEventListener('ended', this.onVideoEnded.bind(this));
    video.addEventListener('error', this.onVideoError.bind(this));
  }

  // Video event handlers
  private onVideoLoaded(): void {
    this.isVideoLoaded.set(true);
  }

  private onVideoEnded(): void {
    this.bgVideo?.nativeElement?.pause();
  }

  private onVideoError(): void {
    this.videoError.set(true);
    console.warn('Video failed to load, using fallback background');
  }

  private playVideo(): void {
    const video = this.bgVideo?.nativeElement;
    if (!video) return;

    video.play()?.catch(() => {
      console.warn('Video autoplay prevented by browser');
      video.currentTime = 0; // Show first frame
    });
  }

  // Form submission
  onSubmit(): void {
    // Always allow submission attempt, but validate and show errors if needed
    if (this.isRateLimited()) {
      this.showRateLimitWarning();
      return;
    }

    if (!this.loginForm.valid) {
      this.markFormGroupTouched();
      // Still allow submission attempt - validation will show errors
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
      email: this.loginForm.get('email')?.value,
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

  readonly hasLoginError = signal(false);

  // ... (existing signals)

  private handleLoginError(error: any): void {
    this.isLoading.set(false);
    this.loginSuccess.set(false);
    this.hasLoginError.set(true);
    
    // Reset error state after animation (e.g., 500ms)
    setTimeout(() => this.hasLoginError.set(false), 500);

    this.trackLoginAttempt(this.loginForm.get('email')?.value, false);
    this.incrementLoginAttempts();
    this.clearPasswordField();

    // Focus password field for retry
    setTimeout(() => document.getElementById('password-input')?.focus(), 100);

    this.showErrorMessage(error);

    console.error('Login error:', error);
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
      'Success',
      'Login successful'
    );
  }

  private showErrorMessage(error: any): void {
    const errorMessage = this.getSpecificErrorMessage(error);
    this.alertService.error(
      'Error',
      errorMessage
    );
  }

  private showRateLimitWarning(): void {
    this.alertService.warning(
      'Warning',
      'Too many attempts. Please wait before trying again.'
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
    Object.values(this.loginForm.controls).forEach(control => control.markAsTouched());
  }

  // Form validation helpers
  getErrorMessage(fieldName: string): string {
    const control = this.loginForm.get(fieldName);
    if (!control) return '';

    if (control.hasError('required')) {
      return this.getRequiredErrorMessage(fieldName);
    }

    if (control.hasError('email')) {
      return 'Please enter a valid email address';
    }

    if (control.hasError('minlength')) {
      const minLength = control.getError('minlength').requiredLength;
      return `Password must be at least ${minLength} characters long`;
    }

    return '';
  }

  private getRequiredErrorMessage(fieldName: string): string {
    const errorMap: Record<string, string> = {
      email: this.languageService.t()('auth.emailRequired'),
      password: this.languageService.t()('auth.passwordRequired')
    };
    return errorMap[fieldName] || `${fieldName} is required`;
  }

  hasError(fieldName: string): boolean {
    const control = this.loginForm.get(fieldName);
    return !!(control?.invalid && control.touched);
  }

  togglePasswordVisibility(): void {
    this.hidePassword.update(value => !value);
  }

  onLogoError(event: Event): void {
    this.showFallbackIcon.set(true);
  }

  // Async email validation
  private emailExistsValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value || control.errors?.['email']) {
        return of(null);
      }

      return timer(this.config.auth.emailValidationDelay).pipe(
        debounceTime(this.config.auth.emailValidationDebounce),
        distinctUntilChanged(),
        switchMap(() => this.authService.checkEmailExists(control.value)),
        map(exists => exists ? null : { emailNotExists: true }),
        catchError(() => of(null))
      );
    };
  }

  // Error handling
  private getSpecificErrorMessage(error: any): string {
    // Only show error messages for login attempts (not for /auth/me)
    if (error.status === 400 || error.status === 401) {
      return 'Invalid email or password';
    }

    if (error.status === 0) {
      return 'Connection error. Try again.';
    }

    if (error.status >= 500) {
      return 'Connection error. Try again.';
    }

    if (error.status === 429) {
      return 'Too many attempts. Please try again later.';
    }

    // Default error message
    return 'Login failed. Please try again.';
  }

  // Form persistence (sessionStorage)
  private saveFormData(): void {
    const formData = {
      email: this.loginForm.get('email')?.value,
      rememberMe: this.loginForm.get('rememberMe')?.value
    };
    this.setStorageItem('session', 'loginFormData', formData);
  }

  private loadFormData(): void {
    const formData = this.getStorageItem('session', 'loginFormData');
    if (formData) {
      this.loginForm.patchValue({
        email: formData.email || '',
        rememberMe: formData.rememberMe || false
      });
    }
  }

  private clearFormData(): void {
    sessionStorage.removeItem('loginFormData');
  }

  // Remember me functionality (localStorage)
  private saveUserCredentials(email: string): void {
    this.setStorageItem('local', 'rememberedEmail', email);
  }

  private loadRememberedEmail(): void {
    const email = this.getStorageItem('local', 'rememberedEmail');
    if (email) {
      this.loginForm.patchValue({ email, rememberMe: true });
    }
  }

  // Keyboard shortcuts
  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', this.handleKeyboardShortcut.bind(this));
  }

  private handleKeyboardShortcut(event: KeyboardEvent): void {
    if (event.altKey && event.key === 'l') {
      event.preventDefault();
      document.getElementById('email-input')?.focus();
    }

    if (event.key === 'Escape') {
      this.resetForm();
    }
  }

  private resetForm(): void {
    this.loginForm.reset({ rememberMe: false });
  }

  // Analytics tracking
  private trackLoginAttempt(email: string, success: boolean): void {
    if (!this.config.enableAnalytics) return;
    console.log(`Login attempt: ${email}, Success: ${success}`);
  }

  // Rate limiting
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
      'Error',
      'Too many attempts. Please try again later.'
    );
  }

  private resetLoginAttempts(): void {
    this.loginAttempts.set(0);
    this.isRateLimited.set(false);
    localStorage.removeItem('loginAttempts');
  }

  // Focus/blur handlers for card animation
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

  // Autofill detection and form state update
  private setupAutofillDetection(): void {
    // Method 1: Check for autofilled values immediately (faster initial check)
    setTimeout(() => {
      this.checkAndUpdateAutofill();
    }, 100);

    // Also check at 500ms for slower autofills
    setTimeout(() => {
      this.checkAndUpdateAutofill();
    }, 500);

    // Method 2: Listen for input events (catches autofill and manual typing)
    const emailInput = document.getElementById('email-input') as HTMLInputElement;
    const passwordInput = document.querySelector('input[formControlName="password"]') as HTMLInputElement;

    if (emailInput) {
      emailInput.addEventListener('input', () => {
        this.syncInputToForm('email', emailInput.value);
      });

      // Also check on focus (autofill might happen on focus)
      emailInput.addEventListener('focus', () => {
        setTimeout(() => this.syncInputToForm('email', emailInput.value), 100);
      });

      // Listen for animation start (browsers fire this on autofill)
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

      // CRITICAL: Listen for animation start (browsers fire this on autofill)
      passwordInput.addEventListener('animationstart', (e: AnimationEvent) => {
        if (e.animationName === 'onAutoFillStart') {
          this.forceFloatLabel(passwordInput);
          this.syncInputToForm('password', passwordInput.value);
        }
      });
    }

    // Method 3: Periodic check for autofilled values (faster checks initially)
    let checkCount = 0;
    const maxChecks = 30; // 3 seconds total (30 * 100ms)
    const autofillCheckInterval = setInterval(() => {
      checkCount++;
      if (this.hasAutofilledValues()) {
        this.checkAndUpdateAutofill();
        clearInterval(autofillCheckInterval);
      } else if (checkCount >= maxChecks) {
        clearInterval(autofillCheckInterval);
      }
    }, 100);
  }

  private syncInputToForm(controlName: 'email' | 'password', value: string): void {
    const control = this.loginForm.get(controlName);
    if (control && value !== control.value) {
      control.setValue(value, { emitEvent: true });
      control.markAsTouched();
      control.updateValueAndValidity({ emitEvent: true });
      this.cdr.markForCheck();
    }
  }

  private hasAutofilledValues(): boolean {
    const emailInput = document.getElementById('email-input') as HTMLInputElement;
    const passwordInput = document.querySelector('input[formControlName="password"]') as HTMLInputElement;

    if (!emailInput || !passwordInput) return false;

    // Check if inputs have values but form controls don't
    const emailValue = emailInput.value;
    const passwordValue = passwordInput.value;
    const formEmail = this.loginForm.get('email')?.value;
    const formPassword = this.loginForm.get('password')?.value;

    // Explicitly convert to boolean
    const hasEmailMismatch = !!(emailValue && emailValue !== formEmail);
    const hasPasswordMismatch = !!(passwordValue && passwordValue !== formPassword);

    return hasEmailMismatch || hasPasswordMismatch;
  }

  private checkAndUpdateAutofill(): void {
    const emailInput = document.getElementById('email-input') as HTMLInputElement;
    const passwordInput = document.querySelector('input[formControlName="password"]') as HTMLInputElement;

    if (!emailInput || !passwordInput) return;

    const emailValue = emailInput.value;
    const passwordValue = passwordInput.value;

    // Update form controls if values exist
    if (emailValue && emailValue !== this.loginForm.get('email')?.value) {
      this.loginForm.get('email')?.setValue(emailValue);
      this.loginForm.get('email')?.markAsTouched();
      this.loginForm.get('email')?.updateValueAndValidity();
      // Force label to float by adding class to parent form field
      this.forceFloatLabel(emailInput);
    }

    if (passwordValue && passwordValue !== this.loginForm.get('password')?.value) {
      this.loginForm.get('password')?.setValue(passwordValue);
      this.loginForm.get('password')?.markAsTouched();
      this.loginForm.get('password')?.updateValueAndValidity();
      // Force label to float by adding class to parent form field
      this.forceFloatLabel(passwordInput);
    }

    // Trigger change detection
    if (this.loginForm.dirty || this.loginForm.touched) {
      // Force form validation update
      this.loginForm.updateValueAndValidity();
      // Manually trigger change detection for OnPush strategy
      this.cdr.markForCheck();
    }
  }

  // Force the floating label to move up when autofill is detected
  // Also handles password field autofill overlap issues
  private forceFloatLabel(input: HTMLInputElement): void {
    const formField = input.closest('mat-form-field');
    if (formField) {
      // Add classes to force label float (for CSS targeting)
      formField.classList.add('mat-form-field-has-value');
      formField.classList.add('mat-form-field-autofilled');

      // ============================================
      // CRITICAL: Force label to float with inline styles
      // ============================================
      const label = formField.querySelector('.mat-mdc-floating-label, .mdc-floating-label') as HTMLElement;
      if (label) {
        // Add float class
        label.classList.add('mdc-floating-label--float-above');

        // Apply inline transform to force immediate visual update
        label.style.transform = 'translateY(-106%) scale(0.75)';
        label.style.color = '#10b981'; // primary color
      }

      // Also ensure the outline notch is open (no top border)
      const notch = formField.querySelector('.mdc-notched-outline__notch') as HTMLElement;
      if (notch) {
        notch.style.borderTop = 'none';
      }

      // ============================================
      // FIX: Handle password autofill overlap
      // ============================================
      if (input.type === 'password') {
        // Force input to re-render by temporarily toggling visibility
        // This clears any "ghost" text from autofill overlap
        const originalDisplay = input.style.display;
        input.style.display = 'none';
        // Force reflow
        void input.offsetHeight;
        input.style.display = originalDisplay || '';

        // Ensure proper input styling is applied
        input.style.lineHeight = '1.5';
        input.style.height = '100%';
        input.style.boxSizing = 'border-box';
        input.style.paddingTop = '0';
      }

      // Trigger change detection
      this.cdr.markForCheck();
    }
  }

  // New signals for enhanced UX
  readonly capsLockOn = signal(false);

  // Storage helpers
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

  // Enhanced Field Behaviors
  
  /**
   * Detects Caps Lock state on keydown/keyup events in the password field
   */
  checkCapsLock(event: Event): void {
    if (event instanceof KeyboardEvent && typeof event.getModifierState === 'function') {
      const capsLockActive = event.getModifierState('CapsLock');
      this.capsLockOn.set(capsLockActive);
    }
  }

  /**
   * Clears the email field and focuses it
   */
  clearEmail(): void {
    this.loginForm.get('email')?.setValue('');
    this.loginForm.get('email')?.markAsTouched();
    document.getElementById('email-input')?.focus();
  }

  /**
   * Trims whitespace from email input on blur to prevent accidental copy-paste errors
   */
  trimEmail(): void {
    const emailControl = this.loginForm.get('email');
    if (emailControl?.value) {
      emailControl.setValue(emailControl.value.trim(), { emitEvent: false });
    }
  }
}
