import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ArrowLeft, Phone, Lock, LogIn, Home } from 'lucide-react';
import { motion } from 'motion/react';
import { useForm } from 'react-hook-form';
import type { Screen, Driver } from '../App';
import { api } from '../services/api';

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
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await api.driverLogin({
        phone: data.phone.trim(),
        password: data.password,
      });

      if (response.driver) {
        reset();
        onDriverLogin(response.driver);
        
        if (response.routeConfig && response.routeConfig.routeId) {
          onShowScreen('driverDashboard');
          onShowNotification(`Welcome back, ${response.driver.name}! 🚌`);
        } else {
          onShowScreen('driverConfig');
          onShowNotification(`Welcome back, ${response.driver.name}! Please configure your route.`);
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      onShowNotification(error.message || 'Login failed. Please check credentials.');
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
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </Button>
          <h2 className="ml-4 font-bold text-lg">Driver Login</h2>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onGoHome}
          className="p-2 hover:bg-gray-100 rounded-full"
          aria-label="Go to home"
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
                        value: /^\+?[1-9]\d{1,14}$/,
                        message: 'Please enter a valid phone number (e.g., +1234567890)'
                      },
                      setValueAs: (value) => value.trim()
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
                    placeholder="Enter your password (min. 4 characters)"
                    className="h-12"
                    {...register('password', { 
                      required: 'Password is required',
                      minLength: {
                        value: 4,
                        message: 'Password must be at least 4 characters'
                      }
                    })}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Signing in...' : 'Sign In'}
                </Button>

                <div className="text-center mt-4">
                  <p className="text-sm text-muted-foreground mb-2">Forgot your password?</p>
                  <Button 
                    variant="link" 
                    className="text-sm text-indigo-600 hover:text-indigo-700 p-0"
                    onClick={() => onShowNotification('Password reset feature coming soon')}
                  >
                    Request password reset
                  </Button>
                </div>
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