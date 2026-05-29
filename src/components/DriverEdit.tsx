import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ArrowLeft, User, Phone, Lock, Save, Shield } from 'lucide-react';
import { motion } from 'motion/react';
import { useForm } from 'react-hook-form@7.55.0';
import type { Screen, Driver } from '../App';

interface DriverEditProps {
  loggedInDriver: Driver | null;
  onGoBack: () => void;
  onDriverUpdate: (driver: Driver) => void;
  onShowNotification: (message: string) => void;
}

interface EditFormData {
  name: string;
  phone: string;
  currentPassword: string;
  newPassword?: string;
  confirmPassword?: string;
}

export default function DriverEdit({ loggedInDriver, onGoBack, onDriverUpdate, onShowNotification }: DriverEditProps) {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<EditFormData>({
    defaultValues: {
      name: loggedInDriver?.name || '',
      phone: loggedInDriver?.phone || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });
  
  const newPassword = watch('newPassword');

  const onSubmit = (data: EditFormData) => {
    if (!loggedInDriver) return;

    // Verify current password
    if (data.currentPassword !== loggedInDriver.password) {
      onShowNotification('Current password is incorrect.');
      return;
    }

    // Check if phone number changed and if it's already taken by another driver
    if (data.phone !== loggedInDriver.phone) {
      const existingDriver = localStorage.getItem(`driver_${data.phone}`);
      if (existingDriver) {
        onShowNotification('A driver with this phone number already exists.');
        return;
      }
      
      // Remove old driver data
      localStorage.removeItem(`driver_${loggedInDriver.phone}`);
      // Also update route config key if it exists
      const routeConfig = localStorage.getItem(`route_config_${loggedInDriver.phone}`);
      if (routeConfig) {
        localStorage.removeItem(`route_config_${loggedInDriver.phone}`);
        localStorage.setItem(`route_config_${data.phone}`, routeConfig);
      }
      // Update location data key if it exists
      const routeConfigData = routeConfig ? JSON.parse(routeConfig) : null;
      if (routeConfigData) {
        const locationData = localStorage.getItem(`bus_location_${routeConfigData.routeId}`);
        if (locationData) {
          // Location data uses routeId, not phone, so no need to update
        }
      }
    }

    // Update driver data
    const updatedDriver: Driver = {
      name: data.name,
      phone: data.phone,
      password: data.newPassword || loggedInDriver.password
    };
    
    localStorage.setItem(`driver_${data.phone}`, JSON.stringify(updatedDriver));
    onDriverUpdate(updatedDriver);
    onShowNotification('Profile updated successfully!');
    onGoBack();
  };

  if (!loggedInDriver) {
    return null;
  }

  return (
    <div className="h-full flex flex-col p-6">
      
      {/* Header */}
      <div className="flex items-center mb-8">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onGoBack}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft size={20} />
        </Button>
        <h2 className="ml-4">Edit Profile</h2>
      </div>

      {/* Edit Form */}
      <motion.div 
        className="flex-1 overflow-y-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-0 shadow-none">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto bg-indigo-100 rounded-full p-4 w-fit mb-4">
              <User className="text-indigo-600" size={32} />
            </div>
            <CardTitle>Update Your Information</CardTitle>
            <p className="text-muted-foreground">Modify your profile details</p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Personal Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <User size={16} className="text-muted-foreground" />
                  <h4>Personal Information</h4>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
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
                  <Label htmlFor="phone">Phone Number</Label>
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
              </div>

              {/* Password Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield size={16} className="text-muted-foreground" />
                  <h4>Security</h4>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    placeholder="Enter your current password"
                    className="h-12"
                    {...register('currentPassword', { 
                      required: 'Current password is required to make changes'
                    })}
                  />
                  {errors.currentPassword && (
                    <p className="text-sm text-destructive">{errors.currentPassword.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password (Optional)</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Leave blank to keep current password"
                    className="h-12"
                    {...register('newPassword', { 
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters'
                      }
                    })}
                  />
                  {errors.newPassword && (
                    <p className="text-sm text-destructive">{errors.newPassword.message}</p>
                  )}
                </div>

                {newPassword && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your new password"
                      className="h-12"
                      {...register('confirmPassword', { 
                        validate: value => !newPassword || value === newPassword || 'Passwords do not match'
                      })}
                    />
                    {errors.confirmPassword && (
                      <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                    )}
                  </div>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700"
                disabled={isSubmitting}
              >
                <Save className="mr-2" size={20} />
                {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
              </Button>
              
            </form>
          </CardContent>
        </Card>

        {/* Security Note */}
        <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-start gap-3">
            <Shield className="text-amber-600 mt-0.5" size={16} />
            <div>
              <h4 className="text-amber-800 mb-1">Security Note</h4>
              <p className="text-sm text-amber-700">
                Your current password is required to make any changes. If you change your phone number, make sure to remember it as it's used for login.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}