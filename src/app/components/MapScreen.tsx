import React, { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, MapPin, Navigation, Wifi, WifiOff, RotateCcw, Clock, Home, Target } from 'lucide-react';
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
  const [routePath, setRoutePath] = useState<any>(null);
  const [routeMarkers, setRouteMarkers] = useState<any[]>([]);
  const [etaEnabled, setEtaEnabled] = useState(false);
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

  // Get route coordinates based on bus stops
  const getRouteCoordinates = (stops: string[]) => {
    // Mock coordinates for demo purposes - in a real app you'd geocode the stops
    const mockCoordinates: { [key: string]: [number, number] } = {
      'central station': [20.5937, 78.9629],
      'mall road': [20.5950, 78.9650],
      'university gate': [20.5970, 78.9680],
      'city hospital': [20.5990, 78.9700],
      'bus stand': [20.6010, 78.9720],
      'market square': [20.6030, 78.9740],
      'railway crossing': [20.6050, 78.9760],
      'old city': [20.6070, 78.9780],
      'new town': [20.6090, 78.9800],
      'airport': [20.6110, 78.9820]
    };

    // Generate coordinates for route stops or use mock ones
    return stops.map((stop, index) => {
      const normalizedStop = stop.toLowerCase().trim();
      if (mockCoordinates[normalizedStop]) {
        return mockCoordinates[normalizedStop];
      }
      // Generate approximate coordinates if not found
      return [20.5937 + (index * 0.002), 78.9629 + (index * 0.003)] as [number, number];
    });
  };

  // Draw route path on map
  const drawRoutePath = () => {
    if (!map || !trackingBus || !window.L) return;

    // Clear existing route elements
    if (routePath) {
      map.removeLayer(routePath);
    }
    routeMarkers.forEach(marker => map.removeLayer(marker));
    setRouteMarkers([]);

    // Get route configuration
    const routeConfigKey = Object.keys(localStorage).find(key => 
      key.startsWith('route_config_') && 
      localStorage.getItem(key) && 
      JSON.parse(localStorage.getItem(key) || '{}').routeId === trackingBus
    );

    if (routeConfigKey) {
      const routeConfig = JSON.parse(localStorage.getItem(routeConfigKey) || '{}');
      const coordinates = getRouteCoordinates(routeConfig.stops);
      
      // Draw new route path
      const newRoutePath = window.L.polyline(coordinates, {
        color: '#4f46e5',
        weight: 4,
        opacity: 0.8,
        dashArray: '10, 5'
      }).addTo(map);

      // Add stop markers
      const newRouteMarkers: any[] = [];
      coordinates.forEach((coord, index) => {
        const stopIcon = window.L.divIcon({
          html: `
            <div class="flex items-center justify-center w-7 h-7 bg-blue-500 text-white rounded-full border-2 border-white shadow-lg text-xs font-bold">
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
        
        newRouteMarkers.push(marker);
      });

      setRoutePath(newRoutePath);
      setRouteMarkers(newRouteMarkers);
      
      // Fit map to show entire route if no bus location
      if (!isOnline) {
        map.fitBounds(newRoutePath.getBounds().pad(0.1));
      }
    }
  };

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
      } else if (busMarker) {
        busMarker.setLatLng([lat, lng]);
      }

      // Center on bus if it's online, but keep route visible
      if (routePath && busMarker) {
        const group = window.L.featureGroup([busMarker, routePath]);
        map.fitBounds(group.getBounds().pad(0.1));
      } else {
        map.setView([lat, lng], 16);
      }
    } else {
      setIsOnline(false);
      setLastUpdate(null);
    }
  };

  // Start location updates and draw route
  useEffect(() => {
    if (map && trackingBus) {
      drawRoutePath(); // Draw route first
      updateBusLocation(); // Then update bus location
      updateIntervalRef.current = setInterval(updateBusLocation, 5000);
    }

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [map, trackingBus]);

  const calculateETA = (busLat: number, busLng: number, userLat: number, userLng: number): string => {
    // Calculate distance using Haversine formula
    const R = 6371; // Earth's radius in kilometers
    const dLat = (userLat - busLat) * Math.PI / 180;
    const dLon = (userLng - busLng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(busLat * Math.PI / 180) * Math.cos(userLat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in km

    // Estimate travel time (assuming average city bus speed of 25 km/h)
    const averageSpeed = 25; // km/h
    const timeInHours = distance / averageSpeed;
    const timeInMinutes = Math.round(timeInHours * 60);

    if (timeInMinutes < 1) {
      return "Arriving now";
    } else if (timeInMinutes === 1) {
      return "1 minute";
    } else {
      return `${timeInMinutes} minutes`;
    }
  };

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

          // Get current bus location
          const locationData = localStorage.getItem(`bus_location_${trackingBus}`);
          if (locationData && map && window.L) {
            const busLocation: LocationData = JSON.parse(locationData);
            
            // Calculate and show ETA
            const etaTime = calculateETA(busLocation.lat, busLocation.lng, latitude, longitude);
            setEta(etaTime);

            // Add user marker to map
            if (!userMarker) {
              const userIcon = window.L.divIcon({
                html: `
                  <div class="flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full shadow-lg border-2 border-white">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                  </div>
                `,
                className: 'user-marker',
                iconSize: [32, 32],
                iconAnchor: [16, 32],
              });

              const marker = window.L.marker([latitude, longitude], { icon: userIcon }).addTo(map);
              marker.bindPopup('Your Location');
              setUserMarker(marker);
            } else {
              userMarker.setLatLng([latitude, longitude]);
            }

            // Fit map to show both markers and route
            if (busMarker && routePath) {
              const group = window.L.featureGroup([busMarker, userMarker, routePath]);
              map.fitBounds(group.getBounds().pad(0.1));
            }
          }
          setShowingEta(false);
        },
        (error) => {
          console.error('Error getting user location:', error);
          alert('Unable to get your location. Please make sure location services are enabled.');
          setShowingEta(false);
          setEtaEnabled(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      // Disable ETA
      setEtaEnabled(false);
      setEta(null);
      if (userMarker) {
        map.removeLayer(userMarker);
        setUserMarker(null);
      }
      setUserLocation(null);
    }
  };

  return (
    <div className="h-full flex flex-col relative">
      
      {/* Header Overlay - Fixed position with higher z-index */}
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
            <Button 
              variant="ghost" 
              size="sm"
              onClick={updateBusLocation}
              className="p-2 hover:bg-gray-100 rounded-full bg-white shadow-lg border"
            >
              <RotateCcw size={20} />
            </Button>
          </div>
        </div>
        
        <Card className="bg-white shadow-lg border">
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base">Bus #{trackingBus}</h2>
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
              <span className="text-muted-foreground">
                {isOnline ? "Live tracking active" : "Showing route only"}
              </span>
              {lastUpdate && (
                <span className="text-xs text-muted-foreground">
                  {lastUpdate.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Map Container with padding for header and footer */}
      <div className="flex-1 relative pt-32 pb-20">
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

      {/* ETA Display */}
      {eta && (
        <motion.div 
          className="fixed top-36 left-4 right-4 z-40 max-w-sm mx-auto"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-green-100 border-green-200 shadow-lg">
            <div className="p-3 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Clock className="text-green-600" size={18} />
                <h3 className="text-green-800 text-sm font-medium">ETA</h3>
              </div>
              <p className="text-green-900 font-semibold text-lg">{eta}</p>
              <p className="text-xs text-green-700 mt-1">
                Based on current location
              </p>
            </div>
          </Card>
        </motion.div>
      )}

      {/* ETA Toggle Button - Always Visible with proper z-index */}
      <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto pointer-events-none">
        <div className="flex gap-2 pointer-events-auto">
          <Button 
            onClick={handleToggleETA}
            disabled={showingEta}
            className={`flex-1 ${etaEnabled 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-blue-600 hover:bg-blue-700'
            } text-white shadow-lg border-2 border-white`}
          >
            {showingEta ? (
              <>
                <Clock className="mr-2 animate-spin" size={18} />
                Getting ETA...
              </>
            ) : etaEnabled ? (
              <>
                <Target className="mr-2" size={18} />
                ETA: ON  
              </>
            ) : (
              <>
                <Target className="mr-2" size={18} />
                Show ETA
              </>
            )}
          </Button>
          
          {etaEnabled && (
            <Button 
              onClick={() => {
                setEtaEnabled(false);
                setEta(null);
                if (userMarker) {
                  map.removeLayer(userMarker);
                  setUserMarker(null);
                }
              }}
              variant="outline"
              className="bg-white shadow-lg border-2 border-gray-300"
            >
              OFF
            </Button>
          )}
        </div>
        
        <div className="text-xs text-center text-gray-600 mt-2 bg-white/90 backdrop-blur-sm rounded px-3 py-1 shadow-md border pointer-events-auto">
          {isOnline 
            ? "🟢 Live tracking • Route with stops shown" 
            : "🔴 Offline • Route with stops shown"
          }
        </div>
      </div>
    </div>
  );
}