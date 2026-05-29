import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Input } from './ui/input';
import { Shield, Users, Plus, Search, LogOut, Home, Phone, Bus, Clock, Edit, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import type { Screen, Admin, Driver, RouteConfig } from '../App';

interface AdminDashboardProps {
  loggedInAdmin: Admin | null;
  onShowScreen: (screen: Screen) => void;
  onSelectDriver: (driverId: string) => void;
  onLogout: () => void;
  onGoHome: () => void;
}

export default function AdminDashboard({ loggedInAdmin, onShowScreen, onSelectDriver, onLogout, onGoHome }: AdminDashboardProps) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDrivers, setFilteredDrivers] = useState<Driver[]>([]);

  useEffect(() => {
    loadDrivers();
  }, []);

  useEffect(() => {
    const filtered = drivers.filter(driver => 
      driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.phone.includes(searchTerm) ||
      getDriverRoute(driver.id)?.routeId.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredDrivers(filtered);
  }, [drivers, searchTerm]);

  const loadDrivers = () => {
    const storedDrivers = localStorage.getItem('registered_drivers');
    if (storedDrivers) {
      const parsedDrivers = JSON.parse(storedDrivers);
      // Ensure all drivers have IDs
      const driversWithIds = parsedDrivers.map((driver: any, index: number) => ({
        ...driver,
        id: driver.id || `driver_${driver.phone}_${index}`
      }));
      setDrivers(driversWithIds);
    }
  };

  const getDriverRoute = (driverId: string): RouteConfig | null => {
    const driver = drivers.find(d => d.id === driverId);
    if (!driver) return null;
    
    const routeConfig = localStorage.getItem(`route_config_${driver.phone}`);
    return routeConfig ? JSON.parse(routeConfig) : null;
  };

  const deleteDriver = (driverId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    if (!driver) return;

    if (confirm(`Are you sure you want to delete driver ${driver.name}? This action cannot be undone.`)) {
      // Remove from drivers list
      const updatedDrivers = drivers.filter(d => d.id !== driverId);
      setDrivers(updatedDrivers);
      localStorage.setItem('registered_drivers', JSON.stringify(updatedDrivers));

      // Remove their route config
      localStorage.removeItem(`route_config_${driver.phone}`);
      
      // Remove their location data
      const route = getDriverRoute(driverId);
      if (route) {
        localStorage.removeItem(`bus_location_${route.routeId}`);
      }
    }
  };

  const handleDriverClick = (driverId: string) => {
    onSelectDriver(driverId);
    onShowScreen('adminDriverDetail');
  };

  if (!loggedInAdmin) return null;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center gap-3">
          <div className="bg-red-100 rounded-full p-2">
            <Shield size={16} className="text-red-600" />
          </div>
          <div>
            <h1 className="font-semibold">Admin Dashboard</h1>
            <p className="text-xs text-muted-foreground">Welcome, {loggedInAdmin.username}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onGoHome}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <Home size={18} />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onLogout}
            className="p-2 hover:bg-gray-100 rounded-full text-red-600"
          >
            <LogOut size={18} />
          </Button>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Stats Cards */}
        <motion.div 
          className="grid grid-cols-2 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 rounded-full p-2">
                  <Users size={16} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Drivers</p>
                  <p className="text-xl font-semibold">{drivers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 rounded-full p-2">
                  <Bus size={16} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Routes</p>
                  <p className="text-xl font-semibold">
                    {drivers.filter(d => getDriverRoute(d.id)).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Actions */}
        <motion.div 
          className="flex gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Button 
            onClick={() => onShowScreen('adminDriverCreate')}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="mr-2" size={18} />
            Add New Driver
          </Button>
        </motion.div>

        {/* Search */}
        <motion.div 
          className="relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="Search drivers by name, phone, or bus number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-input-background"
          />
        </motion.div>

        {/* Drivers List */}
        <motion.div 
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex items-center justify-between">
            <h3>Registered Drivers</h3>
            <Badge variant="secondary">{filteredDrivers.length} drivers</Badge>
          </div>

          {filteredDrivers.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="mx-auto mb-3 text-muted-foreground" size={32} />
                <p className="text-muted-foreground">
                  {drivers.length === 0 
                    ? "No drivers registered yet. Add your first driver to get started."
                    : "No drivers match your search criteria."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredDrivers.map((driver, index) => {
              const route = getDriverRoute(driver.id);
              return (
                <motion.div
                  key={driver.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1" onClick={() => handleDriverClick(driver.id)}>
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-indigo-100 text-indigo-600">
                              {driver.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">{driver.name}</p>
                              {route && (
                                <Badge variant="secondary" className="text-xs">
                                  Bus #{route.routeId}
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Phone size={12} />
                                {driver.phone}
                              </div>
                              {route && (
                                <div className="flex items-center gap-1">
                                  <Clock size={12} />
                                  {route.startTime} - {route.endTime}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDriverClick(driver.id)}
                            className="p-2 hover:bg-blue-100 rounded-full"
                          >
                            <Edit size={14} className="text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteDriver(driver.id)}
                            className="p-2 hover:bg-red-100 rounded-full"
                          >
                            <Trash2 size={14} className="text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </motion.div>
      </div>
    </div>
  );
}