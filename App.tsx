
import React, { useState, useEffect, useRef } from 'react';
import { Emotion, UserState, Recording, Theme, Sensitivity, Avatar } from './types';
import { analyzeEmotionFromText } from './services/claudeService';
import LiquidOrb from './components/LiquidOrb';
import Gamification from './components/Gamification';
import MentalWealth from './components/MentalWealth';
import Settings from './components/Settings';
import { Mic, Square, Play, Save, Trash2, Pause, LayoutDashboard, User, BrainCircuit, Settings as SettingsIcon } from 'lucide-react';

// --- Audio Context Hook with Sensitivity ---
const useAudioAnalysis = (sensitivity: Sensitivity) => {
  const [volume, setVolume] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafId = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  const startAudio = async () => {
    try {
      if (audioContextRef.current?.state === 'running') return;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        
        // Sensitivity Logic
        const divisor = sensitivity === 'loud' ? 160 : sensitivity === 'quiet' ? 60 : 100;
        setVolume(Math.min(average / divisor, 1)); 

        rafId.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopAudio = () => {
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }
    setVolume(0);
  };

  return { volume, startAudio, stopAudio };
};

// --- Main App ---

type RecordingState = 'idle' | 'recording' | 'paused' | 'review';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'reflect' | 'game' | 'mental'>('reflect');
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [currentEmotion, setCurrentEmotion] = useState<Emotion>(Emotion.Neutral);
  const [showSettings, setShowSettings] = useState(false);
  
  // Transcript State - PERSISTENCE Logic
  // committedTranscriptRef holds the finalized text segments during a session
  // interimTranscript holds the current floating sentence
  const [fullTranscript, setFullTranscript] = useState<string>("");
  const [interimTranscript, setInterimTranscript] = useState<string>("");
  const committedTranscriptRef = useRef(""); 
  
  // User State
  const [user, setUser] = useState<UserState>({
    name: "Explorer",
    points: 1250,
    streak: 5,
    level: 3,
    plantStage: 2,
    unlockedEmotions: [Emotion.Neutral, Emotion.Joy, Emotion.Anxiety],
    avatar: Avatar.Fox,
    unlockedAvatars: [Avatar.Fox],
    inventory: { seeds: [], flowers: [] },
    theme: 'dark',
    micSensitivity: 'normal',
    recordings: []
  });

  const { volume, startAudio, stopAudio } = useAudioAnalysis(user.micSensitivity);
  const recognitionRef = useRef<any>(null);
  
  const processedWordCountRef = useRef(0);
  const crashoutCounterRef = useRef(0);
  
  // Session Start Time
  const sessionStartTimeRef = useRef<number>(0);

  // Crashout Detection Logic
  useEffect(() => {
    if (recordingState === 'recording' && volume > 0.85) {
      crashoutCounterRef.current += 1;
      if (crashoutCounterRef.current > 40) { 
        setCurrentEmotion(Emotion.Crashout);
      }
    } else {
      crashoutCounterRef.current = Math.max(0, crashoutCounterRef.current - 1);
    }
  }, [volume, recordingState]);

  // Speech Recognition Setup
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let newInterim = '';
        let newFinal = '';

        if (!event || !event.results) return;

        // Safer loop to avoid undefined access
        const resultIndex = event.resultIndex || 0;
        for (let i = resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          if (result && result.length > 0) {
            const alt = result[0];
            if (alt) {
                if (result.isFinal) {
                  newFinal += alt.transcript;
                } else {
                  newInterim += alt.transcript;
                }
            }
          }
        }

        setInterimTranscript(newInterim);
        
        if (newFinal) {
            // Append to committed ref immediately so it's safe
            committedTranscriptRef.current += " " + newFinal;
            setFullTranscript(committedTranscriptRef.current); // Force UI update
            handleAnalysis(newFinal, true);
        }

        // Live chunk analysis
        const currentWords = newInterim.trim().split(/\s+/);
        if (currentWords.length - processedWordCountRef.current >= 4) {
            const chunk = currentWords.slice(processedWordCountRef.current).join(' ');
            handleAnalysis(chunk, false);
            processedWordCountRef.current = currentWords.length;
        }
      };

      recognitionRef.current.onerror = (event: any) => {
          if (event.error !== 'no-speech') console.error("Speech Rec Error", event.error);
      };

    }
  }, []);

  const handleAnalysis = async (text: string, isFinal: boolean) => {
    if (!text.trim()) return;

    // Use Claude AI for semantic analysis - it understands negation and context
    // (e.g., "I'm not good" = sad, not joy)
    const context = committedTranscriptRef.current.slice(-300);
    const detectedEmotion = await analyzeEmotionFromText(text, context);
    
    // Only update if not currently screaming (Crashout)
    if (currentEmotion !== Emotion.Crashout) {
        setCurrentEmotion(detectedEmotion);
    }
    
    if (isFinal) updatePoints(detectedEmotion);
  };

  const updatePoints = (emotion: Emotion) => {
     setUser(prev => {
        const isNew = !prev.unlockedEmotions.includes(emotion);
        return {
            ...prev,
            points: prev.points + (isNew ? 50 : 5),
            unlockedEmotions: isNew ? [...prev.unlockedEmotions, emotion] : prev.unlockedEmotions
        };
    });
  };

  // --- Controls ---

  const startRecording = () => {
    setRecordingState('recording');
    processedWordCountRef.current = 0;
    sessionStartTimeRef.current = Date.now();
    try {
        recognitionRef.current?.start();
        startAudio();
    } catch (e) { console.log("Already started"); }
  };

  const pauseRecording = () => {
    setRecordingState('paused');
    recognitionRef.current?.stop();
    stopAudio();
  };

  const resumeRecording = () => {
    setRecordingState('recording');
    processedWordCountRef.current = 0; 
    try {
        recognitionRef.current?.start();
        startAudio();
    } catch(e) { console.log("Already started"); }
  };

  const stopRecording = () => {
    setRecordingState('review');
    recognitionRef.current?.stop();
    stopAudio();
    // Ensure transcript is synced
    setFullTranscript(committedTranscriptRef.current);
    setInterimTranscript("");
  };

  const saveRecording = () => {
    const finalTranscript = committedTranscriptRef.current;
    if (!finalTranscript.trim()) {
        alert("Nothing to save!");
        return;
    }

    const newRecording: Recording = {
        id: Date.now().toString(),
        timestamp: sessionStartTimeRef.current,
        transcript: finalTranscript,
        dominantEmotion: currentEmotion,
        duration: Date.now() - sessionStartTimeRef.current
    };

    setUser(prev => ({
        ...prev,
        recordings: [...prev.recordings, newRecording],
        points: prev.points + 100 // Reward for saving
    }));

    alert("Recording Saved! +100 XP");
    resetSession();
  };

  const discardRecording = () => {
    if (confirm("Discard this recording? It cannot be recovered.")) {
        resetSession();
        alert("Recording discarded.");
    }
  };

  const resetSession = () => {
    setRecordingState('idle');
    setFullTranscript("");
    setInterimTranscript("");
    committedTranscriptRef.current = ""; // CRITICAL: Wipe data
    setCurrentEmotion(Emotion.Neutral);
    processedWordCountRef.current = 0;
  };

  const isLight = user.theme === 'light';

  return (
    <div className={`min-h-screen flex flex-col relative overflow-hidden font-sans transition-colors duration-500 ${isLight ? 'bg-[#f0f2f5] text-gray-900' : 'bg-[#0f0f11] text-white'}`}>
      
      {/* Sticky Nav */}
      <nav className={`fixed top-0 left-0 right-0 z-40 px-6 py-4 flex justify-between items-center backdrop-blur-md border-b transition-colors ${isLight ? 'bg-white/80 border-gray-200' : 'bg-[#0f0f11]/80 border-white/5'}`}>
        <div className="text-xl font-bold tracking-tighter flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full transition-colors ${recordingState === 'recording' ? 'bg-red-500 animate-pulse' : isLight ? 'bg-black' : 'bg-white'}`}></div>
          TONUS
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-1 rounded-full p-1 border border-transparent bg-black/5 dark:bg-white/5">
            <button onClick={() => setActiveTab('reflect')} className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'reflect' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>Reflect</button>
            <button onClick={() => setActiveTab('mental')} className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'mental' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>Mental Wealth</button>
            <button onClick={() => setActiveTab('game')} className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'game' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>Garden</button>
          </div>
          <button onClick={() => setShowSettings(true)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
            <SettingsIcon size={20} />
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 pt-20 pb-0 overflow-hidden h-screen relative">
        
        {/* View: Reflect (Orb) */}
        <div className={`h-full flex flex-col items-center justify-center relative transition-opacity duration-300 ${activeTab === 'reflect' ? 'opacity-100 z-10' : 'opacity-0 absolute inset-0 -z-10'}`}>
            
            {/* Dark Mode Stars Background */}
            {!isLight && activeTab === 'reflect' && (
                <div className="absolute inset-0 pointer-events-none opacity-60">
                    {[...Array(50)].map((_, i) => (
                        <div 
                            key={i} 
                            className="absolute bg-white rounded-full animate-pulse"
                            style={{
                                width: Math.random() * 2 + 1 + 'px',
                                height: Math.random() * 2 + 1 + 'px',
                                top: Math.random() * 100 + '%',
                                left: Math.random() * 100 + '%',
                                animationDelay: Math.random() * 5 + 's',
                                opacity: Math.random()
                            }}
                        />
                    ))}
                </div>
            )}

            {/* The Visualizer */}
            <div className="flex-1 w-full flex items-center justify-center -mt-20">
              <LiquidOrb 
                emotion={currentEmotion} 
                volume={volume} 
                isListening={recordingState === 'recording'} 
                theme={user.theme}
              />
            </div>

            {/* Transcript Area */}
            <div className="absolute bottom-48 w-full px-6 text-center pointer-events-none z-20">
                 <div className="max-w-2xl mx-auto">
                    <p className={`text-xl md:text-3xl font-medium leading-tight drop-shadow-md transition-all duration-300 ${isLight ? 'text-gray-800' : 'text-white/90'}`}>
                        {interimTranscript || (fullTranscript.split(' ').slice(-20).join(' ')) || (recordingState === 'idle' ? "Tap microphone to reflect" : "Listening...")}
                    </p>
                    {recordingState === 'recording' && (
                        <p className="text-[10px] text-red-500 mt-4 font-mono uppercase tracking-[0.3em] animate-pulse">
                            {currentEmotion === Emotion.Crashout ? "⚠️ HIGH INTENSITY DETECTED" : "LIVE RECORDING"}
                        </p>
                    )}
                 </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-12 w-full flex items-center justify-center gap-8 z-30">
              
              {recordingState === 'idle' && (
                <button 
                    onClick={startRecording}
                    className={`w-20 h-20 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(124,58,237,0.4)] hover:scale-105 transition-all active:scale-95 ${isLight ? 'bg-purple-600 text-white' : 'bg-white text-black'}`}
                >
                    <Mic size={32} />
                </button>
              )}

              {recordingState === 'recording' && (
                <>
                    <button onClick={pauseRecording} className="w-16 h-16 rounded-full bg-yellow-500/10 text-yellow-500 border-2 border-yellow-500 flex items-center justify-center hover:bg-yellow-500 hover:text-black transition-all backdrop-blur-md">
                        <Pause size={24} fill="currentColor" />
                    </button>
                    <button onClick={stopRecording} className="w-20 h-20 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-all animate-pulse">
                        <Square size={28} fill="currentColor" />
                    </button>
                </>
              )}

              {recordingState === 'paused' && (
                <>
                    <button onClick={resumeRecording} className="w-16 h-16 rounded-full bg-green-500/10 text-green-500 border-2 border-green-500 flex items-center justify-center hover:bg-green-500 hover:text-black transition-all backdrop-blur-md">
                        <Play size={24} fill="currentColor" />
                    </button>
                    <button onClick={stopRecording} className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 border-2 border-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all backdrop-blur-md">
                        <Square size={24} fill="currentColor" />
                    </button>
                </>
              )}

              {recordingState === 'review' && (
                <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-4">
                    <button onClick={discardRecording} className="px-8 py-4 rounded-full bg-gray-200 hover:bg-red-100 hover:text-red-600 dark:bg-white/10 dark:hover:bg-red-900/30 text-gray-500 flex items-center gap-2 transition-colors font-bold uppercase tracking-wider text-xs">
                        <Trash2 size={16} />
                        Discard
                    </button>
                    <button onClick={saveRecording} className="px-8 py-4 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-2 font-bold shadow-lg shadow-purple-500/30 transition-colors uppercase tracking-wider text-xs">
                        <Save size={16} />
                        Save Entry
                    </button>
                </div>
              )}

            </div>
        </div>

        {/* View: Gamification (Garden) */}
        {activeTab === 'game' && (
           <div className="h-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
             <Gamification user={user} updateUser={(u) => setUser(prev => ({...prev, ...u}))} />
           </div>
        )}

        {/* View: Mental Wealth */}
        {activeTab === 'mental' && (
          <div className="h-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <MentalWealth theme={user.theme} user={user} onUpdateUser={(u) => setUser(prev => ({...prev, ...u}))} />
          </div>
        )}

      </main>

      {/* Settings Modal */}
      {showSettings && (
        <Settings 
            user={user} 
            updateUser={(u) => setUser(prev => ({...prev, ...u}))} 
            onClose={() => setShowSettings(false)} 
        />
      )}

      {/* Mobile Bottom Nav */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 border-t flex justify-around py-4 z-40 pb-8 safe-area-bottom backdrop-blur-lg ${isLight ? 'bg-white/90 border-gray-200' : 'bg-[#1a1a1d]/90 border-white/10'}`}>
          <button onClick={() => setActiveTab('reflect')} className={`flex flex-col items-center transition-colors ${activeTab === 'reflect' ? 'text-purple-500 scale-110' : 'text-gray-400'}`}>
             <BrainCircuit size={24} />
             <span className="text-[10px] mt-1 font-bold">Reflect</span>
          </button>
          <button onClick={() => setActiveTab('mental')} className={`flex flex-col items-center transition-colors ${activeTab === 'mental' ? 'text-purple-500 scale-110' : 'text-gray-400'}`}>
             <LayoutDashboard size={24} />
             <span className="text-[10px] mt-1 font-bold">Wealth</span>
          </button>
          <button onClick={() => setActiveTab('game')} className={`flex flex-col items-center transition-colors ${activeTab === 'game' ? 'text-purple-500 scale-110' : 'text-gray-400'}`}>
             <User size={24} />
             <span className="text-[10px] mt-1 font-bold">Garden</span>
          </button>
      </div>

    </div>
  );
};

export default App;
