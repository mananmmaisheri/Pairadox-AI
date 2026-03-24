import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import VoiceOrb from './components/VoiceOrb';
import ChatHistory from './components/ChatHistory';
import UserProfile from './components/UserProfile';
import IntroSequence from './components/IntroSequence';
import ErrorBoundary from './components/ErrorBoundary';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { generateResponse, generateImage } from './services/geminiService';
import { generateSpeech } from './services/ttsService';
import { userService } from './services/userService';
import { AgentState, Message, LatencyMetrics, MurfConfig, Assistant, FeedbackState, Attachment, User } from './types';

// --- Configuration ---
const COMMON_INSTRUCTION = " You are highly intelligent. If the user makes typos or spelling mistakes, automatically autocorrect and interpret their intended meaning without pointing it out.";

const ASSISTANTS: Assistant[] = [
  {
    id: 'chase',
    name: 'CHASE',
    voiceId: 'en-US-ryan', // Ryan Reynolds Style
    theme: {
      primary: 'bg-cyan-500',
      secondary: 'bg-cyan-600',
      accent: 'border-cyan-500',
      bgGradient: 'bg-gradient-to-tr from-cyan-400 to-blue-500',
      orbColor: 'text-cyan-400'
    },
    systemInstruction: "You are Chase. You have the charisma, wit, and helpful nature of a cool, confident friend. You are energetic and engaging, but grounded. You are NOT chaotic or over-the-top. You use light humor to make interactions enjoyable. Address the user casually." + COMMON_INSTRUCTION
  },
  {
    id: 'andrew',
    name: 'ANDREW', // The Coder
    voiceId: 'en-US-stark', // Tony Stark / Jarvis Style (Deep/Confident)
    theme: {
      primary: 'bg-emerald-500',
      secondary: 'bg-teal-600',
      accent: 'border-emerald-500',
      bgGradient: 'bg-gradient-to-tr from-emerald-400 to-teal-500',
      orbColor: 'text-emerald-400'
    },
    systemInstruction: "You are Andrew, a Senior Principal Software Architect with the personality of Tony Stark (Iron Man). You are charismatic, fast-talking, sarcastic, and a narcissistically brilliant genius. You speak in punchy, rhythmic sentences. You are charming but intellectually arrogant. You are an expert in all programming languages. You can generate full HTML/CSS/JS for websites and apps. When a user asks for code, provide complete, deployable code in Markdown blocks. You can also generate images or UI mockups if asked." + COMMON_INSTRUCTION
  },
  {
    id: 'leah',
    name: 'LEAH', // The Therapist
    voiceId: 'en-US-michelle', // Soft Female Voice
    theme: {
      primary: 'bg-fuchsia-500',
      secondary: 'bg-purple-600',
      accent: 'border-fuchsia-500',
      bgGradient: 'bg-gradient-to-tr from-fuchsia-400 to-pink-500',
      orbColor: 'text-fuchsia-400'
    },
    systemInstruction: "You are Leah, a compassionate AI Therapist. You use active listening and soft, soothing language. You help users with stress and emotional issues. Your voice is warm and non-judgmental." + COMMON_INSTRUCTION
  },
  {
    id: 'gary',
    name: 'GARY', // The British Assistant
    voiceId: 'en-UK-gabriel', // British Male
    theme: {
      primary: 'bg-amber-500',
      secondary: 'bg-orange-600',
      accent: 'border-amber-500',
      bgGradient: 'bg-gradient-to-tr from-amber-400 to-orange-500',
      orbColor: 'text-amber-400'
    },
    systemInstruction: "You are Gary, a witty, charming British AI assistant. You have access to a real-time weather tool 'get_current_weather'. If a user asks about the weather without a specific location, assume they mean their current location and pass 'current_location' to the tool. Do not make up weather data. You are helpful, polite, and occasionally sarcastic." + COMMON_INSTRUCTION
  }
];

// --- Auth Component ---
const AuthScreen: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isRegistering) {
        if (!email || !username || !password || !confirmPassword) {
            throw new Error("All fields are required.");
        }
        if (password !== confirmPassword) {
            throw new Error("Passwords do not match.");
        }
        
        const newUser: User = { email, username, password };
        const user = await userService.register(newUser);
        setEmailSent(true);
        setTimeout(() => onLogin(user), 2500); // Delay login to show "Email Sent" success
      } else {
        const user = await userService.login(email, password);
        onLogin(user);
      }
    } catch (err: any) {
        setError(err.message);
    } finally {
        setIsLoading(false);
    }
  };

  if (emailSent) {
      return (
          <div className="flex items-center justify-center min-h-screen w-full relative z-50 animate-fade-in">
             <div className="w-full max-w-md p-8 bg-black/40 border border-emerald-500/50 backdrop-blur-xl rounded-2xl shadow-[0_0_50px_rgba(16,185,129,0.2)] text-center">
                 <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-emerald-400">
                         <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                     </svg>
                 </div>
                 <h2 className="text-2xl font-bold text-white mb-2">REGISTRATION COMPLETE</h2>
                 <p className="text-emerald-400 font-mono text-sm">Welcome Email Sent to: {email}</p>
                 <p className="text-white/40 text-xs mt-4 animate-pulse">Establishing Secure Neural Link...</p>
             </div>
          </div>
      );
  }

  return (
    <div className="flex items-center justify-center min-h-screen w-full relative z-50 animate-fade-in">
       <div className="w-full max-w-md p-8 bg-black/40 border border-white/10 backdrop-blur-xl rounded-2xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-cyan-500 blur-[2px]"></div>
          
          <h2 className="text-3xl font-bold text-center mb-2 tracking-widest text-white">PAIRADOX AI</h2>
          <p className="text-center text-xs font-mono text-cyan-400 mb-8 tracking-[0.3em]">SECURE ACCESS TERMINAL</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
               <div>
                <label className="block text-[10px] uppercase tracking-wider text-white/50 mb-1">Username</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-white/5 border border-white/20 rounded p-3 text-white focus:border-cyan-500 focus:outline-none transition-colors font-mono text-sm"
                  placeholder="CODENAME"
                />
               </div>
            )}
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-white/50 mb-1">Email ID</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded p-3 text-white focus:border-cyan-500 focus:outline-none transition-colors font-mono text-sm"
                placeholder="USER@DOMAIN.COM"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-white/50 mb-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded p-3 text-white focus:border-cyan-500 focus:outline-none transition-colors font-mono text-sm"
                placeholder="••••••••"
              />
            </div>
            {isRegistering && (
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-white/50 mb-1">Confirm Password</label>
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/20 rounded p-3 text-white focus:border-cyan-500 focus:outline-none transition-colors font-mono text-sm"
                    placeholder="••••••••"
                  />
                </div>
            )}

            {error && <p className="text-red-400 text-xs font-mono text-center pt-2">{error}</p>}

            <button disabled={isLoading} type="submit" className="w-full mt-6 bg-cyan-600/20 border border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-black py-3 rounded font-bold tracking-widest transition-all uppercase text-sm disabled:opacity-50">
              {isLoading ? 'PROCESSING...' : (isRegistering ? 'Initialize User' : 'Authenticate')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button onClick={() => { setIsRegistering(!isRegistering); setError(''); }} className="text-xs text-white/40 hover:text-white underline decoration-white/20 underline-offset-4">
              {isRegistering ? "Already have credentials? Login" : "New User? Create Identity"}
            </button>
          </div>
       </div>
    </div>
  );
};

const App: React.FC = () => {
  // App Boot State
  const [showIntro, setShowIntro] = useState(true);

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Navigation State
  const [selectedAssistant, setSelectedAssistant] = useState<Assistant | null>(null);
  const [isBooting, setIsBooting] = useState(false);

  // Agent State
  const [state, setState] = useState<AgentState>(AgentState.IDLE);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentSuggestions, setCurrentSuggestions] = useState<string[]>([]);
  
  // UI Error State
  const [uiError, setUiError] = useState<string | null>(null);

  // File Upload State
  const [pendingAttachment, setPendingAttachment] = useState<Attachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Config & Metrics
  const [metrics, setMetrics] = useState<LatencyMetrics>({ asrTime: 0, llmTime: 0, ttsTime: 0, totalTime: 0 });
  const [murfConfig, setMurfConfig] = useState<MurfConfig>({
    // Fix for Vite: Use import.meta.env
    apiKey: (import.meta as any).env.VITE_MURF_API_KEY || '',
    voiceId: 'en-US-marcus', 
  });

  const { 
    isListening, 
    transcript, 
    startListening, 
    stopListening, 
    resetTranscript, 
    hasRecognitionSupport,
    error: speechError
  } = useSpeechRecognition();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const processingStartRef = useRef<number>(0);
  const silenceTimerRef = useRef<number | null>(null);

  // Check Firebase Auth on Mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in, fetch profile from Firestore
        userService.login(firebaseUser.email!, "").then(userData => {
          setUser(userData);
        }).catch(() => {
          // If login fails (profile not found), we might need to handle it
          setUser({ username: firebaseUser.displayName || 'User', email: firebaseUser.email! });
        });
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to Chat History Effect
  useEffect(() => {
    if (user && selectedAssistant && auth.currentUser) {
      const unsubscribe = userService.subscribeToMessages(auth.currentUser.uid, selectedAssistant.id, (msgs) => {
        if (msgs.length > 0) {
          setMessages(msgs);
        } else {
          setMessages([{
            id: 'init',
            role: 'agent',
            text: `${selectedAssistant.name} ONLINE. Hello, ${user.username}.`,
            timestamp: Date.now()
          }]);
        }
      });
      return () => unsubscribe();
    }
  }, [selectedAssistant, user]);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    userService.logout();
    setUser(null);
    handleBackToGrid();
  };

  const handleUpdateUser = (updatedUser: User) => {
      setUser(updatedUser);
  };

  // Sync Speech Errors to UI
  useEffect(() => {
    if (speechError) {
        setUiError(speechError);
        setState(AgentState.ERROR);
        setTimeout(() => setState(prev => prev === AgentState.ERROR ? AgentState.IDLE : prev), 3000);
    }
  }, [speechError]);

  // Update Murf Voice ID when assistant changes
  useEffect(() => {
    if (selectedAssistant) {
      setMurfConfig(prev => ({ ...prev, voiceId: selectedAssistant.voiceId }));
    }
  }, [selectedAssistant]);

  // Handle Assistant Selection Transition
  const handleSelectAssistant = (assistant: Assistant) => {
    if (!user) return;

    setIsBooting(true);
    setUiError(null);

    const personalizedAssistant = {
      ...assistant,
      systemInstruction: `${assistant.systemInstruction} IMPORTANT: The user's name is ${user.username}. Address them by name occasionally. USER CONTEXT: ${JSON.stringify({ username: user.username, email: user.email })}`
    };

    setTimeout(() => {
      setSelectedAssistant(personalizedAssistant);
      setIsBooting(false);
      
      let suggestions = ["What can you do?", "Tell me a joke"];
      if (assistant.id === 'andrew') suggestions = ["Create a landing page", "Code a Snake game", "Generate a tech logo"];
      if (assistant.id === 'leah') suggestions = ["I'm feeling stressed", "Help me relax", "I had a bad day"];
      if (assistant.id === 'gary') suggestions = ["What's the weather here?", "Is it raining in Tokyo?", "Tell me a story"];
      if (assistant.id === 'chase') suggestions = ["Let's chat", "Generate a chaotic image", "Tell me a joke"];
      
      setCurrentSuggestions(suggestions);
    }, 1500); 
  };

  const handleBackToGrid = () => {
    setSelectedAssistant(null);
    setMessages([]);
    setState(AgentState.IDLE);
    setPendingAttachment(null);
    setCurrentSuggestions([]);
    setUiError(null);
  };

  // Auto-process logic for voice
  useEffect(() => {
    if (isListening && transcript.length > 0) {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = window.setTimeout(() => {
        handleTurnComplete(transcript);
      }, 1500);
    }
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript, isListening]);

  const handleTurnComplete = async (userText: string) => {
    stopListening();
    resetTranscript();
    setInputText('');
    setCurrentSuggestions([]); 
    setUiError(null);

    const tempAttachment = pendingAttachment;
    setPendingAttachment(null); 

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: userText,
      timestamp: Date.now(),
      attachment: tempAttachment ? `data:${tempAttachment.mimeType};base64,${tempAttachment.data}` : undefined
    };
    setMessages(prev => [...prev, userMsg]);
    
    if (auth.currentUser && selectedAssistant) {
      userService.saveMessage(auth.currentUser.uid, selectedAssistant.id, userMsg);
    }

    setState(AgentState.PROCESSING);
    processingStartRef.current = performance.now();
    const timings = { asr: 0, llm: 0, tts: 0 };

    try {
      const llmStart = performance.now();
      const systemInst = selectedAssistant?.systemInstruction;
      
      const aiResponse = await generateResponse(userText, tempAttachment, systemInst);
      
      const llmEnd = performance.now();
      timings.llm = Math.round(llmEnd - llmStart);

      const agentMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        text: aiResponse.answer,
        suggestions: aiResponse.suggestions,
        timestamp: Date.now()
      };

      if (auth.currentUser && selectedAssistant) {
        userService.saveMessage(auth.currentUser.uid, selectedAssistant.id, agentMsg);
      }

      if (aiResponse.imagePrompt) {
          const imageUrl = await generateImage(aiResponse.imagePrompt);
          if (imageUrl) {
              agentMsg.generatedImage = imageUrl;
              agentMsg.text += "\n\n[Visual Data Generated]";
          }
      }

      setMessages(prev => [...prev, agentMsg]);
      setCurrentSuggestions(aiResponse.suggestions || []);

      const ttsStart = performance.now();
      const speechText = aiResponse.answer
        .replace(/```[\s\S]*?```/g, " [Code Block Provided] ")
        .replace(/\[Visual Data Generated\]/g, "");
      
      const audioUrl = await generateSpeech(speechText, murfConfig);
      const ttsEnd = performance.now();
      timings.tts = Math.round(ttsEnd - ttsStart);

      setMetrics({
        asrTime: 0, 
        llmTime: timings.llm,
        ttsTime: timings.tts,
        totalTime: Math.round(performance.now() - processingStartRef.current)
      });

      if (audioUrl === 'BROWSER_NATIVE') {
         setState(AgentState.SPEAKING);
         setTimeout(() => setState(AgentState.IDLE), speechText.length * 80);
      } else {
        setState(AgentState.SPEAKING);
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.play().catch(e => {
              console.error("Autoplay blocked", e);
              setState(AgentState.IDLE);
          });
        }
      }

    } catch (error: any) {
      console.error("Chain error:", error);
      setUiError(error.message || "An unexpected error occurred.");
      setState(AgentState.ERROR);
      setTimeout(() => setState(AgentState.IDLE), 3000);
    }
  };

  const handleAudioEnded = () => {
    setState(AgentState.IDLE);
  };

  const toggleListening = () => {
    if (state === AgentState.IDLE || state === AgentState.ERROR) {
      setUiError(null);
      setState(AgentState.LISTENING);
      startListening();
    } else if (state === AgentState.LISTENING) {
      stopListening();
      if (transcript.length > 0) handleTurnComplete(transcript);
      else setState(AgentState.IDLE);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() || pendingAttachment) {
      handleTurnComplete(inputText || (pendingAttachment ? "Analyze this attachment" : ""));
    }
  };

  const handleFeedback = (id: string, feedback: FeedbackState) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, feedback } : m));
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const matches = base64String.match(/^data:(.+);base64,(.+)$/);
      if (matches && matches.length === 3) {
         setPendingAttachment({
           mimeType: matches[1],
           data: matches[2]
         });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveAttachment = () => {
    setPendingAttachment(null);
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleTurnComplete(suggestion);
  };

  if (!hasRecognitionSupport) return <div className="p-10 text-white">Browser not supported.</div>;

  return (
    <ErrorBoundary>
    <div className="relative min-h-screen bg-slate-950 text-white overflow-hidden flex flex-col font-orbitron">
      {/* --- BACKGROUND LAYERS --- */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        <div className="absolute inset-0 bg-grid opacity-30 h-[200%] -bottom-[50%]"></div>
        {selectedAssistant && (
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-10 filter blur-[100px] transition-colors duration-1000 ${selectedAssistant.theme.primary}`}></div>
        )}
        <div className="absolute inset-0 bg-scanlines opacity-40 z-50 pointer-events-none"></div>
      </div>

      <audio ref={audioRef} onEnded={handleAudioEnded} className="hidden" />
      
      {/* User Profile Modal */}
      {user && (
          <UserProfile 
              user={user} 
              isOpen={isProfileOpen} 
              onClose={() => setIsProfileOpen(false)} 
              onLogout={handleLogout} 
              onUpdateUser={handleUpdateUser}
              murfConfig={murfConfig}
              setMurfConfig={setMurfConfig}
          />
      )}
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/png, image/jpeg, image/webp" 
        className="hidden" 
      />

      {/* === GLOBAL ERROR TOAST === */}
      {uiError && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[60] animate-slide-down w-[90%] max-w-md">
            <div className="flex items-start gap-4 p-4 bg-red-900/90 border border-red-500 rounded-lg shadow-[0_0_30px_rgba(220,38,38,0.5)] backdrop-blur-md">
                <div className="p-2 bg-red-500/20 rounded-full shrink-0 animate-pulse">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-red-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                </div>
                <div className="flex-1">
                    <h4 className="text-sm font-bold text-red-200 tracking-wider mb-1 uppercase">System Error</h4>
                    <p className="text-xs text-red-100/80 font-mono leading-relaxed">{uiError}</p>
                </div>
                <button onClick={() => setUiError(null)} className="text-red-400 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
      )}

      {/* === HEADER === */}
      {user && (
        <div className="relative z-40 p-6 flex justify-between items-start border-b border-white/10 bg-black/20 backdrop-blur-sm animate-fade-in">
            <div>
            <h1 className="text-2xl font-black tracking-widest text-white uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                FALCON <span className="text-xs font-normal opacity-50 ml-2 tracking-[0.5em]">INTERFACE</span>
            </h1>
            <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${state === AgentState.ERROR ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-emerald-500 shadow-[0_0_10px_lime]'} transition-colors duration-300`}></div>
                <span className={`text-[10px] font-mono transition-colors duration-300 ${state === AgentState.ERROR ? 'text-red-400' : 'text-white/50'}`}>
                    SYSTEM STATUS: {state}
                </span>
            </div>
            </div>
            <div className="flex items-center gap-4">
                <motion.button 
                    whileHover={{ scale: 1.05, backgroundColor: "rgba(21, 94, 117, 0.4)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsProfileOpen(true)}
                    className="flex items-center gap-2 group border border-cyan-900/50 bg-cyan-950/20 pr-3 pl-1 py-1 rounded transition-all"
                >
                        {user.avatar ? (
                            <img src={user.avatar} alt="User" className="w-6 h-6 rounded-full object-cover border border-cyan-500/50" />
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/50">
                                 <span className="text-[10px] text-cyan-400 font-bold">{user.username.charAt(0).toUpperCase()}</span>
                            </div>
                        )}
                        <span className="text-[10px] text-cyan-400 font-mono tracking-wider group-hover:text-cyan-300">
                            USER: {user.username}
                        </span>
                </motion.button>
                {selectedAssistant ? (
                    <button onClick={handleBackToGrid} className="px-4 py-2 border border-white/20 text-xs hover:bg-white/10 transition-colors uppercase tracking-wider">
                        Disconnect
                    </button>
                ) : (
                    <button onClick={handleLogout} className="text-xs text-red-400 hover:text-red-300 tracking-wider">
                        LOGOUT
                    </button>
                )}
            </div>
        </div>
      )}

      {/* === MAIN CONTENT === */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4">
        
        {/* 0. AUTH SCREEN */}
        {!user && (
            <AuthScreen onLogin={handleLogin} />
        )}

        {/* 1. SELECTION SCREEN */}
        {user && !selectedAssistant && !isBooting && (
          <div className="w-full max-w-5xl animate-fade-in">
             <div className="text-center mb-12">
                <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20">SELECT MODULE</h2>
                <p className="text-cyan-400/60 font-mono text-sm tracking-[0.3em]">AVAILABLE NODES: 4</p>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {ASSISTANTS.map(agent => (
                   <button 
                     key={agent.id}
                     onClick={() => handleSelectAssistant(agent)}
                     className="group relative h-80 border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 overflow-hidden flex flex-col items-center justify-center fui-bracket"
                   >
                      <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${agent.theme.bgGradient}`}></div>
                      <div className={`w-24 h-24 rounded-full border-2 border-dashed ${agent.theme.accent} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_30px_rgba(0,0,0,0.5)]`}>
                          <div className={`w-20 h-20 rounded-full ${agent.theme.bgGradient} opacity-50 blur-md`}></div>
                      </div>
                      <h3 className="text-xl font-bold tracking-widest z-10">{agent.name}</h3>
                      <p className="text-[10px] text-white/40 font-mono mt-2 z-10 uppercase tracking-wider">
                        {agent.id === 'andrew' ? 'CODING & DEV' : 
                         agent.id === 'leah' ? 'THERAPIST' : 
                         agent.id === 'chase' ? 'TACTICAL' : 'GENERAL'}
                      </p>
                   </button>
                ))}
             </div>
          </div>
        )}

        {/* 2. BOOT SEQUENCE */}
        {isBooting && (
           <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 border-4 border-t-cyan-500 border-r-transparent border-b-cyan-500 border-l-transparent rounded-full animate-spin mb-8"></div>
              <div className="font-mono text-cyan-500 text-xs animate-pulse">ESTABLISHING SECURE CONNECTION...</div>
           </div>
        )}

        {/* 3. ACTIVE AGENT SCREEN */}
        {selectedAssistant && !isBooting && (
           <div className="w-full h-full flex flex-col md:flex-row gap-6 items-center justify-center max-w-7xl">
              
              {/* Left: Chat Log (Desktop) */}
              <div className="hidden md:flex w-1/4 h-[500px] flex-col justify-end">
                 <ChatHistory messages={messages} onFeedback={handleFeedback} accentColor={selectedAssistant.theme.primary} />
              </div>

              {/* Center: The Core & Controls */}
              <div className="flex-1 flex flex-col items-center justify-center relative">
                 {/* Voice Orb */}
                 <div className="mb-8 scale-75 md:scale-100">
                    <VoiceOrb state={state} theme={selectedAssistant.theme} />
                 </div>

                 {/* Command Bar Area */}
                 <div className="w-full max-w-lg flex flex-col gap-3 relative z-20">
                    
                    {/* Suggestion Chips */}
                    {currentSuggestions.length >0 && state === AgentState.IDLE && !uiError && (
                      <div className="flex flex-wrap justify-center gap-2 mb-2 animate-fade-in">
                         {currentSuggestions.map((suggestion, idx) => (
                           <button 
                             key={idx}
                             onClick={() => handleSuggestionClick(suggestion)}
                             className={`px-3 py-1.5 text-[10px] uppercase tracking-wider font-mono border border-white/10 bg-black/40 hover:bg-white/10 hover:border-white/30 transition-all rounded-sm backdrop-blur-md ${selectedAssistant.theme.orbColor}`}
                           >
                             {suggestion}
                           </button>
                         ))}
                      </div>
                    )}

                    {/* Pending Attachment Preview */}
                    {pendingAttachment && (
                      <div className="self-start flex items-center gap-2 bg-white/10 px-3 py-1 rounded-t border border-white/20 backdrop-blur-md">
                        <span className="text-[10px] text-white/70 font-mono uppercase">Image Attached</span>
                        <button onClick={handleRemoveAttachment} className="text-white/50 hover:text-white">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}

                    {/* Main Command Bar */}
                    <div className={`w-full bg-black/80 border p-2 backdrop-blur-xl flex flex-col gap-2 rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] transition-colors duration-300 ${state === AgentState.ERROR ? 'border-red-500/50 bg-red-950/20' : 'border-white/20'}`}>
                        {isListening && (
                            <div className="absolute -top-16 left-0 right-0 text-center">
                              <span className={`text-xl font-light ${selectedAssistant.theme.orbColor} drop-shadow-md`}>
                                  "{transcript}"
                              </span>
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                          <button 
                             onClick={handleFileClick}
                             className={`p-3 border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all rounded-sm`}
                             title="Attach Image"
                           >
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                               <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                             </svg>
                          </button>

                          <form onSubmit={handleTextSubmit} className="flex-1">
                              <input 
                                type="text" 
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder={state === AgentState.ERROR ? "SYSTEM ERROR..." : "ENTER COMMAND..."}
                                spellCheck={true}
                                className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-white/30 transition-all placeholder:text-white/20"
                                disabled={state === AgentState.LISTENING || state === AgentState.SPEAKING}
                              />
                          </form>
                          
                          <button
                            onClick={toggleListening}
                            className={`px-6 py-3 font-bold text-sm tracking-wider uppercase transition-all duration-300 border rounded-sm ${
                              state === AgentState.LISTENING
                                ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse'
                                : state === AgentState.ERROR
                                ? 'bg-red-500/20 border-red-500 text-red-400'
                                : `bg-white/5 border-white/20 hover:bg-white/10 text-white`
                            }`}
                          >
                            {state === AgentState.LISTENING ? 'ABORT' : state === AgentState.ERROR ? 'RETRY' : 'VOICE'}
                          </button>
                        </div>
                    </div>
                 </div>
              </div>

              {/* Right: Metrics (Desktop) */}
              <div className="hidden md:flex w-1/4 h-[500px] flex-col gap-4 font-mono text-[10px]">
                  <div className="p-4 border border-white/10 bg-white/5">
                     <h4 className="text-white/40 mb-2 border-b border-white/10 pb-1">LATENCY METRICS</h4>
                     <div className="flex justify-between py-1"><span>ASR</span> <span className="text-white">{metrics.asrTime}ms</span></div>
                     <div className="flex justify-between py-1"><span>LLM</span> <span className="text-white">{metrics.llmTime}ms</span></div>
                     <div className="flex justify-between py-1"><span>TTS</span> <span className="text-white">{metrics.ttsTime}ms</span></div>
                     <div className={`flex justify-between py-2 mt-2 border-t border-white/10 font-bold ${selectedAssistant.theme.orbColor}`}>
                        <span>TOTAL</span> <span>{metrics.totalTime}ms</span>
                     </div>
                  </div>
                  <div className="flex-1 border border-white/5 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
              </div>

              {/* Mobile Chat History Overlay */}
              <div className="md:hidden w-full h-48">
                <ChatHistory messages={messages} onFeedback={handleFeedback} accentColor={selectedAssistant.theme.primary} />
              </div>

           </div>
        )}
      </div>

      {/* --- INTRO SEQUENCE (Last in DOM = On Top) --- */}
      {showIntro && <IntroSequence onComplete={() => setShowIntro(false)} />}
    </div>
    </ErrorBoundary>
  );
};

export default App;