/// <reference types="react" />
import { useState, type ChangeEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ArrowLeft, User, Phone, Lock, UserPlus, Bus, MapPin, Clock, Home, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { useForm } from 'react-hook-form';
import type { Screen, Driver } from '../App';

interface DriverRegisterProps {
  onShowScreen: (screen: Screen) => void;
  onGoBack: () => void;
  onShowNotification: (message: string) => void;
  onDriverLogin: (driver: Driver) => void;
  onGoHome: () => void;
}

interface RegisterFormData {
  name: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface RouteData {
  routeId: string;
  startTime: string;
  endTime: string;
  stops: string[];
}

export default function DriverRegister({ onShowScreen, onGoBack, onShowNotification, onDriverLogin, onGoHome }: DriverRegisterProps) {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<RegisterFormData>();
  const [step, setStep] = useState<1 | 2>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [routeData, setRouteData] = useState<RouteData>({
    routeId: '',
    startTime: '',
    endTime: '',
    stops: ['']
  });
  
  const password = watch('password');

  const validateRouteData = () => {
    if (!routeData.routeId.trim()) {
      onShowNotification('Bus number / Route ID is required.');
      return false;
    }

    if (!routeData.startTime || !routeData.endTime) {
      onShowNotification('Please enter valid start and end times.');
      return false;
    }

    const nonExitentStops = routeData.stops.filter(s => s.trim().length > 0);
    if (nonExitentStops.length < 2) {
      onShowNotification('Please enter at least 2 stops (Origin and Destination).');
      return false;
    }

    if (routeData.stops.some((stop) => !stop.trim())) {
      onShowNotification('Please fill in all route stop names or remove empty entries.');
      return false;
    }

    return true;
  };

  const onSubmit = async (data: any) => {
    if (step === 1) {
      setStep(2);
      return;
    }

    if (!validateRouteData()) {
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          phone: data.phone,
          password: data.password,
          routeId: routeData.routeId,
          startTime: routeData.startTime,
          endTime: routeData.endTime,
          stops: routeData.stops.map(s => s.trim()).filter(Boolean)
        }),
      });

      const result = await response.json();

      if (response.ok) {
        if (result.token) {
          localStorage.setItem('driver_token', result.token);
        }
        localStorage.setItem(`route_config_${data.phone}`, JSON.stringify({
          routeId: routeData.routeId,
          startTime: routeData.startTime,
          endTime: routeData.endTime,
          stops: routeData.stops.map(s => s.trim()).filter(Boolean)
        }));
        
        onShowNotification("Registration & Route Configuration stored in database successfully!");
        if (result.driver) {
          onDriverLogin({
            id: result.driver.id,
            name: result.driver.name,
            phone: result.driver.phone,
            password: ''
          });
          onShowScreen('driverDashboard');
        } else {
          onShowScreen('driverLogin');
        }
      } else {
        onShowNotification(result.message || "Registration failed.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      onShowNotification("Cannot connect to the server. Is it running?");
    }
  };

  const addStop = () => {
    setRouteData((prev: RouteData) => ({
      ...prev,
      stops: [...prev.stops, '']
    }));
  };

  const addPresetStop = (stopName: string) => {
    setRouteData((prev: RouteData) => {
      // replace last stop if empty or append
      const stopsCopy = [...prev.stops];
      if (stopsCopy.length > 0 && stopsCopy[stopsCopy.length - 1].trim() === '') {
        stopsCopy[stopsCopy.length - 1] = stopName;
      } else {
        stopsCopy.push(stopName);
      }
      return { ...prev, stops: stopsCopy };
    });
  };

  const moveStop = (index: number, direction: 'up' | 'down') => {
    setRouteData((prev: RouteData) => {
      const newStops = [...prev.stops];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex >= 0 && targetIndex < newStops.length) {
        const temp = newStops[index];
        newStops[index] = newStops[targetIndex];
        newStops[targetIndex] = temp;
      }
      return { ...prev, stops: newStops };
    });
  };

  const removeStop = (index: number) => {
    if (routeData.stops.length > 1) {
      setRouteData((prev: RouteData) => ({
        ...prev,
        stops: prev.stops.filter((_, i: number) => i !== index)
      }));
    }
  };

  const updateStop = (index: number, value: string) => {
    setRouteData((prev: RouteData) => ({
      ...prev,
      stops: prev.stops.map((stop: string, i: number) => i === index ? value : stop)
    }));
  };

  const prevStep = () => {
    setStep(1);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-4 flex-shrink-0">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={step === 1 ? onGoBack : prevStep}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft size={20} />
          </Button>
          <h2 className="ml-4">Driver Registration</h2>
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
        {/* Registration Form */}
        <motion.div 
          className="flex flex-col justify-center min-h-full py-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          key={step}
        >
        <Card className="border-0 shadow-none">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto bg-green-100 rounded-full p-4 w-fit mb-4">
              {step === 1 ? <UserPlus className="text-green-600" size={32} /> : <Bus className="text-green-600" size={32} />}
            </div>
            <CardTitle>
              {step === 1 ? 'Create Account' : 'Route Configuration'}
            </CardTitle>
            <p className="text-muted-foreground">
              {step === 1 ? 'Join as a verified bus driver' : 'Set up your bus route details'}
            </p>
            <div className="flex justify-center mt-4 gap-2">
              <div className={`w-8 h-2 rounded-full ${step >= 1 ? 'bg-green-600' : 'bg-gray-200'}`}></div>
              <div className={`w-8 h-2 rounded-full ${step >= 2 ? 'bg-green-600' : 'bg-gray-200'}`}></div>
            </div>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              
              {step === 1 ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
                      <User size={16} />
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      className="h-12"
                      {...register('name', { 
                        required: 'Full name is required',
                        minLength: {
                          value: 2,
                          message: 'Name must be at least 2 characters'
                        }
                      })}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone size={16} />
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      className="h-12"
                      {...register('phone', { 
                        required: 'Phone number is required',
                        pattern: {
                          value: /^[0-9+\-\s()]+$/,
                          message: 'Please enter a valid phone number'
                        }
                      })}
                    />
                    {errors.phone && (
                      <p className="text-sm text-destructive">{errors.phone.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="flex items-center gap-2">
                      <Lock size={16} />
                      Create Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a strong password"
                        className="h-12 pr-10"
                        {...register('password', { 
                          required: 'Password is required',
                          minLength: {
                            value: 6,
                            message: 'Password must be at least 6 characters'
                          }
                        })}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-auto"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </Button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                      <Lock size={16} />
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm your password"
                        className="h-12 pr-10"
                        {...register('confirmPassword', { 
                          required: 'Please confirm your password',
                          validate: value => value === password || 'Passwords do not match'
                        })}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-auto"
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </Button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                    )}
                  </div>

                  <Button 
                    type="submit"
                    className="w-full h-12 bg-green-600 hover:bg-green-700"
                  >
                    Continue to Route Setup
                  </Button>
                </>
              ) : (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="busNumber" className="flex items-center gap-2">
                      <Bus size={16} />
                      Bus Number *
                    </Label>
                    <Input
                      id="busNumber"
                      type="text"
                      placeholder="e.g., B101, Route 45, etc."
                      className="h-12"
                      value={routeData.routeId}
                      onChange={(e) => setRouteData(prev => ({ ...prev, routeId: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startTime" className="flex items-center gap-2">
                        <Clock size={16} />
                        Start Time *
                      </Label>
                      <Input
                        id="startTime"
                        type="time"
                        className="h-12"
                        value={routeData.startTime}
                        onChange={(e) => setRouteData(prev => ({ ...prev, startTime: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endTime" className="flex items-center gap-2">
                        <Clock size={16} />
                        End Time *
                      </Label>
                      <Input
                        id="endTime"
                        type="time"
                        className="h-12"
                        value={routeData.endTime}
                        onChange={(e) => setRouteData(prev => ({ ...prev, endTime: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <MapPin size={16} />
                        Bus Stops *
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addStop}
                      >
                        <Plus size={14} className="mr-1" />
                        Add Stop
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {routeData.stops.map((stop, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="flex items-center gap-2 flex-1">
                            <MapPin size={14} className="text-muted-foreground flex-shrink-0" />
                            <Input
                              value={stop}
                              onChange={(e) => updateStop(index, e.target.value)}
                              placeholder={`Stop ${index + 1} (e.g., Central Station, Mall Plaza)`}
                              className="flex-1"
                            />
                          </div>
                          {routeData.stops.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeStop(index)}
                              className="p-2 text-red-600 hover:bg-red-100 flex-shrink-0"
                            >
                              <Trash2 size={14} />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Add all stops on your route. Include popular landmarks and areas for better search results.
                    </p>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-green-600 hover:bg-green-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Creating Account...' : 'Complete Registration'}
                  </Button>
                </div>
              )}
              
            </form>
          </CardContent>
        </Card>

          {/* Back to Login */}
          <div className="text-center mt-6">
            <p className="text-muted-foreground mb-2">Already have an account?</p>
            <Button 
              variant="link" 
              onClick={() => onShowScreen('driverLogin')}
              className="text-indigo-600 hover:text-indigo-700 p-0"
            >
              Sign in here
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}