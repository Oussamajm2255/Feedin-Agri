const fs = require('fs');
const path = require('path');

const rootDir = 'd:\\Feedinprod-master\\smart-farm-frontend\\src\\app\\features\\landing';
const localesDir = 'd:\\Feedinprod-master\\smart-farm-frontend\\src\\assets\\i18n';

function getFiles(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    for (const file of list) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getFiles(filePath));
        } else if (filePath.endsWith('.html') || filePath.endsWith('.ts')) {
            results.push(filePath);
        }
    }
    return results;
}

const files = getFiles(rootDir);
const keys = new Set();
const regex = /landing\.[a-zA-Z0-9_.-]+/g;

for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = regex.exec(content)) !== null) {
        const key = match[0];
        if (!key.endsWith('.')) {
            keys.add(key);
        }
    }
}

// Add dynamic keys for contact FAQs which are generated dynamically via 'landing.contact.faqs.' + i + '.q'
for (let i = 0; i < 6; i++) {
    keys.add(`landing.contact.faqs.${i}.q`);
    keys.add(`landing.contact.faqs.${i}.a`);
}

// Build the nested structure
const newLandingMap = {};
for (const key of keys) {
    const pathParts = key.replace('landing.', '').split('.');

    let current = newLandingMap;
    for (let i = 0; i < pathParts.length; i++) {
        const part = pathParts[i];
        if (i === pathParts.length - 1) {
            current[part] = current[part] || key; // Default value is the key itself
        } else {
            if (typeof current[part] !== 'object') current[part] = {};
            current = current[part];
        }
    }
}

const locales = ['fr-FR.json', 'en-US.json', 'ar-TN.json'];

function mapExistingValues(target, source) {
    if (!source) return;
    for (const key in target) {
        if (typeof target[key] === 'object' && target[key] !== null && !Array.isArray(target[key])) {
            mapExistingValues(target[key], source[key]);
        } else {
            if (source && source[key] !== undefined && typeof source[key] === 'string') {
                target[key] = source[key];
            }
        }
    }
}

for (const locale of locales) {
    const filePath = path.join(localesDir, locale);
    if (!fs.existsSync(filePath)) continue;

    const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const oldLanding = jsonData.landing || {};

    // Create a fresh clone
    const freshLandingMap = JSON.parse(JSON.stringify(newLandingMap));

    // Populate old known translations, leaving 'landing.xyz' as default for missing ones
    mapExistingValues(freshLandingMap, oldLanding);

    // Replace the landing object
    jsonData.landing = freshLandingMap;

    // Write back
    fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), 'utf8');
    console.log(`Updated ${locale} with ${keys.size} exact landing keys.`);
}
