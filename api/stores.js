import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Check if Vercel KV is configured
  if (!process.env.KV_REST_API_URL) {
    return res.status(503).json({ 
      success: false, 
      message: 'Vercel KV database is not linked yet.' 
    });
  }

  try {
    if (req.method === 'GET') {
      const stores = await kv.get('ammar_stores_data');
      return res.status(200).json({ success: true, stores });
    }

    if (req.method === 'POST') {
      const stores = req.body;
      if (!stores || !Array.isArray(stores)) {
        return res.status(400).json({ success: false, message: 'Invalid stores data' });
      }
      
      await kv.set('ammar_stores_data', stores);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (error) {
    console.error('Stores API error:', error);
    return res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
}
