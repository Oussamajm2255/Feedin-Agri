import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../../../../../../../core/pipes/translate.pipe';

export interface ConfirmImpersonateDialogData {
  userName: string;
  userEmail: string;
}

@Component({
  selector: 'app-confirm-impersonate-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    TranslatePipe,
  ],
  templateUrl: './confirm-impersonate-dialog.component.html',
  styleUrls: ['./confirm-impersonate-dialog.component.scss'],
})
export class ConfirmImpersonateDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmImpersonateDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmImpersonateDialogData,
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
