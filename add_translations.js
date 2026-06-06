const fs = require('fs');
const path = require('path');

const enUSPath = path.join(__dirname, 'smart-farm-frontend/src/assets/i18n/en-US.json');
const frFRPath = path.join(__dirname, 'smart-farm-frontend/src/assets/i18n/fr-FR.json');
const arTNPath = path.join(__dirname, 'smart-farm-frontend/src/assets/i18n/ar-TN.json');

const enUSStore = {
  "HERO": {
    "BADGE": "Feedin Green Agricultural Store",
    "TITLE": "Smart Agriculture & <span class=\"accent-text\">innovative systems</span>",
    "SUBTITLE": "We design and deploy advanced agricultural solutions integrating soilless culture, vertical systems, and smart technologies to optimize production.",
    "BTN_QUOTE": "Request a Quote",
    "BTN_SOLUTIONS": "Discover our Solutions",
    "TRUST_1": "2-Year Equipment Warranty",
    "TRUST_2": "24/7 Responsive Support",
    "TRUST_3": "Installation Included"
  },
  "INTRO": {
    "LABEL": "Sustainable Design",
    "TITLE": "Solutions Adapted to Tunisian Terrain",
    "SUBTITLE": "From tunnel greenhouses to shade structures, agricultural plastics, and fixing equipment, we provide everything needed to protect and optimize your crops under local climate conditions."
  },
  "CATEGORIES": {
    "all": "All Products",
    "serres": "Greenhouses & Structures",
    "materiaux": "Covering Materials",
    "accessoires": "Equipment & Accessories"
  },
  "PRODUCTS": {
    "SERRE_MULTI_CHAPELLE": {
      "NAME": "Multi-Span Greenhouse",
      "BADGE": "Pro Structure",
      "DESC": "A greenhouse composed of several attached spans. Thanks to its robust galvanized steel structure and plastic film or polycarbonate cover, it guarantees excellent resistance to climatic conditions. It creates a controlled environment, ideal for maximizing agricultural yield year-round.",
      "SPECS": [
        "Modular structure adaptable to your needs",
        "High-resistance galvanized steel frame",
        "Available widths: 4m to 12.8m (or custom)",
        "Side and roof ventilation for optimal climate",
        "Compatible with irrigation and fertigation systems",
        "Cover: agricultural plastic, polycarbonate, or net"
      ],
      "FEATURES": ["Modular", "Galvanized Steel", "Custom", "Optimal Ventilation"]
    },
    "SERRE_TUNNEL": {
      "NAME": "Tunnel Greenhouse",
      "BADGE": "Economic",
      "DESC": "The tunnel greenhouse is a simple, economic, and effective solution to protect your crops year-round. Its hoop structure covered with plastic film creates a microclimate favorable for plant growth. Easy to install and maintain, it is particularly suited for small and medium-sized farms.",
      "SPECS": [
        "Galvanized steel hoop structure",
        "Available widths: 4m to 9m (or custom)",
        "Variable height according to needs",
        "Agricultural plastic film cover",
        "Side ventilation system (manual or motorized)",
        "Simple and quick assembly"
      ],
      "FEATURES": ["Economic", "Quick to Build", "Optimal Microclimate", "SME Adapted"]
    },
    "SERRE_JARDIN": {
      "NAME": "Garden Greenhouse",
      "BADGE": "Amateur & Pro",
      "DESC": "The garden greenhouse is ideal for gardening enthusiasts wanting to grow plants under optimal conditions. It protects crops against bad weather, cold, and climate variations while promoting growth. Compact and aesthetic, it easily fits into any garden.",
      "SPECS": [
        "Lightweight aluminum or galvanized steel structure",
        "Lengths: 2.3m to 10m",
        "Height: 2.20 to 2.50m",
        "Polycarbonate or plastic film",
        "Dimensions adapted for small spaces",
        "Access door with locking system",
        "Good light transmission",
        "Simple and quick assembly"
      ],
      "FEATURES": ["Compact", "Aesthetic", "Lightweight", "Easy to Build"]
    },
    "STRUCTURE_OMBRIERE": {
      "NAME": "Shade Structure",
      "BADGE": "UV Protection",
      "DESC": "The shade structure is designed to protect crops against excessive sunlight and heat. Equipped with shade nets, it reduces light intensity while ensuring good air circulation. Ideal for nurseries, sensitive crops, and hot climate areas.",
      "SPECS": [
        "Corrosion-resistant galvanized steel structure",
        "Shade nets available in different rates (50%, 70%)",
        "Customizable height and dimensions (3-4m)",
        "Length: multiple of 2m or 3m",
        "Width: multiple of 6m or 9m",
        "Fixed or removable installation",
        "Good wind resistance",
        "Adapted to different types of crops"
      ],
      "FEATURES": ["Anti-UV", "Customizable", "Fixed or Mobile", "Resistant"]
    },
    "EQUIPEMENTS_SERRES": {
      "NAME": "Greenhouse Equipment",
      "BADGE": "Pro Accessories",
      "DESC": "We offer a complete range of equipment for agricultural greenhouses. Designed with materials resistant to corrosion and climatic conditions, our products ensure a reliable, durable installation adapted to all types of structures.",
      "SPECS": [
        "Fixing clips: secure hold of plastic film, UV resistance",
        "Galvanized hoops: robust structure, high corrosion resistance",
        "Clamps: solid and durable assembly of elements",
        "Tension wire (Nylstrong): optimal hold, tensile strength",
        "Screws and bolts: reliable fixing, long lifespan",
        "Mounting accessories: simple and fast installation"
      ],
      "FEATURES": ["UV Clips", "Galvanized Steel", "Nylstrong", "Pro Screws"]
    },
    "PLASTIQUE_SERRE": {
      "NAME": "Greenhouse Plastic",
      "BADGE": "Essential",
      "DESC": "Greenhouse plastic is an essential element to protect your crops and create an optimal environment for their development. It maintains temperature, protects against wind and rain, while letting through the light necessary for photosynthesis.",
      "SPECS": [
        "Materials: polyethylene (PE), polycarbonate, or UV stabilized film",
        "Thickness: 180 to 200 microns",
        "UV protection to extend lifespan",
        "Transparent or diffusing depending on the crop type",
        "Compatible with all greenhouse structures",
        "Resistant to bad weather and temperature variations"
      ],
      "FEATURES": ["PE / Polycarbonate", "UV Stabilized", "180-200 microns", "Transparent/Diffusing"]
    },
    "SCOTCH_REPARATION": {
      "NAME": "Plastic Repair Tape",
      "BADGE": "Practical",
      "DESC": "Greenhouse plastic repair tape is a practical and essential accessory to extend the life of your plastic films. It allows you to quickly repair tears, cracks, or holes in your greenhouses without having to replace the entire film.",
      "SPECS": [
        "Width: 7.5cm",
        "Length: 25m roll",
        "UV and weather resistant",
        "Powerful adhesive compatible with polyethylene and polycarbonate",
        "Transparent or semi-transparent",
        "Easy to cut and apply"
      ],
      "FEATURES": ["7.5cm x 25m", "Anti-UV", "Powerful Adhesive", "Transparent"]
    },
    "TOILE_HORS_SOL": {
      "NAME": "Ground Cover Fabric",
      "BADGE": "Soil Protection",
      "DESC": "Ground cover fabric is a protective covering intended to cover your crops or structures without direct contact with the soil. It offers effective protection against wind, sun, and certain pests, while promoting plant development.",
      "SPECS": [
        "Made with UV stabilized polypropylene",
        "Different densities available: 90g/m², 100g/m², 110g/m²",
        "UV and weather resistant",
        "Available in rolls",
        "Lightweight and easy to install",
        "Adapted to crops on tables or soilless structures"
      ],
      "FEATURES": ["UV Polypropylene", "90-110g/m²", "Rolls", "Lightweight"]
    },
    "FILET_PROTECTION": {
      "NAME": "Protection Net",
      "BADGE": "Full Range",
      "DESC": "Optimize your agricultural performance with our complete range of technical nets and professional fabrics. Our shade nets, insect-proof, and anti-hail nets offer overall protection of your crops against climatic and biological attacks.",
      "SPECS": [
        "Shade nets: precise regulation of sunshine and heat reduction",
        "Insect-proof nets: effective barrier against pests with excellent ventilation",
        "Anti-hail nets: reinforced protection against impacts and bad weather",
        "Ground covers: optimal weed control and effective moisture management"
      ],
      "FEATURES": ["Shade Net", "Insect-Proof", "Anti-Hail", "Ground Cover"]
    }
  },
  "CARD": {
    "BTN_DETAILS": "Details & Specs",
    "BTN_BACK": "Return",
    "SPECS_TITLE": "Technical Specifications",
    "BTN_QUOTE": "Request Quote"
  },
  "INSTALLATION": {
    "LABEL": "Installation & Support",
    "TITLE": "Need a Professional Installation?",
    "DESC": "Our technical team supports you from the choice of materials to the installation on your farm. We handle greenhouse assembly, ventilation systems, and irrigation equipment connections.",
    "BTN": "Request an Installation"
  },
  "PROCESS": {
    "LABEL": "Commissioning",
    "TITLE": "How Does Your Project Work?",
    "SUBTITLE": "We do more than just deliver equipment. Feedin Green is committed to ensuring the complete operational success of your agritech investments.",
    "STEP1_TITLE": "Product Choice",
    "STEP1_DESC": "Select the greenhouse or equipment suitable for your crop and area.",
    "STEP2_TITLE": "Custom Quote",
    "STEP2_DESC": "Personalized study with dimensions, options, and installation costs.",
    "STEP3_TITLE": "Delivery & Assembly",
    "STEP3_DESC": "On-site delivery and installation by our qualified technical teams.",
    "STEP4_TITLE": "After-Sales Support",
    "STEP4_DESC": "Technical assistance, spare parts, and maintenance available.",
    "BTN": "Schedule a Free Diagnostic"
  },
  "DRAWER": {
    "BADGE": "Custom Study",
    "TITLE": "Quote Request",
    "DESC": "Fill out this form to receive a detailed quote on our greenhouses, structures, and agricultural equipment. Reply within 24 hours.",
    "SELECTION_TITLE": "Your Product Selection",
    "EMPTY_SELECTION": "No products selected. Add one to start.",
    "QUICK_ADD": "Add other products to your quote:",
    "FORM_TITLE": "Your Information",
    "NAME": "Full Name",
    "EMAIL": "Email Address",
    "PHONE": "Phone Number",
    "FARM_SIZE": "Agricultural Area (ha)",
    "CITY": "City & Governorate",
    "MESSAGE_LABEL": "Project Description (Crops, specific needs...)",
    "MESSAGE_PLACEHOLDER": "Ex: 2 hectare tomato greenhouse, need automated regulation and soil moisture measurement.",
    "ERR_NAME": "Full name is required (min 3 characters).",
    "ERR_EMAIL": "Please enter a valid email address.",
    "ERR_PHONE": "Phone number is required.",
    "ERR_SIZE": "Must be greater than 0.1 hectare.",
    "ERR_CITY": "This field is required.",
    "ERR_MESSAGE": "The description must contain at least 10 characters.",
    "BTN_SUBMIT": "Submit my Request"
  }
};

const frFRStore = {
  "HERO": {
    "BADGE": "Boutique Agricole Feedin Green",
    "TITLE": "Agriculture intelligente & <span class=\"accent-text\">systèmes innovants</span>",
    "SUBTITLE": "Nous concevons et déployons des solutions agricoles avancées intégrant la culture hors sol, les systèmes verticaux et les technologies intelligentes pour optimiser la production.",
    "BTN_QUOTE": "Demander un Devis",
    "BTN_SOLUTIONS": "Découvrir nos Solutions",
    "TRUST_1": "Matériel Garanti 2 Ans",
    "TRUST_2": "Support Réactif 24/7",
    "TRUST_3": "Installation Incluse"
  },
  "INTRO": {
    "LABEL": "Conception Durable",
    "TITLE": "Des Solutions Adaptées au Terrain Tunisien",
    "SUBTITLE": "De la serre tunnel à l'ombrière, en passant par le plastique agricole et les équipements de fixation, nous fournissons tout le matériel nécessaire pour protéger et optimiser vos cultures dans les conditions climatiques locales."
  },
  "CATEGORIES": {
    "all": "Tous les produits",
    "serres": "Serres & Structures",
    "materiaux": "Matériaux de couverture",
    "accessoires": "Équipements & Accessoires"
  },
  "PRODUCTS": {
    "SERRE_MULTI_CHAPELLE": {
      "NAME": "Serre Multi Chapelle",
      "BADGE": "Structure Pro",
      "DESC": "C'est une serre composée de plusieurs chapelles accolées. Grâce à sa structure robuste en acier galvanisé et à sa couverture en film plastique ou polycarbonate, elle garantit une excellente résistance aux conditions climatiques (vent, pluie, chaleur). Elle permet également de créer un environnement contrôlé, idéal pour maximiser le rendement agricole tout au long de l'année.",
      "SPECS": [
        "Structure modulaire adaptable selon vos besoins",
        "Ossature en acier galvanisé haute résistance",
        "Largeurs disponibles : 4m à 12,8m (ou plus sur mesure)",
        "Ventilation latérale et zénithale pour un climat optimal",
        "Compatible avec systèmes d'irrigation et de fertigation",
        "Couverture : plastique agricole, polycarbonate ou filet"
      ],
      "FEATURES": ["Modulaire", "Acier Galvanisé", "Sur Mesure", "Ventilation Optimale"]
    },
    "SERRE_TUNNEL": {
      "NAME": "Serre Tunnel",
      "BADGE": "Économique",
      "DESC": "La serre tunnel est une solution simple, économique et efficace pour protéger vos cultures tout au long de l'année. Sa structure en arceaux recouverts de film plastique permet de créer un microclimat favorable à la croissance des plantes. Facile à installer et à entretenir, elle est particulièrement adaptée aux exploitations agricoles de petite et moyenne taille.",
      "SPECS": [
        "Structure en arceaux en acier galvanisé",
        "Largeurs disponibles : 4m à 9m (ou sur mesure)",
        "Hauteur variable selon les besoins",
        "Couverture en film plastique agricole",
        "Système de ventilation latérale (manuelle ou motorisée)",
        "Montage simple et rapide"
      ],
      "FEATURES": ["Économique", "Rapide à Monter", "Microclimat Optimal", "PME Adaptée"]
    },
    "SERRE_JARDIN": {
      "NAME": "Serre Jardin",
      "BADGE": "Amateur & Pro",
      "DESC": "La serre de jardin est idéale pour les amateurs de jardinage souhaitant cultiver leurs plantes dans des conditions optimales. Elle permet de protéger les cultures contre les intempéries, le froid et les variations climatiques tout en favorisant leur croissance. Compacte et esthétique, elle s'intègre facilement dans tout type de jardin.",
      "SPECS": [
        "Structure légère en aluminium ou acier galvanisé",
        "Longueurs : de 2.3m à 10m",
        "Hauteur de la serre : 2.20 à 2.50m",
        "En polycarbonate ou film plastique",
        "Dimensions adaptées aux petits espaces",
        "Porte d'accès avec système de fermeture",
        "Bonne transmission de la lumière",
        "Montage simple et rapide"
      ],
      "FEATURES": ["Compacte", "Esthétique", "Légère", "Facile à Monter"]
    },
    "STRUCTURE_OMBRIERE": {
      "NAME": "Structure Ombrière",
      "BADGE": "Protection UV",
      "DESC": "La structure ombrière est conçue pour protéger les cultures contre l'excès d'ensoleillement et les fortes chaleurs. Équipée de filets d'ombrage, elle permet de réduire l'intensité lumineuse tout en assurant une bonne circulation de l'air. Idéale pour les pépinières, les cultures sensibles et les zones à climat chaud.",
      "SPECS": [
        "Structure en acier galvanisé résistante à la corrosion",
        "Filets d'ombrage disponibles en différents taux (50%, 70%)",
        "Hauteur et dimensions personnalisables (3-4m)",
        "Longueur : multiple de 2m ou 3m",
        "Largeur : multiple de 6m ou 9m",
        "Installation fixe ou démontable",
        "Bonne résistance au vent et aux conditions extérieures",
        "Adaptée à différents types de cultures"
      ],
      "FEATURES": ["Anti-UV", "Personnalisable", "Fixe ou Mobile", "Résistante"]
    },
    "EQUIPEMENTS_SERRES": {
      "NAME": "Équipements des Serres",
      "BADGE": "Accessoires Pro",
      "DESC": "Nous proposons une gamme complète d'équipements pour serres agricoles. Conçus avec des matériaux résistants à la corrosion et aux conditions climatiques, nos produits assurent une installation fiable, durable et adaptée à tous types de structures, garantissant la stabilité et la performance optimale de votre serre.",
      "SPECS": [
        "Clips de fixation : maintien sécurisé du film plastique, résistance aux UV",
        "Arceaux galvanisés : structure robuste, haute résistance à la corrosion",
        "Colliers de serrage : assemblage solide et durable des éléments",
        "Fil de tension (Nylstrong) : maintien optimal de la bâche, résistance à la traction",
        "Visserie et boulonnerie : fixation fiable, longue durée de vie",
        "Accessoires de montage : installation simple et rapide"
      ],
      "FEATURES": ["Clips UV", "Acier Galvanisé", "Nylstrong", "Visserie Pro"]
    },
    "PLASTIQUE_SERRE": {
      "NAME": "Plastique de Serre",
      "BADGE": "Indispensable",
      "DESC": "Le plastique de serre est un élément indispensable pour protéger vos cultures et créer un environnement optimal pour leur développement. Il permet de maintenir la température, de protéger contre le vent et la pluie, tout en laissant passer la lumière nécessaire à la photosynthèse.",
      "SPECS": [
        "Matériaux : polyéthylène (PE), polycarbonate ou film UV stabilisé",
        "Épaisseur : 180 à 200 microns",
        "Protection UV pour prolonger la durée de vie",
        "Transparent ou diffusant selon le type de culture",
        "Compatible avec toutes les structures de serre",
        "Résistant aux intempéries et aux variations de température"
      ],
      "FEATURES": ["PE / Polycarbonate", "UV Stabilisé", "180-200 microns", "Transparent/Diffusant"]
    },
    "SCOTCH_REPARATION": {
      "NAME": "Scotch Réparation Plastique",
      "BADGE": "Pratique",
      "DESC": "Le scotch pour réparation de plastique de serre est un accessoire pratique et indispensable pour prolonger la durée de vie de vos films plastiques. Il permet de réparer rapidement les déchirures, fissures ou trous dans vos serres sans avoir à remplacer tout le film.",
      "SPECS": [
        "Largeur : 7.5cm",
        "Longueur : rouleau de 25m",
        "Résistant aux UV et aux intempéries",
        "Adhésif puissant compatible avec polyéthylène et polycarbonate",
        "Transparent ou semi-transparent pour ne pas réduire la lumière",
        "Facile à découper et à appliquer"
      ],
      "FEATURES": ["7.5cm x 25m", "Anti-UV", "Adhésif Puissant", "Transparent"]
    },
    "TOILE_HORS_SOL": {
      "NAME": "La Toile Hors Sol",
      "BADGE": "Protection Sol",
      "DESC": "La toile hors sol est un revêtement protecteur destiné à couvrir vos cultures, planches ou structures agricoles sans contact direct avec le sol. Elle offre une protection efficace contre le vent, le soleil et certains nuisibles, tout en favorisant le développement des plantes dans un environnement contrôlé.",
      "SPECS": [
        "Réalisée avec du polypropylène stabilisé au UV",
        "Différentes densités disponibles : 90g/m², 100g/m², 110g/m²",
        "Résistant aux UV et aux intempéries",
        "Disponible en rouleaux",
        "Léger et facile à installer",
        "Adapté aux cultures sur tables, bacs ou structures hors sol"
      ],
      "FEATURES": ["Polypropylène UV", "90-110g/m²", "Rouleaux", "Léger"]
    },
    "FILET_PROTECTION": {
      "NAME": "Filet de Protection",
      "BADGE": "Gamme Complète",
      "DESC": "Optimisez vos performances agricoles avec notre gamme complète de filets techniques et toiles professionnelles. Nos filets ombrières, insect-proof et anti-grêle, ainsi que nos toiles hors sol, offrent une protection globale de vos cultures contre les agressions climatiques et biologiques.",
      "SPECS": [
        "Filets ombrières : régulation précise de l'ensoleillement et réduction de la chaleur",
        "Filets insect-proof : barrière efficace contre les insectes nuisibles avec excellente ventilation",
        "Filets anti-grêle : protection renforcée contre les impacts et intempéries",
        "Toiles hors sol : contrôle optimal des adventices et gestion efficace de l'humidité"
      ],
      "FEATURES": ["Ombrière", "Insect-Proof", "Anti-Grêle", "Hors Sol"]
    }
  },
  "CARD": {
    "BTN_DETAILS": "Détails & Specs",
    "BTN_BACK": "Retour",
    "SPECS_TITLE": "Spécifications Techniques",
    "BTN_QUOTE": "Demander Devis"
  },
  "INSTALLATION": {
    "LABEL": "Installation & Support",
    "TITLE": "Besoin d'une Installation Professionnelle ?",
    "DESC": "Notre équipe technique tunisienne vous accompagne du choix des matériaux à l'installation sur votre exploitation. Nous assurons le montage des serres, la mise en place des systèmes de ventilation et le raccordement des équipements d'irrigation.",
    "BTN": "Demander une Installation"
  },
  "PROCESS": {
    "LABEL": "Mise en Service",
    "TITLE": "Comment se Déroule Votre Projet ?",
    "SUBTITLE": "Nous ne nous contentons pas de livrer du matériel. Feedin Green s'engage à assurer la réussite opérationnelle complète de vos investissements agritech.",
    "STEP1_TITLE": "Choix du Produit",
    "STEP1_DESC": "Sélectionnez la serre ou le matériel adapté à votre culture et surface.",
    "STEP2_TITLE": "Devis Sur Mesure",
    "STEP2_DESC": "Étude personnalisée avec dimensions, options et coût d'installation.",
    "STEP3_TITLE": "Livraison & Montage",
    "STEP3_DESC": "Livraison sur site et installation par nos équipes techniques qualifiées.",
    "STEP4_TITLE": "Support Après-Vente",
    "STEP4_DESC": "Assistance technique, pièces de rechange et maintenance disponibles.",
    "BTN": "Planifier un Diagnostic Gratuit"
  },
  "DRAWER": {
    "BADGE": "Étude Personnalisée",
    "TITLE": "Demande de Devis",
    "DESC": "Remplissez ce formulaire pour recevoir un devis détaillé sur nos serres, structures et équipements agricoles. Réponse sous 24h.",
    "SELECTION_TITLE": "Votre Sélection de Produits",
    "EMPTY_SELECTION": "Aucun produit sélectionné. Ajoutez-en un pour commencer.",
    "QUICK_ADD": "Ajouter d'autres produits à votre devis :",
    "FORM_TITLE": "Vos Informations",
    "NAME": "Nom & Prénom",
    "EMAIL": "Adresse E-mail",
    "PHONE": "Numéro de Téléphone",
    "FARM_SIZE": "Surface Agricole (ha)",
    "CITY": "Ville & Gouvernorat",
    "MESSAGE_LABEL": "Description de votre projet (Cultures, besoins spécifiques...)",
    "MESSAGE_PLACEHOLDER": "Ex: Serre de tomates sous abri de 2 hectares, besoin de régulation automatisée et mesure d'humidité du sol.",
    "ERR_NAME": "Le nom complet est obligatoire (min 3 caractères).",
    "ERR_EMAIL": "Veuillez entrer une adresse e-mail valide.",
    "ERR_PHONE": "Le numéro de téléphone est obligatoire.",
    "ERR_SIZE": "Supérieur à 0.1 hectare.",
    "ERR_CITY": "Ce champ est obligatoire.",
    "ERR_MESSAGE": "La description doit contenir au moins 10 caractères.",
    "BTN_SUBMIT": "Soumettre ma Demande"
  }
};

function modifyJson(filePath, storeObj) {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    data.store = storeObj;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Updated ${filePath}`);
  } catch (e) {
    console.error(`Failed to update ${filePath}:`, e);
  }
}

modifyJson(enUSPath, enUSStore);
modifyJson(frFRPath, frFRStore);
// For Arabic, just use the French one as a fallback as discussed
modifyJson(arTNPath, frFRStore);
