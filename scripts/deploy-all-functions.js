const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const functionsDir = path.join(__dirname, '..', 'insforge', 'functions');

function deployFunctions() {
  const entries = fs.readdirSync(functionsDir, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const slug = entry.name;
      console.log(`\n🚀 Deploying function: ${slug}...`);
      
      try {
        const name = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        const cmd = `npx @insforge/cli functions deploy ${slug} --name "${name}"`;
        
        const output = execSync(cmd, { stdio: 'inherit' });
        console.log(`✅ Successfully deployed: ${slug}`);
      } catch (error) {
        console.error(`❌ Failed to deploy ${slug}: ${error.message}`);
      }
    }
  }
}

console.log('--- Starting Bulk Deployment ---');
deployFunctions();
console.log('\n--- Deployment Complete ---');
