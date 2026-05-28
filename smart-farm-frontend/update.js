const fs = require('fs');
const file = 'src/assets/i18n/ar-TN.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
data.auth.welcomeTitle = 'مرحباً بك في <span class="brand-highlight">Feed In Green</span>';
fs.writeFileSync(file, JSON.stringify(data, null, 2));
console.log('done');
