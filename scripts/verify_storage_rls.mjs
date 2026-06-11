import { createClient } from '@insforge/sdk';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
const serviceKey = process.env.INSFORGE_SERVICE_KEY;
const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

const admin = createClient({
  baseUrl: supabaseUrl,
  anonKey: serviceKey,
  isServerMode: true
});

async function runTest() {
  console.log('=== Starting Candidate Resume RLS & Security Workflow Audit ===\n');

  // Fetch a valid active approved job ID dynamically
  const { data: jobList, error: jobListError } = await admin.database
    .from('jobs')
    .select('id, title')
    .eq('status', 'active')
    .eq('is_approved', true)
    .limit(1);

  if (jobListError || !jobList || jobList.length === 0) {
    throw new Error(`Failed to find an active approved job: ${jobListError?.message || 'None found'}`);
  }
  const testJobId = jobList[0].id;
  console.log(`[Setup] Dynamic test job selected: "${jobList[0].title}" (ID: ${testJobId})`);

  const timestamp = Date.now();
  const emailA = `test_cand_a_${timestamp}@example.com`;
  const emailB = `test_cand_b_${timestamp}@example.com`;
  const password = 'TestPassword123!';

  const clientA = createClient({ baseUrl: supabaseUrl, anonKey });
  const clientB = createClient({ baseUrl: supabaseUrl, anonKey });

  // 1. Sign up fresh candidate accounts
  console.log(`[Setup] Signing up Candidate A (${emailA})...`);
  const { data: signUpA, error: errA } = await clientA.auth.signUp({ email: emailA, password });
  if (errA) throw new Error(`Candidate A SignUp failed: ${errA.message}`);

  console.log(`[Setup] Signing up Candidate B (${emailB})...`);
  const { data: signUpB, error: errB } = await clientB.auth.signUp({ email: emailB, password });
  if (errB) throw new Error(`Candidate B SignUp failed: ${errB.message}`);

  // 2. Programmatically verify emails and set roles
  console.log('[Setup] Setting email_verified = true in database...');
  await admin.database.rpc('exec_sql', {
    query: `UPDATE auth.users SET email_verified = true WHERE email IN ('${emailA}', '${emailB}')`
  });

  console.log('[Setup] Inserting profiles and candidate_profiles metadata via SQL...');
  await admin.database.rpc('exec_sql', {
    query: `
      INSERT INTO public.profiles (id, email, role, name, is_active)
      SELECT id, email, 'candidate', 'Test Candidate A', true
      FROM auth.users
      WHERE email = '${emailA}'
    `
  });
  await admin.database.rpc('exec_sql', {
    query: `
      INSERT INTO public.profiles (id, email, role, name, is_active)
      SELECT id, email, 'candidate', 'Test Candidate B', true
      FROM auth.users
      WHERE email = '${emailB}'
    `
  });

  await admin.database.rpc('exec_sql', {
    query: `
      INSERT INTO public.candidate_profiles (id, is_discoverable, is_visible)
      SELECT id, true, true
      FROM auth.users
      WHERE email = '${emailA}'
    `
  });
  await admin.database.rpc('exec_sql', {
    query: `
      INSERT INTO public.candidate_profiles (id, is_discoverable, is_visible)
      SELECT id, true, true
      FROM auth.users
      WHERE email = '${emailB}'
    `
  });

  // Fetch IDs from profiles table via PostgREST
  const { data: profileA } = await admin.database.from('profiles').select('id').eq('email', emailA).single();
  const candidateAId = profileA?.id;

  const { data: profileB } = await admin.database.from('profiles').select('id').eq('email', emailB).single();
  const candidateBId = profileB?.id;

  if (!candidateAId || !candidateBId) {
    throw new Error('Failed to retrieve candidate IDs from profiles table.');
  }
  console.log(`[Setup] Candidate A ID: ${candidateAId}`);
  console.log(`[Setup] Candidate B ID: ${candidateBId}`);

  // 3. Login to set active session tokens
  console.log('[Auth] Logging in Candidate A...');
  const { error: signInAErr } = await clientA.auth.signInWithPassword({ email: emailA, password });
  if (signInAErr) throw new Error(`Candidate A SignIn failed: ${signInAErr.message}`);

  console.log('[Auth] Logging in Candidate B...');
  const { error: signInBErr } = await clientB.auth.signInWithPassword({ email: emailB, password });
  if (signInBErr) throw new Error(`Candidate B SignIn failed: ${signInBErr.message}`);
  console.log('[Auth] Authentication completed.\n');

  // --------------------------------------------------------------------------
  // TEST 1: Upload (Candidate A uploads resume)
  // --------------------------------------------------------------------------
  console.log('--- Test 1 — Upload ---');
  const fileName = `test_resume_${timestamp}.pdf`;
  const uploadPath = `${candidateAId}/${fileName}`;
  const fileBlob = new Blob(['%PDF-1.4 dummy test content'], { type: 'application/pdf' });

  console.log(`Uploading resume to path: resumes/${uploadPath}...`);
  const { data: uploadData, error: uploadError } = await clientA.storage
    .from('resumes')
    .upload(uploadPath, fileBlob, { contentType: 'application/pdf' });

  if (uploadError) {
    console.error('❌ Test 1 — Upload Failed on Storage Upload:', uploadError);
  } else {
    console.log('✅ Storage upload succeeded. Response URL:', uploadData.url);
    
    // Check storage object existence using Admin storage client
    const { data: checkObject, error: checkObjectError } = await admin.storage
      .from('resumes')
      .download(uploadPath);
    console.log('storage object download check (admin):', checkObject ? 'Found (blob size ' + checkObject.size + ')' : 'Not Found (' + checkObjectError?.message + ')');

    // Insert candidate_resumes row using Candidate A client
    console.log('Inserting candidate_resumes metadata row...');
    const { data: insertData, error: insertError } = await clientA.database
      .from('candidate_resumes')
      .insert([{
        candidate_id: candidateAId,
        label: 'Primary Test Resume',
        file_url: clientA.storage.from('resumes').getPublicUrl(uploadPath),
        file_name: fileName,
        file_size_bytes: fileBlob.size,
        is_default: true
      }])
      .select();

    if (insertError) {
      console.error('❌ Test 1 — Upload Failed on metadata insert:', insertError);
    } else {
      console.log('✅ candidate_resumes row successfully created:', insertData[0].id);
      console.log('👉 Test 1 — Upload passed successfully.\n');
    }
  }

  // Fetch created resume metadata for subsequent tests
  const { data: resumesA } = await admin.database
    .from('candidate_resumes')
    .select('*')
    .eq('candidate_id', candidateAId);
  const activeResume = resumesA?.[0];
  if (!activeResume) throw new Error('Failed to retrieve candidate resume from database.');

  // --------------------------------------------------------------------------
  // TEST 2: Preview (Candidate A downloads own resume)
  // --------------------------------------------------------------------------
  console.log('--- Test 2 — Preview ---');
  console.log(`Candidate A attempting to preview/download own resume key: ${uploadPath}...`);
  const { data: downloadA, error: downloadAError } = await clientA.storage
    .from('resumes')
    .download(uploadPath);

  if (downloadAError) {
    console.error('❌ Test 2 — Preview Failed:', downloadAError);
  } else {
    console.log('✅ Preview download succeeded. Blob size:', downloadA.size);
    console.log('👉 Test 2 — Preview passed successfully.\n');
  }

  // --------------------------------------------------------------------------
  // TEST 4: Isolation (Candidate B attempts to access Candidate A's resume)
  // --------------------------------------------------------------------------
  console.log('--- Test 4 — Isolation ---');
  console.log(`Candidate B attempting to download Candidate A's key: ${uploadPath}...`);
  const { data: downloadB, error: downloadBError } = await clientB.storage
    .from('resumes')
    .download(uploadPath);

  if (downloadBError) {
    console.log(`✅ Access denied as expected: HTTP ${downloadBError.statusCode || 'Blocked'} - ${downloadBError.message}`);
  } else {
    console.error('❌ SECURITY FAILURE: Candidate B successfully accessed Candidate A\'s resume blob!', downloadB);
  }

  console.log(`Candidate B attempting to delete Candidate A's key: ${uploadPath}...`);
  const { error: deleteBError } = await clientB.storage
    .from('resumes')
    .remove(uploadPath);

  if (deleteBError) {
    console.log(`✅ Delete access denied as expected: HTTP ${deleteBError.statusCode || 'Blocked'} - ${deleteBError.message}`);
    console.log('👉 Test 4 — Isolation passed successfully.\n');
  } else {
    console.error('❌ SECURITY FAILURE: Candidate B successfully deleted Candidate A\'s resume object!');
  }

  // --------------------------------------------------------------------------
  // TEST 5: Apply (Candidate A performs Quick Apply — omitting resumeUrl/resumeId)
  // --------------------------------------------------------------------------
  console.log('--- Test 5 — Apply (Quick Apply Auto-Resolution) ---');
  console.log(`Invoking candidate-applications (Quick Apply) for Job ID ${testJobId}...`);
  const { data: applyData, error: applyError } = await clientA.functions.invoke('candidate-applications', {
    body: {
      jobId: testJobId,
      coverLetter: 'Quick Apply programmatic validation cover letter',
      applyType: 'quick'
    },
    headers: {
      'x-insforge-service-key': serviceKey
    }
  });

  if (applyError) {
    console.error('❌ Test 5 — Apply Failed on function invocation:', applyError);
  } else if (!applyData || applyData.error) {
    console.error('❌ Test 5 — Apply Failed on function logic response:', applyData?.error);
  } else {
    console.log('✅ Job application successfully submitted:', applyData.application.id);
    console.log('Checking created resume snapshot in application-snapshots...');
    
    // Verify snapshot in database using Admin
    const { data: appDetails } = await admin.database
      .from('applications')
      .select('resume_id, resume_snapshot_key')
      .eq('id', applyData.application.id)
      .single();

    console.log('Resolved resume ID in application record:', appDetails?.resume_id);
    console.log('Resume snapshot key in application record:', appDetails?.resume_snapshot_key);

    if (appDetails?.resume_id === activeResume.id) {
      console.log('✅ Successfully resolved Candidate A\'s default resume.');
    } else {
      console.error(`❌ Resolution failed: expected resume ID ${activeResume.id}, but got ${appDetails?.resume_id}`);
    }

    if (appDetails?.resume_snapshot_key) {
      const { data: snapshotObject, error: snapshotDownloadErr } = await admin.storage
        .from('application-snapshots')
        .download(appDetails.resume_snapshot_key);
      
      console.log('application-snapshots download check:', snapshotObject ? 'Found (size ' + snapshotObject.size + ')' : 'Not Found (' + snapshotDownloadErr?.message + ')');
      if (snapshotObject) {
        console.log('✅ Snapshot successfully created in private bucket.');
        console.log('👉 Test 5 — Apply (Quick Apply Auto-Resolution) passed successfully.\n');
      } else {
        console.error('❌ Test 5 — Apply failed: Snapshot object not found in storage.');
      }
    } else {
      console.error('❌ Test 5 — Apply failed: resume_snapshot_key not populated in application.');
    }
  }

  // --------------------------------------------------------------------------
  // TEST 3: Delete (Candidate A deletes original resume)
  // --------------------------------------------------------------------------
  console.log('--- Test 3 — Delete ---');
  console.log(`Candidate A deleting metadata row for resume ID: ${activeResume.id}...`);
  const { error: dbDeleteError } = await clientA.database
    .from('candidate_resumes')
    .delete()
    .eq('id', activeResume.id);

  if (dbDeleteError) {
    console.error('❌ Test 3 — Delete Failed on metadata delete:', dbDeleteError);
  } else {
    console.log('✅ metadata row deleted.');

    console.log(`Candidate A deleting storage object key: ${uploadPath}...`);
    const { error: storageDeleteError } = await clientA.storage
      .from('resumes')
      .remove(uploadPath);

    if (storageDeleteError) {
      console.error('❌ Test 3 — Delete Failed on storage delete:', storageDeleteError);
    } else {
      console.log('✅ Storage object deleted.');
      
      // Verify deletion using Admin storage and DB queries
      const { data: storageCheck, error: storageCheckError } = await admin.storage
        .from('resumes')
        .download(uploadPath);
      const { data: dbCheck } = await admin.database
        .from('candidate_resumes')
        .select('id')
        .eq('id', activeResume.id);

      const storageExists = !storageCheckError && storageCheck;
      const dbExists = dbCheck && dbCheck.length > 0;

      console.log('storage.objects remaining check:', storageExists ? 'Exists' : 'Deleted');
      console.log('candidate_resumes remaining check:', dbExists ? 'Exists' : 'Deleted');

      if (!storageExists && !dbExists) {
        console.log('✅ Resume removed successfully from database and storage.');
        console.log('👉 Test 3 — Delete passed successfully.\n');
      } else {
        console.error('❌ Test 3 — Delete failed: Objects were not fully deleted.');
      }
    }
  }

  // --------------------------------------------------------------------------
  // TEST 6: Immutable Snapshot Persistence (serving via proxy after original deletion)
  // --------------------------------------------------------------------------
  if (applyData?.application?.id) {
    console.log('--- Test 6 — Immutable Snapshot Persistence ---');
    console.log(`Attempting to download snapshot via resume-proxy for application ID: ${applyData.application.id}...`);
    
    const { data: proxyData, error: proxyError } = await clientA.functions.invoke(`resume-proxy?applicationId=${applyData.application.id}&accessType=viewed`, {
      headers: {
        'x-insforge-service-key': serviceKey
      }
    });

    if (proxyError) {
      console.error('❌ Test 6 — Immutable Snapshot Persistence Failed:', proxyError);
    } else if (proxyData && proxyData.error) {
      console.error('❌ Test 6 — Immutable Snapshot Persistence Failed on proxy response:', proxyData.error);
    } else {
      console.log('✅ Snapshot was successfully served by resume-proxy even after original resume deletion!');
      console.log('👉 Test 6 — Immutable Snapshot Persistence passed successfully.\n');
    }
  }

  // --------------------------------------------------------------------------
  // TEST 7: Fallback to Newest Resume Test
  // --------------------------------------------------------------------------
  console.log('--- Test 7 — Fallback to Newest Resume ---');
  // Upload Resume B1
  const fileNameB1 = `test_resume_b1_${timestamp}.pdf`;
  const uploadPathB1 = `${candidateBId}/${fileNameB1}`;
  const fileBlobB1 = new Blob(['%PDF-1.4 dummy test content B1'], { type: 'application/pdf' });
  console.log(`Uploading Resume B1 to path: resumes/${uploadPathB1}...`);
  await clientB.storage.from('resumes').upload(uploadPathB1, fileBlobB1, { contentType: 'application/pdf' });
  
  const { data: insertB1 } = await clientB.database
    .from('candidate_resumes')
    .insert([{
      candidate_id: candidateBId,
      label: 'Backup Resume B1',
      file_url: clientB.storage.from('resumes').getPublicUrl(uploadPathB1),
      file_name: fileNameB1,
      file_size_bytes: fileBlobB1.size,
      is_default: false
    }])
    .select();
  
  // Wait 1.5 seconds to ensure distinct created_at timestamp
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Upload Resume B2 (Newest)
  const fileNameB2 = `test_resume_b2_${timestamp}.pdf`;
  const uploadPathB2 = `${candidateBId}/${fileNameB2}`;
  const fileBlobB2 = new Blob(['%PDF-1.4 dummy test content B2 (newest)'], { type: 'application/pdf' });
  console.log(`Uploading Resume B2 to path: resumes/${uploadPathB2}...`);
  await clientB.storage.from('resumes').upload(uploadPathB2, fileBlobB2, { contentType: 'application/pdf' });

  const { data: insertB2 } = await clientB.database
    .from('candidate_resumes')
    .insert([{
      candidate_id: candidateBId,
      label: 'Backup Resume B2 (Newest)',
      file_url: clientB.storage.from('resumes').getPublicUrl(uploadPathB2),
      file_name: fileNameB2,
      file_size_bytes: fileBlobB2.size,
      is_default: false
    }])
    .select();

  const resumeB2Id = insertB2?.[0]?.id;
  console.log(`Uploaded Resume B1 (ID: ${insertB1?.[0]?.id}) and Resume B2 (ID: ${resumeB2Id})`);

  console.log(`Candidate B invoking quick apply (without resumeUrl/resumeId)...`);
  const { data: applyBData, error: applyBError } = await clientB.functions.invoke('candidate-applications', {
    body: {
      jobId: testJobId,
      coverLetter: 'Candidate B Quick Apply cover letter',
      applyType: 'quick'
    },
    headers: {
      'x-insforge-service-key': serviceKey
    }
  });

  if (applyBError || !applyBData || applyBData.error) {
    console.error('❌ Test 7 — Fallback to Newest Failed:', applyBError || applyBData?.error);
  } else {
    console.log('✅ Candidate B application successfully submitted:', applyBData.application.id);
    
    // Verify resolved resume in database matches newest resume (B2)
    const { data: appDetailsB } = await admin.database
      .from('applications')
      .select('resume_id, resume_snapshot_key')
      .eq('id', applyBData.application.id)
      .single();

    console.log('Candidate B Application resolved resume ID:', appDetailsB?.resume_id);
    console.log('Candidate B Application snapshot key:', appDetailsB?.resume_snapshot_key);

    if (appDetailsB?.resume_id === resumeB2Id) {
      console.log('✅ Fallback correctly resolved to the newest resume (B2).');
    } else {
      console.error(`❌ Fallback failed: expected resume ID ${resumeB2Id}, but got ${appDetailsB?.resume_id}`);
    }

    if (appDetailsB?.resume_snapshot_key) {
      const { data: snapshotBObject } = await admin.storage
        .from('application-snapshots')
        .download(appDetailsB.resume_snapshot_key);
      console.log('Candidate B snapshot download check:', snapshotBObject ? 'Found (blob size ' + snapshotBObject.size + ')' : 'Not Found');
      if (snapshotBObject) {
        console.log('✅ Candidate B snapshot successfully created in private bucket.');
        console.log('👉 Test 7 — Fallback to Newest Resume passed successfully.\n');
      } else {
        console.error('❌ Test 7 — Fallback to Newest Resume failed: snapshot file missing.');
      }
    } else {
      console.error('❌ Test 7 — Fallback to Newest Resume failed: snapshot key missing.');
    }
  }

  // Clear any existing applications for Candidate A to allow applying in Test 8
  console.log('Clearing Candidate A applications from database...');
  await admin.database.rpc('exec_sql', {
    query: `DELETE FROM public.applications WHERE candidate_id = '${candidateAId}'`
  });

  // --------------------------------------------------------------------------
  // TEST 8: Malicious Rename Verification (evil.exe renamed to resume.pdf)
  // --------------------------------------------------------------------------
  console.log('--- Test 8 — Malicious Rename Verification ---');
  const maliciousFileName = `resume_${timestamp}.pdf`;
  const maliciousUploadPath = `${candidateAId}/${maliciousFileName}`;
  // Create mock executable bytes (not starting with %PDF-)
  const maliciousBlob = new Blob(['MZ\x90\x00\x03\x00\x00\x00mock PE header executable content'], { type: 'application/pdf' });
  console.log(`Uploading malicious file to path: resumes/${maliciousUploadPath}...`);
  const { data: malUpload, error: malUploadError } = await clientA.storage
    .from('resumes')
    .upload(maliciousUploadPath, maliciousBlob, { contentType: 'application/pdf' });

  if (malUploadError) {
    console.error('❌ Test 8 failed on upload stage:', malUploadError);
  } else {
    console.log('✅ Malicious file successfully stored (Proxy bypass correct). Now invoking application snapshot...');
    
    const { data: malApplyData, error: malApplyError } = await clientA.functions.invoke('candidate-applications', {
      body: {
        jobId: testJobId,
        resumeUrl: clientA.storage.from('resumes').getPublicUrl(maliciousUploadPath),
        applyType: 'manual'
      },
      headers: {
        'x-insforge-service-key': serviceKey
      }
    });

    if (malApplyError) {
      console.log('✅ Edge function invocation failed as expected:', malApplyError.error || malApplyError.message || JSON.stringify(malApplyError));
      // Inspect if it returned the correct error or status code
      if (malApplyError.statusCode === 400 || (malApplyError.error && malApplyError.error.includes('PDF'))) {
        console.log('👉 Test 8 — Malicious Rename Verification passed successfully.\n');
      } else {
        console.error('❌ Test 8 failed: unexpected error message/status code:', malApplyError);
      }
    } else if (malApplyData && malApplyData.error) {
      console.log(`✅ Edge function rejected application as expected. Code: ${malApplyData.code || 'None'}, Error: ${malApplyData.error}`);
      if (malApplyData.code === 'INVALID_PDF_FILE' || malApplyData.error.includes('PDF')) {
        console.log('👉 Test 8 — Malicious Rename Verification passed successfully.\n');
      } else {
        console.error(`❌ Test 8 failed: expected code INVALID_PDF_FILE, but got ${malApplyData.code}`);
      }
    } else {
      console.error('❌ SECURITY FAILURE: Job application with malicious non-PDF was successfully submitted!');
    }
    
    // Cleanup malicious file
    await clientA.storage.from('resumes').remove(maliciousUploadPath);
  }

  // --------------------------------------------------------------------------
  // TEST 9: Legacy Resume Compatibility (.docx / .doc bypass)
  // --------------------------------------------------------------------------
  console.log('--- Test 9 — Legacy Resume Compatibility ---');
  
  // Clear any existing applications for Candidate A to allow reapplying
  console.log('Clearing Candidate A applications from database...');
  await admin.database.rpc('exec_sql', {
    query: `DELETE FROM public.applications WHERE candidate_id = '${candidateAId}'`
  });

  const legacyFileName = `legacy_resume_${timestamp}.docx`;
  const legacyUploadPath = `${candidateAId}/${legacyFileName}`;
  const legacyBlob = new Blob(['Microsoft Word Document legacy binary content'], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  console.log(`Uploading legacy docx file to path: resumes/${legacyUploadPath}...`);
  
  const { data: legacyUpload, error: legacyUploadError } = await clientA.storage
    .from('resumes')
    .upload(legacyUploadPath, legacyBlob, { contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

  if (legacyUploadError) {
    console.error('❌ Test 9 failed on upload:', legacyUploadError);
  } else {
    console.log('✅ Legacy file successfully stored. Invoking application snapshot...');
    
    const { data: legacyApplyData, error: legacyApplyError } = await clientA.functions.invoke('candidate-applications', {
      body: {
        jobId: testJobId,
        resumeUrl: clientA.storage.from('resumes').getPublicUrl(legacyUploadPath),
        applyType: 'manual'
      },
      headers: {
        'x-insforge-service-key': serviceKey
      }
    });

    if (legacyApplyError || !legacyApplyData || legacyApplyData.error) {
      console.error('❌ Test 9 — Legacy Resume Application Failed:', legacyApplyError || legacyApplyData?.error);
    } else {
      console.log('✅ Legacy Job application successfully submitted:', legacyApplyData.application.id);
      
      const legacyAppId = legacyApplyData.application.id;
      const legacySnapshotKey = legacyApplyData.application.resume_snapshot_key;
      console.log(`Legacy Snapshot Key: ${legacySnapshotKey}`);
      
      if (legacySnapshotKey && legacySnapshotKey.endsWith('.docx')) {
        console.log('✅ Snapshot key correctly retained the .docx extension.');
        
        // Verify snapshot exists
        const { data: legacySnapshotObj } = await admin.storage
          .from('application-snapshots')
          .download(legacySnapshotKey);
        console.log('Legacy snapshot download check:', legacySnapshotObj ? 'Found (size ' + legacySnapshotObj.size + ')' : 'Not Found');
        
        if (legacySnapshotObj) {
          // Attempt download via resume-proxy
          console.log(`Attempting download of legacy snapshot via resume-proxy...`);
          
          const response = await fetch(`${supabaseUrl.replace('ap-southeast.', 'functions.')}/resume-proxy?applicationId=${legacyAppId}&accessType=downloaded`, {
            headers: {
              'Authorization': `Bearer ${clientA.auth.tokenManager.accessToken}`,
              'x-insforge-service-key': serviceKey
            }
          });
          
          if (!response.ok) {
            console.error('❌ Test 9 — Failed to retrieve snapshot via proxy:', response.statusText);
          } else {
            const disp = response.headers.get('Content-Disposition') || '';
            const ctype = response.headers.get('Content-Type') || '';
            console.log(`Proxy headers resolved: Content-Type: "${ctype}", Content-Disposition: "${disp}"`);
            
            if (ctype.includes('wordprocessingml') && disp.includes('attachment') && disp.includes('resume.docx')) {
              console.log('✅ Proxy successfully served legacy docx with correct type/disposition!');
              console.log('👉 Test 9 — Legacy Resume Compatibility passed successfully.\n');
            } else {
              console.error('❌ Test 9 failed: Proxy headers invalid.', { ctype, disp });
            }
          }
        } else {
          console.error('❌ Test 9 failed: Legacy snapshot was not uploaded.');
        }
      } else {
        console.error(`❌ Test 9 failed: legacy snapshot key is not .docx: ${legacySnapshotKey}`);
      }
      
      // Cleanup legacy application snapshots
      if (legacySnapshotKey) {
        await admin.storage.from('application-snapshots').remove(legacySnapshotKey);
      }
    }
    
    // Cleanup original legacy file
    await clientA.storage.from('resumes').remove(legacyUploadPath);
  }
  
  // Clean up Candidate B resumes from storage
  await clientB.storage.from('resumes').remove([uploadPathB1, uploadPathB2]);

  // Clean up user accounts created
  console.log('[Cleanup] Deleting temporary test users and profiles...');
  await admin.database.rpc('exec_sql', {
    query: `DELETE FROM auth.users WHERE id IN ('${candidateAId}', '${candidateBId}')`
  });
  console.log('[Cleanup] Done.\n');

  console.log('=== Candidate Resume RLS & Security Workflow Audit Complete ===');
}

runTest().catch(console.error);
