import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { MapPin, Navigation, Square, LogOut, User, Bus, Clock, Route, Edit } from 'lucide-react';
import { motion } from 'motion/react';
import type { Screen, Driver, RouteConfig } from '../App';
import { getDriverAuth } from '../utils/auth';
import { emitDriverLocation, emitStopTracking } from '../../services/socketService';

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

  useEffect(() => {
    const fetchRouteConfig = async () => {
      const auth = getDriverAuth();
      if (auth?.token) {
        try {
          const res = await fetch('http://localhost:5000/api/driver/route', {
            headers: { 'Authorization': `Bearer ${auth.token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data && data.routeId) {
              setRouteConfig({
                routeId: data.routeId,
                startTime: data.startTime,
                endTime: data.endTime,
                stops: data.stops
              });
              if (loggedInDriver) {
                localStorage.setItem(`route_config_${loggedInDriver.phone}`, JSON.stringify(data));
              }
              return;
            }
          }
        } catch (err) {
          console.warn("Could not fetch remote route config from MongoDB:", err);
        }
      }

      if (loggedInDriver) {
        const config = localStorage.getItem(`route_config_${loggedInDriver.phone}`);
        if (config) {
          setRouteConfig(JSON.parse(config));
        }
      }
    };

    fetchRouteConfig();
  }, [loggedInDriver]);

  const startSharingLocation = () => {
    if (!navigator.geolocation || !routeConfig) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed, heading } = position.coords;
        const timestamp = position.timestamp || Date.now();

        const locationData = {
          routeId: routeConfig.routeId,
          lat: latitude,
          lng: longitude,
          speed: speed || 0,
          heading: heading || 0,
          timestamp: timestamp
        };

        // Stream via WebSockets to backend server (which updates MongoDB)
        emitDriverLocation(locationData);

        // Cache locally for offline fallback
        localStorage.setItem(`bus_location_${routeConfig.routeId}`, JSON.stringify({
          lat: latitude,
          lng: longitude,
          timestamp
        }));
      },
      (error) => {
        console.error("Error getting driver GPS location:", error);
        setIsSharing(false);
        setLocationWatcherId(null);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    setLocationWatcherId(watchId);
    setIsSharing(true);
  };

  const stopSharingLocation = () => {
    if (locationWatcherId !== null) {
      navigator.geolocation.clearWatch(locationWatcherId);
      setLocationWatcherId(null);
      setIsSharing(false);
      if (routeConfig) {
        emitStopTracking(routeConfig.routeId);
      }
    }
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
    onLogout();
  };

  if (!loggedInDriver || !routeConfig) {
    return null;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onShowScreen('driverConfig')}
          className="flex items-center gap-2"
        >
          <Route size={16} />
          Edit Route
        </Button>
        <h1 className="font-semibold">Driver Dashboard</h1>
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
          <div className="relative">
            <Avatar className="mx-auto mb-4 w-16 h-16">
              <AvatarFallback className="bg-indigo-100 text-indigo-600">
                {loggedInDriver.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onShowScreen('driverEdit')}
              className="absolute top-0 right-0 p-2 hover:bg-gray-100 rounded-full"
            >
              <Edit size={16} />
            </Button>
          </div>
          <h2>Welcome, {loggedInDriver.name}</h2>
          <p className="text-muted-foreground">Ready to start your route</p>
        </motion.div>

      {/* Route Information */}
      <motion.div 
        className="space-y-4 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Bus size={20} />
              Current Route
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Bus Number:</span>
                <Badge variant="secondary" className="font-mono">
                  {routeConfig.routeId}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Schedule:</span>
                <div className="flex items-center gap-1 text-sm">
                  <Clock size={14} />
                  {routeConfig.startTime} - {routeConfig.endTime}
                </div>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-muted-foreground">Stops:</span>
                <div className="text-right text-sm max-w-[180px]">
                  <div className="flex items-center gap-1 mb-1">
                    <Route size={14} />
                    {routeConfig.stops.length} stops
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {routeConfig.stops.slice(0, 2).map(stop => 
                      stop.charAt(0).toUpperCase() + stop.slice(1)
                    ).join(' → ')}
                    {routeConfig.stops.length > 2 && '...'}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Location Status */}
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className={`border-2 ${isSharing ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
          <CardContent className="p-6 text-center">
            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
              isSharing ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              {isSharing ? (
                <Navigation className="text-green-600" size={24} />
              ) : (
                <MapPin className="text-gray-400" size={24} />
              )}
            </div>
            <h3 className="mb-2">Location Sharing</h3>
            <p className={`text-sm mb-4 ${isSharing ? 'text-green-600' : 'text-muted-foreground'}`}>
              Status: {isSharing ? 'ACTIVE' : 'INACTIVE'}
            </p>
            {isSharing && (
              <p className="text-xs text-muted-foreground">
                Your location is being shared with passengers
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Actions */}
      <motion.div 
        className="flex-1 flex flex-col justify-end space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Button 
          onClick={toggleLocationSharing}
          className={`w-full h-14 text-white transition-all duration-300 ${
            isSharing 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isSharing ? (
            <>
              <Square className="mr-2" size={20} />
              Stop Sharing Location
            </>
          ) : (
            <>
              <Navigation className="mr-2" size={20} />
              Start Sharing Location
            </>
          )}
        </Button>

        <Button 
          variant="outline" 
          onClick={() => onShowScreen('driverEdit')}
          className="w-full h-12"
        >
          <Edit className="mr-2" size={18} />
          Edit Profile
        </Button>
      </motion.div>
      </div>
    </div>
  );
}