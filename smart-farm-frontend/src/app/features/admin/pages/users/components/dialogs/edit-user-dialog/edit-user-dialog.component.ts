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
import { User } from '../../../../../../../core/models/user.model';

export interface EditUserDialogData {
  user: User;
}

export interface EditUserDialogResult {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: string;
  status?: string;
  city?: string;
  country?: string;
}

@Component({
  selector: 'app-edit-user-dialog',
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
  templateUrl: './edit-user-dialog.component.html',
  styleUrls: ['./edit-user-dialog.component.scss'],
})
export class EditUserDialogComponent {
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
    public dialogRef: MatDialogRef<EditUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditUserDialogData,
  ) {
    const user = data.user;
    this.userForm = this.fb.group({
      email: [user.email || '', [Validators.required, Validators.email]],
      first_name: [user.first_name || '', [Validators.required]],
      last_name: [user.last_name || '', [Validators.required]],
      phone: [user.phone || ''],
      role: [user.role || 'farmer', [Validators.required]],
      status: [user.status || 'active', [Validators.required]],
      city: [user.city || ''],
      country: [user.country || ''],
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      this.dialogRef.close(this.userForm.value as EditUserDialogResult);
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
    return '';
  }
}

