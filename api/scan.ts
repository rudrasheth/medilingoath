import type { VercelRequest, VercelResponse } from '@vercel/node';

import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image } = req.body || {};
  if (!image) return res.status(400).json({ error: 'image required (base64 data URL)' });

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const parts = image.split(';');
    if (parts.length !== 2) {
      return res.status(400).json({ error: 'Invalid image format' });
    }
    
    const mimeType = parts[0].split(':')[1];
    const data = parts[1].split(',')[1];

    if (!mimeType || !data) {
      return res.status(400).json({ error: 'Invalid image format' });
    }

    const prompt = "You are an expert medical assistant. Carefully read this prescription image and extract all the handwritten or typed text, including the doctor's details, the names of the medicines, dosages, and instructions. Do not hallucinate. Output exactly what is written, formatting it clearly in plain text. Start the text directly without conversational filler.";
    
    const result = await model.generateContent([
      prompt,
      { inlineData: { data, mimeType } }
    ]);
    
    const response = await result.response;
    const text = response.text();
    
    return res.json({ ok: true, text });
  } catch (error: any) {
    console.error('OCR via Gemini failed', error.message);
    
    // Fallback if API fails
    const fallback = 'Could not decipher the prescription automatically. Please check the image quality.';
    return res.json({ ok: true, text: fallback });
  }
}