// PWA Utility functions for offline support and data synchronization

export interface OfflineData {
  type: 'location' | 'route' | 'driver';
  data: any;
  timestamp: number;
  synced: boolean;
}

// Store data for offline use
export const storeOfflineData = (type: string, data: any): void => {
  try {
    const offlineData: OfflineData = {
      type: type as 'location' | 'route' | 'driver',
      data,
      timestamp: Date.now(),
      synced: false
    };
    
    const existingData = JSON.parse(localStorage.getItem('offlineData') || '[]');
    existingData.push(offlineData);
    
    // Keep only last 100 entries to prevent storage overflow
    const limitedData = existingData.slice(-100);
    localStorage.setItem('offlineData', JSON.stringify(limitedData));
  } catch (error) {
    console.warn('Failed to store offline data:', error);
  }
};

// Get cached data when offline
export const getCachedData = (type: string): any[] => {
  try {
    const offlineData = JSON.parse(localStorage.getItem('offlineData') || '[]');
    return offlineData
      .filter((item: OfflineData) => item.type === type)
      .map((item: OfflineData) => item.data);
  } catch (error) {
    console.warn('Failed to get cached data:', error);
    return [];
  }
};

// Check if app is in standalone mode (installed as PWA)
export const isStandalone = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true ||
         document.referrer.includes('android-app://');
};

// Get device info for analytics
export const getDeviceInfo = () => {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    online: navigator.onLine,
    standalone: isStandalone(),
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    }
  };
};

// Request permission for notifications
export const requestNotificationPermission = async (): Promise<boolean> => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};

// Show local notification
export const showNotification = (title: string, options: NotificationOptions = {}) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/manifest-icon-192.png',
      badge: '/manifest-icon-192.png',
      ...options
    });
  }
};

// Cache management utilities
export const clearAppCache = async (): Promise<void> => {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
  }
};

// Background sync utilities
export const scheduleBackgroundSync = (tag: string): void => {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    navigator.serviceWorker.ready.then((registration) => {
      return registration.sync.register(tag);
    }).catch((error) => {
      console.warn('Background sync registration failed:', error);
    });
  }
};

// Share app functionality
export const shareApp = async (customData?: { title?: string; text?: string; url?: string }) => {
  const shareData = {
    title: customData?.title || 'CityBus Go - Live Bus Tracking',
    text: customData?.text || 'Track buses in real-time with CityBus Go!',
    url: customData?.url || window.location.href
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
      return true;
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareData.url);
      return 'copied';
    }
  } catch (error) {
    console.warn('Share failed:', error);
  }
  return false;
};

// Install prompt utilities
export const canInstall = (): boolean => {
  return !isStandalone() && 'serviceWorker' in navigator;
};

// Update app utility
export const checkForUpdates = async (): Promise<boolean> => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.update();
      return registration.waiting !== null;
    }
  }
  return false;
};

// Geolocation with offline fallback
export const getCurrentLocation = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Store location for offline use
        storeOfflineData('location', {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
        resolve(position);
      },
      (error) => {
        // Try to get cached location
        const cachedLocations = getCachedData('location');
        if (cachedLocations.length > 0) {
          const lastLocation = cachedLocations[cachedLocations.length - 1];
          resolve({
            coords: {
              latitude: lastLocation.lat,
              longitude: lastLocation.lng,
              accuracy: lastLocation.accuracy || 50,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null
            },
            timestamp: lastLocation.timestamp
          } as GeolocationPosition);
        } else {
          reject(error);
        }
      },
      options
    );
  });
};

// Network status utilities
export const getNetworkInfo = () => {
  const connection = (navigator as any).connection || 
                    (navigator as any).mozConnection || 
                    (navigator as any).webkitConnection;
  
  return {
    online: navigator.onLine,
    type: connection?.effectiveType || 'unknown',
    downlink: connection?.downlink || 0,
    rtt: connection?.rtt || 0,
    saveData: connection?.saveData || false
  };
};