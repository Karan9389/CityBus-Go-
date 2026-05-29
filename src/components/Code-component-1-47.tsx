import React from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ArrowLeft, Bus, Clock, MapPin, Navigation, Wifi, WifiOff } from 'lucide-react';
import { motion } from 'motion/react';
import type { Screen, RouteConfig } from '../App';

interface BusListProps {
  searchResults: RouteConfig[];
  onShowScreen: (screen: Screen) => void;
  onTrackBus: (busId: string) => void;
}

export default function BusList({ searchResults, onShowScreen, onTrackBus }: BusListProps) {
  
  const checkBusOnline = (routeId: string) => {
    const locationData = localStorage.getItem(`bus_location_${routeId}`);
    if (!locationData) return false;
    
    const { timestamp } = JSON.parse(locationData);
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    return timestamp > fiveMinutesAgo;
  };

  return (
    <div className="h-full flex flex-col p-6">
      
      {/* Header */}
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onShowScreen('commuterSearch')}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft size={20} />
        </Button>
        <div className="ml-4">
          <h2>Available Buses</h2>
          <p className="text-sm text-muted-foreground">{searchResults.length} buses found</p>
        </div>
      </div>

      {/* Bus List */}
      <motion.div 
        className="flex-1 overflow-y-auto space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {searchResults.length > 0 ? (
          searchResults.map((bus, index) => {
            const isOnline = checkBusOnline(bus.routeId);
            
            return (
              <motion.div
                key={bus.routeId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card 
                  className="cursor-pointer hover:shadow-md transition-all duration-300 hover:scale-[1.02] border-l-4 border-l-green-500"
                  onClick={() => onTrackBus(bus.routeId)}
                >
                  <CardContent className="p-4">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 p-2 rounded-lg">
                          <Bus className="text-indigo-600" size={20} />
                        </div>
                        <div>
                          <h3 className="font-mono">Bus #{bus.routeId}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            {isOnline ? (
                              <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                                <Wifi size={10} className="mr-1" />
                                Live
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                                <WifiOff size={10} className="mr-1" />
                                Offline
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <Button size="sm" variant="outline" className="shrink-0">
                        <Navigation size={14} className="mr-1" />
                        Track
                      </Button>
                    </div>

                    {/* Schedule */}
                    <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                      <Clock size={14} />
                      <span>{bus.startTime} - {bus.endTime}</span>
                    </div>

                    {/* Route Preview */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin size={14} />
                        <span>Route ({bus.stops.length} stops)</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="capitalize">{bus.stops[0]}</span>
                        </div>
                        
                        <div className="flex-1 border-t border-dashed border-gray-300 mx-2"></div>
                        
                        {bus.stops.length > 2 && (
                          <>
                            <span className="text-gray-400">+{bus.stops.length - 2} stops</span>
                            <div className="flex-1 border-t border-dashed border-gray-300 mx-2"></div>
                          </>
                        )}
                        
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span className="capitalize">{bus.stops[bus.stops.length - 1]}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Message */}
                    {!isOnline && (
                      <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs text-amber-700">
                          ⚠️ Driver is not currently sharing location
                        </p>
                      </div>
                    )}
                    
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        ) : (
          <motion.div 
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="bg-gray-100 rounded-full p-6 w-fit mx-auto mb-4">
              <Bus className="text-gray-400" size={32} />
            </div>
            <h3 className="mb-2">No Buses Found</h3>
            <p className="text-muted-foreground text-sm mb-4 px-4">
              No active buses found for this route currently. Try searching for different locations.
            </p>
            <Button 
              variant="outline" 
              onClick={() => onShowScreen('commuterSearch')}
            >
              Search Again
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}