import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';
import { Download, Wifi, WifiOff, RefreshCw, Smartphone, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAFeatures() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [serviceWorkerRegistration, setServiceWorkerRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [showInstallIcon, setShowInstallIcon] = useState(false);
  const [installPromptDismissed, setInstallPromptDismissed] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches || 
          (window.navigator as any).standalone === true) {
        setIsInstalled(true);
        setShowInstallIcon(false);
      }
    };
    checkInstalled();

    // Check if install prompt was previously dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      setInstallPromptDismissed(true);
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallIcon(true);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowInstallIcon(false);
      localStorage.removeItem('pwa-install-dismissed');
      toast('🎉 CityBus Go installed successfully!');
    };

    // Listen for online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      toast('📶 Back online!');
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast('📴 You\'re offline. Some features may be limited.');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
          setServiceWorkerRegistration(registration);

          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setIsUpdateAvailable(true);
                  toast('🔄 App update available!');
                }
              });
            }
          });
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);  
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        toast('🚀 Installing CityBus Go...');
      } else {
        console.log('User dismissed the install prompt');
        setInstallPromptDismissed(true);
        localStorage.setItem('pwa-install-dismissed', 'true');
      }
      
      setDeferredPrompt(null);
      setShowInstallIcon(false);
    } catch (error) {
      console.error('Install prompt failed:', error);
    }
  };

  const dismissInstallIcon = () => {
    setShowInstallIcon(false);
    setInstallPromptDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
    toast('You can always install CityBus Go from your browser menu later!');
  };

  const handleUpdateClick = () => {
    if (serviceWorkerRegistration?.waiting) {
      serviceWorkerRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  const shareApp = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'CityBus Go',
          text: 'Track buses in real-time with CityBus Go!',
          url: window.location.href
        });
      } catch (error) {
        console.log('Share failed:', error);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast('🔗 App link copied to clipboard!');
      } catch (error) {
        console.log('Copy failed:', error);
      }
    }
  };

  return (
    <>
      {/* Offline Status */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white text-center py-2 text-sm">
          <WifiOff className="w-4 h-4 inline mr-2" />
          You're offline. Some features may be limited.
        </div>
      )}

      {/* Update Available Banner */}
      {isUpdateAvailable && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-blue-500 text-white text-center py-2 text-sm">
          <RefreshCw className="w-4 h-4 inline mr-2" />
          New version available!
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-2 text-white hover:text-blue-100"
            onClick={handleUpdateClick}
          >
            Update
          </Button>
        </div>
      )}

      {/* Dedicated Install Icon - Top Left */}
      {showInstallIcon && deferredPrompt && !isInstalled && !installPromptDismissed && (
        <div className="fixed top-4 left-4 z-50">
          <Card className="p-2 shadow-lg border-2 border-blue-500 bg-white">
            <div className="flex items-center gap-2">
              <Button
                onClick={handleInstallClick}
                size="sm"
                className="bg-blue-600 text-white hover:bg-blue-700 px-3"
              >
                <Smartphone className="w-4 h-4 mr-1" />
                Install App
              </Button>
              <Button
                onClick={dismissInstallIcon}
                variant="ghost"
                size="sm"
                className="p-1 h-8 w-8 text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Fallback Install Prompt (Bottom Banner) - Only shows if icon was dismissed */}
      {deferredPrompt && !isInstalled && installPromptDismissed && (
        <Card className="fixed bottom-4 left-4 right-4 z-40 p-4 mx-auto max-w-sm bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-medium">Install CityBus Go</h3>
              <p className="text-sm opacity-90">Get the full app experience!</p>
            </div>
            <Button
              onClick={handleInstallClick}
              size="sm"
              className="bg-white text-blue-600 hover:bg-gray-100 ml-4"
            >
              <Download className="w-4 h-4 mr-1" />
              Install
            </Button>
          </div>
        </Card>
      )}

      {/* Connection Status Indicator */}
      <div className="fixed top-4 right-4 z-30">
        <Badge 
          variant={isOnline ? "default" : "destructive"}
          className="flex items-center gap-1"
        >
          {isOnline ? (
            <>
              <Wifi className="w-3 h-3" />
              Online
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3" />
              Offline
            </>
          )}
        </Badge>
      </div>
    </>
  );
}