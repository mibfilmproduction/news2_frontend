import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, SkipForward, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  src: string;
  thumbnail?: string;
  title?: string;
  autoPlay?: boolean;
  onEnded?: () => void;
  onError?: (error: any) => void;
  className?: string;
  controls?: boolean;
  preload?: 'auto' | 'metadata' | 'none';
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  thumbnail,
  title,
  autoPlay = false,
  onEnded,
  onError,
  className = '',
  controls = true,
  preload = 'metadata'
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Handle play/pause toggle
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  // Handle mute toggle
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };
  
  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };
  
  // Handle seeking
  const handleSeek = (value: number[]) => {
    const newTime = value[0];
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };
  
  // Handle time update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setProgress((videoRef.current.currentTime / duration) * 100);
    }
  };
  
  // Handle full screen
  const handleFullScreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  };
  
  // Format time (seconds to MM:SS)
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  // Add event listeners on mount
  useEffect(() => {
    const videoElement = videoRef.current;
    
    if (videoElement) {
      // Load metadata
      const handleLoadedMetadata = () => {
        setDuration(videoElement.duration);
        setIsLoading(false);
      };
      
      // Handle play event
      const handlePlay = () => setIsPlaying(true);
      
      // Handle pause event
      const handlePause = () => setIsPlaying(false);
      
      // Handle end event
      const handleEnded = () => {
        setIsPlaying(false);
        if (onEnded) onEnded();
      };
      
      // Handle error event
      const handleError = (e: any) => {
        setHasError(true);
        setIsLoading(false);
        if (onError) onError(e);
      };
      
      // Add event listeners
      videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.addEventListener('timeupdate', handleTimeUpdate);
      videoElement.addEventListener('play', handlePlay);
      videoElement.addEventListener('pause', handlePause);
      videoElement.addEventListener('ended', handleEnded);
      videoElement.addEventListener('error', handleError);
      
      // Cleanup
      return () => {
        videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
        videoElement.removeEventListener('timeupdate', handleTimeUpdate);
        videoElement.removeEventListener('play', handlePlay);
        videoElement.removeEventListener('pause', handlePause);
        videoElement.removeEventListener('ended', handleEnded);
        videoElement.removeEventListener('error', handleError);
      };
    }
  }, [onEnded, onError]);
  
  return (
    <div 
      className={cn("relative overflow-hidden rounded-md", className)}
      ref={containerRef}
      onMouseEnter={() => setIsControlsVisible(true)}
      onMouseLeave={() => setIsControlsVisible(false)}
      role="region"
      aria-label={title ? `Video: ${title}` : "Video player"}
    >
      {/* Video element */}
      {thumbnail && isLoading && !hasError && (
        <div className="absolute inset-0 bg-black">
          <img 
            src={thumbnail} 
            alt={title || "Video thumbnail"} 
            className="h-full w-full object-contain"
            loading="lazy"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-primary"></div>
          </div>
        </div>
      )}
      
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white">
          <AlertCircle className="h-12 w-12 mb-2 text-red-500" />
          <h3 className="text-lg font-semibold">Video playback error</h3>
          <p className="text-sm text-gray-300 mt-1">Unable to load the video</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      )}
      
      <video
        ref={videoRef}
        src={src}
        className="h-full w-full"
        poster={thumbnail}
        preload={preload}
        playsInline
        onClick={togglePlay}
        onLoadStart={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
      >
        Your browser does not support the video tag.
      </video>
      
      {/* Custom controls */}
      {controls && !hasError && (
        <div 
          className={cn(
            "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity",
            isControlsVisible || !isPlaying ? "opacity-100" : "opacity-0"
          )}
        >
          {/* Progress bar */}
          <Slider
            value={[currentTime]}
            min={0}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="mt-2"
          />
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              {/* Play/pause button */}
              <Button variant="ghost" size="icon" onClick={togglePlay}>
                {isPlaying ? (
                  <Pause className="h-5 w-5 text-white" />
                ) : (
                  <Play className="h-5 w-5 text-white" />
                )}
              </Button>
              
              {/* Skip forward 10s button */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.currentTime += 10;
                  }
                }}
              >
                <SkipForward className="h-5 w-5 text-white" />
              </Button>
              
              {/* Time display */}
              <span className="text-xs text-white">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Volume control */}
              <div className="flex items-center">
                <Button variant="ghost" size="icon" onClick={toggleMute}>
                  {isMuted ? (
                    <VolumeX className="h-5 w-5 text-white" />
                  ) : (
                    <Volume2 className="h-5 w-5 text-white" />
                  )}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  min={0}
                  max={1}
                  step={0.1}
                  onValueChange={handleVolumeChange}
                  className="w-20 mr-2"
                />
              </div>
              
              {/* Fullscreen button */}
              <Button variant="ghost" size="icon" onClick={handleFullScreen}>
                <Maximize className="h-5 w-5 text-white" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
