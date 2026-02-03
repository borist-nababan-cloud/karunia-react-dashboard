'use client';

// Global state to track if Google Maps API is loading or loaded
let isLoading = false;
let isLoaded = false;
let loadCallbacks: (() => void)[] = [];
let loadRejects: ((error: Error) => void)[] = [];

export const GoogleMapsLoader = {
  /**
   * Load Google Maps API with callback
   */
  load: (apiKey: string, callback?: () => void): Promise<void> => {
    return new Promise((resolve, reject) => {
      // If already loaded, resolve immediately
      if (isLoaded && window.google && window.google.maps) {
        console.log('[GoogleMapsLoader] API already loaded, executing callback');
        callback?.();
        resolve();
        return;
      }

      // Add callback to queue
      if (callback) {
        loadCallbacks.push(callback);
      }

      // Track rejection handlers
      loadRejects.push(reject);

      // If already loading, just add to queue and wait
      if (isLoading) {
        console.log('[GoogleMapsLoader] API already loading, waiting...');
        const checkLoaded = setInterval(() => {
          if (isLoaded) {
            clearInterval(checkLoaded);
            resolve();
          }
        }, 100);
        return;
      }

      // Start loading
      isLoading = true;
      console.log('[GoogleMapsLoader] Starting Google Maps API load...');

      const scriptId = 'google-maps-api-script';

      // Check if script already exists
      if (document.getElementById(scriptId)) {
        console.log('[GoogleMapsLoader] Script tag exists, waiting for API...');
        // Script exists but API not loaded yet
        const checkApi = setInterval(() => {
          if (window.google && window.google.maps) {
            clearInterval(checkApi);
            GoogleMapsLoader.onApiLoaded();
            resolve();
          }
        }, 100);
        return;
      }

      // Create and append script
      console.log('[GoogleMapsLoader] Creating script tag...');
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=googleMapsApiCallback`;
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        console.error('[GoogleMapsLoader] Failed to load script');
        isLoading = false;
        const error = new Error('Failed to load Google Maps API script');
        // Reject all pending promises
        loadRejects.forEach(rejectFn => rejectFn(error));
        loadRejects = [];
        reject(error);
      };

      // Global callback for Google Maps API
      (window as any).googleMapsApiCallback = () => {
        console.log('[GoogleMapsLoader] Google Maps API callback triggered');
        GoogleMapsLoader.onApiLoaded();
        resolve();
      };

      document.head.appendChild(script);
      console.log('[GoogleMapsLoader] Script tag appended to head');
    });
  },

  /**
   * Called when Google Maps API is loaded
   */
  onApiLoaded: () => {
    console.log('[GoogleMapsLoader] API loaded, executing callbacks...');
    isLoading = false;
    isLoaded = true;

    // Execute all queued callbacks
    loadCallbacks.forEach((callback, index) => {
      try {
        console.log(`[GoogleMapsLoader] Executing callback ${index + 1}/${loadCallbacks.length}`);
        callback();
      } catch (error) {
        console.error('[GoogleMapsLoader] Error in Google Maps callback:', error);
      }
    });

    // Clear callbacks
    loadCallbacks = [];
    loadRejects = [];
    console.log('[GoogleMapsLoader] All callbacks executed');
  },

  /**
   * Check if Google Maps API is loaded
   */
  isLoaded: (): boolean => {
    return isLoaded && !!(window.google && window.google.maps);
  },

  /**
   * Wait for Google Maps to be loaded
   */
  waitForLoad: (): Promise<void> => {
    return new Promise((resolve) => {
      if (GoogleMapsLoader.isLoaded()) {
        resolve();
        return;
      }

      const checkLoaded = setInterval(() => {
        if (GoogleMapsLoader.isLoaded()) {
          clearInterval(checkLoaded);
          resolve();
        }
      }, 100);
    });
  }
};

// Add TypeScript declarations for Google Maps
declare global {
  interface Window {
    google: any;
    googleMapsApiCallback?: () => void;
  }
}