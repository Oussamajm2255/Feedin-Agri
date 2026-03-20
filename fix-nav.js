const fs = require('fs');
const files = [
  'd:/Feedin-Agri-main/smart-farm-frontend/src/app/features/admin/layout/admin-sidebar/admin-sidebar.scss',
  'd:/Feedin-Agri-main/smart-farm-frontend/src/app/features/admin/layout/admin-shell/admin-shell.component.scss',
  'd:/Feedin-Agri-main/smart-farm-frontend/src/app/features/admin/layout/admin-header/admin-header.scss'
];
files.forEach(file => {
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace(/body\.dark-theme \&/g, ':host-context(.dark-theme) &');
  fs.writeFileSync(file, c);
  console.log(`Replaced in ${file}`);
});
