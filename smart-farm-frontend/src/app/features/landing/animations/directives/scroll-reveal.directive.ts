/**
 * ScrollRevealDirective
 * 
 * Declarative scroll-based reveal animations.
 * 
 * Usage:
 * <div appScrollReveal="fade-up">Content</div>
 * <ul appScrollReveal="stagger" [staggerDelay]="0.15">...</ul>
 */

import { 
  Directive, 
  ElementRef, 
  Input, 
  AfterViewInit, 
  OnDestroy, 
  inject 
} from '@angular/core';
import { ScrollAnimationService } from '../services/scroll-animation.service';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export type RevealAnimation = 'fade-up' | 'fade-left' | 'fade-right' | 'scale' | 'stagger';

@Directive({
  selector: '[appScrollReveal]',
  standalone: true
})
export class ScrollRevealDirective implements AfterViewInit, OnDestroy {
  private el = inject(ElementRef);
  private scrollService = inject(ScrollAnimationService);
  
  private trigger: ScrollTrigger | null = null;

  @Input('appScrollReveal') animation: RevealAnimation = 'fade-up';
  @Input() duration = 0.8;
  @Input() delay = 0;
  @Input() staggerDelay = 0.12;
  @Input() scrub = false;
  @Input() start = 'top 85%';

  ngAfterViewInit(): void {
    // Mark element for reduced motion handling
    this.el.nativeElement.setAttribute('data-scroll-reveal', 'true');
    
    this.trigger = this.scrollService.createReveal({
      element: this.el.nativeElement,
      animation: this.animation,
      duration: this.duration,
      delay: this.delay,
      staggerDelay: this.staggerDelay,
      start: this.start,
      scrub: this.scrub
    });
  }

  ngOnDestroy(): void {
    if (this.trigger) {
      this.trigger.kill();
    }
  }
}
