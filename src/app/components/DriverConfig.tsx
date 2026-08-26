import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { ArrowLeft, Bus, Clock, MapPin, Plus, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useForm } from 'react-hook-form';
import type { Screen, Driver } from '../App';
import { api } from '../services/api';

interface DriverConfigProps {
  loggedInDriver: Driver | null;
  onShowScreen: (screen: Screen) => void;
  onGoBack: () => void;
  onShowNotification: (message: string) => void;
  onGoHome?: () => void;
}

interface ConfigFormData {
  busNumber: string;
  startTime: string;
  endTime: string;
}

export default function DriverConfig({ loggedInDriver, onShowScreen, onGoBack, onShowNotification }: DriverConfigProps) {
  const [stops, setStops] = useState<string[]>([]);
  const [newStop, setNewStop] = useState('');
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ConfigFormData>();

  const addStop = () => {
    const stopName = newStop.trim();
    if (stopName && !stops.map(s => s.toLowerCase()).includes(stopName.toLowerCase())) {
      setStops([...stops, stopName]);
      setNewStop('');
    }
  };

  const removeStop = (index: number) => {
    setStops(stops.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ConfigFormData) => {
    const cleanBusNumber = data.busNumber.trim();
    const cleanStartTime = data.startTime.trim();
    const cleanEndTime = data.endTime.trim();
    const validStops = stops.map(s => s.trim()).filter(Boolean);

    if (!cleanBusNumber) {
      onShowNotification("Please enter a valid Route / Bus Number.");
      return;
    }

    if (!cleanStartTime || !cleanEndTime) {
      onShowNotification("Please specify both Start Time and End Time.");
      return;
    }

    if (validStops.length < 1) {
      onShowNotification("Please add at least 1 bus stop.");
      return;
    }

    try {
      await api.saveRouteConfig({
        routeId: cleanBusNumber,
        startTime: cleanStartTime,
        endTime: cleanEndTime,
        stops: validStops,
      });

      onShowNotification("Route configured successfully! ✅");
      onShowScreen('driverDashboard');
    } catch (error: any) {
      console.error('Save route error:', error);
      onShowNotification(error.message || 'Failed to save route configuration.');
    }
  };

  return (
    <div className="h-full flex flex-col p-6">
      
      {/* Header */}
      <div className="flex items-center mb-8">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onGoBack}
          className="p-2 hover:bg-gray-100 rounded-full mr-4"
        >
          <ArrowLeft size={20} />
        </Button>
        <div className="flex-1 text-center">
          <div className="mx-auto bg-blue-100 rounded-full p-4 w-fit mb-4">
            <Bus className="text-blue-600" size={32} />
          </div>
          <h2 className="font-bold text-xl">Configure Your Route</h2>
          <p className="text-muted-foreground mt-2">Set up your bus route and schedule</p>
        </div>
      </div>

      {/* Configuration Form */}
      <motion.div 
        className="flex-1 overflow-y-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Bus Number */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Bus size={20} />
                Bus Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="busNumber">Route / Bus Number</Label>
                <Input
                  id="busNumber"
                  placeholder="e.g., B101, Route 45, etc."
                  className="h-12"
                  {...register('busNumber', { 
                    required: 'Bus number is required' 
                  })}
                />
                {errors.busNumber && (
                  <p className="text-sm text-destructive">{errors.busNumber.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock size={20} />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    className="h-12"
                    {...register('startTime', { 
                      required: 'Start time is required' 
                    })}
                  />
                  {errors.startTime && (
                    <p className="text-sm text-destructive">{errors.startTime.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    className="h-12"
                    {...register('endTime', { 
                      required: 'End time is required' 
                    })}
                  />
                  {errors.endTime && (
                    <p className="text-sm text-destructive">{errors.endTime.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bus Stops */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin size={20} />
                Bus Stops ({stops.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a stop name (e.g., Central Station)"
                  value={newStop}
                  onChange={(e) => setNewStop(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addStop();
                    }
                  }}
                  className="h-12"
                />
                <Button 
                  type="button" 
                  onClick={addStop}
                  className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus size={20} />
                </Button>
              </div>

              {/* Stops List */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                <AnimatePresence>
                  {stops.map((stop, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="w-6 h-6 rounded-full flex items-center justify-center p-0 text-xs">
                          {index + 1}
                        </Badge>
                        <span className="capitalize text-sm font-medium">{stop}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStop(index)}
                        className="p-1 hover:bg-gray-200 rounded-full h-auto text-muted-foreground hover:text-destructive"
                      >
                        <X size={16} />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
            disabled={isSubmitting}
          >
            <Save size={20} />
            {isSubmitting ? 'Saving Route...' : 'Save Configuration'}
          </Button>

        </form>
      </motion.div>
    </div>
  );
}