const fs = require('fs');
const file = 'd:/Feedin-Agri-main/smart-farm-frontend/src/app/features/admin/pages/overview/overview.component.scss';
let c = fs.readFileSync(file, 'utf8');
const originalLength = c.length;
c = c.replace(/body\.dark-theme &/g, ':host-context(.dark-theme) &');
c = c.replace(/background:\s*var\(--bg-primary\);/, 'background: transparent;');
fs.writeFileSync(file, c);
console.log('Fixed overview.component.scss. Original length: ' + originalLength + ' New length: ' + c.length);
