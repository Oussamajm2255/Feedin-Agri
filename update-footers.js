const fs = require('fs');
const files = [
  'about/about.component.ts',
  'contact/contact.component.ts',
  'formation/formation.component.ts',
  'services/services-page.component.ts',
  'solutions/solutions.component.ts'
];
files.forEach(file => {
  const p = `d:/Feedin-Agri-main/smart-farm-frontend/src/app/features/landing/pages/${file}`;
  if(fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    
    // 1. replace HTML tags
    content = content.replace(/<app-footer>/g, '<app-landing-footer>');
    content = content.replace(/<\/app-footer>/g, '</app-landing-footer>');
    
    // 2. replace class reference
    content = content.replace(/FooterComponent/g, 'LandingFooterComponent');
    
    // 3. fix the import path which now says: import { LandingFooterComponent } from '../../../../shared/components/footer/footer.component';
    content = content.replace(/import\s*{\s*LandingFooterComponent\s*}\s*from\s*['"][^'"]*footer\.component['"];/g, "import { LandingFooterComponent } from '../../sections/landing-footer/landing-footer.component';");

    fs.writeFileSync(p, content, 'utf8');
    console.log('Updated ' + file);
  }
});
