import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ArrowLeft, Phone, Lock, LogIn } from 'lucide-react';
import { motion } from 'motion/react';
import { useForm } from 'react-hook-form@7.55.0';
import type { Screen, Driver } from '../App';

interface DriverLoginProps {
  onShowScreen: (screen: Screen) => void;
  onDriverLogin: (driver: Driver) => void;
  onShowNotification: (message: string) => void;
}

interface LoginFormData {
  phone: string;
  password: string;
}

export default function DriverLogin({ onShowScreen, onDriverLogin, onShowNotification }: DriverLoginProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>();

  const onSubmit = (data: LoginFormData) => {
    const driverData = localStorage.getItem(`driver_${data.phone}`);
    
    if (driverData) {
      const driver = JSON.parse(driverData);
      if (driver.password === data.password) {
        onDriverLogin(driver);
        
        // Check if route is already configured
        const routeConfig = localStorage.getItem(`route_config_${driver.phone}`);
        if (routeConfig) {
          onShowScreen('driverDashboard');
        } else {
          onShowScreen('driverConfig');
        }
        
        onShowNotification(`Welcome back, ${driver.name}!`);
      } else {
        onShowNotification('Incorrect password.');
      }
    } else {
      onShowNotification('No driver found with this phone number.');
    }
  };

  return (
    <div className="h-full flex flex-col p-6">
      
      {/* Header */}
      <div className="flex items-center mb-8">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onShowScreen('welcome')}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft size={20} />
        </Button>
        <h2 className="ml-4">Driver Login</h2>
      </div>

      {/* Login Form */}
      <motion.div 
        className="flex-1 flex flex-col justify-center"
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
  );
}