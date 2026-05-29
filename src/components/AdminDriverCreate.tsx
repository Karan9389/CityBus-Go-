import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ArrowLeft, UserPlus, Phone, Lock, Bus, Clock, MapPin, Save, Home, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import type { Screen, Driver, RouteConfig } from '../App';

interface AdminDriverCreateProps {
  onShowScreen: (screen: Screen) => void;
  onGoBack: () => void;
  onShowNotification: (message: string) => void;
  onGoHome: () => void;
}

export default function AdminDriverCreate({ onShowScreen, onGoBack, onShowNotification, onGoHome }: AdminDriverCreateProps) {
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

  const handleSave = () => {
    // Validate form
    if (!formData.name.trim() || !formData.phone.trim() || !formData.password.trim()) {
      onShowNotification('Please fill in all driver details');
      return;
    }

    if (!routeData.routeId.trim() || !routeData.startTime || !routeData.endTime || routeData.stops.every(stop => !stop.trim())) {
      onShowNotification('Please complete all route details');
      return;
    }

    // Check if phone number already exists
    const storedDrivers = localStorage.getItem('registered_drivers');
    const existingDrivers = storedDrivers ? JSON.parse(storedDrivers) : [];
    
    if (existingDrivers.some((driver: Driver) => driver.phone === formData.phone.trim())) {
      onShowNotification('A driver with this phone number already exists');
      return;
    }

    // Create new driver
    const newDriver: Driver = {
      id: `driver_${formData.phone}_${Date.now()}`,
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      password: formData.password.trim()
    };

    // Save driver
    existingDrivers.push(newDriver);
    localStorage.setItem('registered_drivers', JSON.stringify(existingDrivers));

    // Save route configuration
    const validStops = routeData.stops.filter(stop => stop.trim());
    const routeConfig: RouteConfig = {
      routeId: routeData.routeId.trim(),
      startTime: routeData.startTime,
      endTime: routeData.endTime,
      stops: validStops
    };
    localStorage.setItem(`route_config_${newDriver.phone}`, JSON.stringify(routeConfig));

    onShowNotification(`Driver ${newDriver.name} created successfully! ✅`);
    onGoBack();
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
        <h1 className="font-semibold">Add New Driver</h1>
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
        {/* Driver Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus size={20} />
                Driver Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter driver's full name"
                  className="bg-input-background"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number (used for login)"
                  className="bg-input-background"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter login password"
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
              <div className="space-y-2">
                <Label htmlFor="routeId">Bus Number *</Label>
                <Input
                  id="routeId"
                  value={routeData.routeId}
                  onChange={(e) => setRouteData(prev => ({ ...prev, routeId: e.target.value }))}
                  placeholder="e.g., B101, Route 45, etc."
                  className="bg-input-background"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={routeData.startTime}
                    onChange={(e) => setRouteData(prev => ({ ...prev, startTime: e.target.value }))}
                    className="bg-input-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time *</Label>
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
                  <Label>Bus Stops *</Label>
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
                      <div className="flex items-center gap-2 flex-1">
                        <MapPin size={14} className="text-muted-foreground" />
                        <Input
                          value={stop}
                          onChange={(e) => updateStop(index, e.target.value)}
                          placeholder={`Stop ${index + 1} (e.g., Central Station, Mall Plaza)`}
                          className="bg-input-background flex-1"
                        />
                      </div>
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
            </CardContent>
          </Card>
        </motion.div>

        {/* Create Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Button 
            onClick={handleSave}
            className="w-full bg-green-600 hover:bg-green-700 text-white h-12"
          >
            <Save className="mr-2" size={18} />
            Create Driver
          </Button>
        </motion.div>

        {/* Info Note */}
        <motion.div 
          className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-xs text-blue-800 mb-1 font-medium">Note:</p>
          <p className="text-xs text-blue-700">
            The phone number will be used as the driver's username for login. Make sure all required fields are filled out before creating the driver.
          </p>
        </motion.div>
      </div>
    </div>
  );
}