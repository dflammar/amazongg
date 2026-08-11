import { kv } from '@vercel/kv';

const VALID_PASSWORDS = [
  'ammar1', 'ammar2', 'ammar3', 'ammar4', 'ammar5', 
  'ammar10', 'ammar11', 'ammar12', 'ammar13', 'ammar14', 'ammar15'
];

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

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'الرجاء إدخال الرقم السري' });
    }

    if (!VALID_PASSWORDS.includes(password)) {
      return res.status(400).json({ message: 'الرقم السري غير صحيح' });
    }

    // Check if Vercel KV is configured
    if (!process.env.KV_REST_API_URL) {
      // Fallback if Vercel KV is not linked yet (temporary memory list or allow login)
      console.warn('Vercel KV is not configured. Falling back to letting user log in.');
      return res.status(200).json({ success: true, message: 'Logged in (KV not linked)' });
    }

    // Check if password has already been used in Redis
    const isUsed = await kv.get(`pwd:${password}`);

    if (isUsed) {
      return res.status(400).json({ 
        success: false, 
        message: 'هذا الرقم السري تم استخدامه من قبل مستخدم آخر ولا يمكن إعادة استخدامه.' 
      });
    }

    // Set the password as used in Redis
    await kv.set(`pwd:${password}`, 'used');

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Login API error:', error);
    return res.status(500).json({ message: 'حدث خطأ في نظام التحقق.', error: error.message });
  }
}
