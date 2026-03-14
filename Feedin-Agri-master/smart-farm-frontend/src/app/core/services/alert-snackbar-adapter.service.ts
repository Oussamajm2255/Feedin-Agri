import { Injectable } from '@angular/core';
import { AlertService } from './alert.service';
import { MatSnackBarConfig, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';
import { Observable, EMPTY } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AlertSnackBarAdapter {
  constructor(private alertService: AlertService) {}

  open(message: string, action?: string, config?: MatSnackBarConfig): MatSnackBarRef<TextOnlySnackBar> {
    const isError = message.toLowerCase().includes('fail') || 
                    message.toLowerCase().includes('error') || 
                    message.includes('❌') || 
                    config?.panelClass?.includes('error-snackbar') ||
                    config?.panelClass?.includes('error-toast');
    
    if (isError) {
      this.alertService.error('Error', message.replace(/❌ /g, ''), config?.duration || 4000);
    } else if (config?.panelClass?.includes('warning-snackbar')) {
      this.alertService.warning('Warning', message, config?.duration || 4000);
    } else if (config?.panelClass?.includes('info-snackbar')) {
      this.alertService.info('Info', message, config?.duration || 4000);
    } else {
      this.alertService.success('Success', message.replace(/✅ /g, ''), config?.duration || 4000);
    }
    
    // Return a dummy MatSnackBarRef to prevent errors in callers
    return {
      onAction: () => EMPTY,
      afterDismissed: () => EMPTY,
      dismiss: () => {}
    } as unknown as MatSnackBarRef<TextOnlySnackBar>;
  }

  // Implement other methods to fully satisfy MatSnackBar signature if needed
  dismiss(): void {
    // We could dismiss alerts, but AlertService doesn't have a direct clear method
    // besides clear() which clears all.
  }
  
  openFromComponent(component: any, config?: MatSnackBarConfig): any {
    this.alertService.info('Notice', 'Component alert shown', config?.duration || 4000);
    return { onAction: () => EMPTY, afterDismissed: () => EMPTY, dismiss: () => {} };
  }
  
  openFromTemplate(template: any, config?: MatSnackBarConfig): any {
    this.alertService.info('Notice', 'Template alert shown', config?.duration || 4000);
    return { onAction: () => EMPTY, afterDismissed: () => EMPTY, dismiss: () => {} };
  }
}
