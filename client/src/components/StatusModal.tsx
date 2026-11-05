import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Send, Camera, Sparkles, Plus } from 'lucide-react';
import { StatusStory } from '../types';
import { sounds } from '../services/soundEffects';

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReplyToStatus?: (text: string) => void;
}

export const StatusModal: React.FC<StatusModalProps> = ({
  isOpen,
  onClose,
  onReplyToStatus
}) => {
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newStatusText, setNewStatusText] = useState('');
  const [newStatusColor, setNewStatusColor] = useState('#047857');

  const [stories, setStories] = useState<StatusStory[]>([
    {
      id: 'st_1',
      userId: 'contact_aarav',
      userName: 'Dr. Aarav Sharma (NDRF)',
      userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      caption: 'Mobile relief camp established near Rudraprayag. 150 families supported today! 🏔️🇮🇳',
      mediaUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=80',
      timestamp: '2 hours ago',
      viewed: false
    },
    {
      id: 'st_2',
      userId: 'contact_isro_ground',
      userName: 'Priya Patel (ISRO Ops)',
      userAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      caption: 'NavIC constellation orbital health: All 7 operational satellites reporting nominal SNR! 🛰️✨',
      mediaUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
      timestamp: '4 hours ago',
      viewed: false
    },
    {
      id: 'st_3',
      userId: 'contact_vikram',
      userName: 'Subedar Vikram Singh',
      userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      caption: 'Northern Border Siachen glacier patrol. Frost on the antenna, but Nexus Satellite link is unbroken. Jai Hind! ❄️',
      mediaUrl: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=600&auto=format&fit=crop&q=80',
      timestamp: '6 hours ago',
      viewed: false
    }
  ]);

  // Story Timer
  useEffect(() => {
    if (!isOpen || isCreating) return;

    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          if (activeStoryIndex < stories.length - 1) {
            setActiveStoryIndex(activeStoryIndex + 1);
            return 0;
          } else {
            return 100;
          }
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, activeStoryIndex, isCreating, stories.length]);

  if (!isOpen) return null;

  const currentStory = stories[activeStoryIndex];

  const handleNext = () => {
    if (activeStoryIndex < stories.length - 1) {
      setActiveStoryIndex(activeStoryIndex + 1);
      setProgress(0);
    }
  };

  const handlePrev = () => {
    if (activeStoryIndex > 0) {
      setActiveStoryIndex(activeStoryIndex - 1);
      setProgress(0);
    }
  };

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    if (onReplyToStatus) {
      onReplyToStatus(`Replying to story: "${replyText}"`);
    }
    sounds.playSentSound();
    setReplyText('');
    onClose();
  };

  const handlePublishNewStatus = () => {
    if (!newStatusText.trim()) return;
    const newStory: StatusStory = {
      id: 'st_my_' + Date.now(),
      userId: 'user_self',
      userName: 'My Status',
      userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      caption: newStatusText,
      bgColor: newStatusColor,
      timestamp: 'Just now',
      viewed: true
    };
    setStories([newStory, ...stories]);
    setActiveStoryIndex(0);
    setIsCreating(false);
    setNewStatusText('');
    sounds.playSentSound();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-xl animate-fade-in select-none">
      <div className="bg-[#090e15] border border-slate-700 rounded-3xl w-full max-w-[390px] h-[90dvh] max-h-[620px] flex flex-col overflow-hidden shadow-2xl relative">
        {isCreating ? (
          /* CREATE STATUS VIEW */
          <div className="flex-1 flex flex-col justify-between p-6" style={{ backgroundColor: newStatusColor }}>
            <div className="flex items-center justify-between text-white">
              <h3 className="font-bold text-sm">Create New Status</h3>
              <button onClick={() => setIsCreating(false)} className="p-1 rounded-full bg-black/40">
                <X className="w-5 h-5" />
              </button>
            </div>

            <textarea
              placeholder="What's happening? (Type your status update...)"
              value={newStatusText}
              onChange={(e) => setNewStatusText(e.target.value)}
              className="w-full bg-transparent text-xl font-bold text-white placeholder-white/70 focus:outline-none resize-none text-center"
              rows={4}
              autoFocus
            />

            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2">
                {['#047857', '#0369a1', '#7c3aed', '#b91c1c', '#c2410c'].map(col => (
                  <button
                    key={col}
                    onClick={() => setNewStatusColor(col)}
                    className={`w-7 h-7 rounded-full border-2 ${newStatusColor === col ? 'border-white scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: col }}
                  />
                ))}
              </div>

              <button
                onClick={handlePublishNewStatus}
                disabled={!newStatusText.trim()}
                className="w-full py-3 rounded-xl bg-white text-slate-900 font-bold text-sm shadow-xl hover:bg-slate-100 transition-all"
              >
                Share to My Status (24 Hours)
              </button>
            </div>
          </div>
        ) : (
          /* VIEW STATUS STORIES */
          <>
            {/* Top Progress Bars */}
            <div className="p-3 absolute top-0 left-0 right-0 z-20 flex space-x-1.5 bg-gradient-to-b from-black/80 to-transparent">
              {stories.map((s, idx) => (
                <div key={s.id} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white transition-all"
                    style={{
                      width:
                        idx < activeStoryIndex
                          ? '100%'
                          : idx === activeStoryIndex
                          ? `${progress}%`
                          : '0%'
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Author Profile Header */}
            <div className="p-4 pt-6 absolute top-0 left-0 right-0 z-20 flex items-center justify-between text-white">
              <div className="flex items-center space-x-2.5">
                <img
                  src={currentStory.userAvatar}
                  alt={currentStory.userName}
                  className="w-9 h-9 rounded-full object-cover border border-white"
                />
                <div>
                  <h4 className="font-bold text-sm leading-none">{currentStory.userName}</h4>
                  <p className="text-[10px] text-white/80 mt-0.5">{currentStory.timestamp}</p>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setIsCreating(true)}
                  title="Add My Status"
                  className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-emerald-400"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Story Visual Content */}
            <div className="flex-1 flex items-center justify-center relative bg-black">
              {currentStory.mediaUrl ? (
                <img
                  src={currentStory.mediaUrl}
                  alt="Story Content"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center p-8 text-center"
                  style={{ backgroundColor: currentStory.bgColor || '#047857' }}
                >
                  <p className="text-xl font-bold text-white">{currentStory.caption}</p>
                </div>
              )}

              {/* Navigation click zones */}
              <button
                onClick={handlePrev}
                className="absolute left-0 top-0 bottom-0 w-1/3 z-10 opacity-0 hover:opacity-100 flex items-center pl-2"
              >
                <ChevronLeft className="w-8 h-8 text-white/60 drop-shadow" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-0 top-0 bottom-0 w-1/3 z-10 opacity-0 hover:opacity-100 flex items-center justify-end pr-2"
              >
                <ChevronRight className="w-8 h-8 text-white/60 drop-shadow" />
              </button>

              {/* Caption Overlay if has image */}
              {currentStory.mediaUrl && (
                <div className="absolute bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent text-white text-center">
                  <p className="text-sm font-medium leading-relaxed drop-shadow">
                    {currentStory.caption}
                  </p>
                </div>
              )}
            </div>

            {/* Quick Reply Footer */}
            <div className="p-3 bg-black/90 border-t border-white/10 flex items-center space-x-2 z-20">
              <input
                type="text"
                placeholder="Reply to status..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                className="flex-1 bg-white/10 text-white text-xs px-3.5 py-2 rounded-full placeholder-white/50 focus:outline-none focus:bg-white/20"
              />
              <button
                onClick={handleSendReply}
                disabled={!replyText.trim()}
                className="p-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
