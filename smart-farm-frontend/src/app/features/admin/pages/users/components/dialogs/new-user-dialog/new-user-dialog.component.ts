import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslatePipe } from '../../../../../../../core/pipes/translate.pipe';

export interface NewUserDialogData {
  blueprint?: {
    role?: string;
    status?: string;
  };
}

export interface NewUserDialogResult {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: string;
  status: string;
  city?: string;
  country?: string;
}

@Component({
  selector: 'app-new-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    TranslatePipe,
  ],
  templateUrl: './new-user-dialog.component.html',
  styleUrls: ['./new-user-dialog.component.scss'],
})
export class NewUserDialogComponent {
  userForm: FormGroup;

  roleOptions = [
    { value: 'admin', label: 'Admin' },
    { value: 'farmer', label: 'Farmer' },
    { value: 'moderator', label: 'Moderator' },
  ];

  statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'pending', label: 'Pending' },
  ];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<NewUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: NewUserDialogData,
  ) {
    // Use blueprint defaults if provided, otherwise use defaults
    const defaultRole = data?.blueprint?.role || 'farmer';
    const defaultStatus = data?.blueprint?.status || 'active';

    this.userForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      first_name: ['', [Validators.required]],
      last_name: ['', [Validators.required]],
      phone: [''],
      role: [defaultRole, [Validators.required]],
      status: [defaultStatus, [Validators.required]],
      city: [''],
      country: [''],
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      this.dialogRef.close(this.userForm.value as NewUserDialogResult);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.userForm.controls).forEach((key) => {
        this.userForm.get(key)?.markAsTouched();
      });
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
}

