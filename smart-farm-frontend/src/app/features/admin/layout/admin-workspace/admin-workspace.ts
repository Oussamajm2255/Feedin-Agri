import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Admin Workspace Component
 * Scrollable main content area that hosts routed components
 */
@Component({
  selector: 'app-admin-workspace',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-workspace.html',
  styleUrl: './admin-workspace.scss'
})
export class AdminWorkspace {}
