import { Component, input, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';

import { LanguageService } from '../../../core/services/language.service';

/**
 * 📚 Contextual Help Component
 * 
 * Provides inline help icons with rich tooltips to explain metrics and features.
 * Helps farmers understand what each metric means and what action to take.
 * 
 * Usage:
 * <app-contextual-help 
 *   topic="moisture" 
 *   [showLabel]="true">
 * </app-contextual-help>
 */

// Help topics with explanations
export interface HelpTopic {
  icon: string;
  title: string;
  description: string;
  actionHint: string;
  optimalRange?: string;
}

const HELP_TOPICS: Record<string, HelpTopic> = {
  moisture: {
    icon: 'water_drop',
    title: 'Soil Moisture',
    description: 'Soil moisture measures how much water is in the soil around your crop roots. Too little causes wilting, too much causes root rot.',
    actionHint: 'Irrigate when moisture drops below 30%. Stop watering when above 70%.',
    optimalRange: '40-70%'
  },
  temperature: {
    icon: 'thermostat',
    title: 'Air Temperature',
    description: 'Temperature affects plant growth rate, flowering, and fruit development. Each crop has an ideal temperature range.',
    actionHint: 'Protect crops from frost (below 5°C) and heat stress (above 35°C).',
    optimalRange: '15-30°C'
  },
  humidity: {
    icon: 'cloud',
    title: 'Air Humidity',
    description: 'Humidity is the amount of moisture in the air. High humidity promotes fungal diseases, low humidity increases water stress.',
    actionHint: 'Improve ventilation if humidity exceeds 80%. Mist plants if below 40%.',
    optimalRange: '50-75%'
  },
  growthStage: {
    icon: 'spa',
    title: 'Growth Stage',
    description: 'Tracks your crop\'s progress from planting to harvest. Different stages have different water and nutrient needs.',
    actionHint: 'Check growth tips for the current stage to optimize care.',
    optimalRange: undefined
  },
  healthStatus: {
    icon: 'favorite',
    title: 'Health Status',
    description: 'Overall crop health based on sensor readings. Green = healthy, Yellow = needs attention, Red = critical.',
    actionHint: 'Address any alerts immediately to prevent crop loss.',
    optimalRange: undefined
  },
  daysSincePlanting: {
    icon: 'calendar_today',
    title: 'Days Since Planting',
    description: 'Number of days since your crop was planted. Used to estimate growth stage and expected harvest date.',
    actionHint: 'Compare with expected growth timeline to spot delays.',
    optimalRange: undefined
  },
  recommendations: {
    icon: 'lightbulb',
    title: 'Smart Recommendations',
    description: 'AI-powered suggestions based on your sensor data, weather, and crop stage. Each recommendation includes an action you can take immediately.',
    actionHint: 'Review critical recommendations first - they require immediate attention!',
    optimalRange: undefined
  },
  sensors: {
    icon: 'sensors',
    title: 'Connected Sensors',
    description: 'IoT sensors monitoring your crop. Each sensor sends data like temperature, humidity, and soil moisture to the dashboard.',
    actionHint: 'More sensors = better monitoring. Consider adding sensors for better coverage.',
    optimalRange: undefined
  },
  devices: {
    icon: 'devices_other',
    title: 'Smart Devices',
    description: 'Controllable devices like irrigation pumps, ventilators, and heaters. You can turn them on/off manually or let automation handle it.',
    actionHint: 'Use Auto mode for hands-off operation. Manual mode for precise control.',
    optimalRange: undefined
  },
  irrigation: {
    icon: 'water',
    title: 'Irrigation',
    description: 'Watering system for your crops. Proper irrigation prevents both drought stress and overwatering.',
    actionHint: 'Water early morning or late evening to reduce evaporation.',
    optimalRange: undefined
  }
};

@Component({
  selector: 'app-contextual-help',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatTooltipModule,
    MatButtonModule
  ],
  template: `
    <button 
      mat-icon-button 
      class="help-button"
      [class.compact]="!showLabel()"
      [matTooltip]="getTooltipContent()"
      [matTooltipClass]="'help-tooltip'"
      matTooltipPosition="above"
      [attr.aria-label]="'Help: ' + getTopic().title">
      <mat-icon class="help-icon" [class.small]="!showLabel()">{{ getTopic().icon }}</mat-icon>
      <mat-icon class="help-indicator">help_outline</mat-icon>
    </button>
  `,
  styles: [`
    .help-button {
      position: relative;
      width: 32px;
      height: 32px;
      margin-left: 4px;
      opacity: 0.7;
      transition: all 0.2s ease;

      &:hover {
        opacity: 1;
        background: rgba(16, 185, 129, 0.1);
      }

      &.compact {
        width: 24px;
        height: 24px;
      }
    }

    .help-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: var(--primary-green, #10b981);

      &.small {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }

    .help-indicator {
      position: absolute;
      top: 0;
      right: 0;
      font-size: 10px;
      width: 10px;
      height: 10px;
      color: var(--primary-green, #10b981);
      opacity: 0.8;
    }

    /* Global tooltip styles */
    :host ::ng-deep .help-tooltip {
      max-width: 320px;
      padding: 12px 16px;
      font-size: 13px;
      line-height: 1.5;
      background: var(--card-bg, #1e293b);
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);

      .mdc-tooltip__surface {
        background: var(--card-bg, #1e293b);
        color: var(--text-primary, #f1f5f9);
      }
    }

    /* Dark mode */
    :host-context(body.dark-theme) {
      .help-button:hover {
        background: rgba(16, 185, 129, 0.15);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContextualHelpComponent {
  private languageService = inject(LanguageService);

  // Inputs
  topic = input.required<keyof typeof HELP_TOPICS>();
  showLabel = input<boolean>(false);

  /**
   * Get the help topic configuration
   */
  getTopic(): HelpTopic {
    return HELP_TOPICS[this.topic()] || HELP_TOPICS['healthStatus'];
  }

  /**
   * Build the tooltip content
   */
  getTooltipContent(): string {
    const topic = this.getTopic();
    let content = `${topic.title}\n\n${topic.description}`;
    
    if (topic.optimalRange) {
      content += `\n\n📊 Optimal Range: ${topic.optimalRange}`;
    }
    
    content += `\n\n💡 ${topic.actionHint}`;
    
    return content;
  }
}
