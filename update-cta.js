const fs = require('fs');
['fr-FR', 'en-US', 'ar-TN'].forEach(lang => {
  const path = `d:/Feedin-Agri-main/smart-farm-frontend/src/assets/i18n/${lang}.json`;
  let data = JSON.parse(fs.readFileSync(path, 'utf8'));
  
  if (data.landing && data.landing.services && data.landing.services.cta) {
    if (lang === 'fr-FR') {
      data.landing.services.cta.btn1 = "Demander un devis";
    } else if (lang === 'en-US') {
      data.landing.services.cta.btn1 = "Request a quote";
    } else if (lang === 'ar-TN') {
      data.landing.services.cta.btn1 = "طلب عرض سعر";
    }
  }
  
  fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
});
console.log('CTA buttons updated');
