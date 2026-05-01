import { getPlatformSettings } from './lib/server/admin';

async function run() {
  try {
    console.log("Fetching general...");
    const val = await getPlatformSettings('general');
    console.log("Result:", val);
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}

run();
