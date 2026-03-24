
import React, { useState, useRef } from 'react';
import { User, MurfConfig } from '../types';
import { userService } from '../services/userService';
import ControlPanel from './ControlPanel';

interface UserProfileProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onUpdateUser: (user: User) => void;
  murfConfig: MurfConfig;
  setMurfConfig: (config: MurfConfig) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ 
  user, isOpen, onClose, onLogout, onUpdateUser, murfConfig, setMurfConfig 
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'system'>('general');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Edit Form State
  const [editUsername, setEditUsername] = useState(user.username);
  const [editEmail, setEditEmail] = useState(user.email);
  const [editAvatar, setEditAvatar] = useState(user.avatar || '');

  // Password Form State
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmNewPwd, setConfirmNewPwd] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
        const updated = await userService.updateProfile(user.email, {
            username: editUsername,
            email: editEmail,
            avatar: editAvatar
        });
        onUpdateUser(updated);
        setSuccess("Operative data updated successfully.");
        setIsEditing(false);
    } catch (err: any) {
        setError(err.message);
    } finally {
        setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (newPwd !== confirmNewPwd) {
        setError("New passwords do not match.");
        return;
    }
    
    setIsLoading(true);
    try {
        await userService.changePassword(user.email, currentPwd, newPwd);
        setSuccess("Security clearance updated. Password changed.");
        setCurrentPwd('');
        setNewPwd('');
        setConfirmNewPwd('');
    } catch (err: any) {
        setError(err.message);
    } finally {
        setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileUpload = () => {
      fileInputRef.current?.click();
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 1.25));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.75));

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 font-orbitron animate-fade-in overflow-hidden">
        
        <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(6, 182, 212, 0.5); 
            border: 2px solid rgba(0, 0, 0, 0.2); 
            background-clip: padding-box;
            border-radius: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(6, 182, 212, 0.8);
          }
        `}</style>

        <div 
            className="w-full max-w-6xl bg-[#0a0a0a] border border-white/10 rounded-xl shadow-[0_0_50px_rgba(0,100,255,0.1)] overflow-hidden flex flex-col md:flex-row transition-transform duration-200 ease-out"
            style={{ 
                height: '85vh',
                transform: `scale(${zoomLevel})` 
            }}
        >
            
            {/* Sidebar */}
            <div className="w-full md:w-1/4 bg-white/5 border-r border-white/10 p-6 flex flex-col shrink-0">
                <div className="flex flex-col items-center mb-8">
                    {/* Interactive Avatar */}
                    <div 
                        onClick={() => isEditing && triggerFileUpload()}
                        className={`w-24 h-24 rounded-full border-2 border-dashed border-cyan-500/50 flex items-center justify-center mb-4 relative overflow-hidden transition-all ${isEditing ? 'cursor-pointer hover:border-cyan-400 hover:scale-105 group' : ''}`}
                    >
                        <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full pointer-events-none"></div>
                        <img 
                            src={isEditing ? (editAvatar || `https://api.dicebear.com/9.x/shapes/svg?seed=${user.username}`) : (user.avatar || `https://api.dicebear.com/9.x/shapes/svg?seed=${user.username}`)}
                            alt="Avatar" 
                            className="w-20 h-20 rounded-full object-cover relative z-10"
                        />
                        {isEditing && (
                            <div className="absolute inset-0 bg-black/60 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[8px] font-bold text-white tracking-widest">UPLOAD</span>
                            </div>
                        )}
                    </div>
                    
                    <h2 className="text-xl font-bold text-white tracking-wider break-all text-center">{user.username}</h2>
                    {user.email === 'mananmmaisheri23@gmail.com' ? (
                        <span className="text-[10px] text-red-400 font-bold border border-red-900 bg-red-950/30 px-2 py-0.5 rounded mt-2 animate-pulse">
                            ADMIN OPERATIVE
                        </span>
                    ) : (
                        <span className="text-[10px] text-cyan-400 font-mono border border-cyan-900 bg-cyan-950/30 px-2 py-0.5 rounded mt-2">
                            LEVEL 1 OPERATIVE
                        </span>
                    )}
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/png, image/jpeg, image/webp" />
                </div>

                <nav className="space-y-2 flex-1 overflow-y-auto no-scrollbar">
                    <button 
                        onClick={() => setActiveTab('general')}
                        className={`w-full text-left px-4 py-3 rounded text-xs tracking-widest uppercase transition-all flex items-center gap-2 ${activeTab === 'general' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                        Identity
                    </button>
                    <button 
                        onClick={() => setActiveTab('security')}
                        className={`w-full text-left px-4 py-3 rounded text-xs tracking-widest uppercase transition-all flex items-center gap-2 ${activeTab === 'security' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                             <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                        Security
                    </button>
                    <button 
                        onClick={() => setActiveTab('system')}
                        className={`w-full text-left px-4 py-3 rounded text-xs tracking-widest uppercase transition-all flex items-center gap-2 ${activeTab === 'system' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
                        </svg>
                        Config
                    </button>
                </nav>

                <div className="pt-4 border-t border-white/10 mt-auto">
                    <button onClick={onLogout} className="w-full px-4 py-3 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded text-xs tracking-widest uppercase transition-colors text-center">
                        Logout
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col relative bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-opacity-5">
                 
                 {/* Top Bar: Zoom Controls & Close */}
                 <div className="absolute top-0 right-0 left-0 p-4 flex justify-end items-center gap-3 z-20 pointer-events-none">
                    <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md rounded-full px-2 py-1 border border-white/10 pointer-events-auto">
                        <button onClick={handleZoomOut} className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white rounded-full hover:bg-white/10 transition-colors" title="Zoom Out">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                            </svg>
                        </button>
                        <span className="text-[10px] font-mono text-cyan-400 w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
                        <button onClick={handleZoomIn} className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white rounded-full hover:bg-white/10 transition-colors" title="Zoom In">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                        </button>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-white/50 hover:text-white hover:bg-red-900/30 hover:border-red-500/30 transition-all pointer-events-auto">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                 </div>

                 {/* Scrollable Content */}
                 <div className="flex-1 overflow-y-auto p-8 pt-16 custom-scrollbar">
                    {error && (
                        <div className="mb-4 p-3 bg-red-900/20 border border-red-500/50 text-red-400 text-xs font-mono rounded animate-slide-down">
                            ERROR: {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 p-3 bg-emerald-900/20 border border-emerald-500/50 text-emerald-400 text-xs font-mono rounded animate-slide-down">
                            SUCCESS: {success}
                        </div>
                    )}

                    {/* TAB: GENERAL */}
                    {activeTab === 'general' && (
                        <div className="animate-slide-down max-w-3xl mx-auto pb-10">
                            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-white tracking-widest">OPERATIVE DATA</h3>
                                    <p className="text-[10px] text-white/40 font-mono mt-1">PERSONAL IDENTIFICATION & AVATAR</p>
                                </div>
                                {!isEditing && (
                                    <button onClick={() => setIsEditing(true)} className="text-xs text-cyan-400 hover:text-cyan-300 font-bold border border-cyan-500/30 px-3 py-1.5 rounded bg-cyan-900/20">
                                        // EDIT DATA
                                    </button>
                                )}
                            </div>
                            
                            <form onSubmit={handleUpdateProfile} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="group">
                                        <label className="block text-[10px] uppercase text-cyan-500/70 mb-2 font-bold tracking-wider">Codename</label>
                                        <input 
                                            type="text" 
                                            value={editUsername} 
                                            onChange={e => setEditUsername(e.target.value)}
                                            disabled={!isEditing}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white disabled:opacity-50 disabled:cursor-not-allowed focus:border-cyan-500 focus:bg-cyan-950/20 focus:outline-none transition-all placeholder:text-white/20"
                                            placeholder="ENTER USERNAME"
                                        />
                                    </div>
                                    <div className="group">
                                        <label className="block text-[10px] uppercase text-cyan-500/70 mb-2 font-bold tracking-wider">Secure Comms (Email)</label>
                                        <input 
                                            type="email" 
                                            value={editEmail} 
                                            onChange={e => setEditEmail(e.target.value)}
                                            disabled={!isEditing}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white disabled:opacity-50 disabled:cursor-not-allowed focus:border-cyan-500 focus:bg-cyan-950/20 focus:outline-none transition-all placeholder:text-white/20"
                                            placeholder="ENTER EMAIL"
                                        />
                                    </div>
                                </div>
                                
                                <div className="group">
                                    <label className="block text-[10px] uppercase text-cyan-500/70 mb-2 font-bold tracking-wider">Avatar Source URL</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={editAvatar.length > 80 ? editAvatar.substring(0, 77) + '...' : editAvatar} 
                                            onChange={e => setEditAvatar(e.target.value)}
                                            disabled={!isEditing}
                                            placeholder="https://example.com/image.png"
                                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white disabled:opacity-50 disabled:cursor-not-allowed focus:border-cyan-500 focus:bg-cyan-950/20 focus:outline-none transition-all text-xs font-mono placeholder:text-white/20"
                                        />
                                        {isEditing && (
                                            <button 
                                                type="button" 
                                                onClick={triggerFileUpload}
                                                className="px-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/80 transition-colors flex items-center justify-center"
                                                title="Upload Image"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {isEditing && (
                                    <div className="flex gap-4 pt-4 border-t border-white/10">
                                        <button 
                                            type="button" 
                                            onClick={() => { 
                                                setIsEditing(false); 
                                                setEditUsername(user.username); 
                                                setEditEmail(user.email);
                                                setEditAvatar(user.avatar || '');
                                            }}
                                            className="px-6 py-3 border border-white/20 text-white/60 hover:text-white rounded-lg text-xs font-bold tracking-widest transition-colors"
                                        >
                                            CANCEL
                                        </button>
                                        <button 
                                            type="submit" 
                                            disabled={isLoading}
                                            className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold tracking-widest shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all flex-1"
                                        >
                                            {isLoading ? 'SAVING...' : 'SAVE CHANGES'}
                                        </button>
                                    </div>
                                )}
                            </form>
                        </div>
                    )}

                    {/* TAB: SECURITY */}
                    {activeTab === 'security' && (
                        <div className="animate-slide-down max-w-2xl mx-auto pb-10">
                            <div className="mb-6 border-b border-white/10 pb-4">
                                <h3 className="text-xl font-bold text-white tracking-widest">SECURITY CLEARANCE</h3>
                                <p className="text-[10px] text-white/40 font-mono mt-1">UPDATE ACCESS CREDENTIALS</p>
                            </div>

                            <form onSubmit={handleChangePassword} className="space-y-6">
                                <div className="group">
                                    <label className="block text-[10px] uppercase text-cyan-500/70 mb-2 font-bold tracking-wider">Current Password</label>
                                    <input 
                                        type="password" 
                                        value={currentPwd} 
                                        onChange={e => setCurrentPwd(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:bg-cyan-950/20 focus:outline-none transition-all tracking-widest"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div className="group">
                                    <label className="block text-[10px] uppercase text-cyan-500/70 mb-2 font-bold tracking-wider">New Password</label>
                                    <input 
                                        type="password" 
                                        value={newPwd} 
                                        onChange={e => setNewPwd(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:bg-cyan-950/20 focus:outline-none transition-all tracking-widest"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div className="group">
                                    <label className="block text-[10px] uppercase text-cyan-500/70 mb-2 font-bold tracking-wider">Confirm New Password</label>
                                    <input 
                                        type="password" 
                                        value={confirmNewPwd} 
                                        onChange={e => setConfirmNewPwd(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:bg-cyan-950/20 focus:outline-none transition-all tracking-widest"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div className="pt-4 border-t border-white/10">
                                    <button 
                                        type="submit" 
                                        disabled={isLoading || !currentPwd || !newPwd}
                                        className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-cyan-500/50 text-white rounded-lg text-xs font-bold tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? 'UPDATING...' : 'UPDATE CREDENTIALS'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* TAB: SYSTEM */}
                    {activeTab === 'system' && (
                        <div className="animate-slide-down max-w-3xl mx-auto pb-10">
                            <div className="mb-6 border-b border-white/10 pb-4">
                                <h3 className="text-xl font-bold text-white tracking-widest">SYSTEM CONFIGURATION</h3>
                                <p className="text-[10px] text-white/40 font-mono mt-1">AUDIO & VOICE SYNTHESIS SETTINGS</p>
                            </div>
                            
                            <div className="bg-black/40 p-8 rounded-xl border border-white/10 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-violet-500 to-fuchsia-500"></div>
                                <ControlPanel 
                                    murfConfig={murfConfig} 
                                    setMurfConfig={setMurfConfig} 
                                    isSettingsOpen={true} 
                                    setIsSettingsOpen={() => {}} 
                                    embedded={true} 
                                />
                            </div>
                        </div>
                    )}
                 </div>
            </div>
        </div>
    </div>
  );
};

export default UserProfile;
