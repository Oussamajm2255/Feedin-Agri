/* ============================================
   FEED - Agritech Website JavaScript
   ============================================ */

// Mobile Navigation Toggle - Updated for new header structure
const navToggle = document.getElementById('nav-toggle');
const navMenu = document.getElementById('nav-menu');
const navOverlay = document.getElementById('nav-overlay');
const navMobileClose = document.getElementById('nav-mobile-close');
const navLinks = document.querySelectorAll('.nav__link, .nav__mobile-link');
const body = document.body;

// Toggle mobile menu with body scroll lock
function toggleMobileMenu() {
  const isActive = navMenu.classList.contains('active');
  
  navMenu.classList.toggle('active');
  navOverlay.classList.toggle('active');
  
  if (navToggle) {
    navToggle.classList.toggle('active');
    navToggle.setAttribute('aria-expanded', !isActive);
  }
  
  // Lock body scroll when menu is open
  if (!isActive) {
    body.classList.add('menu-open');
  } else {
    body.classList.remove('menu-open');
  }

  // Accessibility: set aria-hidden on the menu
  if (navMenu) {
    navMenu.setAttribute('aria-hidden', String(!navMenu.classList.contains('active')));
  }
}

// Toggle mobile menu
if (navToggle) {
  navToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMobileMenu();
  });
}

// Close button in mobile menu
if (navMobileClose) {
  navMobileClose.addEventListener('click', () => {
    toggleMobileMenu();
  });
}

// Ensure correct initial aria state
if (navMenu) {
  navMenu.setAttribute('aria-hidden', String(true));
}

// Close mobile menu when clicking overlay
if (navOverlay) {
  navOverlay.addEventListener('click', () => {
    toggleMobileMenu();
  });
}

// Close mobile menu when clicking on a link
navLinks.forEach(link => {
  link.addEventListener('click', () => {
    if (window.innerWidth <= 968 && navMenu.classList.contains('active')) {
      toggleMobileMenu();
    }
  });
});

// Close mobile menu on escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && navMenu && navMenu.classList.contains('active')) {
    toggleMobileMenu();
  }
});

// Smooth Scrolling for anchor links (uses dynamic header height and targets contact content)
function scrollToHash(href) {
  if (!href || href === '#') return;
  const target = document.querySelector(href);
  if (!target) return;

  // Choose sensible scroll target for special anchors
  let scrollTarget = target;
  if (href === '#contact' || href === '#contact-form') {
    // Prefer the actual form element when available
    const formEl = document.getElementById('contact-form') || target.querySelector('#contact-form') || target.querySelector('.contact-form');
    if (formEl) scrollTarget = formEl;
  }
  if (href === '#footer-contact') {
    const footerEl = document.getElementById('footer-contact') || target;
    if (footerEl) scrollTarget = footerEl;
  }

  const navEl = document.querySelector('.nav');
  const headerEl = document.getElementById('header');
  // Prefer the centered `.nav` height (more accurate for offset), fall back to header
  const headerOffset = navEl ? Math.ceil(navEl.getBoundingClientRect().height) : (headerEl ? Math.ceil(headerEl.getBoundingClientRect().height) : 72);
  const elementPosition = scrollTarget.getBoundingClientRect().top + window.pageYOffset;
  const offsetPosition = Math.max(0, elementPosition - headerOffset - 8); // small extra spacing

  window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (!href || href === '#') return;
    e.preventDefault();

    // If mobile menu is open, close it before scrolling so layout is stable
    if (window.innerWidth <= 968 && navMenu && navMenu.classList.contains('active')) {
      toggleMobileMenu();
    }

    scrollToHash(href);
  });
});

// Sticky Header Behavior - Add scrolled class
const header = document.getElementById('header');

function handleHeaderScroll() {
  const scrollY = window.pageYOffset;
  
  if (scrollY > 50) {
    header.classList.add('header--scrolled');
  } else {
    header.classList.remove('header--scrolled');
  }
}

window.addEventListener('scroll', handleHeaderScroll, { passive: true });
handleHeaderScroll(); // Check on load

// Scroll Reveal Animation - More subtle
const observerOptions = {
  threshold: 0.05,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('fade-in');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observe elements for scroll animation
const animateElements = document.querySelectorAll(
  '.service__card, .solution__block, .project__card, .about__content, .formation__content'
);

animateElements.forEach(el => {
  observer.observe(el);
});

// Button and card hover effects are now handled by CSS transitions
// Removed inline style manipulation for better performance

// Project Cards Click Handler (can be extended)
const projectCards = document.querySelectorAll('.project__card');
projectCards.forEach((card, index) => {
  card.addEventListener('click', function() {
    // Placeholder for project detail modal or navigation
    console.log(`Project ${index + 1} clicked`);
    // Add your project detail logic here
  });
});

// Active Navigation Link on Scroll
const sections = document.querySelectorAll('section[id]');

function activateNavLink() {
  const scrollY = window.pageYOffset;

  sections.forEach(section => {
    const sectionHeight = section.offsetHeight;
    const sectionTop = section.offsetTop - 100;
    const sectionId = section.getAttribute('id');

    if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${sectionId}`) {
          link.classList.add('active');
        }
      });
    }
  });
}

window.addEventListener('scroll', activateNavLink);

// Add active class style in CSS if needed
const style = document.createElement('style');
style.textContent = `
  .nav__link.active {
    color: var(--turquoise-primary);
  }
  .nav__link.active::after {
    width: 100%;
  }
`;
document.head.appendChild(style);

// Form Submission Handler (if contact form is added)
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // Add form submission logic here
    console.log('Form submitted');
  });
}

// Lazy Loading for Images (if real images are added)
if ('IntersectionObserver' in window) {
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      }
    });
  });

  document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
  });
}

// Back to Top Button
const backToTopButton = document.getElementById('back-to-top');

function handleBackToTop() {
  const scrollY = window.pageYOffset;
  
  if (scrollY > 400) {
    backToTopButton.classList.add('visible');
  } else {
    backToTopButton.classList.remove('visible');
  }
}

if (backToTopButton) {
  window.addEventListener('scroll', handleBackToTop, { passive: true });
  
  backToTopButton.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
  
  handleBackToTop(); // Check on load
}

// Handle window resize - close mobile menu if resizing to desktop
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (window.innerWidth > 968 && navMenu && navMenu.classList.contains('active')) {
      toggleMobileMenu();
    }
  }, 250);
});

// Contact Modal Functionality
const contactModal = document.getElementById('contact-modal');
const modalOverlay = document.getElementById('modal-overlay');
const modalClose = document.getElementById('modal-close');
const openModalButtons = document.querySelectorAll('#open-contact-modal, #open-contact-modal-nav, #open-contact-modal-mobile, #open-contact-modal-hero');

function openContactModal() {
  if (contactModal) {
    contactModal.classList.add('active');
    contactModal.setAttribute('aria-hidden', 'false');
    body.classList.add('modal-open');
    
    // Focus management for accessibility
    const firstInput = contactModal.querySelector('input, textarea, button');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
  }
}

function closeContactModal() {
  if (contactModal) {
    contactModal.classList.remove('active');
    contactModal.setAttribute('aria-hidden', 'true');
    body.classList.remove('modal-open');
  }
}

// Open modal buttons
openModalButtons.forEach(button => {
  button.addEventListener('click', (e) => {
    e.preventDefault();
    openContactModal();
    
    // Close mobile menu if open
    if (navMenu && navMenu.classList.contains('active')) {
      toggleMobileMenu();
    }
  });
});

// Close modal buttons
if (modalClose) {
  modalClose.addEventListener('click', closeContactModal);
}

if (modalOverlay) {
  modalOverlay.addEventListener('click', closeContactModal);
}

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && contactModal && contactModal.classList.contains('active')) {
    closeContactModal();
  }
});

// Console welcome message
console.log('%cFEED - Agritech Solutions', 'color: #B5E042; font-size: 20px; font-weight: bold;');
console.log('%cCultiver intelligemment, produire durablement', 'color: #17C6BC; font-size: 14px;');
