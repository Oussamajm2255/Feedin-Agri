import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Public landing pages — pre-render for SEO
  // Note: Landing page '/' uses GSAP ScrollTrigger which calls
  // getBoundingClientRect on elements in Angular's internal domino
  // document. Server-rendered instead of prerendered for reliability.
  {
    path: '',
    renderMode: RenderMode.Server
  },
  {
    path: 'landing',
    renderMode: RenderMode.Server
  },
  {
    path: 'about',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'solutions',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'projets',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'contact',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'store',
    renderMode: RenderMode.Prerender
  },
  // Routes with GSAP animations or reactive forms — server-render
  // (can't pre-render due to browser-only API dependencies)
  {
    path: 'formation',
    renderMode: RenderMode.Server
  },
  {
    path: 'services',
    renderMode: RenderMode.Server
  },
  {
    path: 'login',
    renderMode: RenderMode.Server
  },
  // All other routes — server-render (or fallback to CSR)
  {
    path: '**',
    renderMode: RenderMode.Server
  }
];
