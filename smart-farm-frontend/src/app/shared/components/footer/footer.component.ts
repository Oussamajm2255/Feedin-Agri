import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { BreakpointService } from '../../../core/services/breakpoint.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, MatToolbarModule, MatIconModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  // Inject BreakpointService for responsive behavior
  public breakpointService = inject(BreakpointService);
  
  currentYear = new Date().getFullYear();
}
