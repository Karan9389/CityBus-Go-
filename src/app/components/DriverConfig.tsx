import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { ArrowLeft, Bus, Clock, MapPin, Plus, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useForm } from 'react-hook-form@7.55.0';
import type { Screen, Driver } from '../App';

interface DriverConfigProps {
  loggedInDriver: Driver | null;
  onShowScreen: (screen: Screen) => void;
  onGoBack: () => void;
  onShowNotification: (message: string) => void;
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
    if (stopName && !stops.includes(stopName.toLowerCase())) {
      setStops([...stops, stopName.toLowerCase()]);
      setNewStop('');
    }
  };

  const removeStop = (index: number) => {
    setStops(stops.filter((_, i) => i !== index));
  };

  const onSubmit = (data: ConfigFormData) => {
    if (!loggedInDriver) return;
    
    if (stops.length < 2) {
      onShowNotification("Please add at least 2 bus stops.");
      return;
    }

    const routeConfig = {
      routeId: data.busNumber,
      startTime: data.startTime,
      endTime: data.endTime,
      stops: stops
    };

    localStorage.setItem(`route_config_${loggedInDriver.phone}`, JSON.stringify(routeConfig));
    onShowNotification("Route configured successfully!");
    onShowScreen('driverDashboard');
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
          <h2>Configure Your Route</h2>
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
              <CardTitle className="flex items-center gap-2">
                <Bus size={20} />
                Bus Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="busNumber">Bus Number</Label>
                <Input
                  id="busNumber"
                  placeholder="e.g., 101-A, Route 25"
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
              <CardTitle className="flex items-center gap-2">
                <Clock size={20} />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    placeholder="08:00 AM"
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
                    placeholder="09:00 PM"
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
              <CardTitle className="flex items-center gap-2">
                <MapPin size={20} />
                Bus Stops
              </CardTitle>
              <p className="text-sm text-muted-foreground">Add stops in the order of your route</p>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Add Stop Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Enter stop name"
                  value={newStop}
                  onChange={(e) => setNewStop(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addStop())}
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  onClick={addStop}
                  size="sm"
                  variant="outline"
                  className="px-3"
                >
                  <Plus size={16} />
                </Button>
              </div>

              {/* Stops List */}
              <div className="space-y-2 max-h-40 overflow-y-auto">
                <AnimatePresence>
                  {stops.map((stop, index) => (
                    <motion.div
                      key={`${stop}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center justify-between bg-muted/50 p-3 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="w-8 h-8 rounded-full flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <span className="capitalize">{stop}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStop(index)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <X size={14} />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {stops.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin size={24} className="mx-auto mb-2 opacity-50" />
                  <p>No stops added yet</p>
                  <p className="text-sm">Add at least 2 stops to create your route</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700"
            disabled={isSubmitting || stops.length < 2}
          >
            <Save className="mr-2" size={20} />
            {isSubmitting ? 'Saving Configuration...' : 'Save Configuration'}
          </Button>
          
        </form>
      </motion.div>
    </div>
  );
}