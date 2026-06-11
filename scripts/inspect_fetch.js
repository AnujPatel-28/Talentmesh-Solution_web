import { createClient } from '@insforge/sdk';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
const serviceKey = process.env.INSFORGE_SERVICE_KEY;

const admin = createClient({
  baseUrl: supabaseUrl,
  anonKey: serviceKey,
  isServerMode: true
});

async function run() {
  const path = `test_mime_detect_${Date.now()}.pdf`;
  const blob = new Blob(['%PDF-1.4 dummy'], { type: 'application/pdf' });
  
  console.log('Uploading...');
  await admin.storage.from('resumes').upload(path, blob, { contentType: 'application/pdf' });
  
  console.log('Downloading...');
  const { data, error } = await admin.storage.from('resumes').download(path);
  if (error) {
    console.error('Download error:', error);
  } else {
    console.log('Blob size:', data.size);
    console.log('Blob type:', data.type);
  }
  
  console.log('Cleaning up...');
  await admin.storage.from('resumes').remove(path);
}

run().catch(console.error);
