import React, { useState, useEffect, useRef } from 'react';
import { 
  PhoneOff, Mic, MicOff, Video, VideoOff, Volume2, 
  Radio, Shield, Camera, AlertCircle
} from 'lucide-react';
import { Contact } from '../types';
import { sounds } from '../services/soundEffects';

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact | null;
  callType: 'voice' | 'video';
}

export const CallModal: React.FC<CallModalProps> = ({
  isOpen,
  onClose,
  contact,
  callType
}) => {
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(callType === 'video');
  const [callState, setCallState] = useState<'Calling...' | 'Ringing...' | 'Connecting...' | 'Connected' | 'Call Ended'>('Calling...');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasCameraStream, setHasCameraStream] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Call state progression
  useEffect(() => {
    if (!isOpen) {
      setDuration(0);
      setCallState('Calling...');
      stopMediaStream();
      return;
    }

    sounds.playSatelliteChirp();

    const t1 = setTimeout(() => {
      setCallState('Ringing...');
    }, 1000);

    const t2 = setTimeout(() => {
      setCallState('Connecting...');
    }, 2200);

    const t3 = setTimeout(() => {
      setCallState('Connected');
      sounds.playReceivedSound();
    }, 3400);

    const timer = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearInterval(timer);
    };
  }, [isOpen]);

  // Handle Video Stream via WebRTC getUserMedia
  useEffect(() => {
    if (!isOpen) return;

    if (isVideoOn) {
      startCamera();
    } else {
      stopMediaStream();
    }

    return () => {
      stopMediaStream();
    };
  }, [isOpen, isVideoOn]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: false // audio handled separately to prevent local feedback echo
        });
        mediaStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setHasCameraStream(true);
      } else {
        setCameraError('Camera media access is not available in this environment');
      }
    } catch (err: any) {
      console.warn('Camera stream request error:', err);
      setCameraError(err.name === 'NotAllowedError' ? 'Camera access permission denied' : 'Camera hardware unavailable');
      setHasCameraStream(false);
    }
  };

  const stopMediaStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setHasCameraStream(false);
  };

  if (!isOpen || !contact) return null;

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    setCallState('Call Ended');
    sounds.playPttSquelch(false);
    stopMediaStream();

    if (contact) {
      try {
        const record = {
          id: `call_${Date.now()}`,
          contact: {
            id: contact.id,
            name: contact.name,
            avatar: contact.avatar,
            nexusId: contact.nexusId,
            phone: contact.phone,
            satelliteLinked: contact.satelliteLinked
          },
          type: callType,
          direction: 'outgoing',
          timestamp: 'Just now',
          mode: contact.satelliteLinked ? 'satellite' : 'internet',
          status: duration > 0 ? 'completed' : 'missed',
          duration: formatDuration(duration)
        };
        const saved = localStorage.getItem('nexus_call_history');
        const list = saved ? JSON.parse(saved) : [];
        localStorage.setItem('nexus_call_history', JSON.stringify([record, ...list.slice(0, 49)]));
      } catch (e) {
        console.warn('Failed to save call history record', e);
      }
    }

    setTimeout(() => {
      onClose();
    }, 400);
  };

  const toggleVideo = () => {
    setIsVideoOn((prev) => !prev);
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
    sounds.playClickSound();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-fade-in select-none">
      <div className="bg-[#0b111a] border border-sky-500/40 rounded-3xl w-full max-w-[390px] h-[90dvh] max-h-[640px] flex flex-col overflow-hidden shadow-2xl relative">
        {/* Top Header */}
        <div className="p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center space-x-2 text-xs text-sky-400 font-mono">
            <Radio className="w-4 h-4 animate-pulse" />
            <span>{contact.satelliteLinked ? 'Satellite Voice Uplink (Opus 2.4kbps)' : 'Broadband HD Voice'}</span>
          </div>

          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
            <Shield className="w-3.5 h-3.5" />
            <span>P-256 E2EE Secure</span>
          </div>
        </div>

        {/* Video / Visualizer Area */}
        <div className="flex-1 flex flex-col items-center justify-center relative p-6 overflow-hidden">
          {isVideoOn ? (
            <div className="w-full h-full rounded-2xl bg-slate-900 border border-slate-700/80 relative overflow-hidden flex flex-col items-center justify-center">
              {hasCameraStream ? (
                /* Real User Camera Stream */
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
              ) : (
                /* Honest Video State Indicator */
                <div className="flex flex-col items-center space-y-3 p-6 text-center">
                  <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-slate-400">
                    <Camera className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">{contact.name}</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      {cameraError || 'Local camera preview off / waiting for video feed'}
                    </p>
                  </div>
                  <button
                    onClick={startCamera}
                    className="px-3 py-1.5 rounded-xl bg-sky-500/20 text-sky-300 text-xs font-semibold hover:bg-sky-500/30 transition border border-sky-500/40"
                  >
                    Enable Camera
                  </button>
                </div>
              )}

              {/* Status Header Overlay */}
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[11px] font-mono text-emerald-400 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{callState === 'Connected' ? formatDuration(duration) : callState}</span>
              </div>

              {/* Peer Thumbnail */}
              <div className="absolute bottom-3 right-3 w-24 h-28 rounded-xl bg-slate-950 border-2 border-sky-500/60 overflow-hidden shadow-2xl flex flex-col items-center justify-center p-2 text-center">
                <img
                  src={contact.avatar}
                  alt={contact.name}
                  className="w-10 h-10 rounded-full object-cover mb-1 border border-slate-700"
                />
                <span className="text-[10px] text-white font-medium truncate w-full">
                  {contact.name.split(' ')[0]}
                </span>
                <span className="text-[8px] text-sky-400 font-mono">
                  {contact.online ? 'Active' : 'Standby'}
                </span>
              </div>
            </div>
          ) : (
            /* Voice Call Graphic Area */
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-emerald-500/30 to-sky-500/30 blur-xl animate-pulse" />
                <img
                  src={contact.avatar}
                  alt={contact.name}
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-slate-700 relative z-10 shadow-2xl"
                />
              </div>

              <div className="text-center">
                <h3 className="font-bold text-lg sm:text-xl text-white">{contact.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{contact.role}</p>
                <p className={`text-xs font-semibold mt-2 ${
                  callState === 'Connected' ? 'text-emerald-400' : 'text-sky-400 animate-pulse'
                }`}>
                  {callState === 'Connected' ? formatDuration(duration) : callState}
                </p>
              </div>

              {/* Dynamic Equalizer Bars */}
              {callState === 'Connected' && !isMuted && (
                <div className="flex items-center space-x-1 h-8 pt-2">
                  {[12, 28, 16, 32, 20, 36, 14, 24, 40, 18, 30, 10].map((h, i) => (
                    <div
                      key={i}
                      className="w-1.5 bg-gradient-to-t from-emerald-500 to-sky-400 rounded-full animate-pulse"
                      style={{
                        height: `${h}px`,
                        animationDelay: `${i * 90}ms`,
                        animationDuration: '600ms'
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Control Bar */}
        <div className="p-4 sm:p-6 bg-gradient-to-t from-black/90 to-transparent flex items-center justify-around z-10">
          {/* Mute Button */}
          <button
            onClick={toggleMute}
            aria-label="Mute Audio"
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isMuted
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                : 'bg-slate-800 text-white hover:bg-slate-700'
            }`}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* End Call Button */}
          <button
            onClick={handleEndCall}
            aria-label="End Call"
            className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 transition-transform active:scale-95"
          >
            <PhoneOff className="w-6 h-6" />
          </button>

          {/* Toggle Video Button */}
          <button
            onClick={toggleVideo}
            aria-label="Toggle Camera Video"
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isVideoOn
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                : 'bg-slate-800 text-white hover:bg-slate-700'
            }`}
          >
            {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
