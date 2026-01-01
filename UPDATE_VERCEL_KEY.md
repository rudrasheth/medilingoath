# IMPORTANT: Update Vercel Environment Variable

The new Gemini API key needs to be updated in Vercel:

1. Go to: https://vercel.com/rudrasheth2201-8352s-projects/medilingoath/settings/environment-variables

2. Find `GEMINI_API_KEY` and update it to:
   ```
   AIzaSyBIk5DvsQ4qm142vmTIBxpTwNSNa5UWVdU
   ```

3. Apply to: Production, Preview, Development

4. Redeploy after saving

This ensures the backend AI chatbot works properly without exposing the API key in the frontend.
