import { useState, useRef, useEffect } from 'react';
import candyCircuitMusic from '../assets/Candy Circuit.mp3';
import { useSpinAudioStore } from '../store/useSpinAudioStore';

export function AudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const spinVolume = useSpinAudioStore((s) => s.volume);
  const spinMuted = useSpinAudioStore((s) => s.muted);
  const setSpinVolume = useSpinAudioStore((s) => s.setVolume);
  const toggleSpinMuted = useSpinAudioStore((s) => s.toggleMuted);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  const effectiveSpinVolume = spinMuted ? 0 : spinVolume;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {/* Spin Wheel Audio Controls */}
      <div className="bg-white/80 backdrop-blur-sm p-3 rounded-2xl shadow-lg border border-gray-200 flex items-center gap-3 hover:bg-white transition-all">
        <audio className="hidden" />
        <span className="text-xs font-bold text-indigo-700 whitespace-nowrap">🎡 Vòng quay</span>
        <button 
          onClick={toggleSpinMuted}
          className="w-8 h-8 flex items-center justify-center bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors shadow-md"
          title={spinMuted ? "Bật âm thanh vòng quay" : "Tắt âm thanh vòng quay"}
        >
          {spinMuted ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-0.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
          )}
        </button>

        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
            {effectiveSpinVolume === 0 ? (
              <path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6"/>
            ) : effectiveSpinVolume < 0.5 ? (
              <><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></>
            ) : (
              <><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></>
            )}
          </svg>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={spinVolume} 
            onChange={(e) => setSpinVolume(parseFloat(e.target.value))}
            className="w-20 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            title="Âm lượng vòng quay"
          />
        </div>
      </div>

      {/* Background Music Controls */}
      <div className="bg-white/80 backdrop-blur-sm p-3 rounded-2xl shadow-lg border border-gray-200 flex items-center gap-3 hover:bg-white transition-all">
        <audio ref={audioRef} src={candyCircuitMusic} loop />
        <span className="text-xs font-bold text-indigo-700 whitespace-nowrap">🎵 Nhạc nền</span>
        <button 
          onClick={togglePlay}
          className="w-8 h-8 flex items-center justify-center bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors shadow-md"
          title={isPlaying ? "Tạm dừng nhạc nền" : "Phát nhạc nền"}
        >
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-0.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          )}
        </button>

        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
            {volume === 0 ? (
              <path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6"/>
            ) : volume < 0.5 ? (
              <><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></>
            ) : (
              <><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></>
            )}
          </svg>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={volume} 
            onChange={handleVolumeChange}
            className="w-20 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            title="Âm lượng nhạc nền"
          />
        </div>
      </div>
    </div>
  );
}
