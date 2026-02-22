/*
  Contact Form Handler
  - Accessible, multi-language, RTL-ready
  - Uses EmailJS (https://www.emailjs.com/) to send emails
  USAGE: create a service and template in EmailJS, then set SERVICE_ID, TEMPLATE_ID, and EMAILJS_USER_ID below.
*/

(function () {
  'use strict';

  // ----- EmailJS CONFIG (provided) -----
  const EMAILJS_PUBLIC_KEY = 'nNmHCo9nlVJvZUNmv';
  const EMAILJS_SERVICE_ID = 'service_444x595';
  const EMAILJS_TEMPLATE_ID = 'template_l4hwp89';
  // --------------------------------------

  // Elements
  const form = document.getElementById('contact-form');
  if (!form) return; // nothing to do
  const submitBtn = form.querySelector('.contact-form__submit');
  const statusEl = form.querySelector('.contact-form__status');
  const inputs = Array.from(form.querySelectorAll('input, textarea'));

  // Helper: read translation value safely
  function t(keyPath) {
    try {
      const parts = keyPath.split('.');
      let v = translations[currentLang];
      for (const p of parts) {
        v = v?.[p];
      }
      return v ?? '';
    } catch (e) {
      return '';
    }
  }

  // Set placeholders and aria-labels from translations for inputs/textarea
  function setAriaAndPlaceholders() {
    const formTranslations = translations?.[currentLang]?.contact?.form || {};
    if (!formTranslations) return;

    const map = [
      { sel: '#contact-name', keyP: 'fullNamePlaceholder', keyL: 'fullNameLabel' },
      { sel: '#contact-email', keyP: 'emailPlaceholder', keyL: 'emailLabel' },
      { sel: '#contact-phone', keyP: 'phonePlaceholder', keyL: 'phoneLabel' },
      { sel: '#contact-message', keyP: 'messagePlaceholder', keyL: 'messageLabel' }
    ];

    map.forEach(m => {
      const el = form.querySelector(m.sel);
      if (!el) return;
      const placeholder = formTranslations[m.keyP];
      const label = formTranslations[m.keyL];
      if (placeholder) el.placeholder = placeholder;
      if (label) el.setAttribute('aria-label', label);
    });

    // Submit button
    const submitText = formTranslations.submit;
    if (submitText && submitBtn) submitBtn.textContent = submitText;
  }

  // Ensure aria labels/placeholders are set initially
  document.addEventListener('DOMContentLoaded', setAriaAndPlaceholders);

  // Wrap/setLanguage so aria labels update on language change
  if (typeof window.setLanguage === 'function') {
    const _origSetLanguage = window.setLanguage;
    window.setLanguage = function (lang) {
      _origSetLanguage(lang);
      setAriaAndPlaceholders();
    };
  }

  // Initialize EmailJS if available
  function initEmailJS() {
    if (window.emailjs && typeof window.emailjs.init === 'function') {
      try {
        window.emailjs.init(EMAILJS_PUBLIC_KEY);
      } catch (e) {
        console.warn('EmailJS init error', e);
      }
    }
  }

  // Call init on load (if SDK was loaded before this script)
  initEmailJS();

  // If emailjs is not yet available, watch and init when script loads
  if (!window.emailjs) {
    const observer = new MutationObserver(() => {
      if (window.emailjs) {
        initEmailJS();
        observer.disconnect();
      }
    });
    observer.observe(document.head, { childList: true, subtree: true });
  }

  // Show status message with ARIA
  function setStatus(message, type) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.classList.remove('contact-form__status--error', 'contact-form__status--success');
    if (type === 'success') statusEl.classList.add('contact-form__status--success');
    if (type === 'error') statusEl.classList.add('contact-form__status--error');
  }

  // Basic client validation helper
  function validate() {
    let valid = true;
    inputs.forEach(i => {
      i.classList.remove('is-invalid');
      if (i.hasAttribute('required') && !i.value.trim()) {
        i.classList.add('is-invalid');
        valid = false;
      }
      if (i.type === 'email' && i.value) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!re.test(i.value)) {
          i.classList.add('is-invalid');
          valid = false;
        }
      }
      if (i.type === 'tel' && i.value) {
        const re = /[0-9()+\-\s]{7,}/;
        if (!re.test(i.value)) {
          i.classList.add('is-invalid');
          valid = false;
        }
      }
    });
    return valid;
  }

  // Remove invalid class on user input
  inputs.forEach(i => {
    i.addEventListener('input', () => {
      i.classList.remove('is-invalid');
      setStatus('', '');
    });
  });

  // Form submit handler
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    setStatus('', '');

    // Validate
    if (!validate()) {
      const msg = translations?.[currentLang]?.contact?.form?.validation?.required || 'Please fill required fields';
      setStatus(msg, 'error');
      return;
    }

    // Disable button and show sending
    if (submitBtn) {
      submitBtn.disabled = true;
    }
    const sendingText = translations?.[currentLang]?.contact?.form?.sending || 'Sending...';
    setStatus(sendingText, '');

    // Use emailjs.sendForm to send the form directly (maps form field names)
    if (window.emailjs && EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY) {
      try { window.emailjs.init(EMAILJS_PUBLIC_KEY); } catch (e) {}

      window.emailjs.sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, form)
        .then(function () {
          const successText = translations?.[currentLang]?.contact?.form?.success || 'Message sent';
          setStatus(successText, 'success');
          form.reset();
          if (submitBtn) submitBtn.disabled = false;
          
          // Close modal after successful submission (with delay to show success message)
          const contactModal = document.getElementById('contact-modal');
          if (contactModal && contactModal.classList.contains('active')) {
            setTimeout(() => {
              contactModal.classList.remove('active');
              contactModal.setAttribute('aria-hidden', 'true');
              document.body.classList.remove('modal-open');
            }, 2000); // Close after 2 seconds
          }
        })
        .catch(function (err) {
          console.error('EmailJS sendForm error', err);
          const errorText = translations?.[currentLang]?.contact?.form?.error || 'An error occurred';
          setStatus(errorText, 'error');
          if (submitBtn) submitBtn.disabled = false;
        });
    } else {
      // EmailJS not configured - fallback to developer-friendly error message
      const errorText = 'Email service not configured. Please set EmailJS IDs in js/contact-form.js';
      console.warn(errorText);
      setStatus(errorText, 'error');
      if (submitBtn) submitBtn.disabled = false;
    }
  });

})();
