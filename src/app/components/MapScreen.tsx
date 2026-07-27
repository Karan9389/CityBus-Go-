import React, { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, MapPin, Navigation, Wifi, WifiOff, RotateCcw, Clock, Home, Target } from 'lucide-react';
import { motion } from 'motion/react';
import type { Screen } from '../App';
import { api } from '../services/api';
import { socketService } from '../services/socket';

declare global {
  interface Window {
    L: any;
  }
}

interface MapScreenProps {
  trackingBus: string;
  onShowScreen: (screen: Screen) => void;
  onGoBack: () => void;
  onGoHome: () => void;
}

export default function MapScreen({ trackingBus, onShowScreen, onGoBack, onGoHome }: MapScreenProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [busMarker, setBusMarker] = useState<any>(null);
  const [userMarker, setUserMarker] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [eta, setEta] = useState<string | null>(null);
  const [showingEta, setShowingEta] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [busLocation, setBusLocation] = useState<{lat: number, lng: number} | null>(null);
  const [routeConfig, setRouteConfig] = useState<any>(null);
  const [routePath, setRoutePath] = useState<any>(null);
  const [routeMarkers, setRouteMarkers] = useState<any[]>([]);
  const [etaEnabled, setEtaEnabled] = useState(false);

  // Load Leaflet dynamically
  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window !== 'undefined' && !window.L) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

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
        const newMap = window.L.map(mapRef.current, {
          zoomControl: false
        }).setView([20.5937, 78.9629], 6);

        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors'
        }).addTo(newMap);

        window.L.control.zoom({
          position: 'bottomright'
        }).addTo(newMap);

        setMap(newMap);
      }
    });
  }, [map]);

  // Fetch route config & join socket room
  useEffect(() => {
    if (!trackingBus) return;

    async function fetchBusDetails() {
      try {
        const details = await api.getBusByRouteId(trackingBus);
        if (details) {
          setRouteConfig(details);
          setIsOnline(!!details.isLive);
          if (details.lastLocation && details.lastLocation.lat !== undefined) {
            setBusLocation({ lat: details.lastLocation.lat, lng: details.lastLocation.lng });
            setLastUpdate(new Date(details.lastLocation.updatedAt || Date.now()));
          }
        }
      } catch (err) {
        console.error('Error fetching bus details:', err);
      }
    }

    fetchBusDetails();

    // Join tracking room via socket
    socketService.joinCommuterTracking(trackingBus);

    const unsubscribeLocation = socketService.onBusLocationChange((data) => {
      if (data.routeId === trackingBus) {
        setBusLocation({ lat: data.lat, lng: data.lng });
        setIsOnline(data.isLive !== false);
        setLastUpdate(new Date(data.timestamp || Date.now()));
      }
    });

    const unsubscribeStatus = socketService.onBusStatusChange((data) => {
      if (data.routeId === trackingBus) {
        setIsOnline(data.isLive);
      }
    });

    return () => {
      socketService.leaveCommuterTracking(trackingBus);
      unsubscribeLocation();
      unsubscribeStatus();
    };
  }, [trackingBus]);

  // Draw route path when routeConfig is loaded
  useEffect(() => {
    if (!map || !window.L || !routeConfig || !Array.isArray(routeConfig.stops)) return;

    if (routePath) {
      map.removeLayer(routePath);
    }
    routeMarkers.forEach(m => map.removeLayer(m));
    setRouteMarkers([]);

    // Generate mock/approximate coordinates for stops for display
    const coordinates: [number, number][] = routeConfig.stops.map((_: any, index: number) => {
      return [20.5937 + index * 0.015, 78.9629 + index * 0.02];
    });

    if (coordinates.length > 0) {
      const newRoutePath = window.L.polyline(coordinates, {
        color: '#4f46e5',
        weight: 4,
        opacity: 0.8,
        dashArray: '10, 5'
      }).addTo(map);

      const newMarkers: any[] = [];
      coordinates.forEach((coord, index) => {
        const stopIcon = window.L.divIcon({
          html: `
            <div class="flex items-center justify-center w-7 h-7 bg-blue-600 text-white rounded-full border-2 border-white shadow-lg text-xs font-bold">
              ${index + 1}
            </div>
          `,
          className: 'stop-marker',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = window.L.marker(coord, { icon: stopIcon })
          .addTo(map)
          .bindPopup(`Stop ${index + 1}: ${routeConfig.stops[index]}`);
        newMarkers.push(marker);
      });

      setRoutePath(newRoutePath);
      setRouteMarkers(newMarkers);

      if (!busLocation) {
        map.fitBounds(newRoutePath.getBounds().pad(0.2));
      }
    }
  }, [map, routeConfig]);

  // Update bus marker when location updates
  useEffect(() => {
    if (!map || !window.L || !busLocation) return;

    const { lat, lng } = busLocation;

    if (!busMarker) {
      const busIcon = window.L.divIcon({
        html: `
          <div class="flex items-center justify-center w-10 h-10 bg-indigo-600 text-white rounded-full shadow-lg border-2 border-white animate-pulse">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.9 22H5.1C3.94 22 3 21.06 3 19.9V6.1C3 4.94 3.94 4 5.1 4h13.8C20.06 4 21 4.94 21 6.1v13.8c0 1.16-.94 2.1-2.1 2.1zM12 2c-4.42 0-8 .5-8 4v10c0 1.1.9 2 2 2h1c.55 0 1-.45 1-1v-4c0-.55-.45-1-1-1H6V9h12v2h-1c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h1c1.1 0 2-.9 2-2V6c0-3.5-3.58-4-8-4zM7.5 17.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5S8.33 17.5 7.5 17.5zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
            </svg>
          </div>
        `,
        className: 'bus-marker',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      });

      const marker = window.L.marker([lat, lng], { icon: busIcon }).addTo(map);
      marker.bindPopup(`Bus #${trackingBus} - Live Location`);
      setBusMarker(marker);
      map.setView([lat, lng], 15);
    } else {
      busMarker.setLatLng([lat, lng]);
      map.panTo([lat, lng]);
    }
  }, [map, busLocation]);

  const handleToggleETA = () => {
    if (!etaEnabled) {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by this browser.');
        return;
      }

      setShowingEta(true);
      setEtaEnabled(true);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });

          if (busLocation) {
            // Estimate arrival time
            const dLat = (latitude - busLocation.lat) * 111; // approx km
            const dLng = (longitude - busLocation.lng) * 111;
            const dist = Math.sqrt(dLat * dLat + dLng * dLng);
            const timeMin = Math.round((dist / 25) * 60);

            setEta(timeMin <= 1 ? 'Arriving now' : `${timeMin} minutes`);
          }
          setShowingEta(false);
        },
        (error) => {
          console.error('Error getting user location:', error);
          setShowingEta(false);
          setEtaEnabled(false);
        }
      );
    } else {
      setEtaEnabled(false);
      setEta(null);
    }
  };

  return (
    <div className="h-full flex flex-col relative">
      
      {/* Header Overlay */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-white via-white/95 to-transparent p-4 max-w-sm mx-auto">
        <div className="flex items-center justify-between mb-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onGoBack}
            className="p-2 hover:bg-gray-100 rounded-full bg-white shadow-lg border"
          >
            <ArrowLeft size={20} />
          </Button>
          
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onGoHome}
              className="p-2 hover:bg-gray-100 rounded-full bg-white shadow-lg border"
            >
              <Home size={20} />
            </Button>
          </div>
        </div>
        
        <Card className="bg-white shadow-lg border">
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold">Bus #{trackingBus}</h2>
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
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{isOnline ? "Receiving live location" : "Showing route details"}</span>
              {lastUpdate && (
                <span>Updated {lastUpdate.toLocaleTimeString()}</span>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative pt-32 pb-20">
        <div 
          ref={mapRef} 
          className="w-full h-full"
          style={{ minHeight: '400px' }}
        />
      </div>

      {/* ETA Display */}
      {eta && (
        <motion.div 
          className="fixed top-36 left-4 right-4 z-40 max-w-sm mx-auto"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-green-100 border-green-200 shadow-lg">
            <div className="p-3 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Clock className="text-green-600" size={18} />
                <h3 className="text-green-800 text-sm font-medium">ETA</h3>
              </div>
              <p className="text-green-900 font-semibold text-lg">{eta}</p>
            </div>
          </Card>
        </motion.div>
      )}

      {/* ETA Toggle Button */}
      <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto">
        <div className="flex gap-2">
          <Button 
            onClick={handleToggleETA}
            disabled={showingEta}
            className={`flex-1 ${etaEnabled 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-blue-600 hover:bg-blue-700'
            } text-white shadow-lg border-2 border-white`}
          >
            <Target className="mr-2" size={18} />
            {showingEta ? "Getting ETA..." : etaEnabled ? "ETA: ON" : "Calculate ETA"}
          </Button>
        </div>
      </div>
    </div>
  );
}