# 🤖 Gemini Chatbot Setup Guide

This guide explains how to configure the Gemini API key for the chatbot on Vercel.

## Prerequisites
- You have a Gemini API key (should start with `AIza`)
- You have access to your Vercel project

## Environment Variables Required

The chatbot needs these environment variables to work properly:

### Frontend (.env.local)
```dotenv
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### Backend/Vercel (Production)
```
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

## Setup Steps

### 1. Local Development (Already Done)
The `.env.local` file in your repo root should have:
```
VITE_GEMINI_API_KEY=AIzaSyAKOhhF1fXz9OjHCKD8BOuqrskz4Y0y0QA
GEMINI_API_KEY=AIzaSyAKOhhF1fXz9OjHCKD8BOuqrskz4Y0y0QA
```

### 2. Vercel Production Setup
Follow these steps to add env vars to your live deployment:

1. Go to: https://vercel.com/rudrasheth2201-8352s-projects/medilingoath
2. Click **Settings** (top menu)
3. Go to **Environment Variables**
4. Add these two variables:

| Name | Value | Environments |
|------|-------|--------------|
| `GEMINI_API_KEY` | Your API key | Production, Preview, Development |
| `VITE_GEMINI_API_KEY` | Your API key | Production, Preview, Development |

5. Click "Save"
6. Go to **Deployments** and redeploy (or push a new commit)

## How the Chatbot Works

The chatbot uses this fallback chain:

1. **Backend API** (`/api/ai?action=chat`) - Calls Gemini with medical database
2. **Prescription Chat** (`/api/prescriptions/chat`) - Analyzes your prescription
3. **Local Rules** - Uses your medicine history if APIs fail

## Testing the Chatbot

1. Open https://medilingoath.vercel.app
2. Upload a prescription (JPG/PNG)
3. Ask the chatbot a question like:
   - "What is the dosage of this medicine?"
   - "When should I take this?"
   - "What are the side effects?"
   - "Find nearby hospitals"

## Troubleshooting

### Error: "Gemini API key not configured"
- Check that `GEMINI_API_KEY` is set in Vercel environment variables
- Redeploy after adding the environment variable
- Wait 2-3 minutes for deployment to complete

### Chatbot responds but uses basic rules
- The backend AI endpoint isn't working
- Check that MongoDB is connected (for medical database)
- Verify the API key is valid

### Chatbot shows slow response
- First call might be slow while Vercel spins up
- Gemini API can be rate-limited; try waiting a few seconds
- Check browser console (F12) for error details

## API Endpoints

### POST `/api/ai?action=chat`
Calls Gemini with medical knowledge base.

**Request:**
```json
{
  "message": "What is aspirin dosage?",
  "context": "Medicines: Aspirin 500mg, Metformin 1000mg"
}
```

**Response:**
```json
{
  "response": "Aspirin dosage...",
  "source": "gemini_ai",
  "severity": {
    "score": 3,
    "level": "Moderate",
    "isEmergency": false
  }
}
```

### POST `/api/prescriptions/chat`
Fallback endpoint using uploaded prescription.

**Request:**
```json
{
  "userId": "user123",
  "userMessage": "What are the interactions?"
}
```

**Response:**
```json
{
  "reply": "Based on your prescription..."
}
```

## Security Notes

⚠️ **IMPORTANT:**
- Never commit `.env.local` to GitHub
- Never share your Gemini API key publicly
- Use Vercel's environment variables for production
- The key starts with `AIza` - keep it secret!

## Further Help

- [Gemini API Docs](https://ai.google.dev/)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- Check browser DevTools (F12 → Console) for detailed error messages
