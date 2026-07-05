import * as dotenv from 'dotenv';
import fs from 'fs';
dotenv.config({ path: '.env.local' });

const url = 'https://sytk3jgv.ap-southeast.insforge.app/api/metadata';
const key = process.env.INSFORGE_SERVICE_KEY;

async function run() {
  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${key}`
      }
    });
    const data = await res.json();
    fs.writeFileSync('metadata_full.json', JSON.stringify(data, null, 2));
    console.log('Metadata written to metadata_full.json');
  } catch (err) {
    console.error(err);
  }
}

run();
