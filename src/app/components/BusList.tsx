import React from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ArrowLeft, Bus, Clock, MapPin, Navigation, Wifi, WifiOff, Home } from 'lucide-react';
import { motion } from 'motion/react';
import type { Screen } from '../App';

interface BusListProps {
  searchResults: any[];
  onShowScreen: (screen: Screen) => void;
  onGoBack: () => void;
  onTrackBus: (busId: string) => void;
  onGoHome: () => void;
}

export default function BusList({ searchResults, onShowScreen, onGoBack, onTrackBus, onGoHome }: BusListProps) {
  return (
    <div className="h-full flex flex-col p-6">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onGoBack}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft size={20} />
          </Button>
          <div className="ml-4">
            <h2 className="font-bold text-lg">Available Buses</h2>
            <p className="text-xs text-muted-foreground">{searchResults.length} routes found</p>
          </div>
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

      {/* Bus List */}
      <motion.div 
        className="flex-1 overflow-y-auto space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {searchResults.length > 0 ? (
          searchResults.map((bus, index) => {
            const isOnline = !!bus.isLive;
            
            return (
              <motion.div
                key={bus.routeId || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card 
                  className={`cursor-pointer hover:shadow-md transition-all duration-300 hover:scale-[1.01] border-l-4 ${
                    isOnline ? 'border-l-green-500' : 'border-l-gray-300'
                  }`}
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
                          <h3 className="font-bold text-sm">Bus #{bus.routeId}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            {isOnline ? (
                              <Badge variant="default" className="bg-green-100 text-green-800 text-[10px]">
                                <Wifi size={10} className="mr-1" />
                                Live Tracking
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-gray-100 text-gray-600 text-[10px]">
                                <WifiOff size={10} className="mr-1" />
                                Scheduled Route
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Schedule */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3 bg-gray-50 p-2 rounded-lg">
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>Hours: {bus.startTime} - {bus.endTime}</span>
                      </div>
                      {bus.driver?.name && (
                        <span className="text-indigo-600 font-medium ml-auto">Driver: {bus.driver.name}</span>
                      )}
                    </div>

                    {/* Route Stops Summary */}
                    {Array.isArray(bus.stops) && bus.stops.length > 0 && (
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <MapPin size={12} />
                            From:
                          </span>
                          <span className="capitalize font-medium">{bus.stops[0]}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Navigation size={12} />
                            To:
                          </span>
                          <span className="capitalize font-medium">{bus.stops[bus.stops.length - 1]}</span>
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <Button 
                      className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTrackBus(bus.routeId);
                      }}
                    >
                      <Navigation size={14} className="mr-2" />
                      {isOnline ? 'Track Live Location' : 'View Route Map'}
                    </Button>

                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <div className="bg-gray-100 rounded-full p-4 w-fit mx-auto mb-4">
              <Bus className="text-gray-400" size={32} />
            </div>
            <h3 className="text-sm font-semibold mb-1">No Buses Available</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Try searching with different stops or view all routes.
            </p>
            <Button onClick={onGoBack} variant="outline" size="sm">
              Back to Search
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}