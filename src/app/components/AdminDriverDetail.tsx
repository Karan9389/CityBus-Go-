import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { ArrowLeft, User, Phone, Lock, Bus, Clock, MapPin, Save, Home, Plus, Trash2, Eye, EyeOff, Edit } from 'lucide-react';
import { motion } from 'motion/react';
import type { Screen } from '../App';
import { api } from '../services/api';

interface AdminDriverDetailProps {
  driverId: string;
  onShowScreen: (screen: Screen) => void;
  onGoBack: () => void;
  onShowNotification: (message: string) => void;
  onGoHome: () => void;
}

export default function AdminDriverDetail({ driverId, onShowScreen, onGoBack, onShowNotification, onGoHome }: AdminDriverDetailProps) {
  const [driver, setDriver] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
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

  useEffect(() => {
    loadDriverData();
  }, [driverId]);

  const loadDriverData = async () => {
    try {
      const data = await api.getDriverById(driverId);
      if (data) {
        setDriver(data);
        setFormData({
          name: data.name || '',
          phone: data.phone || '',
          password: ''
        });
        if (data.routeConfig) {
          setRouteData({
            routeId: data.routeConfig.routeId || '',
            startTime: data.routeConfig.startTime || '',
            endTime: data.routeConfig.endTime || '',
            stops: data.routeConfig.stops && data.routeConfig.stops.length > 0 ? data.routeConfig.stops : ['']
          });
        }
      }
    } catch (err: any) {
      console.error('Error fetching driver details:', err);
      onShowNotification(err.message || 'Failed to load driver profile.');
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.phone.trim()) {
      onShowNotification('Driver name and phone number are required.');
      return;
    }

    const validStops = routeData.stops.map(s => s.trim()).filter(Boolean);

    setIsSubmitting(true);
    try {
      await api.updateDriver(driverId, {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        password: formData.password ? formData.password.trim() : undefined,
        routeId: routeData.routeId.trim() || undefined,
        startTime: routeData.startTime || undefined,
        endTime: routeData.endTime || undefined,
        stops: validStops.length > 0 ? validStops : undefined,
      });

      onShowNotification('Driver updated successfully! ✅');
      setIsEditing(false);
      loadDriverData();
    } catch (err: any) {
      console.error('Error updating driver:', err);
      onShowNotification(err.message || 'Failed to update driver');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete driver ${driver?.name}? This action cannot be undone.`)) {
      try {
        await api.deleteDriver(driverId);
        onShowNotification('Driver deleted successfully.');
        onGoBack();
      } catch (err: any) {
        onShowNotification(err.message || 'Failed to delete driver.');
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
      <div className="h-full flex items-center justify-center p-6 text-center text-muted-foreground text-sm">
        Loading driver details...
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
        <h1 className="font-semibold text-base">{isEditing ? "Edit Driver" : "Driver Details"}</h1>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onGoHome}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <Home size={20} />
        </Button>
      </div>

      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        {/* Profile Card */}
        <Card className="text-center p-4">
          <Avatar className="mx-auto w-16 h-16 mb-3">
            <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold text-xl">
              {driver.name ? driver.name.charAt(0).toUpperCase() : 'D'}
            </AvatarFallback>
          </Avatar>
          <h2 className="font-bold text-lg">{driver.name}</h2>
          <p className="text-muted-foreground text-sm">{driver.phone}</p>
          
          <div className="flex justify-center gap-2 mt-4">
            <Button
              size="sm"
              variant={isEditing ? "secondary" : "default"}
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-1 text-xs"
            >
              <Edit size={14} />
              {isEditing ? "Cancel Edit" : "Edit Profile"}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDelete}
              className="flex items-center gap-1 text-xs"
            >
              <Trash2 size={14} />
              Delete Driver
            </Button>
          </div>
        </Card>

        {isEditing ? (
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">Full Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="h-10 text-sm mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Phone Number</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="h-10 text-sm mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">New Password (Leave blank to keep current)</Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="New password..."
                    className="h-10 text-sm mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Route Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">Bus / Route Number</Label>
                  <Input
                    value={routeData.routeId}
                    onChange={(e) => setRouteData(prev => ({ ...prev, routeId: e.target.value }))}
                    className="h-10 text-sm mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Start Time</Label>
                    <Input
                      type="time"
                      value={routeData.startTime}
                      onChange={(e) => setRouteData(prev => ({ ...prev, startTime: e.target.value }))}
                      className="h-10 text-sm mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">End Time</Label>
                    <Input
                      type="time"
                      value={routeData.endTime}
                      onChange={(e) => setRouteData(prev => ({ ...prev, endTime: e.target.value }))}
                      className="h-10 text-sm mt-1"
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
              {isSubmitting ? "Saving..." : "Save Driver Changes"}
            </Button>
          </div>
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Bus size={18} />
                Route Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {driver.routeConfig ? (
                <>
                  <div className="flex justify-between items-center text-sm border-b pb-2">
                    <span className="text-muted-foreground">Route ID / Bus Number:</span>
                    <span className="font-semibold text-indigo-600">{driver.routeConfig.routeId}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b pb-2">
                    <span className="text-muted-foreground">Schedule:</span>
                    <span className="font-medium flex items-center gap-1">
                      <Clock size={14} />
                      {driver.routeConfig.startTime} - {driver.routeConfig.endTime}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs block mb-2">Stops:</span>
                    <div className="flex flex-wrap gap-1">
                      {driver.routeConfig.stops?.map((stop: string, i: number) => (
                        <Badge key={i} variant="secondary" className="capitalize text-xs">
                          {i + 1}. {stop}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-2">No route configuration assigned.</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}