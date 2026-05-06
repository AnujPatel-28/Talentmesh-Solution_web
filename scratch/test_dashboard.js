
const axios = require('axios');
const baseUrl = 'https://tnthhoxvzhhldatshskx.region.insforge.app'; // I'll get the real URL from env if I can, but let's assume it's this based on context
const anonKey = '...'; // I'll use the one from lib/insforge.ts if I can find it or just mock the call

async function test() {
  try {
    const response = await axios.post(`${baseUrl}/functions/admin-dashboard`, {
      action: 'get-summary'
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.ADMIN_KEY}`, // I don't have this, so I'll just look at the code again
        'Content-Type': 'application/json'
      }
    });
    console.log(JSON.stringify(response.data, null, 2));
  } catch (err) {
    console.error(err.response?.data || err.message);
  }
}
// test();
