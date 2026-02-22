import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject, DestroyRef, HostListener, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, of } from 'rxjs';
import { trigger, transition, style, animate, state } from '@angular/animations';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';

// Services
import { AdminApiService } from '../../../../../../admin/core/services/admin-api.service';
import { ApiService } from '../../../../../../core/services/api.service';
import { LanguageService } from '../../../../../../core/services/language.service';

// Pipes
import { TranslatePipe } from '../../../../../../core/pipes/translate.pipe';

// Models
import { User, UserRole, UserStatus } from '../../../../../../core/models/user.model';
import { Farm } from '../../../../../../core/models/farm.model';

export type DrawerMode = 'view' | 'edit' | 'create';

export interface DrawerCloseEvent {
  action: 'closed' | 'saved' | 'created';
  user?: User;
}

@Component({
  selector: 'app-user-drawer',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule,
    MatChipsModule,
    MatTabsModule,
    TranslatePipe,
  ],
  templateUrl: './user-drawer.component.html',
  styleUrls: ['./user-drawer.component.scss'],
  animations: [
    trigger('slideIn', [
      state('closed', style({ transform: 'translateX(100%)' })),
      state('open', style({ transform: 'translateX(0)' })),
      transition('closed <=> open', animate('350ms cubic-bezier(0.4, 0, 0.2, 1)')),
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 }))
      ])
    ]),
    trigger('slideUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class UserDrawerComponent implements OnInit, OnChanges {
  // Inputs
  @Input() isOpen = false;
  @Input() mode: DrawerMode = 'view';
  @Input() userId: string | null = null;

  // Outputs
  @Output() closed = new EventEmitter<DrawerCloseEvent>();
  @Output() modeChanged = new EventEmitter<DrawerMode>();

  // Services
  private adminApiService = inject(AdminApiService);
  private apiService = inject(ApiService);
  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);
  public languageService = inject(LanguageService);

  // State
  loading = signal<boolean>(false);
  saving = signal<boolean>(false);
  user = signal<User | null>(null);
  userFarms = signal<Farm[]>([]);
  loadingFarms = signal<boolean>(false);
  activeTab = signal<number>(0);
  hasScrolledToBottom = signal<boolean>(false);

  // Form
  userForm!: FormGroup;
  originalFormValue: any = null;

  // Options
  roleOptions = [
    { value: 'admin', label: 'Admin', icon: 'admin_panel_settings' },
    { value: 'farmer', label: 'Farmer', icon: 'agriculture' },
    { value: 'moderator', label: 'Moderator', icon: 'supervisor_account' },
  ];

  statusOptions = [
    { value: 'active', label: 'Active', color: 'success' },
    { value: 'inactive', label: 'Inactive', color: 'warn' },
    { value: 'suspended', label: 'Suspended', color: 'error' },
    { value: 'pending', label: 'Pending', color: 'default' },
  ];

  // Computed
  drawerTitle = computed(() => {
    switch (this.mode) {
      case 'create': return 'admin.users.drawer.createTitle';
      case 'edit': return 'admin.users.drawer.editTitle';
      case 'view': return 'admin.users.drawer.viewTitle';
      default: return 'admin.users.drawer.viewTitle';
    }
  });

  drawerIcon = computed(() => {
    switch (this.mode) {
      case 'create': return 'person_add';
      case 'edit': return 'edit';
      case 'view': return 'person';
      default: return 'person';
    }
  });

  hasChanges = computed(() => {
    if (this.mode === 'create') {
      return this.userForm?.valid && this.userForm?.dirty;
    }
    if (this.mode === 'edit' && this.originalFormValue) {
      const current = this.userForm?.value;
      return JSON.stringify(current) !== JSON.stringify(this.originalFormValue);
    }
    return false;
  });

  // Keyboard handler for ESC
  @HostListener('document:keydown.escape')
  onEscapePress(): void {
    if (this.isOpen) {
      this.closeDrawer();
    }
  }

  ngOnInit(): void {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      if (this.mode === 'view' || this.mode === 'edit') {
        if (this.userId) {
          this.loadUser(this.userId);
        }
      } else if (this.mode === 'create') {
        this.resetForm();
      }
    }

    if (changes['mode'] && !changes['mode'].firstChange) {
      if (this.mode === 'edit' && this.user()) {
        this.populateForm(this.user()!);
      } else if (this.mode === 'create') {
        this.resetForm();
      }
    }

    if (changes['userId'] && this.userId && this.isOpen) {
      this.loadUser(this.userId);
    }
  }

  private initForm(): void {
    this.userForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', this.mode === 'create' ? [Validators.required, Validators.minLength(8)] : []],
      first_name: ['', [Validators.required]],
      last_name: ['', [Validators.required]],
      phone: [''],
      role: ['farmer', [Validators.required]],
      status: ['active', [Validators.required]],
      city: [''],
      country: [''],
    });
  }

  private resetForm(): void {
    this.userForm.reset({
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      phone: '',
      role: 'farmer',
      status: 'active',
      city: '',
      country: '',
    });
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.user.set(null);
    this.userFarms.set([]);
    this.originalFormValue = null;
    this.activeTab.set(0);
    this.hasScrolledToBottom.set(false);
  }

  private populateForm(user: User): void {
    this.userForm.patchValue({
      email: user.email || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone: user.phone || '',
      role: user.role || 'farmer',
      status: user.status || 'active',
      city: user.city || '',
      country: user.country || '',
    });
    // Clear password validators for edit mode
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
    this.originalFormValue = { ...this.userForm.value };
  }

  loadUser(userId: string): void {
    this.loading.set(true);

    this.adminApiService
      .getUser(userId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((error) => {
          console.error('Error loading user:', error);
          return of(null);
        }),
        finalize(() => this.loading.set(false))
      )
      .subscribe((user: User | null) => {
        if (user) {
          this.user.set(user);
          if (this.mode === 'edit') {
            this.populateForm(user);
          }
          // Load farms for the user
          this.loadUserFarms(userId);
        }
      });
  }

  loadUserFarms(userId: string): void {
    this.loadingFarms.set(true);

    this.apiService
      .getUserFarms(userId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => of([])),
        finalize(() => this.loadingFarms.set(false))
      )
      .subscribe((farms: Farm[]) => {
        this.userFarms.set(farms);
      });
  }

  onTabChange(index: number): void {
    this.activeTab.set(index);
  }

  switchToEditMode(): void {
    if (this.user()) {
      this.mode = 'edit';
      this.populateForm(this.user()!);
      this.modeChanged.emit('edit');
    }
  }

  switchToViewMode(): void {
    this.mode = 'view';
    this.modeChanged.emit('view');
  }

  closeDrawer(): void {
    this.closed.emit({ action: 'closed' });
  }

  onSave(): void {
    if (!this.userForm.valid) {
      Object.keys(this.userForm.controls).forEach((key) => {
        this.userForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.saving.set(true);

    if (this.mode === 'create') {
      this.createUser();
    } else if (this.mode === 'edit') {
      this.updateUser();
    }
  }

  private createUser(): void {
    const formValue = this.userForm.value;

    // Clean the data
    const userData = {
      email: formValue.email,
      password: formValue.password,
      first_name: formValue.first_name,
      last_name: formValue.last_name,
      role: formValue.role,
      status: formValue.status,
      ...(formValue.phone?.trim() ? { phone: formValue.phone.trim() } : {}),
      ...(formValue.city?.trim() ? { city: formValue.city.trim() } : {}),
      ...(formValue.country?.trim() ? { country: formValue.country.trim() } : {}),
    };

    this.adminApiService
      .createUser(userData)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((error) => {
          console.error('Error creating user:', error);
          return of(null);
        }),
        finalize(() => this.saving.set(false))
      )
      .subscribe((user: User | null) => {
        if (user) {
          this.closed.emit({ action: 'created', user });
        }
      });
  }

  private updateUser(): void {
    if (!this.userId || !this.originalFormValue) return;

    const formValue = this.userForm.value;
    const changedFields: Partial<User> = {};

    // Only include changed fields (diff-based)
    Object.keys(formValue).forEach((key) => {
      if (key !== 'password' && formValue[key] !== this.originalFormValue[key]) {
        (changedFields as any)[key] = formValue[key];
      }
    });

    // Include password only if provided
    if (formValue.password?.trim()) {
      (changedFields as any).password = formValue.password;
    }

    if (Object.keys(changedFields).length === 0) {
      this.saving.set(false);
      this.switchToViewMode();
      return;
    }

    this.adminApiService
      .patchUser(this.userId, changedFields)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((error) => {
          console.error('Error updating user:', error);
          return of(null);
        }),
        finalize(() => this.saving.set(false))
      )
      .subscribe((user: User | null) => {
        if (user) {
          this.user.set(user);
          this.closed.emit({ action: 'saved', user });
        }
      });
  }

  // Helpers
  getRoleIcon(role: string): string {
    const roleOption = this.roleOptions.find((r) => r.value === role);
    return roleOption?.icon || 'person';
  }

  getRoleLabel(role: string): string {
    const roleOption = this.roleOptions.find((r) => r.value === role);
    return roleOption?.label || role;
  }

  formatDate(date: Date | string | null | undefined): string {
    if (!date) return '—';
    try {
      return new Date(date).toLocaleDateString(this.languageService.getCurrentLanguageCode() || 'en', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '—';
    }
  }

  formatDateTime(date: Date | string | null | undefined): string {
    if (!date) return '—';
    try {
      return new Date(date).toLocaleString(this.languageService.getCurrentLanguageCode() || 'en', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '—';
    }
  }

  getErrorMessage(fieldName: string): string {
    const control = this.userForm.get(fieldName);
    if (control?.hasError('required')) {
      return `${fieldName} is required`;
    }
    if (control?.hasError('email')) {
      return 'Invalid email format';
    }
    if (control?.hasError('minlength')) {
      return 'Password must be at least 8 characters';
    }
    return '';
  }

  // Track skeleton rows
  get skeletonFields(): number[] {
    return [1, 2, 3, 4, 5, 6];
  }

  // Scroll detection for action buttons visibility
  onBodyScroll(event: Event): void {
    const element = event.target as HTMLElement;
    if (!element) return;

    // Calculate if user has scrolled near the bottom (within 50px threshold)
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;
    const threshold = 50; // pixels from bottom

    const isNearBottom = scrollTop + clientHeight >= scrollHeight - threshold;
    
    if (isNearBottom && !this.hasScrolledToBottom()) {
      this.hasScrolledToBottom.set(true);
    }
  }
}
