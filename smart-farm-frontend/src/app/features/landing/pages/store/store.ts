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

  // Categories
  categories = [
    { id: 'all', label: 'Tous les produits' },
    { id: 'serres', label: 'Serres & Structures' },
    { id: 'materiaux', label: 'Matériaux de couverture' },
    { id: 'accessoires', label: 'Équipements & Accessoires' },
  ];

  // Selected Category filter
  activeCategory = signal<string>('all');

  // Selected product list
  products: Product[] = [
    // ============================================
    // PRODUCT 1: SERRE MULTI CHAPELLE
    // ============================================
    {
      id: 'serre-multi-chapelle',
      name: 'Serre Multi Chapelle',
      badge: 'Structure Pro',
      category: 'serres',
      description: 'C\'est une serre composée de plusieurs chapelles accolées. Grâce à sa structure robuste en acier galvanisé et à sa couverture en film plastique ou polycarbonate, elle garantit une excellente résistance aux conditions climatiques (vent, pluie, chaleur). Elle permet également de créer un environnement contrôlé, idéal pour maximiser le rendement agricole tout au long de l\'année.',
      specs: [
        'Structure modulaire adaptable selon vos besoins',
        'Ossature en acier galvanisé haute résistance',
        'Largeurs disponibles : 4m à 12,8m (ou plus sur mesure)',
        'Ventilation latérale et zénithale pour un climat optimal',
        'Compatible avec systèmes d\'irrigation et de fertigation',
        'Couverture : plastique agricole, polycarbonate ou filet'
      ],
      features: ['Modulaire', 'Acier Galvanisé', 'Sur Mesure', 'Ventilation Optimale'],
      icon: 'warehouse',
      bgGradient: 'linear-gradient(135deg, #15803d 0%, #166534 100%)',
      primaryColor: '#22c55e',
      imageUrl: 'assets/landing/images/serre.jpg',
    },

    // ============================================
    // PRODUCT 2: SERRE TUNNEL
    // ============================================
    {
      id: 'serre-tunnel',
      name: 'Serre Tunnel',
      badge: 'Économique',
      category: 'serres',
      description: 'La serre tunnel est une solution simple, économique et efficace pour protéger vos cultures tout au long de l\'année. Sa structure en arceaux recouverts de film plastique permet de créer un microclimat favorable à la croissance des plantes. Facile à installer et à entretenir, elle est particulièrement adaptée aux exploitations agricoles de petite et moyenne taille.',
      specs: [
        'Structure en arceaux en acier galvanisé',
        'Largeurs disponibles : 4m à 9m (ou sur mesure)',
        'Hauteur variable selon les besoins',
        'Couverture en film plastique agricole',
        'Système de ventilation latérale (manuelle ou motorisée)',
        'Montage simple et rapide'
      ],
      features: ['Économique', 'Rapide à Monter', 'Microclimat Optimal', 'PME Adaptée'],
      icon: 'agriculture',
      bgGradient: 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)',
      primaryColor: '#0d9488',
      imageUrl: 'assets/landing/images/serre-connectee-intelligente.jpg',
    },

    // ============================================
    // PRODUCT 3: SERRE JARDIN
    // ============================================
    {
      id: 'serre-jardin',
      name: 'Serre Jardin',
      badge: 'Amateur & Pro',
      category: 'serres',
      description: 'La serre de jardin est idéale pour les amateurs de jardinage souhaitant cultiver leurs plantes dans des conditions optimales. Elle permet de protéger les cultures contre les intempéries, le froid et les variations climatiques tout en favorisant leur croissance. Compacte et esthétique, elle s\'intègre facilement dans tout type de jardin.',
      specs: [
        'Structure légère en aluminium ou acier galvanisé',
        'Longueurs : de 2.3m à 10m',
        'Hauteur de la serre : 2.20 à 2.50m',
        'En polycarbonate ou film plastique',
        'Dimensions adaptées aux petits espaces',
        'Porte d\'accès avec système de fermeture',
        'Bonne transmission de la lumière',
        'Montage simple et rapide'
      ],
      features: ['Compacte', 'Esthétique', 'Légère', 'Facile à Monter'],
      icon: 'yard',
      bgGradient: 'linear-gradient(135deg, #0369a1 0%, #075985 100%)',
      primaryColor: '#0284c7',
      imageUrl: 'assets/landing/images/urban-farming.jpg',
    },

    // ============================================
    // PRODUCT 4: STRUCTURE OMBRIÈRE
    // ============================================
    {
      id: 'structure-ombriere',
      name: 'Structure Ombrière',
      badge: 'Protection UV',
      category: 'serres',
      description: 'La structure ombrière est conçue pour protéger les cultures contre l\'excès d\'ensoleillement et les fortes chaleurs. Équipée de filets d\'ombrage, elle permet de réduire l\'intensité lumineuse tout en assurant une bonne circulation de l\'air. Idéale pour les pépinières, les cultures sensibles et les zones à climat chaud.',
      specs: [
        'Structure en acier galvanisé résistante à la corrosion',
        'Filets d\'ombrage disponibles en différents taux (50%, 70%)',
        'Hauteur et dimensions personnalisables (3-4m)',
        'Longueur : multiple de 2m ou 3m',
        'Largeur : multiple de 6m ou 9m',
        'Installation fixe ou démontable',
        'Bonne résistance au vent et aux conditions extérieures',
        'Adaptée à différents types de cultures'
      ],
      features: ['Anti-UV', 'Personnalisable', 'Fixe ou Mobile', 'Résistante'],
      icon: 'wb_shade',
      bgGradient: 'linear-gradient(135deg, #6d28d9 0%, #5b21b6 100%)',
      primaryColor: '#7c3aed',
      imageUrl: 'assets/landing/images/serres-agricoles-connectees.jpg',
    },

    // ============================================
    // PRODUCT 5: ÉQUIPEMENTS DES SERRES
    // ============================================
    {
      id: 'equipements-serres',
      name: 'Équipements des Serres',
      badge: 'Accessoires Pro',
      category: 'accessoires',
      description: 'Nous proposons une gamme complète d\'équipements pour serres agricoles. Conçus avec des matériaux résistants à la corrosion et aux conditions climatiques, nos produits assurent une installation fiable, durable et adaptée à tous types de structures, garantissant la stabilité et la performance optimale de votre serre.',
      specs: [
        'Clips de fixation : maintien sécurisé du film plastique, résistance aux UV',
        'Arceaux galvanisés : structure robuste, haute résistance à la corrosion',
        'Colliers de serrage : assemblage solide et durable des éléments',
        'Fil de tension (Nylstrong) : maintien optimal de la bâche, résistance à la traction',
        'Visserie et boulonnerie : fixation fiable, longue durée de vie',
        'Accessoires de montage : installation simple et rapide'
      ],
      features: ['Clips UV', 'Acier Galvanisé', 'Nylstrong', 'Visserie Pro'],
      icon: 'build',
      bgGradient: 'linear-gradient(135deg, #b45309 0%, #92400e 100%)',
      primaryColor: '#d97706',
      imageUrl: 'assets/landing/images/systemes-automatisation-serres.jpg',
    },

    // ============================================
    // PRODUCT 6: PLASTIQUE DE SERRE
    // ============================================
    {
      id: 'plastique-serre',
      name: 'Plastique de Serre',
      badge: 'Indispensable',
      category: 'materiaux',
      description: 'Le plastique de serre est un élément indispensable pour protéger vos cultures et créer un environnement optimal pour leur développement. Il permet de maintenir la température, de protéger contre le vent et la pluie, tout en laissant passer la lumière nécessaire à la photosynthèse.',
      specs: [
        'Matériaux : polyéthylène (PE), polycarbonate ou film UV stabilisé',
        'Épaisseur : 180 à 200 microns',
        'Protection UV pour prolonger la durée de vie',
        'Transparent ou diffusant selon le type de culture',
        'Compatible avec toutes les structures de serre',
        'Résistant aux intempéries et aux variations de température'
      ],
      features: ['PE / Polycarbonate', 'UV Stabilisé', '180-200 microns', 'Transparent/Diffusant'],
      icon: 'layers',
      bgGradient: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
      primaryColor: '#4b5563',
      imageUrl: 'assets/landing/images/bg2.webp',
    },

    // ============================================
    // PRODUCT 7: SCOTCH RÉPARATION PLASTIQUE
    // ============================================
    {
      id: 'scotch-reparation',
      name: 'Scotch Réparation Plastique',
      badge: 'Pratique',
      category: 'accessoires',
      description: 'Le scotch pour réparation de plastique de serre est un accessoire pratique et indispensable pour prolonger la durée de vie de vos films plastiques. Il permet de réparer rapidement les déchirures, fissures ou trous dans vos serres sans avoir à remplacer tout le film.',
      specs: [
        'Largeur : 7.5cm',
        'Longueur : rouleau de 25m',
        'Résistant aux UV et aux intempéries',
        'Adhésif puissant compatible avec polyéthylène et polycarbonate',
        'Transparent ou semi-transparent pour ne pas réduire la lumière',
        'Facile à découper et à appliquer'
      ],
      features: ['7.5cm x 25m', 'Anti-UV', 'Adhésif Puissant', 'Transparent'],
      icon: 'tape_measure',
      bgGradient: 'linear-gradient(135deg, #be123c 0%, #9f1239 100%)',
      primaryColor: '#e11d48',
    },

    // ============================================
    // PRODUCT 8: TOILE HORS SOL
    // ============================================
    {
      id: 'toile-hors-sol',
      name: 'La Toile Hors Sol',
      badge: 'Protection Sol',
      category: 'materiaux',
      description: 'La toile hors sol est un revêtement protecteur destiné à couvrir vos cultures, planches ou structures agricoles sans contact direct avec le sol. Elle offre une protection efficace contre le vent, le soleil et certains nuisibles, tout en favorisant le développement des plantes dans un environnement contrôlé.',
      specs: [
        'Réalisée avec du polypropylène stabilisé au UV',
        'Différentes densités disponibles : 90g/m², 100g/m², 110g/m²',
        'Résistant aux UV et aux intempéries',
        'Disponible en rouleaux',
        'Léger et facile à installer',
        'Adapté aux cultures sur tables, bacs ou structures hors sol'
      ],
      features: ['Polypropylène UV', '90-110g/m²', 'Rouleaux', 'Léger'],
      icon: 'texture',
      bgGradient: 'linear-gradient(135deg, #047857 0%, #065f46 100%)',
      primaryColor: '#10b981',
    },

    // ============================================
    // PRODUCT 9: FILET DE PROTECTION
    // ============================================
    {
      id: 'filet-protection',
      name: 'Filet de Protection',
      badge: 'Gamme Complète',
      category: 'materiaux',
      description: 'Optimisez vos performances agricoles avec notre gamme complète de filets techniques et toiles professionnelles. Nos filets ombrières, insect-proof et anti-grêle, ainsi que nos toiles hors sol, offrent une protection globale de vos cultures contre les agressions climatiques et biologiques.',
      specs: [
        'Filets ombrières : régulation précise de l\'ensoleillement et réduction de la chaleur',
        'Filets insect-proof : barrière efficace contre les insectes nuisibles avec excellente ventilation',
        'Filets anti-grêle : protection renforcée contre les impacts et intempéries',
        'Toiles hors sol : contrôle optimal des adventices et gestion efficace de l\'humidité'
      ],
      features: ['Ombrière', 'Insect-Proof', 'Anti-Grêle', 'Hors Sol'],
      icon: 'grid_on',
      bgGradient: 'linear-gradient(135deg, #4338ca 0%, #3730a3 100%)',
      primaryColor: '#6366f1',
      imageUrl: 'assets/landing/images/serres-verticales-connectees.webp',
    }
  ];

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
      return this.products;
    }
    return this.products.filter(p => p.category === category);
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
