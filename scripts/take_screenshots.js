const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// ==========================================
// CONFIGURATION: Enter your test credentials here
// ==========================================
const BASE_URL = 'http://localhost:3000';
const EMAIL = 'test@example.com';      // Replace with a valid test email
const PASSWORD = 'testpassword123';    // Replace with a valid test password

// Add any specific candidate/recruiter role UUIDs if you know them, 
// otherwise the script will try to extract them after login.
const CANDIDATE_ROLE_ID = 'your-candidate-id-here'; 
const RECRUITER_ROLE_ID = 'your-recruiter-id-here';

const SCREENSHOT_DIR = path.join(__dirname, '..', 'screenshots');

const ROUTES_TO_CAPTURE = [
  { name: '01_Login', path: '/auth/login' },
  { name: '02_Register', path: '/auth/register' },
  // Admin Routes
  { name: '03_Admin_Dashboard', path: '/dashboard/admin' },
  { name: '04_Admin_Jobs', path: '/dashboard/admin/jobs' },
  { name: '05_Admin_Candidates', path: '/dashboard/admin/candidates' },
  // Candidate Routes
  { name: '06_Candidate_Dashboard', path: `/dashboard/candidate/${CANDIDATE_ROLE_ID}` },
  { name: '07_Candidate_Applications', path: `/dashboard/candidate/${CANDIDATE_ROLE_ID}/applications` },
  { name: '08_Candidate_Profile', path: `/dashboard/candidate/${CANDIDATE_ROLE_ID}/profile` },
  // Recruiter Routes
  { name: '09_Recruiter_Dashboard', path: `/dashboard/recruiter/${RECRUITER_ROLE_ID}` },
  { name: '10_Recruiter_Jobs', path: `/dashboard/recruiter/${RECRUITER_ROLE_ID}/jobs` },
];

(async () => {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR);
  }

  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 1. Capture Unauthenticated Routes
  console.log('Capturing unauthenticated routes...');
  await page.goto(`${BASE_URL}/auth/register`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_Register.png'), fullPage: true });

  await page.goto(`${BASE_URL}/auth/login`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_Login.png'), fullPage: true });

  // 2. Log In
  console.log(`Logging in with ${EMAIL}...`);
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  
  // Update this selector based on your actual login button
  await page.click('button[type="submit"]'); 
  
  // Wait for navigation after login
  await page.waitForNavigation({ waitUntil: 'networkidle' });
  console.log('Logged in successfully!');

  // 3. Capture Authenticated Dashboard Routes
  for (const route of ROUTES_TO_CAPTURE) {
    if (route.name.includes('Login') || route.name.includes('Register')) continue;

    console.log(`Navigating to ${route.name}...`);
    await page.goto(`${BASE_URL}${route.path}`);
    
    // Wait for skeletons to disappear and data to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500); // Give it an extra 1.5s for any client-side renders

    const filePath = path.join(SCREENSHOT_DIR, `${route.name}.png`);
    await page.screenshot({ path: filePath, fullPage: true });
    console.log(`Saved screenshot to ${filePath}`);
  }

  console.log('All screenshots captured successfully!');
  await browser.close();
})();
