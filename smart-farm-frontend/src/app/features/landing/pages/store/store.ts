/**
 * ============================================
 * IMAGE ASSET REQUIREMENTS - MANUAL INSERTION
 * ============================================
 * 
 * Place all images in: /assets/images/store/
 * Naming convention: [product-id].jpg
 * 
 * [PLACEHOLDER 1] hero-serre-led.jpg
 *   → Serre moderne avec culture verticale et éclairage LED rose
 *   → Usage: Hero section right side (or below text if layout changed)
 * 
 * [PLACEHOLDER 2] serre-multi-chapelle.jpg  
 *   → Extérieur serre multi-chapelle, structure acier galvanisé
 *   → Toit arrondi, film plastique, ciel bleu en fond
 * 
 * [PLACEHOLDER 3] serre-tunnel.jpg
 *   → Intérieur serre tunnel, structure arceaux métal
 *   → Sol sablonneux, perspective profonde
 * 
 * [PLACEHOLDER 4] serre-jardin.jpg
 *   → Serre jardin dans arrière-cour, style tunnel
 *   → Environnement fleurs et potager, aspect amateur
 * 
 * [PLACEHOLDER 5] structure-ombriere.jpg
 *   → Structure ombrière 2 vues: grande (champ ouvert) + petite (plants)
 *   → Filet noir, poteaux métal, cultures protégées
 * 
 * [PLACEHOLDER 6] equipements-serres.jpg
 *   → Entrepôt avec étagères de tubes acier, boîtes, rouleaux
 *   → Aspect industriel, matériel de construction serre
 * 
 * [PLACEHOLDER 7] plastique-serre.jpg
 *   → Rouleaux de film plastique (transparent/vert/blanc)
 *   → Empilés sur palettes en bois, entrepôt
 * 
 * [PLACEHOLDER 8] scotch-reparation.jpg
 *   → 3 rouleaux scotch transparent réparation plastique
 *   → Fond blanc, produit isolé
 * 
 * [PLACEHOLDER 9] toile-hors-sol.jpg
 *   → Rouleaux tissu noir/blanc (toile hors sol)
 *   → Entrepôt, palettes, emballage plastique
 * 
 * [PLACEHOLDER 10] filet-protection.jpg
 *   → Rouleaux filet vert/noir protection
 *   → Entrepôt, emballés en plastique transparent
 */

import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { PublicNavComponent } from '../shared/public-nav.component';
import { LandingFooterComponent } from '../../sections/landing-footer/landing-footer.component';
import { ScrollToTopComponent } from '../../../../shared/components/scroll-to-top/scroll-to-top.component';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { SeoService } from '../../../../core/services/seo.service';
import { LanguageService } from '../../../../core/services/language.service';

interface Product {
  id: string;
  name: string;
  badge: string;
  category: string;
  description: string;
  specs: string[];
  features: string[];
  icon: string;
  bgGradient: string;
  primaryColor: string;
  imageUrl?: string;
}

@Component({
  selector: 'app-store',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    PublicNavComponent,
    LandingFooterComponent,
    ScrollToTopComponent,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './store.html',
  styleUrl: './store.scss',
})
export class Store implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private seoService = inject(SeoService);
  private cdr = inject(ChangeDetectorRef);
  private langService = inject(LanguageService);

  // Categories
  categories = computed(() => [
    { id: 'all', label: this.langService.t()('store.CATEGORIES.all') },
    { id: 'serres', label: this.langService.t()('store.CATEGORIES.serres') },
    { id: 'materiaux', label: this.langService.t()('store.CATEGORIES.materiaux') },
    { id: 'accessoires', label: this.langService.t()('store.CATEGORIES.accessoires') },
  ]);

  // Selected Category filter
  activeCategory = signal<string>('all');

  // Selected product list
  products = computed<Product[]>(() => {
    const t = this.langService.t();
    const trans = this.langService.translations()?.['store']?.PRODUCTS;
    
    // Fallback safe arrays if translations not yet loaded fully
    const getSpecs = (key: string) => trans?.[key]?.SPECS || [];
    const getFeats = (key: string) => trans?.[key]?.FEATURES || [];

    return [
      {
        id: 'serre-multi-chapelle',
        name: t('store.PRODUCTS.SERRE_MULTI_CHAPELLE.NAME'),
        badge: t('store.PRODUCTS.SERRE_MULTI_CHAPELLE.BADGE'),
        category: 'serres',
        description: t('store.PRODUCTS.SERRE_MULTI_CHAPELLE.DESC'),
        specs: getSpecs('SERRE_MULTI_CHAPELLE'),
        features: getFeats('SERRE_MULTI_CHAPELLE'),
        icon: 'warehouse',
        bgGradient: 'linear-gradient(135deg, #15803d 0%, #166534 100%)',
        primaryColor: '#22c55e',
        imageUrl: 'assets/landing/images/serre.jpg',
      },
      {
        id: 'serre-tunnel',
        name: t('store.PRODUCTS.SERRE_TUNNEL.NAME'),
        badge: t('store.PRODUCTS.SERRE_TUNNEL.BADGE'),
        category: 'serres',
        description: t('store.PRODUCTS.SERRE_TUNNEL.DESC'),
        specs: getSpecs('SERRE_TUNNEL'),
        features: getFeats('SERRE_TUNNEL'),
        icon: 'agriculture',
        bgGradient: 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)',
        primaryColor: '#0d9488',
        imageUrl: 'assets/landing/images/serre-connectee-intelligente.jpg',
      },
      {
        id: 'serre-jardin',
        name: t('store.PRODUCTS.SERRE_JARDIN.NAME'),
        badge: t('store.PRODUCTS.SERRE_JARDIN.BADGE'),
        category: 'serres',
        description: t('store.PRODUCTS.SERRE_JARDIN.DESC'),
        specs: getSpecs('SERRE_JARDIN'),
        features: getFeats('SERRE_JARDIN'),
        icon: 'yard',
        bgGradient: 'linear-gradient(135deg, #0369a1 0%, #075985 100%)',
        primaryColor: '#0284c7',
        imageUrl: 'assets/landing/images/urban-farming.jpg',
      },
      {
        id: 'structure-ombriere',
        name: t('store.PRODUCTS.STRUCTURE_OMBRIERE.NAME'),
        badge: t('store.PRODUCTS.STRUCTURE_OMBRIERE.BADGE'),
        category: 'serres',
        description: t('store.PRODUCTS.STRUCTURE_OMBRIERE.DESC'),
        specs: getSpecs('STRUCTURE_OMBRIERE'),
        features: getFeats('STRUCTURE_OMBRIERE'),
        icon: 'wb_shade',
        bgGradient: 'linear-gradient(135deg, #6d28d9 0%, #5b21b6 100%)',
        primaryColor: '#7c3aed',
        imageUrl: 'assets/landing/images/serres-agricoles-connectees.jpg',
      },
      {
        id: 'equipements-serres',
        name: t('store.PRODUCTS.EQUIPEMENTS_SERRES.NAME'),
        badge: t('store.PRODUCTS.EQUIPEMENTS_SERRES.BADGE'),
        category: 'accessoires',
        description: t('store.PRODUCTS.EQUIPEMENTS_SERRES.DESC'),
        specs: getSpecs('EQUIPEMENTS_SERRES'),
        features: getFeats('EQUIPEMENTS_SERRES'),
        icon: 'build',
        bgGradient: 'linear-gradient(135deg, #b45309 0%, #92400e 100%)',
        primaryColor: '#d97706',
        imageUrl: 'assets/landing/images/systemes-automatisation-serres.jpg',
      },
      {
        id: 'plastique-serre',
        name: t('store.PRODUCTS.PLASTIQUE_SERRE.NAME'),
        badge: t('store.PRODUCTS.PLASTIQUE_SERRE.BADGE'),
        category: 'materiaux',
        description: t('store.PRODUCTS.PLASTIQUE_SERRE.DESC'),
        specs: getSpecs('PLASTIQUE_SERRE'),
        features: getFeats('PLASTIQUE_SERRE'),
        icon: 'layers',
        bgGradient: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
        primaryColor: '#4b5563',
        imageUrl: 'assets/landing/images/bg2.webp',
      },
      {
        id: 'scotch-reparation',
        name: t('store.PRODUCTS.SCOTCH_REPARATION.NAME'),
        badge: t('store.PRODUCTS.SCOTCH_REPARATION.BADGE'),
        category: 'accessoires',
        description: t('store.PRODUCTS.SCOTCH_REPARATION.DESC'),
        specs: getSpecs('SCOTCH_REPARATION'),
        features: getFeats('SCOTCH_REPARATION'),
        icon: 'tape_measure',
        bgGradient: 'linear-gradient(135deg, #be123c 0%, #9f1239 100%)',
        primaryColor: '#e11d48',
      },
      {
        id: 'toile-hors-sol',
        name: t('store.PRODUCTS.TOILE_HORS_SOL.NAME'),
        badge: t('store.PRODUCTS.TOILE_HORS_SOL.BADGE'),
        category: 'materiaux',
        description: t('store.PRODUCTS.TOILE_HORS_SOL.DESC'),
        specs: getSpecs('TOILE_HORS_SOL'),
        features: getFeats('TOILE_HORS_SOL'),
        icon: 'texture',
        bgGradient: 'linear-gradient(135deg, #047857 0%, #065f46 100%)',
        primaryColor: '#10b981',
      },
      {
        id: 'filet-protection',
        name: t('store.PRODUCTS.FILET_PROTECTION.NAME'),
        badge: t('store.PRODUCTS.FILET_PROTECTION.BADGE'),
        category: 'materiaux',
        description: t('store.PRODUCTS.FILET_PROTECTION.DESC'),
        specs: getSpecs('FILET_PROTECTION'),
        features: getFeats('FILET_PROTECTION'),
        icon: 'grid_on',
        bgGradient: 'linear-gradient(135deg, #4338ca 0%, #3730a3 100%)',
        primaryColor: '#6366f1',
        imageUrl: 'assets/landing/images/serres-verticales-connectees.webp',
      }
    ];
  });

  // Drawer States
  isDrawerOpen = signal<boolean>(false);
  selectedProductForQuote = signal<Product | null>(null);
  
  // Quote Request Form
  quoteForm!: FormGroup;
  isSubmitting = signal<boolean>(false);
  showSuccess = signal<boolean>(false);

  // Cart-like quote list (Optional multi-product quotes)
  requestedProducts = signal<Product[]>([]);

  // Flipped cards state tracking for 3D card layout
  flippedCards = signal<Record<string, boolean>>({});

  ngOnInit(): void {
    window.scrollTo(0, 0);

    // Setup SEO Meta Tags
    this.seoService.setMeta({
      title: 'Boutique Serres & Matériel Agricole | Feedin Green',
      description: 'Achetez serres tunnel, multi-chapelles, ombrières, plastique agricole, filets de protection et équipements de montage. Installation et livraison en Tunisie.',
      keywords: 'boutique serre tunisie, serre tunnel, serre multi chapelle, plastique agricole, filet protection culture, ombrière tunisie, matériel serre, feedin green',
      url: 'https://feedingreen.com/store',
    });

    // Initialize Form
    this.quoteForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9+\s-]{8,15}$/)]],
      farmSize: ['', [Validators.required, Validators.min(0.1)]],
      city: ['', [Validators.required]],
      message: ['', [Validators.minLength(10)]]
    });

    // Trigger animations after load
    setTimeout(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 }
      );

      document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));
    }, 100);
  }

  // Set selected category filter
  selectCategory(categoryId: string): void {
    this.activeCategory.set(categoryId);
    this.flippedCards.set({}); // Reset all flipped states for consistency
    this.cdr.markForCheck();
  }

  // Get filtered products as a reactive computed signal
  filteredProducts = computed<Product[]>(() => {
    const category = this.activeCategory();
    if (category === 'all') {
      return this.products();
    }
    return this.products().filter(p => p.category === category);
  });

  // Side Drawer Operations
  openQuoteDrawer(product?: Product): void {
    if (product) {
      this.selectedProductForQuote.set(product);
      // If the product is not in the request list, add it
      if (!this.requestedProducts().some(p => p.id === product.id)) {
        this.requestedProducts.update(list => [...list, product]);
      }
    }
    
    this.showSuccess.set(false);
    this.isDrawerOpen.set(true);
    document.body.style.overflow = 'hidden'; // Lock background scroll
  }

  closeQuoteDrawer(): void {
    this.isDrawerOpen.set(false);
    document.body.style.overflow = ''; // Unlock scroll
  }

  // Remove a product from the quote request list
  removeProductFromQuote(productId: string): void {
    this.requestedProducts.update(list => list.filter(p => p.id !== productId));
    
    // If the currently selected product was removed, update it
    if (this.selectedProductForQuote()?.id === productId) {
      const remaining = this.requestedProducts();
      this.selectedProductForQuote.set(remaining.length > 0 ? remaining[0] : null);
    }
  }

  // Check if a product is in the quote list
  isProductInQuote(productId: string): boolean {
    return this.requestedProducts().some(p => p.id === productId);
  }

  // Toggle card flip state for 3D card presentation
  toggleFlip(productId: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.flippedCards.update(map => ({
      ...map,
      [productId]: !map[productId]
    }));
    this.cdr.markForCheck();
  }

  // Add any product to the multi-product quote list
  addProductToQuoteList(product: Product): void {
    if (!this.requestedProducts().some(p => p.id === product.id)) {
      this.requestedProducts.update(list => [...list, product]);
    }
  }

  // Submit quote request
  onSubmitQuote(): void {
    if (this.quoteForm.invalid) {
      this.quoteForm.markAllAsTouched();
      return;
    }

    if (this.requestedProducts().length === 0) {
      alert('Veuillez ajouter au moins un produit à votre demande de devis.');
      return;
    }

    this.isSubmitting.set(true);

    // Simulate API request to NestJS backend or CRM
    setTimeout(() => {
      this.isSubmitting.set(false);
      this.showSuccess.set(true);
      this.quoteForm.reset();
      this.requestedProducts.set([]);
      this.selectedProductForQuote.set(null);
    }, 1800);
  }

  // Helper validation getters
  isFieldInvalid(fieldName: string): boolean {
    const field = this.quoteForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  goToContactExpert(): void {
    this.router.navigate(['/contact'], { queryParams: { tab: 'expert' } });
  }

  goToSolutions(): void {
    this.router.navigate(['/solutions']);
  }
}
