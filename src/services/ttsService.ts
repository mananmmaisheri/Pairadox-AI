
import { MurfConfig } from '../types';

// Use a known English Falcon or similar fast voice ID from Murf
// Users would typically configure this or it comes from env.
const DEFAULT_MURF_VOICE_ID = 'en-US-terra'; 

export const generateSpeech = async (
  text: string, 
  config: MurfConfig
): Promise<string> => { // Returns Audio URL
  
  if (!config.apiKey) {
    // console.warn("Murf API Key missing, falling back to browser synthesis.");
    return fallbackSynthesis(text, config.voiceId);
  }

  try {
    const response = await fetch('https://api.murf.ai/v1/speech/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'api-key': config.apiKey,
      },
      body: JSON.stringify({
        voiceId: config.voiceId || DEFAULT_MURF_VOICE_ID,
        style: 'Conversational',
        text: text,
        rate: 0,
        pitch: 0,
        sampleRate: 24000,
        format: 'MP3',
        encodeAsBase64: true, 
        variation: 1,
        audioDuration: 0
      }),
    });

    if (!response.ok) {
      // If unauthorized or quota exceeded, fall back
      return fallbackSynthesis(text, config.voiceId);
    }

    const data = await response.json();
    
    if (data.encodedAudio) {
        return `data:audio/mp3;base64,${data.encodedAudio}`;
    }
    
    if (data.audioFile) {
        return data.audioFile;
    }

    throw new Error("Invalid response format from Murf");

  } catch (error) {
    console.error("Murf TTS failed, using fallback:", error);
    return fallbackSynthesis(text, config.voiceId);
  }
};

const fallbackSynthesis = (text: string, voiceId?: string): Promise<string> => {
    return new Promise((resolve) => {
        const synth = window.speechSynthesis;
        
        // Cancel any ongoing speech to avoid overlap
        synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        
        const trySpeak = () => {
            const voices = synth.getVoices();
            let selectedVoice = null;
            const vid = voiceId?.toLowerCase() || '';

            // HELPER: Priority Search for High Quality Voices
            // We prioritize "Natural" (Edge), "Online" (Chrome), "Premium" (Apple)
            const findVoice = (terms: string[], avoid: string[] = []) => {
                // 1. Natural/Online (Highest Quality)
                let match = voices.find(v => 
                    terms.every(term => v.name.toLowerCase().includes(term)) &&
                    avoid.every(term => !v.name.toLowerCase().includes(term)) &&
                    (v.name.includes('Natural') || v.name.includes('Online') || v.name.includes('Premium'))
                );
                if (match) return match;

                // 2. Standard Match
                match = voices.find(v => 
                    terms.every(term => v.name.toLowerCase().includes(term)) &&
                    avoid.every(term => !v.name.toLowerCase().includes(term))
                );
                return match;
            };

            // 1. LEAH (Soft Female)
            if (vid.includes('michelle') || vid.includes('female')) {
                selectedVoice = findVoice(['female', 'us'], ['male']) || 
                                findVoice(['samantha']) || 
                                findVoice(['google us english'], ['male']);
                
                // Fallback: Pick any female voice
                if (!selectedVoice) selectedVoice = voices.find(v => !v.name.toLowerCase().includes('male'));
            } 
            
            // 2. GARY (British Charming Male)
            else if (vid.includes('gabriel') || vid.includes('uk')) {
                 selectedVoice = findVoice(['uk', 'male']) || 
                                 findVoice(['gb', 'male']) ||
                                 findVoice(['daniel']);
            }
            
            // 3. ANDREW (Stark / Tech Male)
            else if (vid.includes('stark')) {
                 // Look for distinct deep male voices
                 selectedVoice = findVoice(['male', 'us'], ['google us english']) || // Often Google US is generic
                                 findVoice(['mark']) || 
                                 findVoice(['david']) || 
                                 findVoice(['alex']);
            }
            
            // 4. CHASE (Ryan / Charismatic Male)
            else if (vid.includes('ryan')) {
                // We want a standard American male, but energetic
                selectedVoice = findVoice(['male', 'us', 'natural']) || // Edge Natural
                                findVoice(['guy']) || // Edge Online Guy
                                findVoice(['google us english']) || // Chrome Standard
                                findVoice(['male', 'us']);
            }
            
            // Default Fallback
            if (!selectedVoice) {
                selectedVoice = voices.find(v => v.default) || voices[0];
            }

            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }

            // HUMANIZATION TUNING
            // We avoid Pitch Shifting (anything != 1.0) as it creates robotic artifacts.
            // We use Rate (Speed) to differentiate.
            utterance.pitch = 1.0; // Keep natural pitch
            utterance.rate = 1.0;  // Default

            if (vid.includes('michelle')) { 
                utterance.rate = 1.0; 
                // Leah: Standard speed, natural pitch.
            } else if (vid.includes('gabriel')) {
                utterance.rate = 0.9; 
                // Gary: Slightly slower for British articulation/charm.
            } else if (vid.includes('stark')) {
                utterance.rate = 1.1; 
                // Andrew: Fast, confident, intelligent.
            } else if (vid.includes('ryan')) {
                utterance.rate = 1.1; 
                // Chase: Energetic, punchy.
            }
            
            synth.speak(utterance);
            resolve("BROWSER_NATIVE"); 
        };

        if (synth.getVoices().length === 0) {
            window.speechSynthesis.onvoiceschanged = () => {
                trySpeak();
                window.speechSynthesis.onvoiceschanged = null; 
            };
        } else {
            trySpeak();
        }
    });
}
