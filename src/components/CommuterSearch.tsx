import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ArrowLeft, MapPin, Navigation, Search, Home } from 'lucide-react';
import { motion } from 'motion/react';
import { useForm } from 'react-hook-form@7.55.0';
import type { Screen, RouteConfig } from '../App';

interface CommuterSearchProps {
  onShowScreen: (screen: Screen) => void;
  onGoBack: () => void;
  onSearchResults: (results: RouteConfig[]) => void;
  onShowNotification: (message: string) => void;
  onGoHome: () => void;
}

interface SearchFormData {
  startLocation: string;
  destinationLocation: string;
}

export default function CommuterSearch({ onShowScreen, onGoBack, onSearchResults, onShowNotification, onGoHome }: CommuterSearchProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SearchFormData>();

  const onSubmit = (data: SearchFormData) => {
    const start = data.startLocation.toLowerCase().trim();
    const destination = data.destinationLocation.toLowerCase().trim();

    if (!start || !destination) {
      onShowNotification("Please enter both starting and destination locations.");
      return;
    }

    if (start === destination) {
      onShowNotification("Starting point and destination cannot be the same.");
      return;
    }

    // Search for available buses
    const availableBuses: RouteConfig[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('route_config_')) {
        const routeData = JSON.parse(localStorage.getItem(key) || '{}');
        
        // Check if both start and destination are in the route stops
        const hasStart = routeData.stops.some((stop: string) => 
          stop.toLowerCase().includes(start) || start.includes(stop.toLowerCase())
        );
        const hasDestination = routeData.stops.some((stop: string) => 
          stop.toLowerCase().includes(destination) || destination.includes(stop.toLowerCase())
        );
        
        if (hasStart && hasDestination) {
          availableBuses.push(routeData);
        }
      }
    }

    if (availableBuses.length > 0) {
      onSearchResults(availableBuses);
      onShowScreen('busList');
    } else {
      onShowNotification("No buses found for this route. Try different locations.");
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-4 flex-shrink-0">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onGoBack}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft size={20} />
          </Button>
          <h2 className="ml-4">Find Your Bus</h2>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onGoHome}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <Home size={20} />
        </Button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6">
        {/* Search Form */}
        <motion.div 
          className="flex flex-col justify-center min-h-full py-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
        <Card className="border-0 shadow-none">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto bg-green-100 rounded-full p-4 w-fit mb-4">
              <Search className="text-green-600" size={32} />
            </div>
            <CardTitle>Plan Your Journey</CardTitle>
            <p className="text-muted-foreground">Enter your starting point and destination</p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="space-y-2">
                <Label htmlFor="startLocation" className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  Starting Point
                </Label>
                <Input
                  id="startLocation"
                  type="text"
                  placeholder="Enter your starting location"
                  className="h-12 pl-4"
                  {...register('startLocation', { 
                    required: 'Starting location is required',
                    minLength: {
                      value: 2,
                      message: 'Location must be at least 2 characters'
                    }
                  })}
                />
                {errors.startLocation && (
                  <p className="text-sm text-destructive">{errors.startLocation.message}</p>
                )}
              </div>

              <div className="flex justify-center">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <Navigation size={16} className="text-gray-400" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="destinationLocation" className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  Destination
                </Label>
                <Input
                  id="destinationLocation"
                  type="text"
                  placeholder="Enter your destination"
                  className="h-12 pl-4"
                  {...register('destinationLocation', { 
                    required: 'Destination is required',
                    minLength: {
                      value: 2,
                      message: 'Destination must be at least 2 characters'
                    }
                  })}
                />
                {errors.destinationLocation && (
                  <p className="text-sm text-destructive">{errors.destinationLocation.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-green-600 hover:bg-green-700"
                disabled={isSubmitting}
              >
                <Search className="mr-2" size={20} />
                {isSubmitting ? 'Searching...' : 'Find Available Buses'}
              </Button>
              
            </form>
          </CardContent>
        </Card>

          {/* Tips */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h4 className="flex items-center gap-2 mb-2">
              <MapPin size={16} className="text-blue-600" />
              Search Tips
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Use popular landmarks or area names</li>
              <li>• Try different variations if no results found</li>
              <li>• Bus drivers add stops they service</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
}