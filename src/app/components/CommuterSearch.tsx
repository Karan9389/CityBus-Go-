import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ArrowLeft, MapPin, Navigation, Search, Home, Bus } from 'lucide-react';
import { motion } from 'motion/react';
import { useForm } from 'react-hook-form';
import type { Screen, RouteConfig } from '../App';
import { api } from '../services/api';

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

  const onSubmit = async (data: SearchFormData) => {
    const start = data.startLocation.trim();
    const destination = data.destinationLocation.trim();

    try {
      const buses = await api.searchBuses({ start, destination });
      if (Array.isArray(buses) && buses.length > 0) {
        onSearchResults(buses);
        onShowScreen('busList');
      } else {
        onShowNotification("No buses found matching your search. Try different locations or view all buses.");
      }
    } catch (error: any) {
      console.error('Search error:', error);
      onShowNotification(error.message || 'Failed to search buses.');
    }
  };

  const handleShowAll = async () => {
    try {
      const buses = await api.getAllBuses();
      if (Array.isArray(buses) && buses.length > 0) {
        onSearchResults(buses);
        onShowScreen('busList');
      } else {
        onShowNotification("No bus routes registered yet.");
      }
    } catch (error: any) {
      console.error('Error fetching all buses:', error);
      onShowNotification(error.message || 'Failed to fetch bus routes.');
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
          <h2 className="ml-4 font-bold text-lg">Find Your Bus</h2>
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
              <p className="text-muted-foreground">Find live buses running between your stops</p>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                
                <div className="space-y-2">
                  <Label htmlFor="startLocation" className="flex items-center gap-2">
                    <MapPin size={16} className="text-green-600" />
                    Starting Point / Stop
                  </Label>
                  <Input
                    id="startLocation"
                    type="text"
                    placeholder="Enter pickup location (e.g. Central Station)"
                    className="h-12"
                    {...register('startLocation')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="destinationLocation" className="flex items-center gap-2">
                    <Navigation size={16} className="text-red-500" />
                    Destination Stop
                  </Label>
                  <Input
                    id="destinationLocation"
                    type="text"
                    placeholder="Enter destination (e.g. University)"
                    className="h-12"
                    {...register('destinationLocation')}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
                  disabled={isSubmitting}
                >
                  <Search size={18} />
                  {isSubmitting ? 'Searching...' : 'Search Buses'}
                </Button>
                
              </form>

              <div className="mt-4 pt-4 border-t text-center">
                <p className="text-xs text-muted-foreground mb-2">Want to see all active routes?</p>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleShowAll}
                  className="w-full h-10 flex items-center justify-center gap-2"
                >
                  <Bus size={16} />
                  View All Available Buses
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}