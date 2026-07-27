import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ArrowLeft, User, Phone, Lock, Save } from 'lucide-react';
import { motion } from 'motion/react';
import { useForm } from 'react-hook-form';
import type { Screen, Driver } from '../App';
import { api } from '../services/api';

interface DriverEditProps {
  loggedInDriver: Driver | null;
  onGoBack: () => void;
  onDriverUpdate: (driver: Driver) => void;
  onShowNotification: (message: string) => void;
  onGoHome?: () => void;
}

interface EditFormData {
  name: string;
  phone: string;
  newPassword?: string;
  confirmPassword?: string;
}

export default function DriverEdit({ loggedInDriver, onGoBack, onDriverUpdate, onShowNotification }: DriverEditProps) {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<EditFormData>({
    defaultValues: {
      name: loggedInDriver?.name || '',
      phone: loggedInDriver?.phone || '',
      newPassword: '',
      confirmPassword: ''
    }
  });
  
  const newPassword = watch('newPassword');

  const onSubmit = async (data: EditFormData) => {
    try {
      const response = await api.updateDriverProfile({
        name: data.name.trim(),
        phone: data.phone.trim(),
        password: data.newPassword ? data.newPassword.trim() : undefined,
      });

      if (response.driver) {
        onDriverUpdate(response.driver);
        onShowNotification('Profile updated successfully!');
        onGoBack();
      }
    } catch (error: any) {
      console.error('Update profile error:', error);
      onShowNotification(error.message || 'Failed to update profile.');
    }
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
        <div className="flex-1 text-center">
          <h2 className="font-bold text-lg">Edit Profile</h2>
          <p className="text-muted-foreground text-xs">Update your personal account details</p>
        </div>
      </div>

      {/* Form */}
      <motion.div 
        className="flex-1 overflow-y-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <User size={18} />
                Driver Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2 text-xs">
                  <User size={14} />
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  className="h-11"
                  {...register('name', { 
                    required: 'Full name is required' 
                  })}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2 text-xs">
                  <Phone size={14} />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  className="h-11"
                  {...register('phone', { 
                    required: 'Phone number is required' 
                  })}
                />
                {errors.phone && (
                  <p className="text-xs text-destructive">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="flex items-center gap-2 text-xs">
                  <Lock size={14} />
                  New Password (Optional)
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Leave blank to keep current password"
                  className="h-11"
                  {...register('newPassword', {
                    minLength: {
                      value: 4,
                      message: 'Password must be at least 4 characters'
                    }
                  })}
                />
                {errors.newPassword && (
                  <p className="text-xs text-destructive">{errors.newPassword.message}</p>
                )}
              </div>

              {newPassword && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="flex items-center gap-2 text-xs">
                    <Lock size={14} />
                    Confirm New Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    className="h-11"
                    {...register('confirmPassword', {
                      validate: value => value === newPassword || 'Passwords do not match'
                    })}
                  />
                  {errors.confirmPassword && (
                    <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
                  )}
                </div>
              )}

            </CardContent>
          </Card>

          <Button 
            type="submit" 
            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2"
            disabled={isSubmitting}
          >
            <Save size={18} />
            {isSubmitting ? 'Updating Profile...' : 'Save Profile Changes'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}