import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Textarea } from './ui/textarea';
import { ArrowLeft, User, Phone, Lock, Bus, Clock, MapPin, Save, Home, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import type { Screen, Driver, RouteConfig } from '../App';

interface AdminDriverDetailProps {
  driverId: string;
  onShowScreen: (screen: Screen) => void;
  onGoBack: () => void;
  onShowNotification: (message: string) => void;
  onGoHome: () => void;
}

export default function AdminDriverDetail({ driverId, onShowScreen, onGoBack, onShowNotification, onGoHome }: AdminDriverDetailProps) {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [route, setRoute] = useState<RouteConfig | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: ''
  });
  const [routeData, setRouteData] = useState({
    routeId: '',
    startTime: '',
    endTime: '',
    stops: ['']
  });

  useEffect(() => {
    loadDriverData();
  }, [driverId]);

  const loadDriverData = () => {
    const storedDrivers = localStorage.getItem('registered_drivers');
    if (storedDrivers) {
      const drivers = JSON.parse(storedDrivers);
      const foundDriver = drivers.find((d: Driver) => d.id === driverId);
      if (foundDriver) {
        setDriver(foundDriver);
        setFormData({
          name: foundDriver.name,
          phone: foundDriver.phone,
          password: foundDriver.password
        });
        
        // Load route config
        const routeConfig = localStorage.getItem(`route_config_${foundDriver.phone}`);
        if (routeConfig) {
          const parsedRoute = JSON.parse(routeConfig);
          setRoute(parsedRoute);
          setRouteData({
            routeId: parsedRoute.routeId,
            startTime: parsedRoute.startTime,
            endTime: parsedRoute.endTime,
            stops: parsedRoute.stops.length > 0 ? parsedRoute.stops : ['']
          });
        }
      }
    }
  };

  const handleSave = () => {
    if (!driver) return;

    // Validate form
    if (!formData.name.trim() || !formData.phone.trim() || !formData.password.trim()) {
      onShowNotification('Please fill in all driver details');
      return;
    }

    if (routeData.routeId && (!routeData.startTime || !routeData.endTime || routeData.stops.every(stop => !stop.trim()))) {
      onShowNotification('Please complete all route details');
      return;
    }

    // Update driver
    const storedDrivers = localStorage.getItem('registered_drivers');
    if (storedDrivers) {
      const drivers = JSON.parse(storedDrivers);
      const driverIndex = drivers.findIndex((d: Driver) => d.id === driverId);
      if (driverIndex >= 0) {
        const updatedDriver = {
          ...drivers[driverIndex],
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          password: formData.password.trim()
        };
        
        drivers[driverIndex] = updatedDriver;
        localStorage.setItem('registered_drivers', JSON.stringify(drivers));
        
        // If phone changed, update route config key
        if (driver.phone !== formData.phone) {
          const oldRouteConfig = localStorage.getItem(`route_config_${driver.phone}`);
          if (oldRouteConfig) {
            localStorage.removeItem(`route_config_${driver.phone}`);
            localStorage.setItem(`route_config_${formData.phone}`, oldRouteConfig);
          }
        }

        // Update route if provided
        if (routeData.routeId.trim()) {
          const validStops = routeData.stops.filter(stop => stop.trim());
          const routeConfig: RouteConfig = {
            routeId: routeData.routeId.trim(),
            startTime: routeData.startTime,
            endTime: routeData.endTime,
            stops: validStops
          };
          localStorage.setItem(`route_config_${formData.phone}`, JSON.stringify(routeConfig));
          setRoute(routeConfig);
        }

        setDriver(updatedDriver);
        setIsEditing(false);
        onShowNotification('Driver details updated successfully! ✅');
      }
    }
  };

  const addStop = () => {
    setRouteData(prev => ({
      ...prev,
      stops: [...prev.stops, '']
    }));
  };

  const removeStop = (index: number) => {
    if (routeData.stops.length > 1) {
      setRouteData(prev => ({
        ...prev,
        stops: prev.stops.filter((_, i) => i !== index)
      }));
    }
  };

  const updateStop = (index: number, value: string) => {
    setRouteData(prev => ({
      ...prev,
      stops: prev.stops.map((stop, i) => i === index ? value : stop)
    }));
  };

  if (!driver) {
    return (
      <div className="h-full flex items-center justify-center">
        <p>Driver not found</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onGoBack}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft size={20} />
        </Button>
        <h1 className="font-semibold">Driver Details</h1>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onGoHome}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <Home size={20} />
        </Button>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Driver Profile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User size={20} />
                  Driver Profile
                </CardTitle>
                <Button
                  variant={isEditing ? "outline" : "default"}
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? 'Cancel' : 'Edit'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isEditing ? (
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="bg-indigo-100 text-indigo-600">
                      {driver.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3>{driver.name}</h3>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <Phone size={14} />
                      {driver.phone}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-input-background"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="bg-input-background"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        className="bg-input-background pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-auto"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Route Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bus size={20} />
                Route Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isEditing && route ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Bus Number:</span>
                    <Badge variant="secondary">{route.routeId}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Schedule:</span>
                    <div className="flex items-center gap-1 text-sm">
                      <Clock size={14} />
                      {route.startTime} - {route.endTime}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Stops ({route.stops.length}):</span>
                    <div className="mt-2 space-y-1">
                      {route.stops.map((stop, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <MapPin size={12} className="text-muted-foreground" />
                          {stop}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="routeId">Bus Number</Label>
                      <Input
                        id="routeId"
                        value={routeData.routeId}
                        onChange={(e) => setRouteData(prev => ({ ...prev, routeId: e.target.value }))}
                        placeholder="e.g., B101"
                        className="bg-input-background"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={routeData.startTime}
                        onChange={(e) => setRouteData(prev => ({ ...prev, startTime: e.target.value }))}
                        className="bg-input-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endTime">End Time</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={routeData.endTime}
                        onChange={(e) => setRouteData(prev => ({ ...prev, endTime: e.target.value }))}
                        className="bg-input-background"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Bus Stops</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addStop}
                      >
                        <Plus size={14} className="mr-1" />
                        Add Stop
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {routeData.stops.map((stop, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            value={stop}
                            onChange={(e) => updateStop(index, e.target.value)}
                            placeholder={`Stop ${index + 1}`}
                            className="bg-input-background flex-1"
                          />
                          {routeData.stops.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeStop(index)}
                              className="p-2 text-red-600 hover:bg-red-100"
                            >
                              <Trash2 size={14} />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No route configured for this driver
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Save Button */}
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Button 
              onClick={handleSave}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <Save className="mr-2" size={18} />
              Save Changes
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}