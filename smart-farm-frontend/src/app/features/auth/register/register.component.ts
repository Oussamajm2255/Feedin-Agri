import { Component, inject, ViewChild, ElementRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AuthService } from '../../../core/services/auth.service';
import { RegisterRequest, UserRole, UserStatus } from '../../../core/models/user.model';
import { LanguageService } from '../../../core/services/language.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-register',
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
    MatSelectModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
  animations: [
    trigger('fadeInDown', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-30px)' }),
        animate('0.8s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  public languageService = inject(LanguageService);

  @ViewChild('bgVideo', { static: false }) bgVideo!: ElementRef<HTMLVideoElement>;

  registerForm: FormGroup;
  isLoading = false;
  hidePassword = true;
  hideConfirmPassword = true;

  public readonly config = environment;
  readonly isVideoLoaded = signal(false);
  readonly videoError = signal(false);
  readonly isCardActive = signal(false);
  readonly showFallbackIcon = signal(false);
  readonly currentStep = signal(1);

  farmTypes = [
    { value: 'small', label: 'Small Farm', icon: 'grass' },
    { value: 'commercial', label: 'Commercial Farm', icon: 'agriculture' },
    { value: 'cooperative', label: 'Cooperative', icon: 'groups' }
  ];

  constructor() {
    this.registerForm = this.fb.group({
      full_name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      farm_type: ['small', [Validators.required]],
      area_hectares: [null, [Validators.required, Validators.min(0.1)]],
      region: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    }, { validators: this.passwordMatchValidator });
  }

  onVideoLoaded(): void {
    this.isVideoLoaded.set(true);
  }

  onVideoError(): void {
    this.videoError.set(true);
  }

  onLogoError(event: Event): void {
    this.showFallbackIcon.set(true);
  }

  onFocus(event: FocusEvent): void {
    this.isCardActive.set(true);
  }

  onBlur(event: FocusEvent): void {
    setTimeout(() => {
      const activeElement = document.activeElement;
      const isInput = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA' || activeElement?.tagName === 'MAT-SELECT';
      if (!isInput) {
        this.isCardActive.set(false);
      }
    }, 100);
  }

  nextStep(): void {
    // Validate step 1 fields before proceeding
    const step1Fields = ['full_name', 'email', 'password', 'confirmPassword'];
    let valid = true;
    step1Fields.forEach(field => {
      const control = this.registerForm.get(field);
      control?.markAsTouched();
      if (control?.invalid) {
        valid = false;
      }
    });
    if (valid) {
      this.currentStep.set(2);
    }
  }

  prevStep(): void {
    this.currentStep.set(1);
  }

  goToStep(step: number): void {
    if (step === 1) {
      this.currentStep.set(1);
    }
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    return null;
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      const formValue = this.registerForm.value;

      // Split full_name into first_name and last_name
      const nameParts = formValue.full_name.trim().split(/\s+/);
      const first_name = nameParts[0] || '';
      const last_name = nameParts.slice(1).join(' ') || first_name;

      const registrationData: RegisterRequest = {
        first_name,
        last_name,
        email: formValue.email,
        password: formValue.password,
        phone: formValue.phone || undefined,
        role: UserRole.FARMER,
        status: UserStatus.PENDING,
        farm_type: formValue.farm_type,
        area_hectares: formValue.area_hectares,
        region: formValue.region,
      };

      this.authService.register(registrationData).subscribe({
        next: () => {
          this.isLoading = false;
          this.snackBar.open(
            this.languageService.t()('auth.registerSuccess') || 'Your access request has been submitted! We\'ll review it shortly.',
            'OK',
            {
              duration: 5000,
              panelClass: ['success-snackbar']
            }
          );
          // AuthService handles redirect to /onboarding/pending
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Registration error:', error);

          let errorMessage = 'Request failed. Please try again.';
          if (error?.error?.error?.message) {
            errorMessage = error.error.error.message;
          } else if (error?.error?.message) {
            errorMessage = error.error.message;
          } else if (error?.message) {
            errorMessage = error.message;
          }

          this.snackBar.open(errorMessage, 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.registerForm.get(fieldName);
    if (control?.hasError('required')) {
      const labels: Record<string, string> = {
        full_name: this.languageService.t()('auth.fullName') || 'Full name',
        email: this.languageService.t()('auth.email') || 'Email',
        farm_type: this.languageService.t()('auth.farmType') || 'Farm type',
        area_hectares: this.languageService.t()('auth.areaHectares') || 'Area',
        region: this.languageService.t()('auth.region') || 'Region',
        password: this.languageService.t()('auth.password') || 'Password',
        confirmPassword: this.languageService.t()('auth.confirmPassword') || 'Password confirmation'
      };
      return `${labels[fieldName] || fieldName} is required`;
    }
    if (control?.hasError('email')) {
      return this.languageService.t()('auth.invalidEmail') || 'Please enter a valid email address';
    }
    if (control?.hasError('minlength')) {
      return `Must be at least ${control.errors?.['minlength'].requiredLength} characters`;
    }
    if (control?.hasError('min')) {
      return 'Must be greater than 0';
    }
    if (control?.hasError('passwordMismatch')) {
      return this.languageService.t()('auth.passwordMismatch') || 'Passwords do not match';
    }
    return '';
  }
}
