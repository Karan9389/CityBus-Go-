import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ArrowLeft, User, Phone, Lock, UserPlus } from 'lucide-react';
import { motion } from 'motion/react';
import { useForm } from 'react-hook-form@7.55.0';
import type { Screen } from '../App';

interface DriverRegisterProps {
  onShowScreen: (screen: Screen) => void;
  onShowNotification: (message: string) => void;
}

interface RegisterFormData {
  name: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export default function DriverRegister({ onShowScreen, onShowNotification }: DriverRegisterProps) {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<RegisterFormData>();
  
  const password = watch('password');

  const onSubmit = (data: RegisterFormData) => {
    // Check if driver already exists
    const existingDriver = localStorage.getItem(`driver_${data.phone}`);
    if (existingDriver) {
      onShowNotification('A driver with this phone number already exists.');
      return;
    }

    // Save driver data
    const driverData = {
      name: data.name,
      phone: data.phone,
      password: data.password
    };
    
    localStorage.setItem(`driver_${data.phone}`, JSON.stringify(driverData));
    onShowNotification(`Registration successful for ${data.name}! Please log in.`);
    onShowScreen('driverLogin');
  };

  return (
    <div className="h-full flex flex-col p-6">
      
      {/* Header */}
      <div className="flex items-center mb-8">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onShowScreen('driverLogin')}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft size={20} />
        </Button>
        <h2 className="ml-4">Driver Registration</h2>
      </div>

      {/* Registration Form */}
      <motion.div 
        className="flex-1 flex flex-col justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-0 shadow-none">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto bg-green-100 rounded-full p-4 w-fit mb-4">
              <UserPlus className="text-green-600" size={32} />
            </div>
            <CardTitle>Create Account</CardTitle>
            <p className="text-muted-foreground">Join as a verified bus driver</p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              
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
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a strong password"
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                  <Lock size={16} />
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  className="h-12"
                  {...register('confirmPassword', { 
                    required: 'Please confirm your password',
                    validate: value => value === password || 'Passwords do not match'
                  })}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-green-600 hover:bg-green-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </Button>
              
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
  );
}