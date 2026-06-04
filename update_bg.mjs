import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_DIR = path.join(__dirname, 'app', 'portals');

function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(filePath));
        } else if (filePath.endsWith('.module.css')) {
            results.push(filePath);
        }
    });
    return results;
}

const cssFiles = walk(APP_DIR);
let updatedCount = 0;

cssFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Look for top-level section blocks and replace white background
    const sectionRegex = /\.(page|hero|faqSection|marqueeContainer|aboutHero|aboutSection|contactSection|caseStudiesSection|careersSection|pricingSection|contentContainer|main|podcastHero)\s*\{([^}]+)\}/g;
    content = content.replace(sectionRegex, (match, className, inner) => {
        const newInner = inner.replace(/background(-color)?:\s*(#ffffff|#fff|white|#fafafa|#f8fafc)(?=\s*[;!}])/gi, 'background: var(--background)');
        return `.${className} {${newInner}}`;
    });
    
    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Updated:', file);
        updatedCount++;
    }
});
console.log(`Updated ${updatedCount} files.`);
