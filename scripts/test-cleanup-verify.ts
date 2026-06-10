import { createClient } from '@insforge/sdk';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;
const serviceKey = process.env.INSFORGE_SERVICE_KEY;

if (!baseUrl || !anonKey || !serviceKey) {
  console.error('Missing required environment variables in .env.local');
  process.exit(1);
}

const client = createClient({
  baseUrl,
  anonKey: serviceKey, // run with admin/service key
  isServerMode: true
});

async function runTest() {
  console.log('--- Starting Storage Cleanup Failure Test ---');

  const jobId = 'a5fbe92a-c169-4979-ba16-e51e081548f7'; // Test job ID
  const testFileName = `test-resume-${Date.now()}.pdf`;
  const resumePath = `test-resumes/${testFileName}`;
  
  // 1. Upload a dummy resume to resumes bucket
  console.log(`1. Uploading dummy resume to 'resumes' bucket at path: ${resumePath}...`);
  const dummyContent = 'PDF-1.4 dummy resume content for cleanup verification test.';
  const blob = new Blob([dummyContent], { type: 'application/pdf' });
  const file = new File([blob], testFileName, { type: 'application/pdf' });

  const { data: uploadData, error: uploadErr } = await client.storage
    .from('resumes')
    .upload(resumePath, file);

  if (uploadErr) {
    console.error('Failed to upload dummy resume:', uploadErr);
    process.exit(1);
  }

  const resumeUrl = `${baseUrl}/api/storage/buckets/resumes/objects/${encodeURIComponent(resumePath)}`;
  console.log(`Uploaded successfully! Resume URL: ${resumeUrl}`);

  // 2. Invoke candidate-applications Edge Function (should trigger the forced DB throw)
  console.log('2. Invoking candidate-applications edge function (expecting DB insert failure)...');
  const functionUrl = `${baseUrl}/functions/candidate-applications`;
  
  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-insforge-service-key': serviceKey
    } as Record<string, string>,
    body: JSON.stringify({
      jobId,
      resumeUrl,
      applyType: 'quick'
    })
  });

  const responseText = await response.text();
  console.log(`Function response status: ${response.status}`);
  console.log(`Function response body: ${responseText}`);

  if (response.status !== 400 || !responseText.includes('Forced DB insert failure')) {
    console.error('Unexpected edge function response. Expected 400 with Forced DB insert failure message.');
  } else {
    console.log('Edge function returned expected DB insertion error!');
  }

  // 3. Verify that the file was deleted from application-snapshots bucket
  console.log('3. Verifying that the snapshot was cleaned up from the private application-snapshots bucket...');
  
  // Let's parse the applicationId from the response or check list of files
  // Since we don't know the generated applicationId directly, we can check the list of files in application-snapshots
  const { data: files, error: listError } = await client.storage
    .from('application-snapshots')
    .list();

  if (listError) {
    console.error('Failed to list files in application-snapshots:', listError);
    process.exit(1);
  }

  console.log(`Current files in application-snapshots:`, files);
  
  // Check if any file in the list has the name corresponding to this application
  const hasOrphan = files?.objects?.some((f: any) => f.key.includes(testFileName));
  if (hasOrphan) {
    console.error('❌ FAILURE: Orphaned file remains in application-snapshots!');
    process.exit(1);
  } else {
    console.log('✅ SUCCESS: No orphaned snapshot file remains in application-snapshots! Cleanup logic verified.');
  }

  // Cleanup: Delete the original resume we uploaded
  console.log('4. Cleaning up original test resume...');
  await client.storage.from('resumes').remove(resumePath);
  console.log('Test completed successfully!');
}

runTest().catch((err) => {
  console.error('Unexpected error running test:', err);
  process.exit(1);
});
