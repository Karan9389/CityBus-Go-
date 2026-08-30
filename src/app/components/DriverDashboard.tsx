import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { MapPin, Navigation, Square, LogOut, User, Bus, Clock, Route, Edit } from 'lucide-react';
import { motion } from 'motion/react';
import type { Screen, Driver, RouteConfig } from '../App';
import { api } from '../services/api';
import { socketService } from '../services/socket';

interface DriverDashboardProps {
  loggedInDriver: Driver | null;
  onShowScreen: (screen: Screen) => void;
  onLogout: () => void;
  onGoHome?: () => void;
}

export default function DriverDashboard({ loggedInDriver, onShowScreen, onLogout }: DriverDashboardProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [locationWatcherId, setLocationWatcherId] = useState<number | null>(null);
  const [routeConfig, setRouteConfig] = useState<RouteConfig | null>(null);
  const [driverProfile, setDriverProfile] = useState<Driver | null>(loggedInDriver);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await api.getDriverProfile();
        if (data.driver) {
          setDriverProfile(data.driver);
        }
        if (data.routeConfig) {
          setRouteConfig(data.routeConfig);
        }
      } catch (err) {
        console.error('Error loading driver profile:', err);
      }
    }
    loadProfile();
  }, []);

  // Cleanup geolocation watcher on unmount
  useEffect(() => {
    return () => {
      if (locationWatcherId !== null) {
        navigator.geolocation.clearWatch(locationWatcherId);
      }
    };
  }, [locationWatcherId]);

  const startSharingLocation = () => {
    if (!routeConfig || !routeConfig.routeId) {
      alert("Please configure a route before starting live tracking.");
      return;
    }

    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your device or browser.");
      return;
    }

    // Notify backend via socket
    socketService.startDriverTracking(routeConfig.routeId);

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        socketService.updateDriverLocation({
          routeId: routeConfig.routeId,
          lat: latitude,
          lng: longitude,
        });
      },
      (error) => {
        console.error("Error getting live position:", error);
        alert(`Location tracking error: ${error.message}. Please verify GPS and permissions.`);
        stopSharingLocation();
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );
    setLocationWatcherId(watchId);
    setIsSharing(true);
  };

  const stopSharingLocation = () => {
    if (routeConfig && routeConfig.routeId) {
      socketService.stopDriverTracking(routeConfig.routeId);
    }
    if (locationWatcherId !== null) {
      navigator.geolocation.clearWatch(locationWatcherId);
      setLocationWatcherId(null);
    }
    setIsSharing(false);
  };

  const toggleLocationSharing = () => {
    if (isSharing) {
      stopSharingLocation();
    } else {
      startSharingLocation();
    }
  };

  const handleLogout = () => {
    stopSharingLocation();
    localStorage.removeItem('driver_token');
    onLogout();
  };

  const activeDriver = driverProfile || loggedInDriver;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onShowScreen('driverConfig')}
          className="flex items-center gap-2 text-xs"
        >
          <Route size={16} />
          Edit Route
        </Button>
        <h1 className="font-semibold text-base">Driver Dashboard</h1>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={handleLogout}
          className="p-2 hover:bg-gray-100 rounded-full text-red-600"
        >
          <LogOut size={18} />
        </Button>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {/* Welcome Section */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative inline-block">
            <Avatar className="mx-auto mb-4 w-16 h-16">
              <AvatarFallback className="bg-indigo-100 text-indigo-600 font-bold text-xl">
                {activeDriver?.name ? activeDriver.name.charAt(0).toUpperCase() : 'D'}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onShowScreen('driverEdit')}
              className="absolute -bottom-1 -right-1 p-1 hover:bg-gray-100 rounded-full bg-white shadow border h-7 w-7"
            >
              <Edit size={12} className="text-gray-600" />
            </Button>
          </div>

          <h2 className="font-bold text-lg">{activeDriver?.name || 'Driver'}</h2>
          <p className="text-muted-foreground text-sm">{activeDriver?.phone || ''}</p>
          
          <Badge 
            variant={isSharing ? "default" : "secondary"} 
            className={`mt-2 ${isSharing ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
          >
            {isSharing ? "🟢 Live Tracking Active" : "⚪ Offline"}
          </Badge>
        </motion.div>

        {/* Location Toggle Button */}
        <motion.div 
          className="mb-8"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Button
            onClick={toggleLocationSharing}
            className={`w-full h-16 text-lg font-semibold rounded-2xl shadow-lg transition-all ${
              isSharing 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {isSharing ? (
              <div className="flex items-center gap-3">
                <Square className="animate-pulse" size={24} />
                Stop Location Sharing
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Navigation size={24} />
                Start Location Sharing
              </div>
            )}
          </Button>
        </motion.div>

        {/* Route Information */}
        {routeConfig ? (
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Bus size={18} />
                  Assigned Route Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center text-sm border-b pb-2">
                  <span className="text-muted-foreground">Bus / Route Number:</span>
                  <span className="font-semibold text-indigo-600">{routeConfig.routeId}</span>
                </div>

                <div className="flex justify-between items-center text-sm border-b pb-2">
                  <span className="text-muted-foreground">Schedule:</span>
                  <span className="font-medium flex items-center gap-1">
                    <Clock size={14} />
                    {routeConfig.startTime} - {routeConfig.endTime}
                  </span>
                </div>

                <div>
                  <span className="text-muted-foreground text-sm flex items-center gap-1 mb-2">
                    <MapPin size={14} />
                    Stops ({routeConfig.stops.length}):
                  </span>
                  <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                    {routeConfig.stops.map((stop, index) => (
                      <Badge key={index} variant="secondary" className="capitalize text-xs">
                        {index + 1}. {stop}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <Card className="text-center p-6">
            <p className="text-muted-foreground text-sm mb-4">No route configured yet.</p>
            <Button onClick={() => onShowScreen('driverConfig')} className="bg-indigo-600 text-white">
              Configure Route Now
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}