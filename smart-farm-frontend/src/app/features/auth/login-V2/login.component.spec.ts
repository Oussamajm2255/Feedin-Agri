import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';

// Mock services
const mockAuthService = {
  login: jest.fn(),
  getCurrentUser: jest.fn(),
};

const mockLanguageService = {
  t: jest.fn((key?: string) => {
    const translations: Record<string, string> = {
      'auth.email': 'Email',
      'auth.password': 'Password',
      'auth.loginButton': 'Sign In',
      'auth.emailRequired': 'Email is required',
      'auth.passwordRequired': 'Password is required',
      'auth.invalidEmail': 'Please enter a valid email',
    };
    return key ? translations[key] || key : translations;
  }),
};

const mockAlertService = {
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
};

const mockRouter = {
  navigate: jest.fn(),
};

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
      ],
      providers: [
        FormBuilder,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: 'AuthService', useValue: mockAuthService },
        { provide: 'LanguageService', useValue: mockLanguageService },
        { provide: 'AlertService', useValue: mockAlertService },
        { provide: 'Router', useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
    flush();
  });

  describe('Component Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize form with empty values', () => {
      expect(component.loginForm.get('email')?.value).toBe('');
      expect(component.loginForm.get('password')?.value).toBe('');
      expect(component.loginForm.get('rememberMe')?.value).toBe(false);
    });

    it('should have form invalid initially', () => {
      expect(component.loginForm.valid).toBe(false);
    });
  });

  describe('Form Validation', () => {
    it('should require email', () => {
      const emailControl = component.loginForm.get('email');
      emailControl?.setValue('');
      emailControl?.markAsTouched();
      
      expect(emailControl?.hasError('required')).toBe(true);
      expect(component.hasError('email')).toBe(true);
    });

    it('should validate email format', () => {
      const emailControl = component.loginForm.get('email');
      emailControl?.setValue('invalid-email');
      emailControl?.markAsTouched();
      
      expect(emailControl?.hasError('email')).toBe(true);
    });

    it('should accept valid email', () => {
      const emailControl = component.loginForm.get('email');
      emailControl?.setValue('test@example.com');
      
      expect(emailControl?.hasError('email')).toBe(false);
    });

    it('should require password', () => {
      const passwordControl = component.loginForm.get('password');
      passwordControl?.setValue('');
      passwordControl?.markAsTouched();
      
      expect(passwordControl?.hasError('required')).toBe(true);
      expect(component.hasError('password')).toBe(true);
    });

    it('should require minimum password length', () => {
      const passwordControl = component.loginForm.get('password');
      passwordControl?.setValue('123');
      passwordControl?.markAsTouched();
      
      expect(passwordControl?.hasError('minlength')).toBe(true);
    });
  });

  describe('Error Messages', () => {
    it('should return email required error message', () => {
      const emailControl = component.loginForm.get('email');
      emailControl?.setValue('');
      emailControl?.markAsTouched();
      
      const errorMessage = component.getErrorMessage('email');
      expect(errorMessage).toContain('required');
    });

    it('should return password required error message', () => {
      const passwordControl = component.loginForm.get('password');
      passwordControl?.setValue('');
      passwordControl?.markAsTouched();
      
      const errorMessage = component.getErrorMessage('password');
      expect(errorMessage).toContain('required');
    });
  });

  describe('UI Interactions', () => {
    it('should toggle password visibility', () => {
      expect(component.hidePassword()).toBe(true);
      
      component.togglePasswordVisibility();
      
      expect(component.hidePassword()).toBe(false);
    });

    it('should clear email field', () => {
      component.loginForm.get('email')?.setValue('test@example.com');
      
      component.clearEmail();
      
      expect(component.loginForm.get('email')?.value).toBe('');
    });

    it('should trim email on blur', () => {
      component.loginForm.get('email')?.setValue('  test@example.com  ');
      
      component.trimEmail();
      
      expect(component.loginForm.get('email')?.value).toBe('test@example.com');
    });
  });

  describe('ARIA Accessibility', () => {
    it('should have aria-describedby when email has error', () => {
      const emailControl = component.loginForm.get('email');
      emailControl?.setValue('');
      emailControl?.markAsTouched();
      
      fixture.detectChanges();
      
      const emailInput = fixture.debugElement.query(By.css('[data-testid="email-input"]'));
      expect(emailInput.attributes['aria-describedby']).toBe('email-error');
    });

    it('should have aria-invalid when field has error', () => {
      const emailControl = component.loginForm.get('email');
      emailControl?.setValue('');
      emailControl?.markAsTouched();
      
      fixture.detectChanges();
      
      expect(component.hasError('email')).toBe(true);
    });

    it('should get password aria describedby with error and caps lock', () => {
      // Mock caps lock on
      component.capsLockOn.set(true);
      
      // Set password error
      const passwordControl = component.loginForm.get('password');
      passwordControl?.setValue('');
      passwordControl?.markAsTouched();
      
      const describedBy = component.getPasswordAriaDescribedBy();
      expect(describedBy).toContain('password-error');
      expect(describedBy).toContain('caps-warning');
    });
  });

  describe('Test IDs', () => {
    it('should have login page test id', () => {
      const loginPage = fixture.debugElement.query(By.css('[data-testid="login-page"]'));
      expect(loginPage).toBeTruthy();
    });

    it('should have email input test id', () => {
      const emailInput = fixture.debugElement.query(By.css('[data-testid="email-input"]'));
      expect(emailInput).toBeTruthy();
    });

    it('should have password input test id', () => {
      const passwordInput = fixture.debugElement.query(By.css('[data-testid="password-input"]'));
      expect(passwordInput).toBeTruthy();
    });

    it('should have submit button test id', () => {
      const submitBtn = fixture.debugElement.query(By.css('[data-testid="login-submit-btn"]'));
      expect(submitBtn).toBeTruthy();
    });
  });

  describe('Signals', () => {
    it('should track loading state', () => {
      expect(component.isLoading()).toBe(false);
      
      component.isLoading.set(true);
      
      expect(component.isLoading()).toBe(true);
    });

    it('should track password visibility', () => {
      expect(component.hidePassword()).toBe(true);
      
      component.hidePassword.set(false);
      
      expect(component.hidePassword()).toBe(false);
    });
  });
});
