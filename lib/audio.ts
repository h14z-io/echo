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
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      const url = URL.createObjectURL(blob);
      let resolved = false;

      const cleanup = () => {
        URL.revokeObjectURL(url);
        audio.removeEventListener('loadedmetadata', onLoaded);
        audio.removeEventListener('error', onError);
        audio.src = '';
      };

      const onLoaded = () => {
        if (resolved) return;
        resolved = true;
        cleanup();
        // If duration is NaN or Infinity, return 0 as fallback
        const duration = isFinite(audio.duration) ? audio.duration : 0;
        resolve(duration);
      };

      const onError = (e: Event) => {
        if (resolved) return;
        resolved = true;
        cleanup();
        console.error('Audio loading error:', e);
        // Don't reject, just resolve with 0 duration
        resolve(0);
      };

      // Timeout after 5 seconds
      const timeout = setTimeout(() => {
        if (resolved) return;
        resolved = true;
        cleanup();
        console.warn('Audio duration loading timed out');
        resolve(0);
      }, 5000);

      audio.addEventListener('loadedmetadata', onLoaded);
      audio.addEventListener('error', onError);

      try {
        audio.src = url;
        audio.load(); // Explicitly load on Safari
      } catch (err) {
        clearTimeout(timeout);
        onError(err as Event);
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
