const fs = require('fs');
const path = require('path');

// Load env variables manually from .env.local
const envFile = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value.trim();
  }
});

const baseUrl = env.NEXT_PUBLIC_INSFORGE_URL;
const anonKey = env.NEXT_PUBLIC_INSFORGE_ANON_KEY;
const serviceKey = env.INSFORGE_SERVICE_KEY;

if (!baseUrl || !anonKey || !serviceKey) {
  console.error('Error: NEXT_PUBLIC_INSFORGE_URL, NEXT_PUBLIC_INSFORGE_ANON_KEY or INSFORGE_SERVICE_KEY not found in .env.local');
  process.exit(1);
}

async function runTest() {
  console.log('--- Starting Storage Cleanup Failure Test ---');

  const jobId = 'a21df5b6-30d6-47d4-8d40-f451f38caf29'; // Real job ID in sytk3jgv database
  const testFileName = `test-resume-${Date.now()}.pdf`;
  const resumePath = `test-resumes/${testFileName}`;
  
  // 1. Upload a dummy resume to resumes bucket using multipart form data
  console.log(`1. Uploading dummy resume to 'resumes' bucket at: ${resumePath}...`);
  
  // Create a form data body manually
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  const fileContent = 'PDF-1.4 dummy resume content for cleanup verification test.';
  
  let body = '';
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="file"; filename="${testFileName}"\r\n`;
  body += 'Content-Type: application/pdf\r\n\r\n';
  body += fileContent + '\r\n';
  body += `--${boundary}--\r\n`;

  const uploadUrl = `${baseUrl}/api/storage/buckets/resumes/objects/${encodeURIComponent(resumePath)}`;
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`
    },
    body: body
  });

  const uploadData = await uploadRes.json();
  if (!uploadRes.ok) {
    console.error('Failed to upload dummy resume:', uploadData);
    process.exit(1);
  }

  const resumeUrl = `${baseUrl}/api/storage/buckets/resumes/objects/${encodeURIComponent(resumePath)}`;
  console.log(`Uploaded successfully! Resume URL: ${resumeUrl}`);

  // 2. Invoke candidate-applications Edge Function (should trigger the forced DB throw)
  console.log('2. Invoking candidate-applications edge function...');
  const functionUrl = `${baseUrl}/functions/candidate-applications`;
  
  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-insforge-url': baseUrl,
      'x-insforge-anon-key': anonKey,
      'x-insforge-service-key': serviceKey
    },
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
    console.error('❌ FAILURE: Unexpected edge function response.');
    process.exit(1);
  } else {
    console.log('✅ SUCCESS: Edge function returned expected DB insertion error!');
  }

  // 3. Verify that the file was deleted from application-snapshots bucket
  console.log('3. Checking application-snapshots bucket for orphaned files...');
  const listUrl = `${baseUrl}/api/storage/buckets/application-snapshots/objects`;
  const listRes = await fetch(listUrl, {
    headers: {
      'Authorization': `Bearer ${serviceKey}`
    }
  });

  const listData = await listRes.json();
  if (!listRes.ok) {
    console.error('Failed to list files in application-snapshots:', listData);
    process.exit(1);
  }

  const files = listData.data || [];
  console.log('Current files in application-snapshots:', files);

  // Check if any file is orphaned (since we created a snapshot, it would have the generated applicationId path)
  // We can see if there are any files containing our test filename or any file at all
  // Note: Since this is a clean test, if cleanup worked, the bucket should have 0 files (or at least no new files).
  // But wait, the snapshot path is: applications/{applicationId}/resume.pdf.
  // We can list files and see if any file was recently created.
  // Or we can check if the file count changed. Since the bucket was empty before (0 files in metadata), it should still be empty (0 files).
  if (files.length > 0) {
    console.error('❌ FAILURE: Orphaned snapshot file remains in application-snapshots!');
    process.exit(1);
  } else {
    console.log('✅ SUCCESS: No orphaned snapshot file remains in application-snapshots! Cleanup logic verified.');
  }

  // 4. Cleanup: Delete the original resume we uploaded
  console.log('4. Cleaning up original test resume...');
  const deleteUrl = `${baseUrl}/api/storage/buckets/resumes/objects/${encodeURIComponent(resumePath)}`;
  await fetch(deleteUrl, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${serviceKey}`
    }
  });
  console.log('Test completed successfully!');
}

runTest().catch((err) => {
  console.error('Unexpected error running test:', err);
  process.exit(1);
});
