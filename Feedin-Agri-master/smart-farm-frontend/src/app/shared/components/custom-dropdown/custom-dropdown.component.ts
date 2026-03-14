import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

export interface DropdownItem {
  id: string;
  label: string;
  subtitle?: string;
  icon?: string;
  image?: string;
  flag?: string;
  badge?: string;
  disabled?: boolean;
  divider?: boolean;
  action?: () => void;
  routerLink?: string;
}

@Component({
  selector: 'app-custom-dropdown',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatDividerModule],
  template: `
    <div class="dropdown-container" #dropdownContainer>
      <button 
        class="dropdown-trigger"
        [class.active]="isOpen()"
        [style.border]="getTriggerBorder()"
        (click)="toggleDropdown()"
        [attr.aria-expanded]="isOpen()"
        [attr.aria-haspopup]="true">
        
        <ng-content select="[slot=trigger]"></ng-content>
      </button>

      <div 
        class="dropdown-menu"
        [class.open]="isOpen()"
        [class.above]="positionAbove()"
        [style.background]="getMenuBackground()"
        [style.border]="getMenuBorder()"
        [style.box-shadow]="getMenuShadow()"
        [style.top]="menuPosition().top"
        [style.bottom]="menuPosition().bottom"
        [style.left]="menuPosition().left"
        [style.right]="menuPosition().right"
        [style.transform]="menuPosition().transform"
        *ngIf="isOpen()">
        
        <div class="menu-content">
          <!-- Header Section -->
          <div class="menu-header" *ngIf="title || subtitle">
            <div class="header-content">
              <div class="header-icon" *ngIf="headerIcon">
                <mat-icon>{{ headerIcon }}</mat-icon>
              </div>
              <div class="header-text">
                <div class="header-title" [style.color]="getPrimaryTextColor()">{{ title }}</div>
                <div class="header-subtitle" [style.color]="getSecondaryTextColor()" *ngIf="subtitle">{{ subtitle }}</div>
              </div>
            </div>
          </div>

          <mat-divider *ngIf="title || subtitle" [style.border-color]="getDividerColor()"></mat-divider>

          <!-- Items Section -->
          <div class="menu-items">
            <div 
              class="menu-section" 
              *ngFor="let section of groupedItems">
              
              <div class="section-title" [style.color]="getSecondaryTextColor()" *ngIf="section.title">
                {{ section.title }}
              </div>

              <button
                class="menu-item"
                *ngFor="let item of section.items"
                [class.disabled]="item.disabled"
                [class.selected]="item.id === selectedItemId"
                [style.color]="getItemTextColor(item)"
                (click)="selectItem(item)"
                [disabled]="item.disabled">
                
                <div class="item-content">
                  <div class="item-icon" *ngIf="item.icon || item.image || item.flag">
                    <mat-icon *ngIf="item.icon">{{ item.icon }}</mat-icon>
                    <img *ngIf="item.image" [src]="item.image" [alt]="item.label" class="item-image" />
                    <img *ngIf="item.flag" [src]="item.flag" [alt]="item.label + ' flag'" class="item-flag" />
                  </div>
                  
                  <div class="item-text">
                    <div class="item-label" [style.color]="getItemTextColor(item)">{{ item.label }}</div>
                    <div class="item-subtitle" [style.color]="getSecondaryTextColor()" *ngIf="item.subtitle">{{ item.subtitle }}</div>
                  </div>
                  
                  <div class="item-badge" *ngIf="item.badge" [style.background]="getBadgeBackground()" [style.color]="getBadgeTextColor()">
                    {{ item.badge }}
                  </div>
                  
                  <div class="item-check" *ngIf="item.id === selectedItemId">
                    <mat-icon class="check-icon">check</mat-icon>
                  </div>
                  
                  <div class="item-arrow" *ngIf="item.routerLink && item.id !== selectedItemId">
                    <mat-icon [style.color]="getSecondaryTextColor()">chevron_right</mat-icon>
                  </div>
                </div>
              </button>

              <mat-divider *ngIf="!section.isLast" [style.border-color]="getDividerColor()"></mat-divider>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dropdown-container {
      position: relative;
      display: inline-block;
    }

    .dropdown-trigger {
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border-radius: 12px;
      padding: 0;
      margin: 0;
    }

    .dropdown-trigger:hover {
      transform: translateY(-1px);
    }

    .dropdown-trigger.active {
      transform: translateY(-1px);
    }

    .dropdown-menu {
      position: absolute;
      margin-top: 8px;
      min-width: 320px;
      max-width: 400px;
      border-radius: 16px;
      z-index: 9999 !important;
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      pointer-events: none;
      overflow: hidden;
      box-sizing: border-box;
    }

    /* Ensure dropdown respects viewport on all screens */
    @media (max-width: 768px) {
      .dropdown-menu {
        max-width: calc(100vw - 24px);
        min-width: min(280px, calc(100vw - 24px));
      }
    }

    @media (max-width: 480px) {
      .dropdown-menu {
        max-width: calc(100vw - 16px);
        min-width: min(260px, calc(100vw - 16px));
        border-radius: 12px;
      }
    }

    /* When positioned above */
    .dropdown-menu.above {
      margin-top: 0;
      margin-bottom: 8px;
    }

    .dropdown-menu.open {
      opacity: 1;
      pointer-events: all;
      /* Transform is set via inline styles in updatePosition() */
      /* The inline style will override any default transform */
    }

    /* Ensure smooth transition when opening */
    .dropdown-menu.open[style*="transform"] {
      /* Inline transform takes precedence */
    }

    .menu-content {
      padding: 8px;
    }

    .menu-header {
      padding: 16px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      margin-bottom: 8px;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    /* RTL: reverse header content direction */
    :host-context([dir="rtl"]) .header-content,
    :host-context(.rtl) .header-content,
    [dir="rtl"] .header-content {
      flex-direction: row-reverse;
    }

    .header-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.05);
    }

    .header-icon mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .header-text {
      flex: 1;
      text-align: left;
    }

    /* RTL: align header text to right */
    :host-context([dir="rtl"]) .header-text,
    :host-context(.rtl) .header-text,
    [dir="rtl"] .header-text {
      text-align: right;
    }

    .header-title {
      font-weight: 600;
      font-size: 16px;
      line-height: 1.2;
    }

    .header-subtitle {
      font-size: 13px;
      margin-top: 2px;
      opacity: 0.8;
    }

    .menu-items {
      padding: 8px 0;
    }

    .menu-section {
      margin-bottom: 8px;
    }

    .section-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 8px 16px 4px;
      margin-bottom: 4px;
      text-align: left;
    }

    /* RTL: align section title to right */
    :host-context([dir="rtl"]) .section-title,
    :host-context(.rtl) .section-title,
    [dir="rtl"] .section-title {
      text-align: right;
    }

    .menu-item {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 12px 16px;
      border: none;
      background: transparent;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      margin: 2px 0;
      position: relative;
      overflow: hidden;
    }

    .menu-item::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: var(--nav-item-hover, rgba(0, 0, 0, 0.05));
      opacity: 0;
      transition: opacity 0.3s ease;
      border-radius: 12px;
    }

    .menu-item:hover::before {
      opacity: 1;
    }

    .menu-item:hover {
      transform: translateX(4px);
    }

    /* RTL: hover slides left instead of right */
    :host-context([dir="rtl"]) .menu-item:hover,
    :host-context(.rtl) .menu-item:hover,
    [dir="rtl"] .menu-item:hover {
      transform: translateX(-4px);
    }

    .menu-item.selected {
      background: var(--nav-item-active, rgba(16, 185, 129, 0.15));
      border: 1px solid var(--primary-green, rgba(16, 185, 129, 0.3));
    }

    .menu-item.selected .item-label {
      color: #10b981 !important;
      font-weight: 600;
    }

    .menu-item.selected::before {
      opacity: 0;
    }

    .menu-item.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .menu-item.disabled:hover {
      transform: none;
    }

    .item-content {
      display: flex;
      align-items: center;
      width: 100%;
      position: relative;
      z-index: 1;
    }

    /* RTL: reverse flex direction for item content */
    :host-context([dir="rtl"]) .item-content,
    :host-context(.rtl) .item-content,
    [dir="rtl"] .item-content {
      flex-direction: row-reverse;
    }

    .item-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      margin-right: 12px;
      flex-shrink: 0;
    }

    /* RTL: swap margin direction for item-icon */
    :host-context([dir="rtl"]) .item-icon,
    :host-context(.rtl) .item-icon,
    [dir="rtl"] .item-icon {
      margin-right: 0;
      margin-left: 12px;
    }

    .item-icon mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .item-image, .item-flag {
      width: 24px;
      height: 24px;
      object-fit: cover;
      border-radius: 4px;
    }

    .item-flag {
      border-radius: 2px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    }

    .item-text {
      flex: 1;
      min-width: 0;
      text-align: left;
    }

    /* RTL: align text to right */
    :host-context([dir="rtl"]) .item-text,
    :host-context(.rtl) .item-text,
    [dir="rtl"] .item-text {
      text-align: right;
    }

    .item-label {
      font-weight: 500;
      font-size: 14px;
      line-height: 1.2;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .item-subtitle {
      font-size: 12px;
      margin-top: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .item-badge {
      font-size: 10px;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 8px;
      margin-left: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .item-check {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: auto;
      padding-left: 12px;
      flex-shrink: 0;
    }

    .item-check .check-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #10b981;
    }

    /* RTL: swap margin direction for item-check */
    :host-context([dir="rtl"]) .item-check,
    :host-context(.rtl) .item-check,
    [dir="rtl"] .item-check {
      margin-left: 0;
      margin-right: auto;
      padding-left: 0;
      padding-right: 12px;
    }

    /* RTL: swap margin direction for item-badge */
    :host-context([dir="rtl"]) .item-badge,
    :host-context(.rtl) .item-badge,
    [dir="rtl"] .item-badge {
      margin-left: 0;
      margin-right: 8px;
    }

    .item-arrow {
      margin-left: 8px;
    }

    /* RTL: swap margin and rotate arrow for item-arrow */
    :host-context([dir="rtl"]) .item-arrow,
    :host-context(.rtl) .item-arrow,
    [dir="rtl"] .item-arrow {
      margin-left: 0;
      margin-right: 8px;
    }

    :host-context([dir="rtl"]) .item-arrow mat-icon,
    :host-context(.rtl) .item-arrow mat-icon,
    [dir="rtl"] .item-arrow mat-icon {
      transform: rotate(180deg);
    }

    .item-arrow mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    /* Dark theme styles - Clean sophisticated greys */
    .dark-theme .menu-header {
      border-bottom-color: var(--divider-color, rgba(255, 255, 255, 0.1));
    }

    .dark-theme .header-icon {
      background: rgba(255, 255, 255, 0.08);
    }

    .dark-theme .header-icon mat-icon {
      color: var(--text-primary, #f1f5f9);
    }

    .dark-theme .menu-item::before {
      background: var(--nav-item-hover, rgba(255, 255, 255, 0.08));
    }

    .dark-theme .menu-item.selected {
      background: var(--nav-item-active, rgba(16, 185, 129, 0.2));
      border-color: var(--primary-green, rgba(16, 185, 129, 0.4));
    }

    .dark-theme .menu-item.selected .item-label {
      color: #10b981 !important;
    }

    .dark-theme .item-check .check-icon {
      color: #10b981;
    }

    /* Scrollbar in dropdown menu */
    .dropdown-menu {
      &::-webkit-scrollbar {
        width: 6px;
      }

      &::-webkit-scrollbar-track {
        background: var(--light-bg, #f1f1f1);
        border-radius: 3px;
      }

      &::-webkit-scrollbar-thumb {
        background: var(--border-color, #cbd5e1);
        border-radius: 3px;

        &:hover {
          background: var(--text-secondary, #94a3b8);
        }
      }
    }

    .dark-theme .dropdown-menu {
      &::-webkit-scrollbar-track {
        background: var(--card-bg, #1e293b);
      }

      &::-webkit-scrollbar-thumb {
        background: var(--border-color, #475569);
      }
    }

    /* Responsive design - Small screens */
    @media (max-width: 480px) {
      .dropdown-menu {
        max-height: calc(100vh - 80px);
        overflow-y: auto;
        margin-top: 4px;
        margin-bottom: 4px;
      }

      .menu-content {
        padding: 4px;
      }
      
      .menu-header {
        padding: 12px;
        margin-bottom: 4px;
      }

      .header-content {
        gap: 8px;
      }

      .header-icon {
        width: 32px;
        height: 32px;
      }

      .header-icon mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .header-title {
        font-size: 14px;
      }

      .header-subtitle {
        font-size: 12px;
      }
      
      .menu-item {
        padding: 10px 12px;
        margin: 1px 0;
      }
      
      .item-icon {
        width: 28px;
        height: 28px;
        margin-right: 10px;
      }

      :host-context([dir="rtl"]) .item-icon,
      :host-context(.rtl) .item-icon,
      [dir="rtl"] .item-icon {
        margin-right: 0;
        margin-left: 10px;
      }
      
      .item-label {
        font-size: 13px;
      }
      
      .item-subtitle {
        font-size: 11px;
      }

      .section-title {
        font-size: 10px;
        padding: 6px 12px 2px;
      }
    }

    @media (max-width: 360px) {
      .dropdown-menu {
        max-height: calc(100vh - 60px);
        overflow-y: auto;
      }

      .menu-content {
        padding: 2px;
      }

      .menu-header {
        padding: 10px;
      }
      
      .menu-item {
        padding: 8px 10px;
      }
      
      .item-icon {
        width: 24px;
        height: 24px;
        margin-right: 8px;
      }

      :host-context([dir="rtl"]) .item-icon,
      :host-context(.rtl) .item-icon,
      [dir="rtl"] .item-icon {
        margin-right: 0;
        margin-left: 8px;
      }
      
      .item-label {
        font-size: 12px;
      }
      
      .item-subtitle {
        font-size: 10px;
      }

      .header-title {
        font-size: 13px;
      }

      .header-subtitle {
        font-size: 11px;
      }
    }
  `]
})
export class CustomDropdownComponent {
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() headerIcon?: string;
  @Input() items: DropdownItem[] = [];
  @Input() selectedItemId?: string;
  @Input() sections: { title?: string; items: DropdownItem[] }[] = [];
  @Input() position: 'below' | 'above' = 'below';

  @Output() itemSelected = new EventEmitter<DropdownItem>();
  @Output() dropdownToggled = new EventEmitter<boolean>();

  @ViewChild('dropdownContainer', { static: true }) dropdownContainer!: ElementRef;

  isOpen = signal(false);
  positionAbove = signal(false);
  alignRight = signal(true); // For RTL/LTR positioning
  menuPosition = signal<{ top: string; bottom: string; left: string; right: string; transform: string }>({
    top: '100%',
    bottom: 'auto',
    left: 'auto',
    right: '0',
    transform: 'translateY(-10px) scale(0.95)'
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.dropdownContainer.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.isOpen()) {
      // Use setTimeout to ensure DOM is updated after resize
      setTimeout(() => {
        if (this.isOpen()) {
          this.updatePosition();
        }
      }, 0);
    }
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (this.isOpen()) {
      // Debounce scroll updates for performance
      setTimeout(() => {
        if (this.isOpen()) {
          this.updatePosition();
        }
      }, 10);
    }
  }

  toggleDropdown(): void {
    if (this.isOpen()) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  openDropdown(): void {
    this.isOpen.set(true);
    this.dropdownToggled.emit(true);
    // Use setTimeout to ensure DOM is updated
    setTimeout(() => {
      this.updatePosition();
      // Update transform to open state after position is calculated
      const menuElement = this.dropdownContainer.nativeElement.querySelector('.dropdown-menu') as HTMLElement;
      if (menuElement && this.menuPosition().transform) {
        const currentTransform = this.menuPosition().transform;
        // Extract X translation if present, otherwise use default
        const xMatch = currentTransform.match(/translate\(([^,]+)/);
        if (xMatch) {
          const xTranslation = xMatch[1].trim();
          menuElement.style.transform = `translate(${xTranslation}, 0) scale(1)`;
        } else {
          menuElement.style.transform = 'translateY(0) scale(1)';
        }
      }
    }, 0);
  }

  closeDropdown(): void {
    this.isOpen.set(false);
    this.positionAbove.set(false);
    this.alignRight.set(true);
    this.menuPosition.set({
      top: '100%',
      bottom: 'auto',
      left: 'auto',
      right: '0',
      transform: 'translateY(-10px) scale(0.95)'
    });
    this.dropdownToggled.emit(false);
  }

  selectItem(item: DropdownItem): void {
    if (item.disabled) return;
    
    this.selectedItemId = item.id;
    this.itemSelected.emit(item);
    
    if (item.action) {
      item.action();
    }
    
    this.closeDropdown();
  }

  private updatePosition(): void {
    const container = this.dropdownContainer.nativeElement;
    const rect = container.getBoundingClientRect();
    const menuElement = container.querySelector('.dropdown-menu') as HTMLElement;
    
    if (!menuElement) return;
    
    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const isSmallScreen = viewportWidth <= 768;
    const isVerySmallScreen = viewportWidth <= 480;
    
    // Safe area padding from viewport edges
    const safeArea = isVerySmallScreen ? 8 : isSmallScreen ? 12 : 16;
    
    // Get menu dimensions (use actual or fallback)
    const menuHeight = menuElement.offsetHeight || 400;
    let menuWidth = menuElement.offsetWidth || 320;
    
    // Constrain menu width to fit viewport
    const maxAllowedWidth = viewportWidth - (safeArea * 2);
    if (menuWidth > maxAllowedWidth) {
      menuWidth = maxAllowedWidth;
      menuElement.style.maxWidth = `${maxAllowedWidth}px`;
      menuElement.style.minWidth = 'auto';
    } else if (isVerySmallScreen) {
      menuElement.style.maxWidth = `${maxAllowedWidth}px`;
      menuElement.style.minWidth = 'auto';
    } else if (isSmallScreen) {
      menuElement.style.maxWidth = `min(400px, ${maxAllowedWidth}px)`;
    } else {
      menuElement.style.maxWidth = '400px';
    }
    
    // Calculate available space
    const spaceBelow = viewportHeight - rect.bottom - safeArea;
    const spaceAbove = rect.top - safeArea;
    
    // Check if we should position above
    const shouldPositionAbove = spaceBelow < menuHeight && spaceAbove > spaceBelow;
    this.positionAbove.set(shouldPositionAbove);
    
    // Calculate where the dropdown would be if aligned to trigger's right edge
    // Dropdown right edge would be at trigger's right edge (rect.right)
    // Dropdown left edge would be at (rect.right - menuWidth)
    const dropdownRightEdge = rect.right;
    const dropdownLeftEdgeIfRightAligned = rect.right - menuWidth;
    
    // Check if dropdown would go off the right edge of viewport
    const rightOverflow = dropdownRightEdge - (viewportWidth - safeArea);
    // Check if dropdown would go off the left edge of viewport
    const leftOverflow = safeArea - dropdownLeftEdgeIfRightAligned;
    
    // Calculate the X offset needed to keep dropdown within viewport
    let offsetX = 0;
    
    if (rightOverflow > 0) {
      // Dropdown extends past right edge - shift left
      offsetX = -rightOverflow;
    }
    
    // After shifting left, check if we now overflow on the left
    const newLeftEdge = dropdownLeftEdgeIfRightAligned + offsetX;
    if (newLeftEdge < safeArea) {
      // Would overflow left - adjust to stay within left boundary
      offsetX = safeArea - dropdownLeftEdgeIfRightAligned;
    }
    
    // Positioning
    let top = '100%';
    let bottom = 'auto';
    const left = 'auto';
    const right = '0';
    
    if (shouldPositionAbove) {
      top = 'auto';
      bottom = '100%';
    }
    
    // Build transform string
    const baseYTransform = shouldPositionAbove ? '10px' : '-10px';
    let transform: string;
    
    if (offsetX !== 0) {
      transform = `translate(${offsetX}px, ${baseYTransform}) scale(0.95)`;
    } else {
      transform = `translateY(${baseYTransform}) scale(0.95)`;
    }
    
    // Store position
    this.menuPosition.set({ top, bottom, left, right, transform });
    this.alignRight.set(true);
    
    // If menu is open, update transform to open state (remove Y translation and scale)
    if (this.isOpen() && menuElement) {
      if (offsetX !== 0) {
        menuElement.style.transform = `translate(${offsetX}px, 0) scale(1)`;
      } else {
        menuElement.style.transform = 'translateY(0) scale(1)';
      }
    }
  }

  get groupedItems(): { title?: string; items: DropdownItem[]; isLast: boolean }[] {
    if (this.sections.length > 0) {
      return this.sections.map((section, index) => ({
        ...section,
        isLast: index === this.sections.length - 1
      }));
    }
    
    return [{ items: this.items, isLast: true }];
  }

  // Theme-aware styling methods
  getTriggerBorder(): string {
    const isDarkTheme = document.body.classList.contains('dark-theme');
    return isDarkTheme 
      ? '0.5px solid rgba(255, 255, 255, 0.3)' 
      : '0.5px solid rgba(0, 0, 0, 0.2)';
  }

  getMenuBackground(): string {
    const isDarkTheme = document.body.classList.contains('dark-theme');
    return isDarkTheme 
      ? 'var(--user-menu-bg, #1e293b)' 
      : 'var(--user-menu-bg, #ffffff)';
  }

  getMenuBorder(): string {
    const isDarkTheme = document.body.classList.contains('dark-theme');
    return isDarkTheme 
      ? '1px solid var(--user-menu-border, rgba(255, 255, 255, 0.1))' 
      : '1px solid var(--user-menu-border, rgba(0, 0, 0, 0.08))';
  }

  getMenuShadow(): string {
    const isDarkTheme = document.body.classList.contains('dark-theme');
    return isDarkTheme 
      ? 'var(--user-menu-shadow, 0 8px 32px rgba(0, 0, 0, 0.4))' 
      : 'var(--user-menu-shadow, 0 8px 32px rgba(0, 0, 0, 0.12))';
  }

  getPrimaryTextColor(): string {
    const isDarkTheme = document.body.classList.contains('dark-theme');
    return isDarkTheme ? '#ffffff' : '#2c3e50';
  }

  getSecondaryTextColor(): string {
    const isDarkTheme = document.body.classList.contains('dark-theme');
    return isDarkTheme ? 'rgba(255, 255, 255, 0.8)' : '#7f8c8d';
  }

  getDividerColor(): string {
    const isDarkTheme = document.body.classList.contains('dark-theme');
    return isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  }

  getItemTextColor(item: DropdownItem): string {
    if (item.id === 'logout') {
      return '#ff6b6b';
    }
    return this.getPrimaryTextColor();
  }

  getBadgeBackground(): string {
    const isDarkTheme = document.body.classList.contains('dark-theme');
    return isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
  }

  getBadgeTextColor(): string {
    return this.getSecondaryTextColor();
  }
}
