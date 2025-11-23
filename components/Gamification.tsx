
import React, { useState } from 'react';
import { UserState, Emotion, EMOTION_COLORS, GardenNote, Avatar, Theme } from '../types';
import { Trophy, Flame, Sprout, Lock, PenTool, Star, Zap, Droplets, Sun, BookOpen, Send, ShoppingBag } from 'lucide-react';

interface GamificationProps {
  user: UserState;
  updateUser: (updates: Partial<UserState>) => void;
}

const Gamification: React.FC<GamificationProps> = React.memo(({ user, updateUser }) => {
  const [activeTab, setActiveTab] = useState<'gazette' | 'garden'>('garden');
  const [showPlantMenu, setShowPlantMenu] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [showShop, setShowShop] = useState(false);
  
  // Gazette State
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteBody, setNewNoteBody] = useState("");
  const [notes, setNotes] = useState<GardenNote[]>([
    { id: '1', title: 'Morning Reflection', content: 'Today started slow but I felt better after coffee.', date: 'Oct 24', timestamp: Date.now() },
    { id: '2', title: 'Anxiety Spike', content: 'Had a moment of panic at work, used breathing tech.', date: 'Oct 22', timestamp: Date.now() - 86400000 }
  ]);

  // Inventory Mock Data
  const availableFlowers = ['🌻', '🌷', '🌹', '🪷', '🌺'];

  const getPlantImage = (stage: number) => {
    if (stage === 0) return "🌱"; // Sprout
    if (stage === 1) return "🌿"; // Small
    if (stage === 2) return "🪴"; // Pot
    if (stage === 3) return "🌳"; // Tree
    if (stage === 4) return "🌲"; // Big Tree
    return "🌳 ✨"; // Max
  };

  const handlePlantAction = (type: 'water' | 'fertilize' | 'sun') => {
      let pointsToAdd = 0;
      let growAmount = 0;
      let message = "";

      if (type === 'water') {
        pointsToAdd = 50;
        growAmount = 0.2;
        message = "Watered! (Did you record your day?)";
      } else if (type === 'fertilize') {
        pointsToAdd = 100;
        growAmount = 0.5;
        message = "Fertilized! (Task completed)";
      } else if (type === 'sun') {
        pointsToAdd = 30;
        growAmount = 0.1;
        message = "Sunlight given! (Reflection done)";
      }

      const nextStage = Math.min(user.plantStage + growAmount, 5); // Max stage 5

      updateUser({ 
          points: user.points + pointsToAdd, 
          plantStage: nextStage
      });
      setShowPlantMenu(false);
      alert(`${message} +${pointsToAdd} XP`);
  };

  const saveNote = () => {
    if (!newNoteBody.trim()) return;
    const note: GardenNote = {
        id: Date.now().toString(),
        title: newNoteTitle || 'Untitled Entry',
        content: newNoteBody,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        timestamp: Date.now()
    };
    setNotes([note, ...notes]);
    setNewNoteTitle("");
    setNewNoteBody("");
    alert("Entry saved to Gazette!");
  };

  const unlockAvatar = (avatar: Avatar, cost: number) => {
      if (user.points >= cost && !user.unlockedAvatars.includes(avatar)) {
          updateUser({ 
              points: user.points - cost, 
              unlockedAvatars: [...user.unlockedAvatars, avatar],
              avatar: avatar
          });
      } else if (user.unlockedAvatars.includes(avatar)) {
          updateUser({ avatar: avatar });
      } else {
          alert("Not enough points!");
      }
  };

  const isLight = user.theme === 'light';

  return (
    <div className={`h-full overflow-y-auto p-6 space-y-8 pb-32 md:pb-6 ${isLight ? 'text-gray-900' : 'text-white'}`}>
      
      {/* HEADER STATS */}
      <div className="grid grid-cols-3 gap-4">
        <div className={`p-4 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden border ${isLight ? 'bg-yellow-50 border-yellow-200' : 'bg-gradient-to-br from-yellow-900/30 to-black border-yellow-500/20'}`}>
          <Trophy className="w-6 h-6 text-yellow-500 mb-2" />
          <span className="text-2xl font-black">{Math.floor(user.points)}</span>
          <span className="text-[10px] uppercase tracking-widest opacity-60">Points</span>
        </div>
        <div className={`p-4 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden border ${isLight ? 'bg-orange-50 border-orange-200' : 'bg-gradient-to-br from-orange-900/30 to-black border-orange-500/20'}`}>
          <Flame className="w-6 h-6 text-orange-500 mb-2" />
          <span className="text-2xl font-black">{user.streak}</span>
          <span className="text-[10px] uppercase tracking-widest opacity-60">Streak</span>
        </div>
        <div className={`p-4 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden border ${isLight ? 'bg-green-50 border-green-200' : 'bg-gradient-to-br from-green-900/30 to-black border-green-500/20'}`}>
          <Sprout className="w-6 h-6 text-green-500 mb-2" />
          <span className="text-2xl font-black">{Math.floor(user.plantStage)}</span>
          <span className="text-[10px] uppercase tracking-widest opacity-60">Stage</span>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-4 border-b border-gray-200 dark:border-white/10 pb-2">
         <button onClick={() => setActiveTab('garden')} className={`pb-2 px-2 font-bold transition-colors ${activeTab === 'garden' ? 'text-green-500 border-b-2 border-green-500' : 'opacity-50'}`}>Growth Garden</button>
         <button onClick={() => setActiveTab('gazette')} className={`pb-2 px-2 font-bold transition-colors ${activeTab === 'gazette' ? 'text-yellow-500 border-b-2 border-yellow-500' : 'opacity-50'}`}>Garden Gazette</button>
      </div>

      {/* GARDEN VIEW */}
      {activeTab === 'garden' && (
        <div className="grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2">
            
            {/* GUARDIAN */}
            <div 
                onClick={() => setShowAvatarMenu(true)}
                className={`cursor-pointer group rounded-3xl p-6 relative overflow-hidden border flex flex-col items-center transition-all hover:scale-[1.02] ${isLight ? 'bg-white border-gray-200 shadow-sm' : 'bg-[#18181b] border-white/5'}`}
            >
                <div className="absolute top-4 right-4 bg-purple-500 text-white text-[10px] px-2 py-1 rounded-full font-bold opacity-0 group-hover:opacity-100 transition-opacity">SWAP</div>
                <h3 className="text-lg font-bold mb-4 text-purple-400">Guardian</h3>
                <div className="w-32 h-32 rounded-full flex items-center justify-center text-7xl shadow-[0_0_30px_rgba(168,85,247,0.3)] border-4 border-purple-500/20 bg-purple-500/5 animate-bounce-slow">
                    {user.avatar}
                </div>
            </div>

            {/* MAIN PLANT */}
            <div 
                onClick={() => setShowPlantMenu(true)}
                className={`cursor-pointer group rounded-3xl p-6 relative overflow-hidden border flex flex-col items-center transition-all hover:scale-[1.02] ${isLight ? 'bg-white border-gray-200 shadow-sm' : 'bg-[#18181b] border-white/5'}`}
            >
                <div className="absolute top-4 right-4 bg-green-500 text-white text-[10px] px-2 py-1 rounded-full font-bold opacity-0 group-hover:opacity-100 transition-opacity">CARE</div>
                <h3 className="text-lg font-bold mb-4 text-green-400">Growth Tree</h3>
                <div className="w-40 h-40 flex items-center justify-center text-8xl drop-shadow-2xl transition-all duration-700">
                    {getPlantImage(Math.floor(user.plantStage))}
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-800 h-2 rounded-full mt-6 overflow-hidden">
                    <div className="bg-green-500 h-full transition-all duration-500" style={{ width: `${(user.plantStage % 1) * 100}%` }} />
                </div>
                <p className="mt-2 text-[10px] uppercase tracking-wider opacity-60 font-bold">Next Stage: {Math.floor((1 - (user.plantStage % 1)) * 100)}%</p>
                
                {Math.floor(user.plantStage) >= 5 && (
                    <button onClick={(e) => { e.stopPropagation(); setShowShop(true); }} className="mt-4 bg-yellow-500 text-black px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2">
                        <ShoppingBag size={14}/> Open Flower Shop
                    </button>
                )}
            </div>
        </div>
      )}

      {/* GAZETTE VIEW */}
      {activeTab === 'gazette' && (
          <div className="grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2">
              
              {/* WRITE SECTION */}
              <div className={`p-6 rounded-3xl border ${isLight ? 'bg-white border-yellow-200' : 'bg-[#1c1c1a] border-yellow-900/30'}`}>
                  <h3 className="font-serif text-xl font-bold mb-4 flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                      <PenTool size={18}/> New Entry
                  </h3>
                  <input 
                    className="w-full bg-transparent border-b border-gray-300 dark:border-white/10 mb-4 p-2 outline-none font-bold"
                    placeholder="Title your thought..."
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                  />
                  <textarea 
                    className="w-full bg-transparent p-2 outline-none h-32 resize-none text-sm opacity-80"
                    placeholder="Write a short reflection..."
                    value={newNoteBody}
                    onChange={(e) => setNewNoteBody(e.target.value)}
                  />
                  <button onClick={saveNote} className="w-full mt-4 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
                      <Send size={16}/> Publish to Gazette
                  </button>
              </div>

              {/* READ SECTION */}
              <div className="space-y-4">
                  <h3 className="font-bold text-sm uppercase opacity-50 ml-2">Gazette Feed</h3>
                  {notes.map(note => (
                      <div key={note.id} className={`p-4 rounded-xl border relative ${isLight ? 'bg-[#fffdf5] border-yellow-100' : 'bg-white/5 border-white/5'}`}>
                          <div className="absolute top-4 right-4 text-[10px] opacity-40 font-mono">{note.date}</div>
                          <h4 className="font-serif font-bold text-lg mb-1">{note.title}</h4>
                          <p className="text-sm opacity-70 leading-relaxed">{note.content}</p>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* AVATAR SELECTION MODAL */}
      {showAvatarMenu && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className={`w-full max-w-md rounded-3xl p-6 ${isLight ? 'bg-white' : 'bg-gray-900'} shadow-2xl`}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Guardian Shelter</h3>
                    <button onClick={() => setShowAvatarMenu(false)} className="p-2 hover:bg-black/10 rounded-full"><span className="sr-only">Close</span>✕</button>
                </div>
                <div className="grid grid-cols-4 gap-4">
                    {Object.values(Avatar).map((av, index) => {
                        const isUnlocked = user.unlockedAvatars.includes(av);
                        const cost = (index + 1) * 300;
                        return (
                            <button 
                                key={av}
                                onClick={() => unlockAvatar(av, cost)}
                                className={`aspect-square rounded-2xl flex flex-col items-center justify-center text-3xl relative border-2 transition-all ${user.avatar === av ? 'border-purple-500 bg-purple-500/10 scale-105' : 'border-transparent bg-gray-100 dark:bg-white/5'} ${!isUnlocked && 'opacity-60 grayscale'}`}
                            >
                                {av}
                                {!isUnlocked && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-2xl backdrop-blur-[1px]">
                                        <Lock size={12} className="text-white mb-1"/>
                                        <span className="text-[9px] font-bold text-white">{cost}</span>
                                    </div>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
      )}

      {/* PLANT CARE MODAL */}
      {showPlantMenu && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className={`w-full max-w-sm rounded-3xl p-6 ${isLight ? 'bg-white' : 'bg-gray-900'} shadow-2xl`}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2"><Sprout /> Garden Care</h3>
                    <button onClick={() => setShowPlantMenu(false)} className="p-2 hover:bg-black/10 rounded-full">✕</button>
                </div>
                <div className="space-y-3">
                    <button onClick={() => handlePlantAction('water')} className="w-full p-4 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center gap-4 hover:bg-blue-500 hover:text-white transition-all group">
                        <div className="bg-blue-500/20 p-2 rounded-full group-hover:bg-white/20"><Droplets size={20} /></div>
                        <div className="text-left">
                            <p className="font-bold">Water (+50xp)</p>
                            <p className="text-[10px] opacity-70">Requires: Record a reflection</p>
                        </div>
                    </button>
                    <button onClick={() => handlePlantAction('sun')} className="w-full p-4 rounded-xl bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 flex items-center gap-4 hover:bg-yellow-500 hover:text-white transition-all group">
                        <div className="bg-yellow-500/20 p-2 rounded-full group-hover:bg-white/20"><Sun size={20} /></div>
                        <div className="text-left">
                            <p className="font-bold">Sunlight (+30xp)</p>
                            <p className="text-[10px] opacity-70">Requires: Write in Gazette</p>
                        </div>
                    </button>
                    <button onClick={() => handlePlantAction('fertilize')} className="w-full p-4 rounded-xl bg-pink-500/10 text-pink-500 border border-pink-500/20 flex items-center gap-4 hover:bg-pink-500 hover:text-white transition-all group">
                        <div className="bg-pink-500/20 p-2 rounded-full group-hover:bg-white/20"><Zap size={20} /></div>
                        <div className="text-left">
                            <p className="font-bold">Fertilize (+100xp)</p>
                            <p className="text-[10px] opacity-70">Requires: Complete a task</p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* SHOP MODAL (Unlock Flowers) */}
      {showShop && (
          <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4">
              <div className={`w-full max-w-sm rounded-3xl p-6 ${isLight ? 'bg-white' : 'bg-gray-900'} text-center`}>
                  <h3 className="text-2xl font-bold mb-4">🌺 Seed Shop</h3>
                  <p className="mb-6 opacity-70 text-sm">You have a fully grown tree! Spend points to add flowers to your garden.</p>
                  <div className="grid grid-cols-3 gap-3">
                      {availableFlowers.map(flower => (
                          <button key={flower} className="text-4xl p-4 bg-gray-100 dark:bg-white/5 rounded-xl hover:scale-110 transition-transform">
                              {flower}
                          </button>
                      ))}
                  </div>
                  <button onClick={() => setShowShop(false)} className="mt-8 text-sm font-bold opacity-50 hover:opacity-100">Close Shop</button>
              </div>
          </div>
      )}

    </div>
  );
});

export default Gamification;
