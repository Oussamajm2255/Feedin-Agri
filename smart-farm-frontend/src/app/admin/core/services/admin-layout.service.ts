import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AdminLayoutService {
  // Signal to track if a right-side drawer is open
  rightDrawerOpen = signal<boolean>(false);
  
  // Signal to track the width of the drawer (optional, for dynamic resizing)
  rightDrawerWidth = signal<string>('40%');

  constructor() { }

  openRightDrawer(width: string = '40%') {
    this.rightDrawerWidth.set(width);
    this.rightDrawerOpen.set(true);
  }

  closeRightDrawer() {
    this.rightDrawerOpen.set(false);
  }

  toggleRightDrawer() {
    this.rightDrawerOpen.update(v => !v);
  }
}
