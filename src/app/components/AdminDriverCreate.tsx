import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ArrowLeft, UserPlus, Phone, Lock, Bus, Clock, MapPin, Save, Home, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import type { Screen } from '../App';
import { api } from '../services/api';

interface AdminDriverCreateProps {
  onShowScreen: (screen: Screen) => void;
  onGoBack: () => void;
  onShowNotification: (message: string) => void;
  onGoHome: () => void;
}

export default function AdminDriverCreate({ onShowScreen, onGoBack, onShowNotification, onGoHome }: AdminDriverCreateProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.phone.trim() || !formData.password.trim()) {
      onShowNotification('Please fill in driver name, phone, and password.');
      return;
    }

    const validStops = routeData.stops.map(s => s.trim()).filter(Boolean);

    setIsSubmitting(true);
    try {
      await api.createDriver({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        password: formData.password.trim(),
        routeId: routeData.routeId.trim() || undefined,
        startTime: routeData.startTime || undefined,
        endTime: routeData.endTime || undefined,
        stops: validStops.length > 0 ? validStops : undefined,
      });

      onShowNotification(`Driver ${formData.name} created successfully! ✅`);
      onGoBack();
    } catch (err: any) {
      console.error('Error creating driver:', err);
      onShowNotification(err.message || 'Failed to create driver');
    } finally {
      setIsSubmitting(false);
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
        <h1 className="font-semibold text-base">Add New Driver</h1>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onGoHome}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <Home size={20} />
        </Button>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Driver Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <UserPlus size={18} />
                Driver Credentials
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-xs">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Driver Full Name"
                  className="h-11 mt-1 text-sm"
                />
              </div>

              <div>
                <Label htmlFor="phone" className="text-xs">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Driver Phone Number"
                  className="h-11 mt-1 text-sm"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-xs">Password *</Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Account Password"
                    className="h-11 pr-10 text-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Optional Route Config */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Bus size={18} />
                Assign Route (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="routeId" className="text-xs">Bus / Route Number</Label>
                <Input
                  id="routeId"
                  value={routeData.routeId}
                  onChange={(e) => setRouteData(prev => ({ ...prev, routeId: e.target.value }))}
                  placeholder="e.g., B101"
                  className="h-11 mt-1 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="startTime" className="text-xs">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={routeData.startTime}
                    onChange={(e) => setRouteData(prev => ({ ...prev, startTime: e.target.value }))}
                    className="h-11 mt-1 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="endTime" className="text-xs">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={routeData.endTime}
                    onChange={(e) => setRouteData(prev => ({ ...prev, endTime: e.target.value }))}
                    className="h-11 mt-1 text-sm"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs">Stops</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addStop} className="h-7 text-xs px-2">
                    <Plus size={12} className="mr-1" /> Add Stop
                  </Button>
                </div>
                <div className="space-y-2">
                  {routeData.stops.map((stop, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={stop}
                        onChange={(e) => updateStop(index, e.target.value)}
                        placeholder={`Stop ${index + 1}`}
                        className="h-10 text-sm flex-1"
                      />
                      {routeData.stops.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeStop(index)}
                          className="p-2 text-red-600 h-10"
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

          <Button 
            onClick={handleSave}
            disabled={isSubmitting}
            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center justify-center gap-2"
          >
            <Save size={18} />
            {isSubmitting ? "Creating Driver..." : "Save New Driver"}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}