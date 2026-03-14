import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';

@Component({
  selector: 'app-digital-twin-manage',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule
  ],
  template: `
    <h2 mat-dialog-title>Manage Digital Twins</h2>
    <mat-dialog-content>
      <div class="twins-container">
        
        <!-- List of existing twins -->
        <div class="twins-list">
          <h3>Existing Twins</h3>
          <div *ngIf="twins.length === 0" class="no-twins">No digital twins configured yet.</div>
          <div class="twin-item" *ngFor="let twin of twins" [class.selected]="selectedTwin?.id === twin.id" (click)="selectTwin(twin)">
            <span class="twin-name">{{ twin.name }}</span>
            <button mat-icon-button color="warn" (click)="deleteTwin(twin.id, $event)">
              <mat-icon>delete</mat-icon>
            </button>
          </div>
          <button mat-stroked-button color="primary" class="add-btn" (click)="startNewTwin()">
            <mat-icon>add</mat-icon> Create New Twin
          </button>
        </div>

        <!-- Form to add/edit a twin -->
        <div class="twin-form" *ngIf="showForm">
          <h3 *ngIf="!selectedTwin">Create New Digital Twin</h3>
          <h3 *ngIf="selectedTwin">Edit Digital Twin</h3>
          
          <form [formGroup]="twinForm" (ngSubmit)="saveTwin()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Name</mat-label>
              <input matInput formControlName="name" placeholder="e.g. Zone 1 Greenhouse">
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Description</mat-label>
              <textarea matInput formControlName="description" rows="2"></textarea>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Config (JSON)</mat-label>
              <textarea matInput formControlName="config" rows="5"></textarea>
              <mat-hint>Provide JSON with actuator positions. E.g. &#123;"fan": &#123;"x": 0.5, "y": 0.5, "w": 0.1, "h": 0.1&#125;&#125;</mat-hint>
            </mat-form-field>

            <div class="file-upload">
              <label>Background Image (Photo/Video)</label>
              <input type="file" (change)="onFileSelected($event)" accept="image/*,video/*">
              <small *ngIf="selectedTwin?.media_url">Current media: {{ selectedTwin?.media_url }}</small>
            </div>

            <div class="form-actions">
              <button mat-button type="button" (click)="cancelEdit()">Cancel</button>
              <button mat-raised-button color="primary" type="submit" [disabled]="twinForm.invalid || isLoading">
                {{ selectedTwin ? 'Update' : 'Create' }}
              </button>
            </div>
          </form>
        </div>

      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .twins-container {
      display: flex;
      gap: 20px;
      min-width: 600px;
      max-width: 900px;
    }
    .twins-list {
      flex: 1;
      border-right: 1px solid #ccc;
      padding-right: 20px;
    }
    .twin-form {
      flex: 2;
    }
    .twin-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px;
      border: 1px solid #eee;
      border-radius: 4px;
      margin-bottom: 8px;
      cursor: pointer;
    }
    .twin-item:hover {
      background-color: #f5f5f5;
    }
    .twin-item.selected {
      border-color: #3f51b5;
      background-color: #e8eaf6;
    }
    .full-width {
      width: 100%;
      margin-bottom: 15px;
    }
    .add-btn {
      width: 100%;
      margin-top: 10px;
    }
    .file-upload {
      margin-bottom: 20px;
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
  `]
})
export class DigitalTwinManageDialogComponent implements OnInit {
  twins: any[] = [];
  selectedTwin: any = null;
  showForm = false;
  twinForm: FormGroup;
  selectedFile: File | null = null;
  isLoading = false;

  constructor(
    public dialogRef: MatDialogRef<DigitalTwinManageDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { farmId: string },
    private apiService: ApiService,
    private fb: FormBuilder
  ) {
    this.twinForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      config: ['{}']
    });
  }

  ngOnInit() {
    this.loadTwins();
  }

  loadTwins() {
    this.apiService.getDigitalTwins(this.data.farmId).subscribe({
      next: (res) => {
        this.twins = res;
      },
      error: (err) => console.error('Failed to load twins', err)
    });
  }

  startNewTwin() {
    this.selectedTwin = null;
    this.showForm = true;
    this.twinForm.reset({ config: '{}' });
    this.selectedFile = null;
  }

  selectTwin(twin: any) {
    this.selectedTwin = twin;
    this.showForm = true;
    this.twinForm.patchValue({
      name: twin.name,
      description: twin.description,
      config: typeof twin.config === 'object' ? JSON.stringify(twin.config, null, 2) : twin.config
    });
    this.selectedFile = null;
  }

  cancelEdit() {
    this.showForm = false;
    this.selectedTwin = null;
  }

  onFileSelected(event: any) {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  saveTwin() {
    if (this.twinForm.invalid) return;
    this.isLoading = true;
    
    const formVal = this.twinForm.value;
    let parsedConfig = {};
    try {
      parsedConfig = JSON.parse(formVal.config);
    } catch {
      alert('Invalid JSON in config');
      this.isLoading = false;
      return;
    }

    const twinData = {
      farm_id: this.data.farmId,
      name: formVal.name,
      description: formVal.description,
      config: parsedConfig
    };

    if (this.selectedTwin) {
      this.apiService.updateDigitalTwin(this.selectedTwin.id, twinData).subscribe({
        next: (res) => {
          this.handleFileUpload(this.selectedTwin.id);
        },
        error: () => this.isLoading = false
      });
    } else {
      this.apiService.createDigitalTwin(twinData).subscribe({
        next: (res) => {
          this.handleFileUpload(res.id);
        },
        error: () => this.isLoading = false
      });
    }
  }

  handleFileUpload(twinId: string) {
    if (!this.selectedFile) {
      this.loadTwins();
      this.cancelEdit();
      this.isLoading = false;
      return;
    }

    this.apiService.uploadDigitalTwinMedia(twinId, this.selectedFile).subscribe({
      next: () => {
        this.loadTwins();
        this.cancelEdit();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('File upload failed', err);
        this.isLoading = false;
        this.loadTwins();
        this.cancelEdit();
      }
    });
  }

  deleteTwin(id: string, event: Event) {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this Digital Twin?')) {
      this.apiService.deleteDigitalTwin(id).subscribe({
        next: () => {
          if (this.selectedTwin?.id === id) this.cancelEdit();
          this.loadTwins();
        }
      });
    }
  }
}
