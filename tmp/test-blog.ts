import { insforge as publicClient } from '../lib/insforge';

async function test() {
  try {
    console.log('Fetching all columns from blog table...');
    const { data, error } = await publicClient.database
      .from('blog')
      .select('*');
    
    if (error) {
      console.error('DATABASE ERROR:', error.message);
    } else {
      console.log('Success!', JSON.stringify(data, null, 2));
    }
  } catch (err: any) {
    console.error('FAILED with error:', err.message);
  }
}

test();
