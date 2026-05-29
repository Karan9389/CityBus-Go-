import React, { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, MapPin, Navigation, Wifi, WifiOff, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';
import type { Screen, LocationData } from '../App';

// Leaflet types and imports
declare global {
  interface Window {
    L: any;
  }
}

interface MapScreenProps {
  trackingBus: string;
  onShowScreen: (screen: Screen) => void;
}

export default function MapScreen({ trackingBus, onShowScreen }: MapScreenProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [busMarker, setBusMarker] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load Leaflet dynamically
  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window !== 'undefined' && !window.L) {
        // Load CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        // Load JS
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        
        return new Promise<void>((resolve) => {
          script.onload = () => resolve();
          document.head.appendChild(script);
        });
      }
    };

    loadLeaflet().then(() => {
      if (mapRef.current && window.L && !map) {
        // Initialize map
        const newMap = window.L.map(mapRef.current, {
          zoomControl: false
        }).setView([20.5937, 78.9629], 5);

        // Add tile layer
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors'
        }).addTo(newMap);

        // Add zoom control to bottom right
        window.L.control.zoom({
          position: 'bottomright'
        }).addTo(newMap);

        setMap(newMap);
      }
    });

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [map]);

  // Update bus location
  const updateBusLocation = () => {
    if (!map || !trackingBus) return;

    const locationData = localStorage.getItem(`bus_location_${trackingBus}`);
    
    if (locationData) {
      const location: LocationData = JSON.parse(locationData);
      const { lat, lng, timestamp } = location;
      
      // Check if location is recent (within 5 minutes)
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      const isRecent = timestamp > fiveMinutesAgo;
      
      setIsOnline(isRecent);
      setLastUpdate(new Date(timestamp));

      // Create or update marker
      if (!busMarker && window.L) {
        // Custom bus icon
        const busIcon = window.L.divIcon({
          html: `
            <div class="flex items-center justify-center w-8 h-8 bg-indigo-600 text-white rounded-full shadow-lg">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.9 22H5.1C3.94 22 3 21.06 3 19.9V6.1C3 4.94 3.94 4 5.1 4h13.8C20.06 4 21 4.94 21 6.1v13.8c0 1.16-.94 2.1-2.1 2.1zM12 2c-4.42 0-8 .5-8 4v10c0 1.1.9 2 2 2h1c.55 0 1-.45 1-1v-4c0-.55-.45-1-1-1H6V9h12v2h-1c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h1c1.1 0 2-.9 2-2V6c0-3.5-3.58-4-8-4zM7.5 17.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5S8.33 17.5 7.5 17.5zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
              </svg>
            </div>
          `,
          className: 'bus-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        });

        const marker = window.L.marker([lat, lng], { icon: busIcon }).addTo(map);
        setBusMarker(marker);
      } else if (busMarker) {
        busMarker.setLatLng([lat, lng]);
      }

      // Center map on bus location
      map.setView([lat, lng], 16);
    } else {
      setIsOnline(false);
      setLastUpdate(null);
    }
  };

  // Start location updates
  useEffect(() => {
    if (map && trackingBus) {
      updateBusLocation(); // Initial update
      updateIntervalRef.current = setInterval(updateBusLocation, 5000);
    }

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [map, trackingBus]);

  return (
    <div className="h-full flex flex-col relative">
      
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-white via-white/90 to-transparent p-4">
        <div className="flex items-center justify-between mb-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onShowScreen('busList')}
            className="p-2 hover:bg-gray-100 rounded-full bg-white/80 backdrop-blur-sm"
          >
            <ArrowLeft size={20} />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={updateBusLocation}
            className="p-2 hover:bg-gray-100 rounded-full bg-white/80 backdrop-blur-sm"
          >
            <RotateCcw size={20} />
          </Button>
        </div>
        
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h2>Live Bus Location</h2>
              <Badge 
                variant={isOnline ? "default" : "secondary"} 
                className={isOnline ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}
              >
                {isOnline ? (
                  <>
                    <Wifi size={10} className="mr-1" />
                    Live
                  </>
                ) : (
                  <>
                    <WifiOff size={10} className="mr-1" />
                    Offline
                  </>
                )}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Bus #{trackingBus}</span>
              {lastUpdate && (
                <span className="text-xs text-muted-foreground">
                  Updated: {lastUpdate.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <div 
          ref={mapRef} 
          className="w-full h-full"
          style={{ minHeight: '400px' }}
        />

        {/* No Location Message */}
        {!isOnline && !lastUpdate && (
          <motion.div 
            className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
          >
            <Card className="max-w-sm mx-4 text-center">
              <div className="p-6">
                <div className="bg-amber-100 rounded-full p-4 w-fit mx-auto mb-4">
                  <MapPin className="text-amber-600" size={32} />
                </div>
                <h3 className="mb-2">Location Not Available</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  The driver is not currently sharing their location. Please check back later or try refreshing.
                </p>
                <Button size="sm" onClick={updateBusLocation}>
                  <RotateCcw size={14} className="mr-1" />
                  Refresh
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 bg-white border-t">
        <p className="text-xs text-center text-muted-foreground">
          {isOnline 
            ? "🟢 Map updates every 5 seconds while bus is online" 
            : "🔴 Bus is currently offline - location updates paused"
          }
        </p>
      </div>
    </div>
  );
}