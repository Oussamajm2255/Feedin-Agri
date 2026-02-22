// ============================================
// FEED - Language Switcher
// ============================================

// Get current language from localStorage or default to French
let currentLang = localStorage.getItem('language') || 'fr';

// Function to set language and update page
function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('language', lang);
  
  // Update HTML lang attribute
  document.documentElement.lang = lang;
  
  // Update dir attribute for RTL (Arabic)
  if (lang === 'ar') {
    document.documentElement.dir = 'rtl';
    document.body.classList.add('rtl');
  } else {
    document.documentElement.dir = 'ltr';
    document.body.classList.remove('rtl');
  }
  
  // Update meta description
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    const descriptions = {
      fr: "FEED - Solutions agritech intelligentes et durables pour l'agriculture moderne",
      en: "FEED - Intelligent and sustainable agritech solutions for modern agriculture",
      ar: "FEED - حلول تقنية زراعية ذكية ومستدامة للزراعة الحديثة"
    };
    metaDesc.setAttribute('content', descriptions[lang]);
  }
  
  // Update page title
  const titles = {
    fr: "FEED - Cultiver intelligemment, produire durablement",
    en: "FEED - Grow intelligently, produce sustainably",
    ar: "FEED - زرع بذكاء، إنتاج مستدام"
  };
  document.title = titles[lang];
  
  // Translate all elements with data-translate attribute
  const elements = document.querySelectorAll('[data-translate]');
  elements.forEach(element => {
    const key = element.getAttribute('data-translate');
    const keys = key.split('.');
    let value = translations[lang];
    
    for (let k of keys) {
      if (value && value[k]) {
        value = value[k];
      } else {
        value = null;
        break;
      }
    }
    
    if (value !== null) {
      if (element.tagName === 'INPUT' && element.type === 'text') {
        element.placeholder = value;
      } else if (element.hasAttribute('alt')) {
        element.setAttribute('alt', value);
      } else {
        element.textContent = value;
      }
    }
  });
  
  // Translate arrays (like service items, project items)
  translateArrays(lang);
  
  // Update language dropdown
  updateLanguageDropdown(lang);
}

// Function to translate arrays (services, projects, etc.)
function translateArrays(lang) {
  // Translate service items
  const serviceTitles = document.querySelectorAll('.service__title');
  const serviceDescs = document.querySelectorAll('.service__description');
  const serviceKeys = ['connected', 'vertical', 'automation', 'planning', 'urban', 'training'];
  
  serviceTitles.forEach((title, index) => {
    if (translations[lang]?.services?.items?.[serviceKeys[index]]?.title) {
      title.textContent = translations[lang].services.items[serviceKeys[index]].title;
    }
  });
  
  serviceDescs.forEach((desc, index) => {
    if (translations[lang]?.services?.items?.[serviceKeys[index]]?.desc) {
      desc.textContent = translations[lang].services.items[serviceKeys[index]].desc;
    }
  });
  
  // Translate solution features - handle each solution block separately
  const solutionBlocks = document.querySelectorAll('.solution__block');
  
  solutionBlocks.forEach((block, blockIndex) => {
    const features = block.querySelectorAll('.solution__list li');
    let featureArray = [];
    
    if (blockIndex === 0) {
      // First block: IoT & Capteurs
      featureArray = translations[lang]?.solutions?.iot?.features || [];
    } else if (blockIndex === 1) {
      // Second block: Supervision intelligente
      featureArray = translations[lang]?.solutions?.supervision?.features || [];
    }
    
    features.forEach((feature, index) => {
      if (featureArray[index]) {
        feature.textContent = featureArray[index];
      }
    });
  });
  
  // Translate project titles
  const projectTitles = document.querySelectorAll('.project__title');
  const projectItems = translations[lang]?.projects?.items || [];
  projectTitles.forEach((title, index) => {
    if (projectItems[index]) {
      title.textContent = projectItems[index];
    }
  });
  
  // Translate training programs
  const trainingPrograms = document.querySelectorAll('.formation__list li');
  const programs = translations[lang]?.training?.programs || [];
  trainingPrograms.forEach((program, index) => {
    if (programs[index]) {
      program.textContent = programs[index];
    }
  });
}

// Language flags and names mapping
const languageData = {
  fr: { flag: 'assets/icons/icons france.png', name: 'Français' },
  en: { flag: 'assets/icons/icons england.png', name: 'English' },
  ar: { flag: 'assets/icons/icons tunisia.png', name: 'العربية' }
};

// Function to update language dropdown display
function updateLanguageDropdown(lang) {
  const langData = languageData[lang];
  if (!langData) return;

  // Update all language toggles (desktop and mobile)
  const toggles = document.querySelectorAll('.lang-toggle');
  toggles.forEach(toggle => {
    const flag = toggle.querySelector('.lang-toggle__flag');
    const span = toggle.querySelector('span');
    if (flag) {
      flag.src = langData.flag;
      flag.alt = langData.name;
    }
    if (span && !toggle.classList.contains('lang-toggle--mobile')) {
      // Only update text for desktop toggle, mobile has separate span
      const textSpan = Array.from(toggle.childNodes).find(node => 
        node.nodeType === 3 || (node.nodeType === 1 && node.tagName === 'SPAN' && !node.classList.contains('lang-toggle__arrow'))
      );
      if (textSpan && textSpan.textContent) {
        textSpan.textContent = langData.name;
      }
    }
  });

  // Update mobile toggle text separately
  const mobileToggle = document.querySelector('.lang-toggle--mobile');
  if (mobileToggle) {
    const mobileSpan = Array.from(mobileToggle.childNodes).find(node => 
      node.nodeType === 1 && node.tagName === 'SPAN' && !node.classList.contains('lang-toggle__arrow')
    );
    if (mobileSpan) {
      mobileSpan.textContent = langData.name;
    }
  }

  // Update active state in dropdown menus
  const options = document.querySelectorAll('.lang-menu__item');
  options.forEach(option => {
    const optionLang = option.getAttribute('data-lang');
    if (optionLang === lang) {
      option.classList.add('active');
    } else {
      option.classList.remove('active');
    }
  });

  // Close all dropdowns
  closeAllDropdowns();
}

// Function to close all dropdowns
function closeAllDropdowns() {
  const menus = document.querySelectorAll('.lang-menu');
  const toggles = document.querySelectorAll('.lang-toggle');
  
  menus.forEach(menu => {
    menu.classList.remove('active');
  });
  toggles.forEach(toggle => toggle.setAttribute('aria-expanded', 'false'));
}

// Initialize language on page load
document.addEventListener('DOMContentLoaded', () => {
  setLanguage(currentLang);
  
  // Add event listeners to language toggles
  const toggles = document.querySelectorAll('.lang-toggle');
  const menus = document.querySelectorAll('.lang-menu');
  
  // Ensure menus have proper ARIA roles
  menus.forEach(menu => {
    if (!menu.hasAttribute('role')) menu.setAttribute('role', 'menu');
  });
  
  toggles.forEach(toggle => {
    // Ensure accessibility attributes
    toggle.setAttribute('aria-haspopup', 'true');
    if (!toggle.hasAttribute('aria-expanded')) {
      toggle.setAttribute('aria-expanded', 'false');
    }

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const langContainer = toggle.closest('.nav__lang, .nav__mobile-lang');
      const menu = langContainer ? langContainer.querySelector('.lang-menu') : null;
      const isExpanded = toggle.getAttribute('aria-expanded') === 'true';

      // Close all other dropdowns
      closeAllDropdowns();

      // Toggle current dropdown
      if (!isExpanded && menu) {
        toggle.setAttribute('aria-expanded', 'true');
        menu.classList.add('active');
        // Focus first option for keyboard users
        const firstOpt = menu.querySelector('.lang-menu__item');
        if (firstOpt) firstOpt.focus();
      }
    });

    // Open/close with keyboard (Enter/Space)
    toggle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle.click();
      }
      if (e.key === 'Escape') {
        closeAllDropdowns();
        toggle.focus();
      }
    });
  });
  
  // Add event listeners to language options
  const options = document.querySelectorAll('.lang-menu__item');
  options.forEach(option => {
    // Ensure option roles and keyboard focus
    option.setAttribute('role', 'menuitem');
    option.setAttribute('tabindex', '0');

    option.addEventListener('click', (e) => {
      e.stopPropagation();
      const lang = option.getAttribute('data-lang');
      setLanguage(lang);
    });

    option.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        option.click();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        // Move focus between options
        const menu = option.closest('.lang-menu');
        if (!menu) return;
        const items = Array.from(menu.querySelectorAll('.lang-menu__item'));
        const idx = items.indexOf(option);
        let nextIdx = idx;
        if (e.key === 'ArrowDown') nextIdx = (idx + 1) % items.length;
        if (e.key === 'ArrowUp') nextIdx = (idx - 1 + items.length) % items.length;
        items[nextIdx].focus();
      } else if (e.key === 'Escape') {
        closeAllDropdowns();
        const langContainer = option.closest('.nav__lang, .nav__mobile-lang');
        const toggle = langContainer ? langContainer.querySelector('.lang-toggle') : null;
        if (toggle) toggle.focus();
      }
    });
  });
  
  // Close dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav__lang') && !e.target.closest('.nav__mobile-lang')) {
      closeAllDropdowns();
    }
  });
  
  // Close dropdowns on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllDropdowns();
    }
  });
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { setLanguage, currentLang };
}

