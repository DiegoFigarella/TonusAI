
import React from 'react';
import { UserState, Theme, Sensitivity } from '../types';
import { X, Moon, Sun, Volume1, Volume2, Shield, User } from 'lucide-react';

interface SettingsProps {
  user: UserState;
  updateUser: (updates: Partial<UserState>) => void;
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ user, updateUser, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`${user.theme === 'light' ? 'bg-white text-gray-900' : 'bg-[#18181b] text-white'} w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden transition-colors duration-300 transform scale-100`}>
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-white/10 flex justify-between items-center">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            ⚙️ Settings
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          
          {/* User Profile */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider opacity-60 mb-4 flex items-center gap-2">
              <User size={16} /> User Profile
            </h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-4xl bg-gray-100 dark:bg-white/10 p-3 rounded-full">{user.avatar}</div>
              <div className="flex-1">
                <label className="block text-[10px] font-bold mb-1 opacity-70 uppercase">Display Name</label>
                <input 
                  type="text" 
                  value={user.name}
                  onChange={(e) => updateUser({ name: e.target.value })}
                  className="w-full bg-transparent border-b border-gray-300 dark:border-white/20 focus:border-purple-500 outline-none py-2 font-medium transition-colors"
                />
              </div>
            </div>
          </section>

          {/* Appearance */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider opacity-60 mb-4 flex items-center gap-2">
              {user.theme === 'light' ? <Sun size={16} /> : <Moon size={16} />} Appearance
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => updateUser({ theme: 'light' })}
                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${user.theme === 'light' ? 'border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/20' : 'border-gray-200 dark:border-white/10 opacity-50 hover:opacity-100'}`}
              >
                <Sun size={24} />
                <span className="font-medium">Light Mode</span>
              </button>
              <button 
                onClick={() => updateUser({ theme: 'dark' })}
                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${user.theme === 'dark' ? 'border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/20' : 'border-gray-200 dark:border-white/10 opacity-50 hover:opacity-100'}`}
              >
                <Moon size={24} className="text-blue-400" />
                <span className="font-medium">Dark Mode</span>
              </button>
            </div>
          </section>

          {/* Audio Environment */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider opacity-60 mb-4 flex items-center gap-2">
              <Volume2 size={16} /> Audio Environment
            </h3>
            <div className={`p-4 rounded-xl border ${user.theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-white/5 border-white/10'}`}>
              <div className="flex justify-between mb-4">
                <span className={`text-xs font-bold flex items-center gap-1 ${user.micSensitivity === 'quiet' ? 'text-purple-500' : 'opacity-50'}`}>
                    <Volume1 size={14}/> Quiet Env
                </span>
                <span className={`text-xs font-bold flex items-center gap-1 ${user.micSensitivity === 'loud' ? 'text-purple-500' : 'opacity-50'}`}>
                    <Volume2 size={14}/> Loud Env
                </span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="2" 
                step="1"
                value={user.micSensitivity === 'quiet' ? 0 : user.micSensitivity === 'normal' ? 1 : 2}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  const s: Sensitivity = val === 0 ? 'quiet' : val === 1 ? 'normal' : 'loud';
                  updateUser({ micSensitivity: s });
                }}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="mt-3 flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-purple-500 mt-1.5 flex-shrink-0"></div>
                <p className="text-xs opacity-70 leading-relaxed">
                  {user.micSensitivity === 'quiet' ? 'Standard mode. Good for home or quiet offices. Recognizes whispers better.' : 
                   user.micSensitivity === 'normal' ? 'Balanced filtering for everyday use.' : 
                   'High noise suppression. Filters background noise aggressively. Speak clearly.'}
                </p>
              </div>
            </div>
          </section>

          {/* Privacy */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider opacity-60 mb-4 flex items-center gap-2">
              <Shield size={16} /> Privacy Policy
            </h3>
            <div className={`text-sm p-4 rounded-xl border ${user.theme === 'light' ? 'bg-blue-50 border-blue-100 text-blue-900' : 'bg-blue-900/10 border-blue-500/20 text-blue-100'}`}>
               <p className="opacity-90 leading-relaxed">
                   <strong>Your privacy matters.</strong> Audio is processed in real-time. 
                   <br/><br/>
                   • <strong>Discard</strong> immediately wipes data from memory.
                   <br/>
                   • <strong>Save</strong> stores transcription locally on your device (simulated).
                   <br/>
                   • We do not sell your personal data.
               </p>
               <button className="mt-4 text-xs font-bold uppercase tracking-wider underline opacity-70 hover:opacity-100">Read Full Legal Policy</button>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default Settings;
