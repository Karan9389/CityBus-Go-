import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ArrowLeft, Phone, Lock, LogIn, Home } from 'lucide-react';
import { motion } from 'motion/react';
import { useForm } from 'react-hook-form';
import type { Screen, Driver } from '../App';
import { loginDriverApi, setDriverAuth, getLocalDriver, setLocalDriver } from '../utils/auth';

interface DriverLoginProps {
  onShowScreen: (screen: Screen) => void;
  onGoBack: () => void;
  onDriverLogin: (driver: Driver) => void;
  onShowNotification: (message: string) => void;
  onGoHome: () => void;
}

interface LoginFormData {
  phone: string;
  password: string;
}

export default function DriverLogin({ onShowScreen, onGoBack, onDriverLogin, onShowNotification, onGoHome }: DriverLoginProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError, clearErrors } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    try {
      clearErrors(['phone', 'password']);
      const localDriver = getLocalDriver(data.phone);
      let backendLoginUnavailable = false;

      if (navigator.onLine) {
        try {
          const authPayload = await loginDriverApi(data.phone, data.password);
          setDriverAuth(authPayload);
          setLocalDriver({ ...authPayload.driver, password: data.password });
          onDriverLogin(authPayload.driver);

          const routeConfig = localStorage.getItem(`route_config_${authPayload.driver.phone}`);
          if (routeConfig) {
            onShowScreen('driverDashboard');
            onShowNotification(`Welcome back, ${authPayload.driver.name}! 🚌`);
          } else {
            onShowScreen('driverConfig');
            onShowNotification(`Welcome back, ${authPayload.driver.name}! Please configure your route.`);
          }
          return;
        } catch (error: any) {
          const message = error?.message || 'Login failed';
          if (message.includes('Invalid phone number') || message.includes('Invalid phone') || message.includes('password')) {
            setError('phone', { type: 'manual', message: 'Invalid phone number or password' });
            setError('password', { type: 'manual', message: 'Invalid phone number or password' });
            onShowNotification('Incorrect phone number or password. Please try again.');
            return;
          }

          if (message.toLowerCase().includes('fetch') || message.toLowerCase().includes('network') || message.toLowerCase().includes('failed to fetch') || message.toLowerCase().includes('failed')) {
            backendLoginUnavailable = true;
            console.warn('Backend auth server may be unreachable:', error);
            onShowNotification('Unable to reach authentication server. Trying local login if available.');
          } else {
            console.warn('Backend login failed, falling back to local credentials if available:', error);
          }
        }
      }

      if (localDriver) {
        if (localDriver.password === data.password) {
          onDriverLogin(localDriver);
          const routeConfig = localStorage.getItem(`route_config_${localDriver.phone}`);
          if (routeConfig) {
            onShowScreen('driverDashboard');
            onShowNotification(`Welcome back, ${localDriver.name}! 🚌`);
          } else {
            onShowScreen('driverConfig');
            onShowNotification(`Welcome back, ${localDriver.name}! Please configure your route.`);
          }
        } else {
          setError('password', { type: 'manual', message: 'Wrong password' });
          onShowNotification('Incorrect details. Please check your phone number and password.');
        }
      } else if (backendLoginUnavailable) {
        setError('phone', { type: 'manual', message: 'Authentication server unavailable' });
        onShowNotification('Authentication server is unavailable and no local account exists. Please register or try again later.');
      } else {
        setError('phone', { type: 'manual', message: 'User is not registered' });
        onShowNotification('User is not registered. Please sign up or check your phone number.');
      }
    } catch (error) {
      console.error('Login error:', error);
      onShowNotification('Login failed. Please try again.');
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
          <h2 className="ml-4">Driver Login</h2>
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
        {/* Login Form */}
        <motion.div 
          className="flex flex-col justify-center min-h-full py-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
        <Card className="border-0 shadow-none">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto bg-indigo-100 rounded-full p-4 w-fit mb-4">
              <LogIn className="text-indigo-600" size={32} />
            </div>
            <CardTitle>Welcome Back</CardTitle>
            <p className="text-muted-foreground">Sign in to your driver account</p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
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
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="h-12"
                  {...register('password', { 
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </Button>
              
            </form>
          </CardContent>
        </Card>

          {/* Register Link */}
          <div className="text-center mt-8">
            <p className="text-muted-foreground mb-2">New driver?</p>
            <Button 
              variant="link" 
              onClick={() => onShowScreen('driverRegister')}
              className="text-indigo-600 hover:text-indigo-700 p-0"
            >
              Register your account here
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}