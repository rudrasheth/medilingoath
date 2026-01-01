import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  const viteKey = process.env.VITE_GEMINI_API_KEY;
  
  return res.json({
    hasGeminiKey: !!geminiKey,
    geminiKeyPreview: geminiKey ? `${geminiKey.substring(0, 20)}...` : 'NOT SET',
    hasViteKey: !!viteKey,
    viteKeyPreview: viteKey ? `${viteKey.substring(0, 20)}...` : 'NOT SET (good!)',
    allEnvKeys: Object.keys(process.env).filter(k => 
      k.includes('GEMINI') || k.includes('API') || k.includes('KEY')
    ),
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
}
