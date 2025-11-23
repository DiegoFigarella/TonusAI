
import React, { useState, useMemo } from 'react';
import { WeeklyTask, EMOTION_COLORS, Theme, UserState, Recording, Emotion, Avatar } from '../types';
import { CheckCircle2, Circle, Calendar, Plus, Trash2, PlayCircle, BarChart2, Zap } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface MentalWealthProps {
  theme: Theme;
  user: UserState;
  onUpdateUser: (updates: Partial<UserState>) => void;
}

// Helper to get happy/sad avatar
const getAvatarExpression = (avatar: Avatar, mood: 'happy' | 'anxious') => {
    // Since we only have one emoji per avatar in the enum, we use CSS classes/containers to express emotion
    // or return the base avatar.
    return avatar;
};

// Custom Rollercoaster Cart Dot
const RollerCoasterDot = (props: any) => {
  const { cx, cy, payload, theme } = props;
  
  // Safety check: Recharts passes data in 'payload' for the dot
  if (!payload || !payload.emotion) return null;

  const emoColor = EMOTION_COLORS[payload.emotion as Emotion] || '#ec4899';
  const tireColor = theme === 'dark' ? '#ffffff' : '#333333';
  
  return (
    <g transform={`translate(${cx}, ${cy})`} className="drop-shadow-md">
      {/* Wheels */}
      <circle cx="-6" cy="6" r="2.5" fill={tireColor} />
      <circle cx="6" cy="6" r="2.5" fill={tireColor} />
      {/* Cart Body */}
      <path d="M-10 4 L-10 0 Q-10 -6 0 -6 Q10 -6 10 0 L10 4 Z" fill={emoColor} stroke={theme === 'light' ? '#fff' : 'rgba(255,255,255,0.2)'} strokeWidth="1.5" />
      {/* Safety Bar */}
      <path d="M-8 0 Q0 -3 8 0" stroke="black" strokeWidth="1" fill="none" opacity="0.3"/>
    </g>
  );
};

const MentalWealth: React.FC<MentalWealthProps> = React.memo(({ theme, user, onUpdateUser }) => {
  const [tasks, setTasks] = useState<WeeklyTask[]>([
    { id: '1', text: 'Morning Affirmations', completed: false, category: 'mindfulness', streak: 3, history: [] },
    { id: '2', text: 'Reflect on a win', completed: false, category: 'gratitude', streak: 5, history: [] },
    { id: '3', text: 'Walk without phone', completed: false, category: 'exercise', streak: 1, history: [] },
  ]);
  const [newTaskText, setNewTaskText] = useState("");
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // Mock Calendar Data (past 7 days)
  const calendarDays = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        // Find recordings for this day
        const dayRecordings = user.recordings.filter(r => 
            new Date(r.timestamp).toDateString() === d.toDateString()
        );
        // Determine dominant emotion
        let domEmotion = Emotion.Neutral;
        if (dayRecordings.length > 0) {
            // Simple logic: last one or most frequent. Using last for now.
            domEmotion = dayRecordings[dayRecordings.length - 1].dominantEmotion;
        }

        days.push({
            date: d,
            dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
            dayNum: d.getDate(),
            emotion: domEmotion,
            recordings: dayRecordings
        });
    }
    return days;
  }, [user.recordings]);

  // Chart Data preparation
  const chartData = calendarDays.map(d => ({
    day: d.dayName,
    score: d.emotion === Emotion.Joy ? 90 : d.emotion === Emotion.Anxiety ? 40 : d.emotion === Emotion.Burnout ? 20 : 60, // Mock score based on emotion
    emotion: d.emotion
  }));

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => {
        if (t.id === id) {
            const isCompleted = !t.completed;
            if (isCompleted) {
                onUpdateUser({ points: user.points + 50 }); // Large points for completion
            }
            return { ...t, completed: isCompleted, streak: isCompleted ? t.streak + 1 : t.streak };
        }
        return t;
    }));
  };

  const addTask = () => {
    if (!newTaskText.trim()) return;
    const newTask: WeeklyTask = {
      id: Date.now().toString(),
      text: newTaskText,
      completed: false,
      category: 'custom',
      streak: 0,
      history: []
    };
    setTasks([...tasks, newTask]);
    setNewTaskText("");
    setIsAddingTask(false);
    onUpdateUser({ points: user.points + 10 }); // Small points for adding
  };

  // Calculate Crashout Level
  const crashoutLevel = useMemo(() => {
    const recentEmotions = user.recordings.slice(-5).map(r => r.dominantEmotion);
    let risk = 30; // Base
    recentEmotions.forEach(e => {
        if (e === Emotion.Burnout || e === Emotion.Crashout || e === Emotion.Anger) risk += 15;
        if (e === Emotion.Joy || e === Emotion.Neutral) risk -= 5;
    });
    return Math.min(Math.max(risk, 0), 100);
  }, [user.recordings]);

  const getCrashoutLabel = (level: number) => {
    if (level < 40) return "Doing Okay 🌿";
    if (level < 75) return "Take it Easy ⚠️";
    return "CRASHOUT RISK 🚨";
  };

  const getAdviceForEmotion = (emotion: Emotion) => {
    switch(emotion) {
        case Emotion.Burnout: return "You're running on empty. Please disconnect and rest.";
        case Emotion.Anxiety: return "Focus on your breath. One thing at a time.";
        case Emotion.Anger: return "Channel this energy into movement or writing.";
        case Emotion.Joy: return "Share this energy! You're glowing.";
        case Emotion.Crashout: return "Stop everything. Step away. Breathe.";
        default: return "Stay mindful and keep tracking.";
    }
  };

  const isLight = theme === 'light';

  return (
    <div className={`h-full overflow-y-auto p-6 space-y-8 pb-32 md:pb-6 ${isLight ? 'text-gray-900' : 'text-white'}`}>
      
      {/* 1. EMOTION CALENDAR */}
      <div className={`rounded-3xl p-6 border ${isLight ? 'bg-white border-gray-200' : 'bg-[#18181b] border-white/5'}`}>
         <div className="flex items-center gap-2 mb-6">
            <Calendar className="text-purple-500" />
            <h3 className="font-bold text-lg">Your Emotion Week</h3>
         </div>
         <div className="flex justify-between items-center">
            {calendarDays.map((day, idx) => (
                <button 
                    key={idx}
                    onClick={() => setSelectedDayIndex(idx)}
                    className={`flex flex-col items-center gap-2 transition-all hover:scale-110 ${selectedDayIndex === idx ? 'scale-110' : 'opacity-70 hover:opacity-100'}`}
                >
                    <span className="text-[10px] uppercase font-bold opacity-60">{day.dayName}</span>
                    <div 
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg border-2 ${selectedDayIndex === idx ? 'border-white ring-2 ring-purple-500' : 'border-transparent'}`}
                        style={{ backgroundColor: EMOTION_COLORS[day.emotion] }}
                    >
                        <span className="text-xs font-bold">{day.dayNum}</span>
                    </div>
                </button>
            ))}
         </div>

         {/* Selected Day Details */}
         {selectedDayIndex !== null && (
             <div className={`mt-6 p-4 rounded-xl ${isLight ? 'bg-gray-50' : 'bg-zinc-800'} animate-in fade-in slide-in-from-top-2`}>
                 <div className="flex justify-between items-start mb-3">
                    <div>
                        <h4 className="font-bold text-lg capitalize flex items-center gap-2">
                            {calendarDays[selectedDayIndex].emotion}
                            <span className="text-xs font-normal opacity-60 bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded-full">Dominant</span>
                        </h4>
                        <p className="text-sm opacity-70 mt-1 italic">"{getAdviceForEmotion(calendarDays[selectedDayIndex].emotion)}"</p>
                    </div>
                 </div>
                 
                 <div className="space-y-2 mt-4">
                     <p className="text-xs font-bold uppercase opacity-50">Recordings</p>
                     {calendarDays[selectedDayIndex].recordings.length === 0 ? (
                         <p className="text-xs opacity-50 italic">No recordings this day.</p>
                     ) : (
                         calendarDays[selectedDayIndex].recordings.map(rec => (
                             <div key={rec.id} className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-black/20 border border-gray-100 dark:border-white/5">
                                 <div className="flex items-center gap-3">
                                     <PlayCircle size={20} className="text-purple-500" />
                                     <div>
                                         <p className="text-xs font-bold opacity-80">{new Date(rec.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                         <p className="text-[10px] opacity-60 truncate w-32">{rec.transcript.slice(0, 20)}...</p>
                                     </div>
                                 </div>
                                 <div className="w-2 h-2 rounded-full" style={{background: EMOTION_COLORS[rec.dominantEmotion]}} />
                             </div>
                         ))
                     )}
                 </div>
             </div>
         )}
      </div>

      {/* 2. EMOTIONAL ROLLERCOASTER */}
      <div className={`p-6 rounded-3xl border shadow-lg relative overflow-hidden group ${isLight ? 'bg-gradient-to-br from-blue-50 to-pink-50 border-gray-200' : 'bg-gradient-to-br from-gray-900 to-black border-white/10'}`}>
        {/* Track Decoration */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #888 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        
        {/* Happy Avatar floating near chart */}
        <div className="absolute top-4 right-4 animate-bounce-slow text-4xl filter drop-shadow-xl z-20">
            {getAvatarExpression(user.avatar, 'happy')}
        </div>

        <div className="flex items-center justify-between mb-8 relative z-10">
          <h3 className="text-2xl font-black italic flex items-center gap-2 tracking-tighter transform -skew-x-12">
            <span className="text-3xl not-italic skew-x-0">🎢</span>
            EMOTIONAL ROLLERCOASTER
          </h3>
        </div>

        <div className="h-64 w-full relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e5e7eb' : '#374151'} vertical={false} />
              <XAxis 
                dataKey="day" 
                stroke={isLight ? '#6b7280' : '#9ca3af'} 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                tickMargin={15}
                fontWeight="bold"
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}
                cursor={{ stroke: 'rgba(236, 72, 153, 0.5)', strokeWidth: 2, strokeDasharray: '5 5' }} 
              />
              
              {/* The Track Line - Look like rails */}
              <Area 
                type="monotone" 
                dataKey="score" 
                stroke="#ec4899" 
                strokeWidth={4} 
                strokeDasharray="15 0" 
                fillOpacity={1} 
                fill="url(#colorScore)" 
                dot={<RollerCoasterDot theme={theme} />}
                activeDot={{ r: 8, strokeWidth: 0 }}
              />
              {/* Track Ties fake visual */}
              <Area 
                type="monotone" 
                dataKey="score" 
                stroke="rgba(0,0,0,0.1)" 
                strokeWidth={12} 
                strokeDasharray="2 8" 
                fill="none" 
                pointerEvents="none"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. MENTAL WEALTH TASKS */}
      <div className={`p-6 rounded-3xl border ${isLight ? 'bg-white border-gray-200 shadow-sm' : 'bg-white/5 border-white/10'}`}>
         <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Zap className="text-yellow-500 fill-current" />
            Daily Wealth Tasks
          </h3>
          <button 
            onClick={() => setIsAddingTask(!isAddingTask)}
            className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center hover:bg-purple-600 transition-colors shadow-lg shadow-purple-500/30"
          >
            <Plus size={18} />
          </button>
        </div>
        
        {isAddingTask && (
            <div className="mb-4 flex gap-2 animate-in fade-in slide-in-from-top-2">
                <input 
                    type="text" 
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    placeholder="Enter actionable task..."
                    className={`flex-1 px-4 py-2 rounded-xl outline-none border ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-black/20 border-white/10 text-white'}`}
                    onKeyDown={(e) => e.key === 'Enter' && addTask()}
                />
                <button onClick={addTask} className="px-4 py-2 bg-green-500 text-white rounded-xl font-bold text-sm">Add</button>
            </div>
        )}

        <div className="space-y-3">
          {tasks.map(task => (
            <div key={task.id}>
                <div 
                  className={`p-4 rounded-xl flex items-center gap-4 transition-all cursor-pointer ${
                      task.completed 
                        ? 'bg-green-500/10 border-green-500/20' 
                        : isLight ? 'bg-gray-50 border-gray-100 hover:bg-gray-100' : 'bg-white/5 border-transparent hover:bg-white/10'
                  } border`}
                  onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                >
                  <button onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}>
                    {task.completed ? (
                        <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                    ) : (
                        <Circle className={`w-6 h-6 flex-shrink-0 ${isLight ? 'text-gray-300' : 'text-gray-500'}`} />
                    )}
                  </button>
                  
                  <div className="flex-1">
                    <p className={`font-medium ${task.completed ? 'opacity-50 line-through' : ''}`}>
                      {task.text}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] uppercase tracking-wider ${isLight ? 'text-gray-400' : 'text-gray-500'}`}>
                        {task.category}
                        </span>
                        <span className="text-[10px] font-bold text-orange-500 flex items-center">
                            🔥 {task.streak}
                        </span>
                    </div>
                  </div>
                  
                  {task.category === 'custom' && (
                      <button onClick={(e) => { e.stopPropagation(); setTasks(tasks.filter(t => t.id !== task.id)); }} className="text-gray-400 hover:text-red-500 p-2">
                          <Trash2 size={16} />
                      </button>
                  )}
                </div>

                {/* Expanded Mini Calendar Logic */}
                {expandedTaskId === task.id && (
                    <div className="p-4 ml-10 mt-2 mb-4 rounded-xl bg-black/5 dark:bg-white/5 grid grid-cols-7 gap-1 text-center animate-in fade-in slide-in-from-top-1">
                        {['S','M','T','W','T','F','S'].map((d, i) => (
                            <div key={i} className="text-[10px] opacity-50 font-bold">{d}</div>
                        ))}
                        {[...Array(7)].map((_, i) => (
                            <div key={i} className={`w-full aspect-square rounded-full flex items-center justify-center text-[10px] ${i < 4 ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-white/10'}`}>
                                {i < 4 && "✓"}
                            </div>
                        ))}
                        <div className="col-span-7 text-center text-xs opacity-50 mt-2 italic">Task History</div>
                    </div>
                )}
            </div>
          ))}
        </div>
      </div>

      {/* 4. CRASHOUT METER */}
      <div className={`p-6 rounded-3xl border relative overflow-hidden ${isLight ? 'bg-gradient-to-r from-red-50 to-orange-50 border-red-100' : 'bg-gradient-to-r from-red-900/20 to-orange-900/20 border-red-500/20'}`}>
        
        {/* Anxious Avatar */}
        <div className={`absolute bottom-2 right-4 text-5xl transition-transform duration-500 ${crashoutLevel > 60 ? 'animate-pulse scale-110' : 'scale-90 opacity-50'}`}>
             {crashoutLevel > 60 ? '😰' : user.avatar}
        </div>

        <h3 className="font-bold mb-4 flex justify-between items-center relative z-10">
            <span className="flex items-center gap-2"><BarChart2 className="text-red-500"/> Crashout Meter</span>
            <span className={`text-xs px-2 py-1 rounded-lg font-bold shadow-sm ${crashoutLevel > 70 ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                {getCrashoutLabel(crashoutLevel)}
            </span>
        </h3>
        
        <div className="relative h-8 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden border border-black/5 dark:border-white/5">
            <div 
                className="absolute top-0 left-0 h-full transition-all duration-1000 ease-out bg-gradient-to-r from-green-400 via-yellow-400 to-red-500"
                style={{ width: `${crashoutLevel}%` }}
            />
            {/* Ticks */}
            <div className="absolute top-0 left-1/3 h-full w-px bg-black/20 mix-blend-overlay"></div>
            <div className="absolute top-0 left-2/3 h-full w-px bg-black/20 mix-blend-overlay"></div>
        </div>
        
        <p className="text-xs mt-3 opacity-70 relative z-10 max-w-[80%]">
          Inputs: Volatility ({chartData.length} pts), Burnout signs, and missed tasks.
        </p>
      </div>

    </div>
  );
});

export default MentalWealth;
