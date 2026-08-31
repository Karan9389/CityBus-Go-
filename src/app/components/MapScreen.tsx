import React, { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, MapPin, Navigation, Wifi, WifiOff, Clock, Home, Target } from 'lucide-react';
import { motion } from 'motion/react';
import type { Screen, RouteConfig } from '../App';
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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const busMarkerRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const routePathRef = useRef<any>(null);
  const routeMarkersRef = useRef<any[]>([]);
  const userWatchIdRef = useRef<number | null>(null);

  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [eta, setEta] = useState<string | null>(null);
  const [showingEta, setShowingEta] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [busLocation, setBusLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [routeConfig, setRouteConfig] = useState<RouteConfig | null>(null);
  const [etaEnabled, setEtaEnabled] = useState(false);

  // Initialize Leaflet Map
  useEffect(() => {
    let isCancelled = false;

    const initMap = async () => {
      // Ensure Leaflet JS is available
      if (typeof window !== 'undefined' && !window.L) {
        const existingScript = document.querySelector('script[src*="leaflet.js"]');
        if (!existingScript) {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.async = true;
          document.head.appendChild(script);

          await new Promise<void>((resolve) => {
            script.onload = () => resolve();
            script.onerror = () => resolve();
          });
        } else {
          // If script tag already exists in DOM, wait for window.L to finish initializing
          let attempts = 0;
          while (!window.L && attempts < 30) {
            await new Promise((resolve) => setTimeout(resolve, 100));
            attempts++;
          }
        }
      }

      if (isCancelled || !mapContainerRef.current || !window.L) return;

      // Clean up previous instance if any
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      if (mapContainerRef.current && (mapContainerRef.current as any)._leaflet_id) {
        (mapContainerRef.current as any)._leaflet_id = null;
      }

      // Initialize map instance
      const map = window.L.map(mapContainerRef.current, {
        zoomControl: false,
      }).setView([20.5937, 78.9629], 6);

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      window.L.control.zoom({
        position: 'bottomright',
      }).addTo(map);

      mapInstanceRef.current = map;
    };

    initMap();

    return () => {
      isCancelled = true;
      if (userWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(userWatchIdRef.current);
        userWatchIdRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Fetch route configuration & subscribe to real-time socket events
  useEffect(() => {
    if (!trackingBus) return;

    let isSubscribed = true;

    async function fetchBusDetails() {
      try {
        const details = await api.getBusByRouteId(trackingBus);
        if (isSubscribed && details) {
          setRouteConfig(details);
          setIsOnline(!!details.isLive);
          if (details.lastLocation && typeof details.lastLocation.lat === 'number' && typeof details.lastLocation.lng === 'number') {
            setBusLocation({ lat: details.lastLocation.lat, lng: details.lastLocation.lng });
            setLastUpdate(new Date(details.lastLocation.updatedAt || Date.now()));
          }
        }
      } catch (err) {
        console.error('Error fetching bus details:', err);
      }
    }

    fetchBusDetails();

    socketService.joinCommuterTracking(trackingBus);

    const unsubscribeLocation = socketService.onBusLocationChange((data) => {
      if (isSubscribed && data.routeId === trackingBus) {
        setBusLocation({ lat: data.lat, lng: data.lng });
        setIsOnline(data.isLive !== false);
        setLastUpdate(new Date(data.timestamp || Date.now()));
      }
    });

    const unsubscribeStatus = socketService.onBusStatusChange((data) => {
      if (isSubscribed && data.routeId === trackingBus) {
        setIsOnline(data.isLive);
      }
    });

    return () => {
      isSubscribed = false;
      socketService.leaveCommuterTracking(trackingBus);
      unsubscribeLocation();
      unsubscribeStatus();
    };
  }, [trackingBus]);

  // Update Route Polyline and Stop Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.L || !routeConfig || !Array.isArray(routeConfig.stops) || routeConfig.stops.length === 0) return;

    // Remove old route layer & markers
    if (routePathRef.current) {
      map.removeLayer(routePathRef.current);
      routePathRef.current = null;
    }
    routeMarkersRef.current.forEach((m) => map.removeLayer(m));
    routeMarkersRef.current = [];

    // Approximate stop coordinate spacing based on initial center
    const baseLat = busLocation ? busLocation.lat : (routeConfig.lastLocation?.lat || 20.5937);
    const baseLng = busLocation ? busLocation.lng : (routeConfig.lastLocation?.lng || 78.9629);

    const coordinates: [number, number][] = routeConfig.stops.map((_, index) => {
      return [baseLat + (index - Math.floor(routeConfig.stops.length / 2)) * 0.012, baseLng + (index - Math.floor(routeConfig.stops.length / 2)) * 0.015];
    });

    if (coordinates.length > 0) {
      const newRoutePath = window.L.polyline(coordinates, {
        color: '#4f46e5',
        weight: 4,
        opacity: 0.8,
        dashArray: '8, 6',
      }).addTo(map);
      routePathRef.current = newRoutePath;

      const newMarkers: any[] = [];
      coordinates.forEach((coord, index) => {
        const stopIcon = window.L.divIcon({
          html: `
            <div class="flex items-center justify-center w-6 h-6 bg-indigo-600 text-white rounded-full border-2 border-white shadow text-xs font-bold">
              ${index + 1}
            </div>
          `,
          className: 'stop-marker',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = window.L.marker(coord, { icon: stopIcon })
          .addTo(map)
          .bindPopup(`<b>Stop ${index + 1}:</b> ${routeConfig.stops[index]}`);
        newMarkers.push(marker);
      });
      routeMarkersRef.current = newMarkers;

      if (!busLocation) {
        map.fitBounds(newRoutePath.getBounds().pad(0.3));
      }
    }
  }, [routeConfig]);

  // Update Live Bus Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.L || !busLocation) return;

    const { lat, lng } = busLocation;

    if (!busMarkerRef.current) {
      const busIcon = window.L.divIcon({
        html: `
          <div class="flex items-center justify-center w-10 h-10 bg-indigo-600 text-white rounded-full shadow-xl border-2 border-white animate-pulse">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.9 22H5.1C3.94 22 3 21.06 3 19.9V6.1C3 4.94 3.94 4 5.1 4h13.8C20.06 4 21 4.94 21 6.1v13.8c0 1.16-.94 2.1-2.1 2.1zM12 2c-4.42 0-8 .5-8 4v10c0 1.1.9 2 2 2h1c.55 0 1-.45 1-1v-4c0-.55-.45-1-1-1H6V9h12v2h-1c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h1c1.1 0 2-.9 2-2V6c0-3.5-3.58-4-8-4zM7.5 17.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5S8.33 17.5 7.5 17.5zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
            </svg>
          </div>
        `,
        className: 'bus-marker',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const marker = window.L.marker([lat, lng], { icon: busIcon }).addTo(map);
      marker.bindPopup(`<b>Bus #${trackingBus}</b><br/>Live Location`);
      busMarkerRef.current = marker;
      map.setView([lat, lng], 15);
    } else {
      busMarkerRef.current.setLatLng([lat, lng]);
      map.panTo([lat, lng]);
    }
  }, [busLocation, trackingBus]);

  // Update Commuter User Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.L || !userLocation) return;

    const { lat, lng } = userLocation;

    if (!userMarkerRef.current) {
      const userIcon = window.L.divIcon({
        html: `
          <div class="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full shadow-lg border-2 border-white animate-pulse">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="8"/>
            </svg>
          </div>
        `,
        className: 'user-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = window.L.marker([lat, lng], { icon: userIcon }).addTo(map);
      marker.bindPopup('<b>Your Current Location</b>');
      userMarkerRef.current = marker;
    } else {
      userMarkerRef.current.setLatLng([lat, lng]);
    }
  }, [userLocation]);

  // Recalculate ETA dynamically when bus or user coordinates update
  useEffect(() => {
    if (etaEnabled && userLocation && busLocation) {
      const dLat = (userLocation.lat - busLocation.lat) * 111; // approx km
      const dLng = (userLocation.lng - busLocation.lng) * 111;
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);
      const timeMin = Math.round((dist / 25) * 60);
      const distFormatted = dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`;

      setEta(timeMin <= 1 ? `Arriving now (< 1 min • ${distFormatted})` : `~ ${timeMin} mins (${distFormatted})`);
    }
  }, [busLocation, userLocation, etaEnabled]);

  const handleToggleETA = () => {
    if (!etaEnabled) {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser.');
        return;
      }

      setShowingEta(true);

      // Start continuous position watching
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setShowingEta(false);
          setEtaEnabled(true);

          if (busLocation) {
            const dLat = (latitude - busLocation.lat) * 111;
            const dLng = (longitude - busLocation.lng) * 111;
            const dist = Math.sqrt(dLat * dLat + dLng * dLng);
            const timeMin = Math.round((dist / 25) * 60);
            const distFormatted = dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`;
            setEta(timeMin <= 1 ? `Arriving now (< 1 min • ${distFormatted})` : `~ ${timeMin} mins (${distFormatted})`);
          } else {
            setEta('Waiting for bus live signal...');
          }
        },
        (error) => {
          console.error('Error getting user location:', error);
          setShowingEta(false);
          setEtaEnabled(false);
          alert('Unable to retrieve your location. Please check location permissions.');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );

      userWatchIdRef.current = watchId;
    } else {
      if (userWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(userWatchIdRef.current);
        userWatchIdRef.current = null;
      }
      if (userMarkerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(userMarkerRef.current);
        userMarkerRef.current = null;
      }
      setEtaEnabled(false);
      setEta(null);
      setUserLocation(null);
    }
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-white via-white/95 to-transparent p-4">
        <div className="flex items-center justify-between mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onGoBack}
            className="p-2 hover:bg-gray-100 rounded-full bg-white shadow-lg border"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onGoHome}
            className="p-2 hover:bg-gray-100 rounded-full bg-white shadow-lg border"
            aria-label="Go home"
          >
            <Home size={20} />
          </Button>
        </div>

        <Card className="bg-white shadow-lg border">
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold">Bus #{trackingBus}</h2>
              <Badge
                variant={isOnline ? 'default' : 'secondary'}
                className={isOnline ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}
              >
                {isOnline ? (
                  <>
                    <Wifi size={10} className="mr-1" />
                    Live Tracking
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
              <span>{isOnline ? 'Receiving live telemetry' : 'Route scheduled info'}</span>
              {lastUpdate && <span>Updated {lastUpdate.toLocaleTimeString()}</span>}
            </div>
          </div>
        </Card>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative w-full h-full pt-32 pb-20">
        <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '400px' }} />
      </div>

      {/* ETA Display */}
      {eta && (
        <motion.div
          className="absolute top-36 left-4 right-4 z-30"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-green-100 border-green-200 shadow-lg">
            <div className="p-3 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Clock className="text-green-600" size={18} />
                <h3 className="text-green-800 text-xs font-semibold uppercase tracking-wider">Estimated Arrival Time</h3>
              </div>
              <p className="text-green-900 font-bold text-base">{eta}</p>
            </div>
          </Card>
        </motion.div>
      )}

      {/* ETA Toggle Button */}
      <div className="absolute bottom-4 left-4 right-4 z-30">
        <div className="flex gap-2">
          <Button
            onClick={handleToggleETA}
            disabled={showingEta}
            className={`flex-1 ${
              etaEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'
            } text-white shadow-lg border-2 border-white h-12`}
          >
            <Target className="mr-2" size={18} />
            {showingEta ? 'Acquiring GPS Signal...' : etaEnabled ? 'Disable Live ETA' : 'Calculate Live ETA'}
          </Button>
        </div>
      </div>
    </div>
  );
}