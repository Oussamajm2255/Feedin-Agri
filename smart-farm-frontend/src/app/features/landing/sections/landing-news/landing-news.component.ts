import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ScrollRevealDirective } from '../../animations/directives/scroll-reveal.directive';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

/**
 * Interface defining the strict structure of our actualité news card.
 */
interface NewsItem {
  imagePath: string;
  fallbackPath: string;
  title: string;
  tag: string;
  dateKey: string;     // Translation key or string
  defaultDate: string; // Fallback date string
  readTime: string;
  link: string;
}

/**
 * LandingNewsComponent
 * 
 * A premium, highly custom News section for the Feedin Green landing page.
 * Features advanced CSS grid layout, beautiful frosted glass cards,
 * buttery-smooth transitions, and image loading fallback safety.
 */
@Component({
  selector: 'app-landing-news',
  standalone: true,
  imports: [CommonModule, ScrollRevealDirective, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './landing-news.component.html',
  styleUrls: ['./landing-news.component.scss']
})
export class LandingNewsComponent implements OnInit {
  private router = inject(Router);

  /**
   * Exactly two high-end items provided by the client,
   * structured perfectly to allow seamless scaling to N items later.
   */
  public newsItems: NewsItem[] = [
    {
      imagePath: 'assets/images/news-1.jpg',
      fallbackPath: 'assets/landing/images/news/news-1.jpeg',
      title: 'Participation de Feedin green à l’innovation week à CIHEAM Bari à l’italy',
      tag: 'Événement',
      dateKey: 'landing.news.items.0.date',
      defaultDate: '10 Mai 2026',
      readTime: '3 min read',
      link: '/about' // Navigates to a valid route since news pages don't exist yet
    },
    {
      imagePath: 'assets/images/news-2.jpg',
      fallbackPath: 'assets/landing/images/news/news-2.jpeg',
      title: 'Participation de Feedin Geen au Forum économique Tuniso-Nigérien à la maison de l’exportateur à Tunisie',
      tag: 'Forum',
      dateKey: 'landing.news.items.1.date',
      defaultDate: '15 Mai 2026',
      readTime: '4 min read',
      link: '/solutions' // Navigates to a valid route
    }
  ];

  ngOnInit(): void {
    // Lifecycle hooks for future API data fetching
  }

  /**
   * Handle image loading errors gracefully.
   * If the primary path doesn't load (e.g. assets/images/news-1.jpg is missing),
   * we swap to the local asset path (assets/landing/images/news/news-1.jpeg) which is present.
   */
  public onImgError(event: Event, fallbackPath: string): void {
    const target = event.target as HTMLImageElement;
    if (target && !target.src.endsWith(fallbackPath)) {
      target.src = fallbackPath;
    }
  }

  /**
   * Navigates to a specific news article or related page.
   */
  public navigateToArticle(link: string): void {
    const [path, fragment] = link.split('#');
    this.router.navigate([path], fragment ? { fragment } : {});
  }

  /**
   * Handles keyboard navigation (Enter or Space triggers the click action).
   */
  public onCardKeydown(event: KeyboardEvent, link: string): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.navigateToArticle(link);
    }
  }
}
