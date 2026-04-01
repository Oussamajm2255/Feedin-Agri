/**
 * Script to inject landing.projects translations into en-US.json and ar-TN.json
 */
const fs = require('fs');
const path = require('path');

const i18nDir = path.join(__dirname, 'smart-farm-frontend', 'src', 'assets', 'i18n');

const enProjects = {
  "hero": {
    "label": "Our Projects",
    "title1": "Projects that",
    "title2": "transform agriculture",
    "sub": "Discover how we support farmers, institutions, and entrepreneurs in their transition to smart and sustainable agriculture.",
    "cta1": "Discover our projects",
    "cta2": "Contact us",
    "stat1": "Projects delivered",
    "stat2": "Clients supported",
    "stat3": "Hectares covered"
  },
  "featured": {
    "badge": "Flagship project",
    "title": "Connected Greenhouse — El Amra Farm",
    "desc": "Deployment of a 2-hectare connected greenhouse with automated irrigation system, IoT sensors, and real-time monitoring dashboard. Results measured after 6 months of operation.",
    "imgAlt": "Project photo",
    "cta": "Discuss your project",
    "r1": "Water consumption",
    "r2": "Agricultural yield",
    "r3": "Return on investment"
  },
  "grid": {
    "label": "Portfolio",
    "title": "Our recent projects",
    "sub": "Each project is custom-designed to meet the specific needs of our clients.",
    "cardCta": "Learn more"
  },
  "cards": [
    {
      "category": "Connected greenhouse",
      "title": "Smart Greenhouse — Nabeul",
      "desc": "Complete IoT installation for a market garden farm with climate monitoring and automated irrigation.",
      "tags": ["IoT", "Irrigation", "Monitoring"]
    },
    {
      "category": "Irrigation",
      "title": "Irrigation System — Sfax",
      "desc": "Deployment of a smart irrigation network driven by soil moisture sensors.",
      "tags": ["Sensors", "Water", "Automation"]
    },
    {
      "category": "Energy",
      "title": "Solar Greenhouse — Sousse",
      "desc": "Design and construction of an autonomous greenhouse powered by solar panels and storage system.",
      "tags": ["Solar", "Autonomy", "Green Tech"]
    },
    {
      "category": "IoT",
      "title": "Sensor Network — Béja",
      "desc": "Deployment of 200+ connected sensors for real-time monitoring of cereal crops.",
      "tags": ["Sensors", "Data", "Field crops"]
    },
    {
      "category": "Vertical farming",
      "title": "Vertical Farm — Tunis",
      "desc": "Installation of a hydroponic vertical farming system in an urban environment with LED lighting.",
      "tags": ["Hydroponics", "Urban", "LED"]
    },
    {
      "category": "Automation",
      "title": "Full Automation — Bizerte",
      "desc": "Implementation of a comprehensive automation system for a 5-hectare farm.",
      "tags": ["AI", "Automation", "Control"]
    }
  ],
  "process": {
    "label": "Our methodology",
    "title": "How we deliver your projects",
    "steps": [
      { "title": "Analysis", "desc": "Field diagnosis and needs assessment" },
      { "title": "UX/UI", "desc": "Interface and experience design" },
      { "title": "Development", "desc": "Technical development and integration" },
      { "title": "Deployment", "desc": "Installation and go-live" },
      { "title": "Optimization", "desc": "Performance monitoring and adjustments" }
    ]
  },
  "testimonial": {
    "quote": "Thanks to Feedin, our farm has gained in efficiency and peace of mind. Real-time monitoring of our greenhouses allowed us to reduce losses by 40% in the first season.",
    "name": "Mohamed B.",
    "role": "Farmer — Nabeul"
  },
  "cta": {
    "title": "Have an agricultural project?",
    "desc": "Let's talk about it. Our team supports you from idea to production.",
    "btn1": "Request a quote",
    "btn2": "Our services"
  }
};

const arProjects = {
  "hero": {
    "label": "إنجازاتنا",
    "title1": "مشاريع",
    "title2": "تُحوّل الزراعة",
    "sub": "اكتشف كيف ندعم المزارعين والمؤسسات ورواد الأعمال في تحولهم نحو زراعة ذكية ومستدامة.",
    "cta1": "اكتشف مشاريعنا",
    "cta2": "تواصل معنا",
    "stat1": "مشاريع مُنجزة",
    "stat2": "عملاء مرافقون",
    "stat3": "هكتارات مغطاة"
  },
  "featured": {
    "badge": "مشروع رائد",
    "title": "دفيئة متصلة — مزرعة العمرة",
    "desc": "نشر دفيئة متصلة على مساحة 2 هكتار مع نظام ري آلي، أجهزة استشعار إنترنت الأشياء ولوحة متابعة في الوقت الفعلي. نتائج مقاسة بعد 6 أشهر من التشغيل.",
    "imgAlt": "صورة المشروع",
    "cta": "ناقش مشروعك",
    "r1": "استهلاك المياه",
    "r2": "المردود الزراعي",
    "r3": "عائد الاستثمار"
  },
  "grid": {
    "label": "أعمالنا",
    "title": "مشاريعنا الأخيرة",
    "sub": "كل مشروع مصمم خصيصاً لتلبية الاحتياجات الفريدة لعملائنا.",
    "cardCta": "معرفة المزيد"
  },
  "cards": [
    {
      "category": "دفيئة متصلة",
      "title": "دفيئة ذكية — نابل",
      "desc": "تركيب كامل لأجهزة إنترنت الأشياء لمزرعة خضروات مع مراقبة مناخية وري آلي.",
      "tags": ["إنترنت الأشياء", "ري", "مراقبة"]
    },
    {
      "category": "ري",
      "title": "نظام ري — صفاقس",
      "desc": "نشر شبكة ري ذكية يتحكم فيها أجهزة استشعار رطوبة التربة.",
      "tags": ["أجهزة استشعار", "مياه", "أتمتة"]
    },
    {
      "category": "طاقة",
      "title": "دفيئة شمسية — سوسة",
      "desc": "تصميم وإنجاز دفيئة مستقلة تعمل بالألواح الشمسية ونظام تخزين.",
      "tags": ["طاقة شمسية", "استقلالية", "تكنولوجيا خضراء"]
    },
    {
      "category": "إنترنت الأشياء",
      "title": "شبكة أجهزة استشعار — باجة",
      "desc": "نشر أكثر من 200 جهاز استشعار متصل لمتابعة محاصيل الحبوب في الوقت الفعلي.",
      "tags": ["أجهزة استشعار", "بيانات", "زراعة كبرى"]
    },
    {
      "category": "زراعة عمودية",
      "title": "مزرعة عمودية — تونس",
      "desc": "تركيب نظام زراعة عمودية مائية في بيئة حضرية مع إضاءة LED.",
      "tags": ["زراعة مائية", "حضري", "LED"]
    },
    {
      "category": "أتمتة",
      "title": "أتمتة كاملة — بنزرت",
      "desc": "تنفيذ نظام أتمتة شامل لمزرعة بمساحة 5 هكتارات.",
      "tags": ["ذكاء اصطناعي", "أتمتة", "تحكم"]
    }
  ],
  "process": {
    "label": "منهجيتنا",
    "title": "كيف ننجز مشاريعكم",
    "steps": [
      { "title": "التحليل", "desc": "تشخيص ميداني ودراسة الاحتياجات" },
      { "title": "UX/UI", "desc": "تصميم الواجهة والتجربة" },
      { "title": "التطوير", "desc": "التطوير والتكامل التقني" },
      { "title": "النشر", "desc": "التركيب والتشغيل" },
      { "title": "التحسين", "desc": "متابعة الأداء والتعديلات" }
    ]
  },
  "testimonial": {
    "quote": "بفضل فيدين، اكتسبت مزرعتنا كفاءة وطمأنينة. المتابعة الآنية لدفيئاتنا مكنتنا من تقليل الخسائر بنسبة 40% منذ الموسم الأول.",
    "name": "محمد ب.",
    "role": "مزارع — نابل"
  },
  "cta": {
    "title": "لديك مشروع زراعي؟",
    "desc": "دعنا نتحدث عنه معاً. فريقنا يرافقك من الفكرة إلى الإنتاج.",
    "btn1": "طلب عرض أسعار",
    "btn2": "خدماتنا"
  }
};

// Inject into en-US.json
const enPath = path.join(i18nDir, 'en-US.json');
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
if (!enData.landing) enData.landing = {};
enData.landing.projects = enProjects;
fs.writeFileSync(enPath, JSON.stringify(enData, null, 2) + '\n', 'utf8');
console.log('✅ en-US.json updated');

// Inject into ar-TN.json
const arPath = path.join(i18nDir, 'ar-TN.json');
const arData = JSON.parse(fs.readFileSync(arPath, 'utf8'));
if (!arData.landing) arData.landing = {};
arData.landing.projects = arProjects;
fs.writeFileSync(arPath, JSON.stringify(arData, null, 2) + '\n', 'utf8');
console.log('✅ ar-TN.json updated');
