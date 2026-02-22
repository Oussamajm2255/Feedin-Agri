import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, catchError, of, map, firstValueFrom, timeout, TimeoutError } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

import { User, LoginRequest, RegisterRequest, AuthResponse, UserStatus } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.apiUrl;
  // No localStorage for token; rely on httpOnly cookie set by the backend

  private userSubject = new BehaviorSubject<User | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);
  private initPromise: Promise<void> | null = null;
  private initialized = false;

  // Signals for reactive programming
  public user = signal<User | null>(null);
  public token = signal<string | null>(null);
  public isAuthenticated = computed(() => !!this.token());

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Don't initialize immediately - wait for Angular to be ready
  }

  // Initialize auth when called (from app component)
  async initAuth(): Promise<void> {
    if (this.initialized) return;

    // If initialization is already in progress, wait for it
    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    this.initPromise = this.initializeAuth();
    try {
      await this.initPromise;
    } finally {
      this.initialized = true;
    }
  }

  private async initializeAuth(): Promise<void> {
    try {
      // Prime CSRF token first - timeout after 2s
      // This is non-critical, continue even if it fails
      try {
        await firstValueFrom(
          this.http.get<{ csrfToken: string }>(`${this.API_URL}/auth/csrf`, { withCredentials: true })
            .pipe(timeout(2000))
        );
      } catch (csrfError) {
        console.warn('CSRF priming failed, continuing...', csrfError);
      }

      // Always try to fetch current user to check if there's an active session
      // Don't rely on router.url as it's not updated during guard execution
      try {
        const user = await firstValueFrom(
          this.http.get<User>(`${this.API_URL}/auth/me`, { withCredentials: true })
            .pipe(timeout(2000))
        );
        this.setAuthData(user);
      } catch (authError: any) {
        // 401 is expected when no session exists - silently handle it
        if (authError?.status === 401) {
          // No valid session, clear auth state without navigating
          this.clearAuthState(false);
        } else if (authError instanceof TimeoutError || authError?.status === 0 || authError?.status === 504) {
          console.warn('⚠️ Backend unreachable or timed out. Continuing without auth.');
          this.clearAuthState(false);
        } else {
          console.error('Auth initialization error:', authError);
          this.clearAuthState(false);
        }
      }
    } catch (error: any) {
      // Catch-all for any unexpected errors
      console.error('Unexpected auth initialization error:', error);
      this.clearAuthState(false);
    }
  }

  // Method for guards to wait for initialization
  // Includes a master timeout to prevent infinite hangs
  async waitForInit(): Promise<boolean> {
    if (!this.initialized) {
      // Add a master timeout to prevent infinite hangs
      const initPromise = this.initAuth();
      const timeoutPromise = new Promise<void>((_, reject) => 
        setTimeout(() => reject(new Error('Auth init timeout')), 5000)
      );
      
      try {
        await Promise.race([initPromise, timeoutPromise]);
      } catch (error) {
        console.warn('Auth initialization timeout or error, continuing without auth:', error);
        this.initialized = true;
        this.clearAuthState(false);
      }
    }
    return this.isAuthenticated();
  }

  login(credentials: LoginRequest): Observable<User> {
    return this.http.post<{ user: User }>(`${this.API_URL}/auth/login`, credentials, { withCredentials: true })
      .pipe(
        tap(response => {
          if (response?.user) {
            this.setAuthData(response.user);

            // PENDING users → redirect to onboarding status page
            if (response.user.status === UserStatus.PENDING) {
              this.router.navigate(['/onboarding/pending']);
            } else {
              // Active users → redirect based on role
              const redirectPath = response.user.role === 'admin' ? '/admin' : '/dashboard';
              this.router.navigate([redirectPath]);
            }
          }
        }),
        catchError(error => {
          console.error('Login error:', error);
          throw error;
        }),
        map(response => response.user)
      );
  }

  register(userData: RegisterRequest): Observable<User> {
    // Force status to PENDING for approval-based onboarding
    const registrationData = { ...userData, status: UserStatus.PENDING };

    return this.http.post<{ user: User }>(`${this.API_URL}/users/register`, registrationData, { withCredentials: true })
      .pipe(
        tap(response => {
          if (response?.user) {
            this.setAuthData(response.user);
            // Always redirect to onboarding pending page after registration
            this.router.navigate(['/onboarding/pending']);
          }
        }),
        catchError(error => {
          console.error('Registration error:', error);
          throw error;
        }),
        map(response => response.user)
      );
  }

  logout(navigate: boolean = true): void {
    // Try to clear server cookie, but don't fail if CSRF is missing
    this.http.post(`${this.API_URL}/auth/logout`, {}, { withCredentials: true }).subscribe({
      complete: () => {},
      error: () => {
        // Ignore logout errors (e.g., no valid session)
        console.log('Logout request failed, but clearing local state anyway');
      }
    });

    this.clearAuthState(navigate);
  }

  private clearAuthState(navigate: boolean = true): void {
    this.user.set(null);
    this.token.set(null);
    this.userSubject.next(null);
    this.tokenSubject.next(null);
    if (navigate) this.router.navigate(['/login']);
  }

  private setAuthData(user: User): void {
    this.user.set(user);
    this.token.set('cookie');
    this.userSubject.next(user);
    this.tokenSubject.next('cookie');
  }

  getCurrentUser(): User | null {
    return this.user();
  }

  getToken(): string | null { return null; }

  isTokenValid(): boolean { return !!this.token(); }

  refreshToken(): Observable<any> {
    // Implement token refresh logic if needed
    return of(null);
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.role) : false;
  }

  /**
   * Check if email exists in the system
   * Used for async form validation
   */
  checkEmailExists(email: string): Observable<boolean> {
    return this.http.get<{ exists: boolean }>(`${this.API_URL}/auth/check-email?email=${encodeURIComponent(email)}`, { withCredentials: true })
      .pipe(
        map(response => response.exists),
        catchError(() => of(true)) // On error, assume email exists to allow form submission
      );
  }
}
