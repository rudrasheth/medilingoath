import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

// Initialize MongoDB connection
if (mongoose.connection.readyState === 0) {
  mongoose.connect(process.env.MONGODB_URI!);
}

// Prescription Schema
const PrescriptionSchema = new mongoose.Schema({
  userId: String,
  imageUrl: String,
  text: String,
  analysis: {
    medications: [String],
    dosages: [String],
    instructions: [String],
    warnings: [String],
    interactions: [String]
  },
  createdAt: { type: Date, default: Date.now },
});

const Prescription = mongoose.models.Prescription || mongoose.model('Prescription', PrescriptionSchema);

// Medical data for semantic search
interface MedicalRecord {
  ID: string;
  'Symptoms/Question': string;
  'Disease Prediction': string;
  'Recommended Medicines': string;
  Advice: string;
  text_to_embed: string;
  Severity_Score: string;
  [key: string]: string; // For vector columns
}

let medicalData: MedicalRecord[] = [];

// Load medical data from CSV
const loadMedicalData = (): MedicalRecord[] => {
  if (medicalData.length > 0) return medicalData;
  
  try {
    const csvPath = path.join(process.cwd(), 'server', 'medical_data.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',');
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',');
        const record: MedicalRecord = {} as MedicalRecord;
        headers.forEach((header, index) => {
          record[header.trim()] = values[index]?.trim() || '';
        });
        medicalData.push(record);
      }
    }
  } catch (error) {
    console.error('Error loading medical data:', error);
  }
  
  return medicalData;
};

// Simple cosine similarity for semantic search
const cosineSimilarity = (vecA: number[], vecB: number[]) => {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
};

// Generate embedding using Gemini (simplified approach)
const generateEmbedding = async (text: string, genAI: any) => {
  try {
    const model = genAI.getGenerativeModel({ model: "embedding-001" });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    // Fallback: create a simple hash-based embedding
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(384).fill(0);
    words.forEach((word, i) => {
      const hash = word.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      embedding[i % 384] += Math.abs(hash) / 1000000;
    });
    return embedding;
  }
};

// Semantic search in medical data
const semanticSearch = async (query: string, genAI: any): Promise<MedicalRecord | null> => {
  const data = loadMedicalData();
  if (data.length === 0) return null;

  try {
    const queryEmbedding = await generateEmbedding(query, genAI);
    let bestMatch: MedicalRecord | null = null;
    let bestScore = -1;

    for (const record of data) {
      // Extract vector values (vector_0 to vector_383)
      const recordVector: number[] = [];
      for (let i = 0; i < 384; i++) {
        const vectorValue = parseFloat(record[`vector_${i}`] || '0');
        recordVector.push(vectorValue);
      }

      const similarity = cosineSimilarity(queryEmbedding, recordVector);
      if (similarity > bestScore) {
        bestScore = similarity;
        bestMatch = record;
      }
    }

    return bestMatch;
  } catch (error) {
    console.error('Semantic search error:', error);
    return null;
  }
};

// Check if symptoms indicate emergency
const isEmergency = (symptoms: string, severityScore: number) => {
  const emergencyKeywords = [
    'chest pain', 'heart attack', 'stroke', 'difficulty breathing', 'severe bleeding',
    'unconscious', 'seizure', 'severe allergic reaction', 'poisoning', 'severe burns',
    'broken bone', 'head injury', 'severe abdominal pain', 'choking', 'overdose'
  ];
  
  const lowerSymptoms = symptoms.toLowerCase();
  const hasEmergencyKeyword = emergencyKeywords.some(keyword => 
    lowerSymptoms.includes(keyword)
  );
  
  return hasEmergencyKeyword || severityScore > 0.7;
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action } = req.query;
    const apiKey = process.env.GEMINI_API_KEY;

    // Enhanced chat with semantic search and severity analysis
    if (action === 'chat') {
      const { message, context } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      if (!apiKey) {
        return res.status(500).json({ error: 'Gemini API key not configured' });
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      
      // Perform semantic search
      const medicalMatch = await semanticSearch(message, genAI);
      
      let severityScore = 0;
      let isEmergencyCase = false;
      let ambulanceRecommendation = '';

      if (medicalMatch) {
        severityScore = parseFloat(medicalMatch.Severity_Score || '0');
        isEmergencyCase = isEmergency(message, severityScore);
        
        if (isEmergencyCase) {
          ambulanceRecommendation = `
🚨 **EMERGENCY DETECTED** 🚨
Severity Score: ${(severityScore * 100).toFixed(1)}%

**IMMEDIATE ACTION REQUIRED:**
📞 Call Emergency Services: 911 (US), 999 (UK), 112 (EU)
🏥 Go to nearest emergency room immediately
⏰ Time is critical - do not delay

**While waiting for help:**
- Stay calm and keep the person conscious if possible
- Do not move if spinal injury is suspected
- Apply pressure to bleeding wounds
- Monitor breathing and pulse
`;
        }
      }

      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const enhancedPrompt = `You are MediLingo, an advanced medical AI assistant. You provide accurate, helpful medical information while being empathetic and supportive.

${medicalMatch ? `
**MEDICAL DATABASE MATCH FOUND:**
- Condition: ${medicalMatch['Disease Prediction']}
- Recommended Treatment: ${medicalMatch['Recommended Medicines']}
- Medical Advice: ${medicalMatch.Advice}
- Severity Score: ${(severityScore * 100).toFixed(1)}%
` : ''}

${ambulanceRecommendation}

**GUIDELINES:**
- Always recommend consulting healthcare professionals for serious concerns
- Provide general health information, not specific medical diagnoses
- Be supportive and understanding, especially for sensitive topics
- Focus on women's health, period tracking, medication management, and general wellness
- If asked about prescriptions, help interpret but recommend pharmacist/doctor consultation
- Keep responses concise but informative
- If emergency detected, emphasize immediate medical attention

Context: ${context || 'No additional context provided'}
User message: ${message}

Respond as MediLingo with appropriate urgency level:`;

      const result = await model.generateContent(enhancedPrompt);
      const response = result.response;
      const text = response.text();

      return res.json({
        ok: true,
        response: text,
        severityScore: severityScore,
        isEmergency: isEmergencyCase,
        medicalMatch: medicalMatch ? {
          condition: medicalMatch['Disease Prediction'],
          medicines: medicalMatch['Recommended Medicines'],
          advice: medicalMatch.Advice,
          severity: severityScore
        } : null,
        ambulanceAlert: isEmergencyCase,
        timestamp: new Date().toISOString()
      });
    }

    // Analyze prescription (existing functionality)
    if (action === 'analyze') {
      const { text, userId } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: 'Prescription text is required' });
      }

      if (!apiKey) {
        const fallbackAnalysis = {
          medications: ['Unable to analyze - AI service unavailable'],
          dosages: ['Please consult pharmacist'],
          instructions: ['Follow doctor\'s instructions'],
          warnings: ['Consult healthcare provider for proper guidance'],
          interactions: ['Check with pharmacist for drug interactions']
        };

        if (userId) {
          await Prescription.create({
            userId,
            text,
            analysis: fallbackAnalysis
          });
        }

        return res.json({
          ok: true,
          analysis: fallbackAnalysis,
          fallback: true
        });
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const analysisPrompt = `Analyze this prescription text and extract key information. Return a JSON response with the following structure:

{
  "medications": ["list of medication names"],
  "dosages": ["list of dosages with frequencies"],
  "instructions": ["list of specific instructions"],
  "warnings": ["list of important warnings or side effects"],
  "interactions": ["list of potential drug interactions or precautions"]
}

Prescription text: ${text}

Important: Only provide factual information from the prescription. Add general safety reminders but avoid specific medical advice.`;

      const result = await model.generateContent(analysisPrompt);
      const response = result.response;
      const analysisText = response.text();

      let analysis: any;
      try {
        const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        analysis = {
          medications: ['Analysis available - see full response'],
          dosages: ['Please refer to original prescription'],
          instructions: ['Follow prescribed instructions'],
          warnings: ['Consult healthcare provider'],
          interactions: ['Check with pharmacist'],
          fullResponse: analysisText
        };
      }

      if (userId) {
        await Prescription.create({
          userId,
          text,
          analysis
        });
      }

      return res.json({
        ok: true,
        analysis,
        timestamp: new Date().toISOString()
      });
    }

    // Text-to-Speech functionality
    if (action === 'synthesize') {
      const { text } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: 'Text is required for synthesis' });
      }

      // For now, return a placeholder response since Gemini doesn't have direct text-to-speech
      // In a real implementation, you'd use Google Cloud Text-to-Speech API
      return res.json({
        ok: true,
        audioUrl: null,
        message: "Text-to-speech functionality will be implemented with Google Cloud Text-to-Speech API",
        text: text
      });
    }

    // Speech-to-Text functionality
    if (action === 'transcribe') {
      // For now, return a placeholder response since Gemini doesn't have direct speech-to-text
      // In a real implementation, you'd use Google Cloud Speech-to-Text API
      return res.json({
        ok: true,
        transcription: "Speech-to-text functionality will be implemented with Google Cloud Speech API",
        message: "Please type your message for now"
      });
    }

    return res.status(400).json({ error: 'Invalid action' });

  } catch (error) {
    console.error('AI API error:', error);
    
    const { action } = req.query;
    const fallbackResponse = action === 'chat' 
      ? "I'm having trouble connecting to my AI service right now. For medical questions, please consult with a healthcare professional. If this is an emergency, call 911 immediately."
      : {
          medications: ['Analysis failed - please consult pharmacist'],
          dosages: ['Refer to original prescription'],
          instructions: ['Follow doctor\'s instructions carefully'],
          warnings: ['Consult healthcare provider for guidance'],
          interactions: ['Check with pharmacist for drug interactions']
        };
    
    return res.status(200).json({
      ok: true,
      [action === 'chat' ? 'response' : 'analysis']: fallbackResponse,
      fallback: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}