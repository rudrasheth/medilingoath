import { useState } from 'react';
import { API_BASE_URL } from '@/lib/config';

interface ScanResult {
  text: string;
  medicines?: {
    name: string;
    dosage: string;
    timing: string;
  }[];
}

// Helper function to parse medicines from OCR text
function parseMedicines(text: string) {
  const medicines: { name: string; dosage: string; timing: string }[] = [];
  
  // Common medicine patterns
  const lines = text.split('\n').filter(line => line.trim());
  
  for (const line of lines) {
    // Look for patterns like "Medicine 500mg" or "Tab Medicine"
    const medicineMatch = line.match(/(?:Tab\.|Syp\.|Cap\.?)?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*(\d+\s*(?:mg|ml|g)?)/i);
    
    if (medicineMatch) {
      const name = medicineMatch[1].trim();
      const dosage = medicineMatch[2].trim();
      
      // Try to extract timing
      let timing = 'As directed';
      if (/morning|breakfast/i.test(line)) timing = 'Morning';
      else if (/afternoon|lunch/i.test(line)) timing = 'Afternoon';
      else if (/evening|dinner|night/i.test(line)) timing = 'Night';
      else if (/\b[0-9]-[0-9]-[0-9]\b/.test(line)) timing = 'As per schedule';
      
      medicines.push({ name, dosage, timing });
    }
  }
  
  return medicines.length > 0 ? medicines : undefined;
}

export const useAiScan = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const scan = async (file: File): Promise<string> => {
    setLoading(true);
    setError(null);
    setProgress(10);
    
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file (JPEG, PNG, etc.)');
      }

      // Convert file to base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
      });
      
      setProgress(40);

      // Call our backend endpoint which uses Gemini Vision
      const response = await fetch(`${API_BASE_URL}/api/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: base64Data }),
      });

      setProgress(80);

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const extractedText = data.text?.trim() || '';
      
      if (!extractedText || extractedText.length < 5) {
        throw new Error('No clear text detected in the image. Please upload a clearer prescription image.');
      }

      setProgress(100);

      // Parse medicine information from the text (optional, for future use)
      const medicines = parseMedicines(extractedText);
      console.log('Parsed medicines:', medicines);

      return extractedText;
    } catch (e: any) {
      console.error('OCR Error:', e);
      const fallback = 'Could not scan prescription. Please try again with a clearer image or check your internet connection.';
      setError(e?.message || 'Failed to scan prescription');
      return fallback;
    } finally {
      setLoading(false);
      // Optional: keep progress at 100 for a short moment before resetting if you prefer
      setTimeout(() => setProgress(0), 500);
    }
  };

  return { scan, loading, error, progress };
};
