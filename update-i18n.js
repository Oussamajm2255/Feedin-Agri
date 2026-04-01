const fs = require('fs');
const path = require('path');

const i18nPath = path.join(__dirname, 'smart-farm-frontend', 'src', 'assets', 'i18n');
console.log('Checking path:', i18nPath);

const translations = {
  fr: {
    hero: {
      label: "Nos Réalisations",
      title1: "Cultiver ",
      title2: "l'Avenir de l'Agriculture",
      sub: "Découvrez comment Feedin Green transforme le secteur agricole avec des serres connectées, des systèmes hydroponiques et des innovations R&D en Tunisie et en Afrique.",
      cta1: "Explorer les Projets",
      cta2: "Lancer votre projet",
      stat1: "Projets Réalisés",
      stat2: "Agriculteurs Formés",
      stat3: "Plantes Cultivées"
    },
    featured: {
      badge: "Projet Phare Européen",
      title: "Projet de R&D : Intégration UDENE",
      desc: "Intégration de l'outil UDENE dans notre processus de modernisation des exploitations agricoles, en collaboration avec l'Union Européenne.",
      r1: "Précision",
      r2: "Efficacité",
      r3: "Durabilité",
      cta: "Voir les détails",
      imgAlt: "Projet R&D UDENE"
    },
    grid: {
      label: "Nos Projets",
      title: "Innovations AgTech",
      sub: "Des unités de recherche aux serres intelligentes pour maximiser la rentabilité.",
      cardCta: "Voir plus"
    },
    cards: [
      {
        category: "R&D",
        title: "Unité de Recherche et Développement",
        desc: "Mise en place de systèmes hydroponiques en intérieur pour optimiser les nutriments, accélérer la croissance et minimiser la consommation en eau.",
        tags: ["Recherche", "Hydroponie", "Indoor"]
      },
      {
        category: "Déploiement",
        title: "Serres intelligents 6x60 m²",
        desc: "Développement et installation de serres connectées à grande échelle (360m²) avec une gestion climatique automatisée et suivi en temps réel.",
        tags: ["Serre Intelligente", "Automatisation", "Rendement"]
      },
      {
        category: "Logiciel",
        title: "Dashboard de Supervision Agricole",
        desc: "Plateforme IoT centralisée pour suivre l'humidité du sol, la fertigation et l'état des cultures depuis une interface unique.",
        tags: ["Supervision", "Data", "IoT"]
      }
    ],
    process: {
      label: "Notre Méthode",
      title: "Comment nous opérons",
      steps: [
        {title: "Étude", desc: "Diagnostic agronomique"},
        {title: "Conception", desc: "Plans & Architecture"},
        {title: "Déploiement", desc: "Installation sur site"},
        {title: "Automatisation", desc: "Lancement IoT"},
        {title: "Suivi", desc: "Monitoring continu"}
      ]
    },
    testimonial: {
      quote: "Ces projets de modernisation ont radicalement changé notre approche de l'agriculture, alliant technologie et respect des ressources.",
      name: "Union Européenne",
      role: "Partenaire Projet UDENE"
    },
    cta: {
      title: "Prêt à transformer votre exploitation ?",
      desc: "Rejoignez la révolution de l'agriculture intelligente.",
      btn1: "Contactez-nous",
      btn2: "Nos Services"
    },
    soon: {
      title: "Encore Plus d'Innovations à Venir...",
      desc: "Restez à l'écoute ! Nous travaillons sur plusieurs projets révolutionnaires dans le domaine de la technologie agricole qui vont redéfinir notre secteur."
    }
  },
  en: {
    hero: {
      label: "Our Achievements",
      title1: "Cultivating ",
      title2: "the Future of Agriculture",
      sub: "Discover how Feedin Green is transforming the agricultural sector with connected greenhouses, hydroponic systems, and R&D innovations in Tunisia and Africa.",
      cta1: "Explore Projects",
      cta2: "Start your project",
      stat1: "Projects Completed",
      stat2: "Farmers Trained",
      stat3: "Plants Grown"
    },
    featured: {
      badge: "Flagship Project",
      title: "R&D Project: UDENE Integration",
      desc: "Integration of the UDENE space tool into our agricultural modernization process for optimal parcel monitoring, in collaboration with the European Union.",
      r1: "Precision",
      r2: "Efficiency",
      r3: "Sustainability",
      cta: "View details",
      imgAlt: "UDENE R&D Project"
    },
    grid: {
      label: "Our Projects",
      title: "AgTech Innovations",
      sub: "From research units to intelligent greenhouses to maximize profitability.",
      cardCta: "Read more"
    },
    cards: [
      {
        category: "R&D",
        title: "Research and Development Unit",
        desc: "Setup of indoor hydroponic systems to optimize nutrients, accelerate growth, and minimize water consumption.",
        tags: ["Research", "Hydroponics", "Indoor"]
      },
      {
        category: "Deployment",
        title: "Smart Greenhouses 6x60 m²",
        desc: "Development and installation of large-scale connected greenhouses (360m²) with automated climate management and real-time tracking.",
        tags: ["Smart Greenhouse", "Automation", "Yield"]
      },
      {
        category: "Software",
        title: "Agricultural Supervision Dashboard",
        desc: "Centralized IoT platform to track soil moisture, fertigation, and crop health from a single interface.",
        tags: ["Supervision", "Data", "IoT"]
      }
    ],
    process: {
      label: "Our Method",
      title: "How we operate",
      steps: [
        {title: "Study", desc: "Agronomic diagnosis"},
        {title: "Design", desc: "Plans & Architecture"},
        {title: "Deployment", desc: "On-site installation"},
        {title: "Automation", desc: "IoT Launch"},
        {title: "Follow-up", desc: "Continuous monitoring"}
      ]
    },
    testimonial: {
      quote: "These modernization projects have radically changed our approach to farming, combining technology with resource respect.",
      name: "European Union",
      role: "UDENE Project Partner"
    },
    cta: {
      title: "Ready to transform your farm?",
      desc: "Join the revolution of smart agriculture today.",
      btn1: "Contact Us",
      btn2: "Our Services"
    },
    soon: {
        title: "More Innovations Coming Soon...",
        desc: "Stay tuned! We are working on multiple revolutionary projects in the agricultural technology field that will redefine our industry."
    }
  },
  ar: {
    hero: {
      label: "إنجازاتنا",
      title1: "نزرع ",
      title2: "مستقبل الزراعة",
      sub: "اكتشف كيف تقوم فيدين جرين بتحويل القطاع الزراعي من خلال البيوت المحمية المتصلة والأنظمة المائية وابتكارات البحث والتطوير.",
      cta1: "استكشف المشاريع",
      cta2: "ابدأ مشروعك",
      stat1: "المشاريع المنجزة",
      stat2: "المزارعين المدربين",
      stat3: "النباتات المزروعة"
    },
    featured: {
      badge: "مشروع رائد",
      title: "مشروع البحث والتطوير: تكامل أداة UDENE",
      desc: "دمج أداة UDENE الفضائية في عملية تحديث المزارع الخاصة بنا للمراقبة المثلى للقطع الأرضية، بالتعاون مع الاتحاد الأوروبي.",
      r1: "دقة",
      r2: "كفاءة",
      r3: "استدامة",
      cta: "عرض التفاصيل",
      imgAlt: "مشروع UDENE"
    },
    grid: {
      label: "مشاريعنا",
      title: "ابتكارات التكنولوجيا الزراعية",
      sub: "من وحدات البحث إلى البيوت الزراعية الذكية لزيادة الربحية.",
      cardCta: "المزيد"
    },
    cards: [
      {
        category: "البحث والتطوير",
        title: "وحدة البحث والتطوير",
        desc: "إعداد أنظمة الزراعة المائية الداخلية لتحسين المغذيات وتسريع النمو وتقليل استهلاك المياه.",
        tags: ["بحوث", "زراعة مائية", "داخلي"]
      },
      {
        category: "النشر",
        title: "البيوت الزراعية الذكية 6x60 م²",
        desc: "تطوير وتركيب بيوت زراعية متصلة ومكيفة على نطاق واسع.",
        tags: ["بيوت ذكية", "أتمتة", "إنتاج"]
      },
      {
        category: "برمجيات",
        title: "لوحة تحكم للإشراف الزراعي",
        desc: "منصة مركزية لمراقبة رطوبة التربة والري والتسميد وحالة المحاصيل من واجهة واحدة.",
        tags: ["إشراف", "بيانات", "إنترنت الأشياء"]
      }
    ],
    process: {
      label: "منهجيتنا",
      title: "كيف نعمل",
      steps: [
        {title: "دراسة", desc: "تشخيص زراعي"},
        {title: "تصميم", desc: "خطط وهندسة"},
        {title: "نشر", desc: "تركيب بالموقع"},
        {title: "أتمتة", desc: "إطلاق الأنظمة"},
        {title: "متابعة", desc: "مراقبة مستمرة"}
      ]
    },
    testimonial: {
      quote: "لقد غيرت مشاريع التحديث هذه نهجنا في الزراعة بشكل جذري، حيث جمعت بين التكنولوجيا واحترام الموارد.",
      name: "الاتحاد الأوروبي",
      role: "شريك مشروع UDENE"
    },
    cta: {
      title: "جاهز لتغيير مزرعتك؟",
      desc: "انضم إلى ثورة الزراعة الذكية.",
      btn1: "اتصل بنا",
      btn2: "خدماتنا"
    },
    soon: {
        title: "المزيد من الابتكارات قريباً...",
        desc: "ابقوا متابعين! نحن نعمل على عدة مشاريع ثورية في مجال التكنولوجيا الزراعية التي ستعيد تعريف هذا القطاع."
    }
  }
};

const map = {
  'fr-FR.json': 'fr',
  'en-US.json': 'en',
  'ar-TN.json': 'ar'
};

for (const [file, lang] of Object.entries(map)) {
  const filePath = path.join(i18nPath, file);
  if (fs.existsSync(filePath)) {
    const raw = fs.readFileSync(filePath, 'utf8');
    let data = JSON.parse(raw);
    if (!data.landing) data.landing = {};
    data.landing.projects = translations[lang];
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Updated ${file}`);
  } else {
    console.log(`File not found: ${filePath}`);
  }
}
