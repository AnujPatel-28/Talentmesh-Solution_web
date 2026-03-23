const { createClient } = require('@insforge/sdk');
require('dotenv').config({ path: '.env.local' });

const client = createClient({
  baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL,
  anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY
});

async function checkSchema() {
  const { data, error } = await client.database
    .from('information_schema.columns')
    .select('column_name')
    .eq('table_name', 'profiles');
    
  if (error) {
    console.error('Error:', error);
    // If info schema fails, try a direct select * limit 1
    const { data: row } = await client.database.from('profiles').select('*').limit(1);
    console.log('Sample row keys:', Object.keys(row[0] || {}));
    return;
  }
  
  console.log('Columns:', data.map(c => c.column_name).join(', '));
}

checkSchema();
