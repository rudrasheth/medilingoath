import { useEffect, useState, useRef } from 'react';
import { BrainCircuit, Building2, Send, Loader2, AlertCircle, MapPin, Mic, MicOff, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMedicineHistory } from '@/contexts/MedicineHistoryContext';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

interface Hospital {
  name: string;
  lat: number;
  lon: number;
  distance?: number;
}

const AdvancedChatbot = ({ prescriptionText }: { prescriptionText?: string }) => {
  const { medicines, recordDose } = useMedicineHistory();
  const { user } = useAuth();
  const API_BASE_URL = 'https://medilingoath.vercel.app';
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nearbyHospitals, setNearbyHospitals] = useState<Hospital[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [messages]);

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks(prev => [...prev, event.data]);
        }
      };
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        await processAudioInput(audioBlob);
        setAudioChunks([]);
        stream.getTracks().forEach(track => track.stop());
      };
      
      setMediaRecorder(recorder);
      setAudioChunks([]);
      recorder.start();
      setIsRecording(true);
      
      toast({
        title: "🎤 Recording started",
        description: "Speak your message now...",
      });
    } catch (error) {
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to use voice input.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
      toast({
        title: "🎤 Recording stopped",
        description: "Processing your voice message...",
      });
    }
  };

  const processAudioInput = async (audioBlob: Blob) => {
    try {
      // For now, we'll use the Web Speech API for speech-to-text
      // In production, you'd send this to your voice API endpoint
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputText(transcript);
          toast({
            title: "✅ Voice recognized",
            description: `"${transcript}"`,
          });
        };
        
        recognition.onerror = () => {
          toast({
            title: "Voice recognition failed",
            description: "Please try typing your message instead.",
            variant: "destructive",
          });
        };
        
        // Note: This is a simplified implementation
        // The actual audio processing would happen on the server
        toast({
          title: "🔄 Processing voice...",
          description: "Converting speech to text...",
        });
      } else {
        toast({
          title: "Voice input not supported",
          description: "Please type your message instead.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Voice processing failed",
        description: "Please try typing your message instead.",
        variant: "destructive",
      });
    }
  };

  const speakMessage = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      // Try to use a more natural voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Google') || 
        voice.name.includes('Microsoft') ||
        voice.lang.startsWith('en')
      );
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      utterance.onstart = () => {
        toast({
          title: "🔊 Speaking...",
          description: "AI is reading the response aloud",
        });
      };
      
      utterance.onend = () => {
        toast({
          title: "✅ Speech complete",
          description: "Finished reading the response",
        });
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      toast({
        title: "Text-to-speech not supported",
        description: "Your browser doesn't support voice output.",
        variant: "destructive",
      });
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const findNearbyHospitals = async () => {
    if (!navigator.geolocation) {
      addBotMessage('🚫 Geolocation not available. Please enable location services in your browser.');
      return;
    }

    addBotMessage('📍 Getting your location to find nearby hospitals...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const radius = 5000; // 5km radius
        
        addBotMessage(`📍 Location found: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}\n🔍 Searching for hospitals within 5km...`);
        
        const query = `
          [out:json][timeout:25];
          (
            node(around:${radius},${latitude},${longitude})[amenity=hospital];
            way(around:${radius},${latitude},${longitude})[amenity=hospital];
            node(around:${radius},${latitude},${longitude})[amenity=clinic];
            way(around:${radius},${latitude},${longitude})[amenity=clinic];
            node(around:${radius},${latitude},${longitude})[healthcare=hospital];
            way(around:${radius},${latitude},${longitude})[healthcare=hospital];
          );
          out center 15;
        `;

        try {
          const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: query,
          });
          
          if (!response.ok) {
            throw new Error('Failed to fetch hospital data');
          }
          
          const data = await response.json();
          
          const hospitalList: Hospital[] = data.elements
            .map((el: any) => {
              const lat = el.lat || el.center?.lat || 0;
              const lon = el.lon || el.center?.lon || 0;
              const distance = calculateDistance(latitude, longitude, lat, lon);
              
              return {
                name: el.tags?.name || el.tags?.['healthcare:speciality'] || 'Medical Facility',
                lat,
                lon,
                distance,
              };
            })
            .filter((h: Hospital) => h.distance && h.distance <= radius && h.name !== 'Medical Facility')
            .sort((a: Hospital, b: Hospital) => (a.distance || 0) - (b.distance || 0))
            .slice(0, 8);

          setNearbyHospitals(hospitalList);

          if (hospitalList.length > 0) {
            const hospitalInfo = hospitalList.map((h, idx) => 
              `${idx + 1}. **${h.name}**\n   📍 Distance: ${(h.distance! / 1000).toFixed(2)}km\n   🗺️ [Open in Maps](https://maps.google.com/?q=${h.lat},${h.lon})\n   📞 [Get Directions](https://www.google.com/maps/dir/${latitude},${longitude}/${h.lat},${h.lon})`
            ).join('\n\n');
            
            addBotMessage(`🏥 **Found ${hospitalList.length} hospitals/clinics near you:**\n\n${hospitalInfo}\n\n💡 *Click "Get Directions" for turn-by-turn navigation*`);
          } else {
            addBotMessage('❌ No hospitals found within 5km of your location.\n\n💡 **Try:**\n• Moving to a different area\n• Checking if location services are enabled\n• Searching for "emergency services" online');
          }
        } catch (err) {
          console.error('Hospital search error:', err);
          addBotMessage('❌ Could not search for hospitals. Please check your internet connection and try again.\n\n🆘 **In case of emergency:**\n• Call 911 (US) / 999 (UK) / 112 (EU)\n• Go to nearest emergency room\n• Contact your local emergency services');
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        let errorMessage = '❌ Could not access your location.\n\n';
        
        switch(err.code) {
          case err.PERMISSION_DENIED:
            errorMessage += '🔒 **Location access denied**\n• Please allow location access in your browser\n• Check browser settings for location permissions';
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage += '📍 **Location unavailable**\n• Check if GPS/location services are enabled\n• Try refreshing the page';
            break;
          case err.TIMEOUT:
            errorMessage += '⏱️ **Location request timed out**\n• Please try again\n• Check your internet connection';
            break;
          default:
            errorMessage += '🔧 **Unknown location error**\n• Please try again or search manually';
        }
        
        errorMessage += '\n\n🆘 **For emergencies:** Call your local emergency number immediately';
        addBotMessage(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const addBotMessage = (content: string) => {
    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'bot',
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const addUserMessage = (content: string) => {
    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = inputText;
    addUserMessage(userMessage);
    setInputText('');
    setLoading(true);
    setError('');

    try {
      // Check for hospital search
      const lowerMessage = userMessage.toLowerCase();
      if (lowerMessage.includes('hospital') || lowerMessage.includes('clinic') || lowerMessage.includes('nearby')) {
        await findNearbyHospitals();
        setLoading(false);
        return;
      }

      // Try backend AI endpoint with Gemini
      try {
        console.log('🤖 Calling backend AI endpoint...');
        console.log('API URL:', `${API_BASE_URL}/api/ai?action=chat`);
        console.log('Request payload:', { message: userMessage, context: prescriptionText || `Medicines: ${medicines.length}` });
        
        const resp = await fetch(`${API_BASE_URL}/api/ai?action=chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMessage,
            context: prescriptionText ? `Prescription: ${prescriptionText}` : `Medicines: ${medicines.map(m => `${m.name} ${m.dosage}`).join(', ')}`
          }),
        });

        console.log('Backend AI response status:', resp.status);
        const responseText = await resp.text();
        console.log('Backend AI raw response:', responseText);

        if (!resp.ok) {
          console.error('Backend AI error response:', responseText);
          throw new Error(`Backend AI failed with status ${resp.status}: ${responseText}`);
        }

        const data = JSON.parse(responseText);
        console.log('✅ Backend AI parsed response:', data);

        if (data?.response) {
          addBotMessage(data.response);
        } else {
          console.error('No response field in data:', data);
          throw new Error('Empty response from backend');
        }
      } catch (backendErr) {
        console.error('⚠️ Backend API error details:', backendErr);
        console.warn('⚠️ Falling back to local rules...');
        
        // Final fallback to simple local rule-based response
        let response = '';
        const medicineNames = medicines.map(m => m.name.toLowerCase());
        const mentionedMedicine = medicineNames.find(name => lowerMessage.includes(name));
        
        if (mentionedMedicine) {
          const medicine = medicines.find(m => m.name.toLowerCase() === mentionedMedicine);
          if (medicine) {
            if (lowerMessage.includes('when') || lowerMessage.includes('time')) {
              response = `Based on your history, ${medicine.name} is typically taken at ${medicine.timeOfDay}. Maintain consistency for best results.`;
            } else if (lowerMessage.includes('dose') || lowerMessage.includes('how much')) {
              response = `Your usual dose for ${medicine.name} is ${medicine.dosage}. Do not adjust without consulting your doctor.`;
            } else if (lowerMessage.includes('side effect')) {
              response = `For any side effects from ${medicine.name}, please consult your healthcare provider immediately.`;
            } else {
              response = `${medicine.name} - ${medicine.dosage}. ${medicine.instructions || 'Take as prescribed.'}`;
            }
          }
        } else if (lowerMessage.includes('miss') || lowerMessage.includes('forgot')) {
          response = 'If you missed a dose, take it as soon as you remember unless it\'s close to your next scheduled dose. Never double up. Consult your pharmacist for specific guidance.';
        } else if (lowerMessage.includes('schedule') || lowerMessage.includes('routine')) {
          response = `Your current routine includes ${medicines.length} medicine(s). Consistency is key - take them at the same times daily.`;
        } else if (lowerMessage.includes('side effect') || lowerMessage.includes('reaction')) {
          response = 'If you experience any unusual symptoms or side effects, contact your healthcare provider immediately. Don\'t stop medications without medical advice.';
        } else {
          response = `I'm here to help with medication questions! Ask me about dosages, schedules, side effects, or interactions. For medical emergencies, call 911 or your local emergency number.`;
        }
        addBotMessage(response);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get response';
      console.error('Final error:', errorMsg);
      setError(errorMsg);
      addBotMessage(`Sorry, I encountered an error: ${errorMsg}. Please try again or contact support if the issue persists.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full h-full flex flex-col border-0 shadow-lg bg-white/50 backdrop-blur-sm">
      <CardContent className="p-4 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4 pb-4 border-b">
          <BrainCircuit className="w-5 h-5 text-primary" />
          <span className="font-semibold text-sm">AI Medicine Assistant</span>
          {medicines.length > 0 && (
            <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-1 rounded">
              {medicines.length} medicine{medicines.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-3">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        {/* Messages Area */}
        <ScrollArea className="flex-1 mb-4 border border-primary/20 rounded-lg bg-gradient-to-b from-white/80 to-white/50">
          <div className="space-y-3 p-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                <div className="mb-6">
                  <div className="text-4xl mb-3">🏥</div>
                  <p className="font-semibold mb-2 text-lg text-primary">MediLingo AI Assistant</p>
                  <p className="text-xs text-muted-foreground mb-4">Your intelligent healthcare companion</p>
                </div>
                
                <div className="grid grid-cols-1 gap-3 text-left max-w-sm mx-auto">
                  <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">💊</span>
                      <span className="font-medium text-xs">Medicine Help</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Ask about dosages, interactions, and schedules</p>
                  </div>
                  
                  <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">🏥</span>
                      <span className="font-medium text-xs">Find Hospitals</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Locate nearby medical facilities with directions</p>
                  </div>
                  
                  <div className="bg-purple-50 dark:bg-purple-950/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">🎤</span>
                      <span className="font-medium text-xs">Voice Support</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Speak your questions or listen to responses</p>
                  </div>
                  
                  <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">🚨</span>
                      <span className="font-medium text-xs">Emergency Detection</span>
                    </div>
                    <p className="text-xs text-muted-foreground">AI analyzes symptoms for severity assessment</p>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground mt-4 px-4">
                  💡 Try asking: "Find nearby hospitals" or "What are the side effects of aspirin?"
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                >
                  <div
                    className={`max-w-xs px-4 py-3 rounded-2xl text-sm break-words shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-none'
                        : 'bg-muted text-secondary rounded-bl-none border border-border'
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs opacity-60 ${
                        msg.role === 'user' ? '' : ''
                      }`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {msg.role === 'bot' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => speakMessage(msg.content)}
                          className="h-6 w-6 p-0 ml-2 opacity-60 hover:opacity-100"
                        >
                          <Volume2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-none border border-border">
                  <div className="flex gap-2 items-center">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              addUserMessage('Find nearby hospitals');
              findNearbyHospitals();
            }}
            className="text-xs h-8 flex items-center gap-1"
          >
            <Building2 className="w-3 h-3" />
            Find Hospitals
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              addUserMessage('What should I do in a medical emergency?');
              addBotMessage('🚨 **In a Medical Emergency:**\n\n**Immediate Actions:**\n• Call emergency services: 911 (US), 999 (UK), 112 (EU)\n• Stay calm and assess the situation\n• Provide first aid if trained\n• Do not move injured person unless necessary\n\n**Information to Provide:**\n• Your exact location\n• Nature of emergency\n• Number of people involved\n• Current condition of patient(s)\n\n**While Waiting:**\n• Keep patient comfortable\n• Monitor breathing and pulse\n• Apply pressure to bleeding wounds\n• Stay on the line with emergency services');
            }}
            className="text-xs h-8 flex items-center gap-1"
          >
            <AlertCircle className="w-3 h-3" />
            Emergency Help
          </Button>
        </div>

        {/* Input Area */}
        <div className="space-y-2 border-t pt-3">
          <div className="flex gap-2">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={medicines.length > 0 ? "💬 Ask me anything about your medicines..." : "📤 Upload prescription first..."}
              disabled={loading}
              className="text-sm h-10 bg-white/70 border border-primary/30 focus-visible:ring-primary"
            />
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={loading}
              size="sm"
              variant={isRecording ? "destructive" : "outline"}
              className="px-3"
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={loading || !inputText.trim()}
              size="sm"
              className="px-4 bg-primary hover:bg-primary/90"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            💡 Type, speak, or press Enter • 🔊 Click speaker icons to hear responses
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvancedChatbot;
