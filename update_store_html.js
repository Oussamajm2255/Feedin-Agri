const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'smart-farm-frontend/src/app/features/landing/pages/store/store.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// Replacements
html = html.replace('Boutique Agricole Feedin Green', `{{ 'store.HERO.BADGE' | translate }}`);
html = html.replace('Agriculture intelligente & <span class="accent-text">systèmes innovants</span>', `{{ 'store.HERO.TITLE' | translate }}`);
html = html.replace('Nous concevons et déployons des solutions agricoles avancées intégrant la culture hors sol, les systèmes verticaux et les technologies intelligentes pour optimiser la production.', `{{ 'store.HERO.SUBTITLE' | translate }}`);
html = html.replace('Demander un Devis', `{{ 'store.HERO.BTN_QUOTE' | translate }}`);
html = html.replace('Découvrir nos Solutions', `{{ 'store.HERO.BTN_SOLUTIONS' | translate }}`);
html = html.replace('Matériel Garanti 2 Ans', `{{ 'store.HERO.TRUST_1' | translate }}`);
html = html.replace('Support Réactif 24/7', `{{ 'store.HERO.TRUST_2' | translate }}`);
html = html.replace('Installation Incluse', `{{ 'store.HERO.TRUST_3' | translate }}`);

html = html.replace('Conception Durable', `{{ 'store.INTRO.LABEL' | translate }}`);
html = html.replace('Des Solutions Adaptées au Terrain Tunisien', `{{ 'store.INTRO.TITLE' | translate }}`);
html = html.replace("De la serre tunnel à l'ombrière, en passant par le plastique agricole et les équipements de fixation, nous fournissons tout le matériel nécessaire pour protéger et optimiser vos cultures dans les conditions climatiques locales.", `{{ 'store.INTRO.SUBTITLE' | translate }}`);

html = html.replace('SERRES & STRUCTURES', `{{ 'store.CATEGORIES.serres' | translate }}`);
html = html.replace('MATÉRIAUX DE COUVERTURE', `{{ 'store.CATEGORIES.materiaux' | translate }}`);
html = html.replace('ÉQUIPEMENTS & ACCESSOIRES', `{{ 'store.CATEGORIES.accessoires' | translate }}`);
html = html.replace('Serres & Structures', `{{ 'store.CATEGORIES.serres' | translate }}`);
html = html.replace('Matériaux de couverture', `{{ 'store.CATEGORIES.materiaux' | translate }}`);
html = html.replace('Matériaux', `{{ 'store.CATEGORIES.materiaux' | translate }}`);
html = html.replace('Équipements & Accessoires', `{{ 'store.CATEGORIES.accessoires' | translate }}`);
html = html.replace('Équipements', `{{ 'store.CATEGORIES.accessoires' | translate }}`);

html = html.replace('Détails & Specs', `{{ 'store.CARD.BTN_DETAILS' | translate }}`);
html = html.replace('Spécifications Techniques', `{{ 'store.CARD.SPECS_TITLE' | translate }}`);

html = html.replace('Installation & Support', `{{ 'store.INSTALLATION.LABEL' | translate }}`);
html = html.replace("Besoin d'une Installation Professionnelle ?", `{{ 'store.INSTALLATION.TITLE' | translate }}`);
html = html.replace("Notre équipe technique tunisienne vous accompagne du choix des matériaux à l'installation sur votre exploitation. Nous assurons le montage des serres, la mise en place des systèmes de ventilation et le raccordement des équipements d'irrigation.", `{{ 'store.INSTALLATION.DESC' | translate }}`);
html = html.replace('Demander une Installation', `{{ 'store.INSTALLATION.BTN' | translate }}`);

html = html.replace('Mise en Service', `{{ 'store.PROCESS.LABEL' | translate }}`);
html = html.replace('Comment se Déroule Votre Projet ?', `{{ 'store.PROCESS.TITLE' | translate }}`);
html = html.replace("Nous ne nous contentons pas de livrer du matériel. Feedin Green s'engage à assurer la réussite opérationnelle complète de vos investissements agritech.", `{{ 'store.PROCESS.SUBTITLE' | translate }}`);
html = html.replace('Choix du Produit', `{{ 'store.PROCESS.STEP1_TITLE' | translate }}`);
html = html.replace('Sélectionnez la serre ou le matériel adapté à votre culture et surface.', `{{ 'store.PROCESS.STEP1_DESC' | translate }}`);
html = html.replace('Devis Sur Mesure', `{{ 'store.PROCESS.STEP2_TITLE' | translate }}`);
html = html.replace("Étude personnalisée avec dimensions, options et coût d'installation.", `{{ 'store.PROCESS.STEP2_DESC' | translate }}`);
html = html.replace('Livraison & Montage', `{{ 'store.PROCESS.STEP3_TITLE' | translate }}`);
html = html.replace('Livraison sur site et installation par nos équipes techniques qualifiées.', `{{ 'store.PROCESS.STEP3_DESC' | translate }}`);
html = html.replace('Support Après-Vente', `{{ 'store.PROCESS.STEP4_TITLE' | translate }}`);
html = html.replace('Assistance technique, pièces de rechange et maintenance disponibles.', `{{ 'store.PROCESS.STEP4_DESC' | translate }}`);
html = html.replace('Planifier un Diagnostic Gratuit', `{{ 'store.PROCESS.BTN' | translate }}`);

html = html.replace('Étude Personnalisée', `{{ 'store.DRAWER.BADGE' | translate }}`);
html = html.replace('Demande de Devis', `{{ 'store.DRAWER.TITLE' | translate }}`);
html = html.replace('Remplissez ce formulaire pour recevoir un devis détaillé sur nos serres, structures et équipements agricoles. Réponse sous 24h.', `{{ 'store.DRAWER.DESC' | translate }}`);
html = html.replace('Votre Sélection de Produits', `{{ 'store.DRAWER.SELECTION_TITLE' | translate }}`);
html = html.replace('Aucun produit sélectionné. Ajoutez-en un pour commencer.', `{{ 'store.DRAWER.EMPTY_SELECTION' | translate }}`);
html = html.replace("Ajouter d'autres produits à votre devis :", `{{ 'store.DRAWER.QUICK_ADD' | translate }}`);
html = html.replace('Vos Informations', `{{ 'store.DRAWER.FORM_TITLE' | translate }}`);
html = html.replace('Nom & Prénom', `{{ 'store.DRAWER.NAME' | translate }}`);
html = html.replace('Adresse E-mail', `{{ 'store.DRAWER.EMAIL' | translate }}`);
html = html.replace('Numéro de Téléphone', `{{ 'store.DRAWER.PHONE' | translate }}`);
html = html.replace('Surface Agricole (ha)', `{{ 'store.DRAWER.FARM_SIZE' | translate }}`);
html = html.replace('Ville & Gouvernorat', `{{ 'store.DRAWER.CITY' | translate }}`);
html = html.replace('Description de votre projet (Cultures, besoins spécifiques...)', `{{ 'store.DRAWER.MESSAGE_LABEL' | translate }}`);
html = html.replace("Ex: Serre de tomates sous abri de 2 hectares, besoin de régulation automatisée et mesure d'humidité du sol.", `{{ 'store.DRAWER.MESSAGE_PLACEHOLDER' | translate }}`);
html = html.replace('Le nom complet est obligatoire (min 3 caractères).', `{{ 'store.DRAWER.ERR_NAME' | translate }}`);
html = html.replace('Veuillez entrer une adresse e-mail valide.', `{{ 'store.DRAWER.ERR_EMAIL' | translate }}`);
html = html.replace('Le numéro de téléphone est obligatoire.', `{{ 'store.DRAWER.ERR_PHONE' | translate }}`);
html = html.replace('Supérieur à 0.1 hectare.', `{{ 'store.DRAWER.ERR_SIZE' | translate }}`);
html = html.replace('Ce champ est obligatoire.', `{{ 'store.DRAWER.ERR_CITY' | translate }}`);
html = html.replace('La description doit contenir au moins 10 caractères.', `{{ 'store.DRAWER.ERR_MESSAGE' | translate }}`);
html = html.replace('Soumettre ma Demande', `{{ 'store.DRAWER.BTN_SUBMIT' | translate }}`);

// Fix products -> products()
html = html.replace(/let p of products/g, 'let p of products()');
html = html.replace(/products\.length/g, 'products().length');

// Special cases that need precise regex to not accidentally replace generic things
html = html.replace(/>\s*Demander Devis\s*</g, `>{{ 'store.CARD.BTN_QUOTE' | translate }}<`);

// Write back
fs.writeFileSync(htmlPath, html);
console.log('Successfully updated store.html');
