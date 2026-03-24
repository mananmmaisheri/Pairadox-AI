
import React, { useEffect, useState, useRef } from 'react';

interface IntroSequenceProps {
  onComplete: () => void;
}

const IntroSequence: React.FC<IntroSequenceProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'INIT' | 'SCAN' | 'CORE' | 'COMPLETE'>('INIT');
  const [terminalText, setTerminalText] = useState('');
  const [scanProgress, setScanProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  
  // Audio Refs
  const audioCtxRef = useRef<AudioContext | null>(null);

  // --- AUDIO ENGINE ---
  const initAudio = () => {
    try {
        if (!audioCtxRef.current) {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            audioCtxRef.current = new AudioContext();
        }
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume().catch(() => {
                // Autoplay blocked, proceed silently
            });
        }
    } catch (e) {
        console.warn("Audio unavailable:", e);
    }
  };

  const playSound = (type: 'beep' | 'drone' | 'scan' | 'open') => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'suspended') return;
    
    try {
        const ctx = audioCtxRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        if (type === 'beep') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(800 + Math.random() * 500, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.05, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
            osc.start();
            osc.stop(ctx.currentTime + 0.1);
        } 
        else if (type === 'drone') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(50, ctx.currentTime);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 2.5);
            
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(100, ctx.currentTime);
            filter.frequency.linearRampToValueAtTime(1000, ctx.currentTime + 2);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 2.5);
            return;
        }
        else if (type === 'scan') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(2000, ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(4000, ctx.currentTime + 0.5);
            gain.gain.setValueAtTime(0.02, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
            osc.start();
            osc.stop(ctx.currentTime + 0.5);
        }
        else if (type === 'open') {
            const bufferSize = ctx.sampleRate * 1.5;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            const noiseFilter = ctx.createBiquadFilter();
            noiseFilter.type = 'lowpass';
            noiseFilter.frequency.setValueAtTime(1000, ctx.currentTime);
            noiseFilter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 1);
            noise.connect(noiseFilter);
            noiseFilter.connect(gain);
            gain.gain.setValueAtTime(0.5, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);
            noise.start();
            return;
        }

        osc.connect(gain);
        gain.connect(ctx.destination);
    } catch (e) {
        // Ignore audio errors
    }
  };

  // Auto-Start
  useEffect(() => {
    initAudio();
    // Start Sequence
    const startTimer = setTimeout(() => {
        setPhase('INIT');
    }, 100);
    return () => clearTimeout(startTimer);
  }, []);

  // Generate random system logs
  useEffect(() => {
    if (phase === 'CORE') {
        const interval = setInterval(() => {
            const sysLogs = [
                "LOADING CORE MODULES...",
                "DECRYPTING NEURAL NETWORKS...",
                "CONNECTING TO SATELLITE UPLINK...",
                "VERIFYING BIO-SIGNATURES...",
                "ALLOCATING MEMORY BLOCKS...",
                "OPTIMIZING THREADS...",
                "SYSTEM INTEGRITY CHECK: PASS",
                "LOADING: FALCON_AI_V2.5",
                "ESTABLISHING SECURE PROTOCOL..."
            ];
            const randomLog = sysLogs[Math.floor(Math.random() * sysLogs.length)] + ` [${Math.floor(Math.random() * 999)}ms]`;
            setLogs(prev => [...prev.slice(-6), randomLog]);
            playSound('beep');
        }, 150);
        return () => clearInterval(interval);
    }
  }, [phase]);

  // Phase 1: Terminal Typing
  useEffect(() => {
    if (phase === 'INIT') {
        const text = "INITIALIZING FALCON SYSTEM PROTOCOL...";
        let i = 0;
        const typing = setInterval(() => {
        setTerminalText(text.substring(0, i + 1));
        i++;
        if (i % 3 === 0) playSound('beep');
        if (i >= text.length) {
            clearInterval(typing);
            setTimeout(() => setPhase('SCAN'), 600);
        }
        }, 40);
        return () => clearInterval(typing);
    }
  }, [phase]);

  // Phase 2: Biometric Scan
  useEffect(() => {
    if (phase === 'SCAN') {
      playSound('scan');
      const scan = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            clearInterval(scan);
            setPhase('CORE');
            playSound('drone');
            return 100;
          }
          return prev + 1.5;
        });
      }, 20);
      return () => clearInterval(scan);
    }
  }, [phase]);

  // Phase 3: Core Ignition & Exit
  useEffect(() => {
    if (phase === 'CORE') {
      const timer = setTimeout(() => {
        setPhase('COMPLETE');
        playSound('open');
        setTimeout(onComplete, 1200); 
      }, 2800); 
      return () => clearTimeout(timer);
    }
  }, [phase, onComplete]);

  const styles = `
    @keyframes intro-slide-left {
        0% { transform: translateX(0); }
        100% { transform: translateX(-100%); }
    }
    @keyframes intro-slide-right {
        0% { transform: translateX(0); }
        100% { transform: translateX(100%); }
    }
    .intro-door-left { animation: intro-slide-left 1.2s cubic-bezier(0.7, 0, 0.3, 1) forwards; }
    .intro-door-right { animation: intro-slide-right 1.2s cubic-bezier(0.7, 0, 0.3, 1) forwards; }
  `;

  if (phase === 'COMPLETE') {
     return (
        <div className="fixed inset-0 z-[100] pointer-events-none flex">
            <style>{styles}</style>
            <div className="w-1/2 h-full bg-[#000000] border-r-2 border-cyan-500/50 intro-door-left relative overflow-hidden shadow-[10px_0_50px_rgba(0,0,0,0.8)]">
                <div className="absolute top-1/2 right-4 transform -translate-y-1/2 w-2 h-32 bg-cyan-900/50"></div>
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(6,182,212,0.05)_25%,rgba(6,182,212,0.05)_50%,transparent_50%,transparent_75%,rgba(6,182,212,0.05)_75%,rgba(6,182,212,0.05)_100%)] bg-[size:20px_20px] opacity-20"></div>
            </div>
            <div className="w-1/2 h-full bg-[#000000] border-l-2 border-cyan-500/50 intro-door-right relative overflow-hidden shadow-[-10px_0_50px_rgba(0,0,0,0.8)]">
                <div className="absolute top-1/2 left-4 transform -translate-y-1/2 w-2 h-32 bg-cyan-900/50"></div>
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(6,182,212,0.05)_25%,rgba(6,182,212,0.05)_50%,transparent_50%,transparent_75%,rgba(6,182,212,0.05)_75%,rgba(6,182,212,0.05)_100%)] bg-[size:20px_20px] opacity-20"></div>
            </div>
        </div>
     );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-[#000000] text-cyan-500 font-orbitron overflow-hidden flex flex-col items-center justify-center select-none cursor-wait">
      <style>{styles}</style>
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(6,182,212,0.15)_0%,_transparent_70%)]"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [transform:perspective(500px)_rotateX(60deg)] origin-top opacity-20"></div>

      {/* --- PHASE 1: TERMINAL --- */}
      {phase === 'INIT' && (
        <div className="z-10 font-mono text-lg md:text-2xl tracking-[0.2em] text-cyan-400 drop-shadow-[0_0_10px_cyan]">
           {'>'} {terminalText}<span className="inline-block w-3 h-6 bg-cyan-400 align-middle ml-2 animate-pulse"></span>
        </div>
      )}

      {/* --- PHASE 2: BIOMETRIC SCAN --- */}
      {phase === 'SCAN' && (
        <div className="z-10 relative flex flex-col items-center animate-fade-in">
            <div className="w-72 h-72 border border-cyan-500/30 rounded-lg relative overflow-hidden flex items-center justify-center bg-black/50 shadow-[0_0_50px_rgba(6,182,212,0.1)]">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={0.5} stroke="currentColor" className="w-48 h-48 text-cyan-500/20">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565m4.382 7.056a12 12 0 01-6.053 3.814m5-4.252a12 12 0 00-5.306-14.75m0 0a12 12 0 00-5.306 14.75M12 10.5h.008v.008H12v-.008z" />
                </svg>
                <div className="absolute top-0 left-0 w-full h-2 bg-cyan-400 shadow-[0_0_30px_#22d3ee] animate-[scan-line_2s_linear_infinite] opacity-80"></div>
                <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[size:100%_4px] pointer-events-none"></div>
            </div>
            
            <div className="mt-8 font-mono text-cyan-400 tracking-[0.2em] text-xs uppercase flex items-center gap-3">
                <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>
                Biometric Verification: {Math.floor(scanProgress)}%
            </div>
            
            <div className="w-72 h-1 bg-cyan-900/30 mt-3 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-400 shadow-[0_0_10px_cyan]" style={{ width: `${scanProgress}%` }}></div>
            </div>
        </div>
      )}

      {/* --- PHASE 3: CORE IGNITION --- */}
      {phase === 'CORE' && (
        <div className="z-10 flex flex-col items-center w-full animate-fade-in">
             <div className="relative w-80 h-80 flex items-center justify-center scale-75 md:scale-100">
                 <div className="absolute inset-0 border-[6px] border-cyan-900/30 border-t-cyan-400 border-b-cyan-400 rounded-full animate-[spin_10s_linear_infinite] shadow-[0_0_30px_rgba(6,182,212,0.2)]"></div>
                 <div className="absolute inset-6 border-[2px] border-dashed border-cyan-500/50 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
                 <div className="absolute inset-12 border border-cyan-400/30 rounded-full animate-pulse"></div>
                 
                 <div className="w-32 h-32 bg-cyan-500 rounded-full blur-[60px] animate-pulse opacity-40"></div>
                 <div className="absolute w-24 h-24 bg-white rounded-full blur-[40px] animate-ping opacity-10"></div>
                 
                 <div className="absolute z-20 text-center">
                    <div className="text-4xl font-black text-white tracking-[0.2em] drop-shadow-[0_0_20px_cyan]">FALCON</div>
                    <div className="text-[10px] text-cyan-300 font-mono tracking-[0.5em] mt-1">ONLINE</div>
                 </div>
             </div>

             <div className="mt-8 md:mt-12 w-full max-w-[320px] h-32 overflow-hidden border-l-2 border-cyan-500/30 pl-4 font-mono text-[10px] text-cyan-500/70 flex flex-col justify-end">
                {logs.map((log, i) => (
                    <div key={i} className="whitespace-nowrap animate-slide-down opacity-80">
                        {'>'} {log}
                    </div>
                ))}
             </div>
        </div>
      )}
      
      <div className="absolute bottom-8 left-0 w-full text-center">
        <p className="text-[9px] font-mono text-cyan-500/40 tracking-[0.3em]">SECURE ACCESS TERMINAL // v2.5.0</p>
      </div>
    </div>
  );
};

export default IntroSequence;
