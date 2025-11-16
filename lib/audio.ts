export const audioUtils = {
  // Convert Blob to base64
  blobToBase64: (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  },

  // Convert base64 to Blob
  base64ToBlob: (base64: string): Blob => {
    const arr = base64.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  },

  // Get audio duration from blob
  getAudioDuration: (blob: Blob): Promise<number> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      const url = URL.createObjectURL(blob);
      let resolved = false;
      let timeoutId: NodeJS.Timeout;

      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId);
        URL.revokeObjectURL(url);
        audio.removeEventListener('loadedmetadata', onLoaded);
        audio.removeEventListener('durationchange', onDurationChange);
        audio.removeEventListener('canplay', onCanPlay);
        audio.removeEventListener('error', onError);
        audio.src = '';
      };

      const finalize = (duration: number) => {
        if (resolved) return;
        resolved = true;
        cleanup();
        const validDuration = isFinite(duration) && duration > 0 ? duration : 0;
        console.log('Audio duration resolved:', validDuration);
        resolve(validDuration);
      };

      const onLoaded = () => {
        console.log('Metadata loaded, duration:', audio.duration);
        if (isFinite(audio.duration) && audio.duration > 0) {
          finalize(audio.duration);
        }
      };

      const onDurationChange = () => {
        console.log('Duration changed:', audio.duration);
        if (isFinite(audio.duration) && audio.duration > 0) {
          finalize(audio.duration);
        }
      };

      const onCanPlay = () => {
        console.log('Can play, duration:', audio.duration);
        if (isFinite(audio.duration) && audio.duration > 0) {
          finalize(audio.duration);
        }
      };

      const onError = (e: Event) => {
        console.error('Audio loading error:', e);
        finalize(0);
      };

      // Timeout after 10 seconds
      timeoutId = setTimeout(() => {
        console.warn('Audio duration loading timed out');
        finalize(0);
      }, 10000);

      // Multiple event listeners for better Safari compatibility
      audio.addEventListener('loadedmetadata', onLoaded);
      audio.addEventListener('durationchange', onDurationChange);
      audio.addEventListener('canplay', onCanPlay);
      audio.addEventListener('error', onError);

      // Preload metadata
      audio.preload = 'metadata';

      try {
        audio.src = url;
        // Force load on Safari
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            audio.pause();
            audio.currentTime = 0;
          }).catch((err) => {
            console.log('Auto-play prevented (expected):', err);
          });
        }
      } catch (err) {
        console.error('Error setting audio source:', err);
        finalize(0);
      }
    });
  },

  // Format duration for display (e.g., "1:23")
  formatDuration: (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  },

  // Format timestamp for display
  formatTimestamp: (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },
};
