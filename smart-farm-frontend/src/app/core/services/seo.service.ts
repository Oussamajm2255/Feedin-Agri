import { Injectable, inject, DOCUMENT } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

/**
 * SEO metadata payload for per-route configuration.
 * All fields are optional — only provided fields will be updated.
 */
export interface SeoMeta {
  /** Page title — max 60 chars for best SERP display */
  title?: string;
  /** Page description — max 160 chars */
  description?: string;
  /** Comma-separated keywords relevant to the page */
  keywords?: string;
  /** Canonical URL for this page */
  url?: string;
  /** OG/Twitter image URL (absolute) */
  image?: string;
  /** OG type — defaults to 'website' */
  type?: string;
  /** Language code e.g. 'fr', 'en', 'ar' */
  locale?: string;
}

/**
 * SeoService
 *
 * Centralised SEO management for the Feedin Green platform.
 * Dynamically sets <title>, meta tags, canonical links, Open Graph,
 * Twitter Card, and JSON-LD structured data per route.
 *
 * @usage Inject in any public-facing page component and call `setMeta()` in ngOnInit().
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly meta = inject(Meta);
  private readonly titleService = inject(Title);
  private readonly doc = inject(DOCUMENT);

  /** Base URL for the production site */
  private readonly baseUrl = 'https://feedingreen.com';

  /** Default OG image — Feedin Green logo */
  private readonly defaultImage = `${this.baseUrl}/assets/images/logos/Feedin_pnglogo.webp`;

  /** Default SEO values (French — primary language) */
  private readonly defaults: Required<SeoMeta> = {
    title: 'Feedin Green — Plateforme Agricole Intelligente | Agriculture Connectée Tunisie',
    description:
      "Feedin Green : votre plateforme IoT pour l'agriculture intelligente en Tunisie. " +
      'Capteurs connectés, gestion des cultures, monitoring en temps réel et automatisation des serres.',
    keywords:
      'feedin, feedin green, feed in, smart farm, agriculture, agriculture tunisie, ' +
      'agriculture intelligente, IoT agricole, capteurs agricoles, serre connectée, ' +
      'gestion exploitation agricole, monitoring cultures, agriculture de précision',
    url: this.baseUrl,
    image: this.defaultImage,
    type: 'website',
    locale: 'fr_FR',
  };

  /**
   * Set all SEO meta tags for the current page.
   * Falls back to defaults for any omitted field.
   *
   * @param config - Partial SEO metadata to apply
   */
  setMeta(config: SeoMeta): void {
    const data = { ...this.defaults, ...config };

    // 1. Page title
    this.titleService.setTitle(data.title);

    // 2. Standard meta tags
    this.meta.updateTag({ name: 'description', content: data.description });
    this.meta.updateTag({ name: 'keywords', content: data.keywords });
    this.meta.updateTag({ name: 'author', content: 'Feedin Green' });

    // 3. Open Graph tags
    this.meta.updateTag({ property: 'og:title', content: data.title });
    this.meta.updateTag({ property: 'og:description', content: data.description });
    this.meta.updateTag({ property: 'og:url', content: data.url });
    this.meta.updateTag({ property: 'og:image', content: data.image });
    this.meta.updateTag({ property: 'og:type', content: data.type });
    this.meta.updateTag({ property: 'og:locale', content: data.locale });
    this.meta.updateTag({ property: 'og:site_name', content: 'Feedin Green' });

    // 4. Twitter Card tags
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: data.title });
    this.meta.updateTag({ name: 'twitter:description', content: data.description });
    this.meta.updateTag({ name: 'twitter:image', content: data.image });

    // 5. Canonical link
    this.setCanonical(data.url);

    // 6. Hreflang alternate links
    this.setHreflangLinks(data.url);
  }

  /**
   * Inject or update JSON-LD structured data in the document <head>.
   *
   * @param schema - A valid Schema.org JSON-LD object
   * @param id     - Unique identifier for the script tag (allows multiple schemas)
   */
  setJsonLd(schema: Record<string, unknown>, id: string = 'seo-jsonld'): void {
    const scriptId = `jsonld-${id}`;
    let scriptEl = this.doc.getElementById(scriptId) as HTMLScriptElement | null;

    if (!scriptEl) {
      scriptEl = this.doc.createElement('script');
      scriptEl.id = scriptId;
      scriptEl.type = 'application/ld+json';
      this.doc.head.appendChild(scriptEl);
    }

    scriptEl.textContent = JSON.stringify(schema);
  }

  /**
   * Set the Organization schema (call once on app init or landing page).
   */
  setOrganizationSchema(): void {
    this.setJsonLd(
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Feedin Green',
        url: this.baseUrl,
        logo: this.defaultImage,
        description:
          'Plateforme agricole intelligente pour la gestion IoT des exploitations en Tunisie. ' +
          'Capteurs connectés, automatisation des serres et monitoring des cultures en temps réel.',
        foundingDate: '2024',
        areaServed: {
          '@type': 'Country',
          name: 'Tunisia',
        },
        knowsAbout: [
          'Agriculture intelligente',
          'IoT agricole',
          'Smart farming',
          'Capteurs agricoles',
          'Serres connectées',
        ],
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer service',
          availableLanguage: ['French', 'English', 'Arabic'],
        },
      },
      'organization',
    );
  }

  /**
   * Set the WebApplication schema (call once on app init or landing page).
   */
  setWebApplicationSchema(): void {
    this.setJsonLd(
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Feedin Green',
        url: this.baseUrl,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web Browser',
        description:
          'Plateforme IoT de gestion agricole intelligente — monitoring, automatisation et analyse de données pour les exploitations agricoles.',
        inLanguage: ['fr', 'en', 'ar'],
        offers: {
          '@type': 'Offer',
          category: 'Smart Farming Platform',
          availability: 'https://schema.org/InStock',
        },
      },
      'webapp',
    );
  }

  /**
   * Set or update the canonical <link> tag.
   */
  private setCanonical(url: string): void {
    let linkEl = this.doc.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;

    if (!linkEl) {
      linkEl = this.doc.createElement('link');
      linkEl.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(linkEl);
    }

    linkEl.setAttribute('href', url);
  }

  /**
   * Set hreflang alternate links for multi-language SEO.
   * Injects <link rel="alternate" hreflang="..."> tags.
   */
  private setHreflangLinks(currentUrl: string): void {
    // Remove existing hreflang links
    const existing = this.doc.querySelectorAll('link[rel="alternate"][hreflang]');
    existing.forEach((el) => el.remove());

    // Derive the path from the current URL
    const path = currentUrl.replace(this.baseUrl, '') || '/';

    const languages = [
      { hreflang: 'fr', url: `${this.baseUrl}${path}` },
      { hreflang: 'en', url: `${this.baseUrl}${path}` },
      { hreflang: 'ar', url: `${this.baseUrl}${path}` },
      { hreflang: 'x-default', url: `${this.baseUrl}${path}` },
    ];

    languages.forEach(({ hreflang, url }) => {
      const link = this.doc.createElement('link');
      link.setAttribute('rel', 'alternate');
      link.setAttribute('hreflang', hreflang);
      link.setAttribute('href', url);
      this.doc.head.appendChild(link);
    });
  }
}
