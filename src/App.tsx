import React, { useState, useEffect } from 'react';
import { Card } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Badge } from './components/ui/badge';
import { Avatar, AvatarFallback } from './components/ui/avatar';
import { toast } from 'sonner@2.0.3';
import { ArrowLeft, MapPin, Users, Bus, Navigation, UserCog, Search, Play, Square, Clock, Route } from 'lucide-react';

import WelcomeScreen from './components/WelcomeScreen';
import DriverLogin from './components/DriverLogin';
import DriverRegister from './components/DriverRegister';
import DriverConfig from './components/DriverConfig';
import DriverDashboard from './components/DriverDashboard';
import DriverEdit from './components/DriverEdit';
import CommuterSearch from './components/CommuterSearch';
import BusList from './components/BusList';
import MapScreen from './components/MapScreen';
import PWAFeatures from './components/PWAFeatures';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import AdminDriverDetail from './components/AdminDriverDetail';
import AdminDriverCreate from './components/AdminDriverCreate';

export type Screen = 
  | 'welcome' 
  | 'driverLogin' 
  | 'driverRegister' 
  | 'driverConfig' 
  | 'driverDashboard'
  | 'driverEdit'
  | 'commuterSearch'
  | 'busList'
  | 'map'
  | 'adminLogin'
  | 'adminDashboard'
  | 'adminDriverDetail'
  | 'adminDriverCreate';

export interface Driver {
  id: string;
  name: string;
  phone: string;
  password: string;
}

export interface Admin {
  username: string;
  password: string;
}

export interface RouteConfig {
  routeId: string;
  startTime: string;
  endTime: string;
  stops: string[];
}

export interface LocationData {
  lat: number;
  lng: number;
  timestamp: number;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [screenHistory, setScreenHistory] = useState<Screen[]>(['welcome']);
  const [loggedInDriver, setLoggedInDriver] = useState<Driver | null>(null);
  const [loggedInAdmin, setLoggedInAdmin] = useState<Admin | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [searchResults, setSearchResults] = useState<RouteConfig[]>([]);
  const [trackingBus, setTrackingBus] = useState<string>('');

  // Handle PWA shortcuts on app load
  useEffect(() => {
    // Check URL parameters for shortcuts
    const urlParams = new URLSearchParams(window.location.search);
    const shortcut = urlParams.get('shortcut');
    
    if (shortcut === 'driver') {
      showScreen('driverLogin');
      toast('Welcome to Driver Portal! 🚌');
    } else if (shortcut === 'commuter') {
      showScreen('commuterSearch');
      toast('Let\'s find your bus! 🔍');
    }
    
    // Also check localStorage for backward compatibility
    const storedShortcut = localStorage.getItem('pwa-shortcut');
    if (storedShortcut === 'driver') {
      localStorage.removeItem('pwa-shortcut');
      showScreen('driverLogin');
      toast('Welcome to Driver Portal! 🚌');
    } else if (storedShortcut === 'commuter') {
      localStorage.removeItem('pwa-shortcut');
      showScreen('commuterSearch');
      toast('Let\'s find your bus! 🔍');
    }
  }, []);

  const showScreen = (screen: Screen) => {
    setScreenHistory(prev => [...prev, screen]);
    setCurrentScreen(screen);
  };

  const goBack = () => {
    if (screenHistory.length > 1) {
      const newHistory = screenHistory.slice(0, -1);
      const previousScreen = newHistory[newHistory.length - 1];
      setScreenHistory(newHistory);
      setCurrentScreen(previousScreen);
    }
  };

  const resetToScreen = (screen: Screen) => {
    setScreenHistory([screen]);
    setCurrentScreen(screen);
  };

  const goHome = () => {
    setLoggedInDriver(null);
    setLoggedInAdmin(null);
    setSelectedDriverId('');
    resetToScreen('welcome');
  };

  const showNotification = (message: string) => {
    toast(message);
  };

  return (
    <>
      {/* PWA Features Component */}
      <PWAFeatures />
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden relative" style={{ height: '700px' }}>
          
          {currentScreen === 'welcome' && (
            <WelcomeScreen onShowScreen={showScreen} />
          )}

        {currentScreen === 'driverLogin' && (
          <DriverLogin 
            onShowScreen={showScreen}
            onGoBack={goBack}
            onDriverLogin={setLoggedInDriver}
            onShowNotification={showNotification}
            onGoHome={goHome}
          />
        )}

        {currentScreen === 'driverRegister' && (
          <DriverRegister 
            onShowScreen={showScreen}
            onGoBack={goBack}
            onShowNotification={showNotification}
            onDriverLogin={setLoggedInDriver}
            onGoHome={goHome}
          />
        )}

        {currentScreen === 'driverConfig' && (
          <DriverConfig 
            loggedInDriver={loggedInDriver}
            onShowScreen={showScreen}
            onGoBack={goBack}
            onShowNotification={showNotification}
            onGoHome={goHome}
          />
        )}

        {currentScreen === 'driverDashboard' && (
          <DriverDashboard 
            loggedInDriver={loggedInDriver}
            onShowScreen={showScreen}
            onLogout={() => {
              setLoggedInDriver(null);
              resetToScreen('welcome');
            }}
            onGoHome={goHome}
          />
        )}

        {currentScreen === 'driverEdit' && (
          <DriverEdit 
            loggedInDriver={loggedInDriver}
            onGoBack={goBack}
            onDriverUpdate={setLoggedInDriver}
            onShowNotification={showNotification}
            onGoHome={goHome}
          />
        )}

        {currentScreen === 'commuterSearch' && (
          <CommuterSearch 
            onShowScreen={showScreen}
            onGoBack={goBack}
            onSearchResults={setSearchResults}
            onShowNotification={showNotification}
            onGoHome={goHome}
          />
        )}

        {currentScreen === 'busList' && (
          <BusList 
            searchResults={searchResults}
            onShowScreen={showScreen}
            onGoBack={goBack}
            onTrackBus={(busId: string) => {
              setTrackingBus(busId);
              showScreen('map');
            }}
            onGoHome={goHome}
          />
        )}

        {currentScreen === 'map' && (
          <MapScreen 
            trackingBus={trackingBus}
            onShowScreen={showScreen}
            onGoBack={goBack}
            onGoHome={goHome}
          />
        )}

        {currentScreen === 'adminLogin' && (
          <AdminLogin 
            onShowScreen={showScreen}
            onGoBack={goBack}
            onAdminLogin={setLoggedInAdmin}
            onShowNotification={showNotification}
            onGoHome={goHome}
          />
        )}

        {currentScreen === 'adminDashboard' && (
          <AdminDashboard 
            loggedInAdmin={loggedInAdmin}
            onShowScreen={showScreen}
            onSelectDriver={setSelectedDriverId}
            onLogout={() => {
              setLoggedInAdmin(null);
              resetToScreen('welcome');
            }}
            onGoHome={goHome}
          />
        )}

        {currentScreen === 'adminDriverDetail' && (
          <AdminDriverDetail 
            driverId={selectedDriverId}
            onShowScreen={showScreen}
            onGoBack={goBack}
            onShowNotification={showNotification}
            onGoHome={goHome}
          />
        )}

        {currentScreen === 'adminDriverCreate' && (
          <AdminDriverCreate 
            onShowScreen={showScreen}
            onGoBack={goBack}
            onShowNotification={showNotification}
            onGoHome={goHome}
          />
        )}

        </div>
      </div>
    </>
  );
}