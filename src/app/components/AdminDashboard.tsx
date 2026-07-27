import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Input } from './ui/input';
import { Shield, Users, Plus, Search, LogOut, Home, Phone, Bus, Clock, Edit, Trash2, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import type { Screen, Admin } from '../App';
import { api } from '../services/api';

interface AdminDashboardProps {
  loggedInAdmin: Admin | null;
  onShowScreen: (screen: Screen) => void;
  onSelectDriver: (driverId: string) => void;
  onLogout: () => void;
  onGoHome: () => void;
}

export default function AdminDashboard({ loggedInAdmin, onShowScreen, onSelectDriver, onLogout, onGoHome }: AdminDashboardProps) {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ totalDrivers: 0, totalRoutes: 0, liveBuses: 0, totalStopsCovered: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [driversData, statsData] = await Promise.all([
        api.getAllDrivers().catch(() => []),
        api.getAdminStats().catch(() => ({ totalDrivers: 0, totalRoutes: 0, liveBuses: 0, totalStopsCovered: 0 }))
      ]);

      if (Array.isArray(driversData)) {
        setDrivers(driversData);
      }
      if (statsData) {
        setStats(statsData);
      }
    } catch (err) {
      console.error('Error loading admin dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteDriver = async (driverId: string, driverName: string) => {
    if (confirm(`Are you sure you want to delete driver ${driverName}? This action cannot be undone.`)) {
      try {
        await api.deleteDriver(driverId);
        loadDashboardData();
      } catch (err: any) {
        alert(err.message || 'Failed to delete driver');
      }
    }
  };

  const handleDriverClick = (driverId: string) => {
    onSelectDriver(driverId);
    onShowScreen('adminDriverDetail');
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    onLogout();
  };

  const filteredDrivers = drivers.filter(d => 
    d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.phone?.includes(searchTerm) ||
    d.routeConfig?.routeId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center gap-3">
          <div className="bg-red-100 rounded-full p-2">
            <Shield size={18} className="text-red-600" />
          </div>
          <div>
            <h1 className="font-semibold text-base">Admin Dashboard</h1>
            <p className="text-xs text-muted-foreground">Welcome, {loggedInAdmin?.username || 'Admin'}</p>
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
            onClick={handleLogout}
            className="p-2 hover:bg-gray-100 rounded-full text-red-600"
          >
            <LogOut size={18} />
          </Button>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card className="bg-blue-50 border-blue-100">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-blue-600 font-medium">Total Drivers</p>
              <h3 className="text-xl font-bold text-blue-900 mt-1">{stats.totalDrivers || drivers.length}</h3>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-100">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-green-600 font-medium">Live Buses</p>
              <h3 className="text-xl font-bold text-green-900 mt-1">{stats.liveBuses}</h3>
            </CardContent>
          </Card>
        </div>

        {/* Actions bar */}
        <div className="flex items-center justify-between mb-4 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Search driver or route..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 text-xs"
            />
          </div>
          <Button 
            onClick={() => onShowScreen('adminDriverCreate')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white h-10 text-xs px-3 flex items-center gap-1"
          >
            <Plus size={16} />
            Add Driver
          </Button>
        </div>

        {/* Driver list */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Driver Directory ({filteredDrivers.length})</h2>
          
          {isLoading ? (
            <p className="text-xs text-center py-6 text-muted-foreground">Loading system drivers...</p>
          ) : filteredDrivers.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-xs text-muted-foreground">No drivers found.</p>
            </Card>
          ) : (
            filteredDrivers.map((driver) => (
              <Card key={driver.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => handleDriverClick(driver.id)}>
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold text-sm">
                          {driver.name ? driver.name.charAt(0).toUpperCase() : 'D'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium text-sm text-gray-900">{driver.name}</h3>
                        <p className="text-xs text-muted-foreground">{driver.phone}</p>
                        {driver.routeConfig && (
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px] text-indigo-600 border-indigo-200">
                              Bus #{driver.routeConfig.routeId}
                            </Badge>
                            {driver.routeConfig.isLive && (
                              <Badge className="text-[9px] bg-green-500 text-white">Live</Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDriverClick(driver.id)}
                        className="p-2 h-auto text-indigo-600"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteDriver(driver.id, driver.name)}
                        className="p-2 h-auto text-red-600"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}