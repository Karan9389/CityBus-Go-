import React from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Bus, MapPin, UserCog, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import type { Screen } from '../App';

interface WelcomeScreenProps {
  onShowScreen: (screen: Screen) => void;
}

export default function WelcomeScreen({ onShowScreen }: WelcomeScreenProps) {
  return (
    <div className="h-full flex flex-col justify-center items-center p-6 bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 text-white relative overflow-hidden">
      
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <ImageWithFallback 
          src="https://images.unsplash.com/photo-1757181471096-c375cbb229bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBjaXR5JTIwYnVzJTIwdHJhbnNwb3J0YXRpb258ZW58MXx8fHwxNzU3NTk5NTYzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="City Bus"
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Floating Elements */}
      <motion.div 
        className="absolute top-20 left-8 text-white/20"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <Bus size={32} />
      </motion.div>
      
      <motion.div 
        className="absolute top-32 right-12 text-white/20"
        animate={{ y: [0, 15, 0] }}
        transition={{ duration: 4, repeat: Infinity, delay: 1 }}
      >
        <MapPin size={24} />
      </motion.div>

      <motion.div 
        className="absolute bottom-32 left-12 text-white/20"
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, delay: 2 }}
      >
        <Search size={28} />
      </motion.div>

      {/* Main Content */}
      <motion.div 
        className="text-center z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div 
          className="mb-8 bg-white/20 backdrop-blur-sm rounded-full p-6 inline-block"
          whileHover={{ scale: 1.1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Bus size={48} className="text-white" />
        </motion.div>
        
        <motion.h1 
          className="mb-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          CityBus Go
        </motion.h1>
        
        <motion.p 
          className="text-white/90 mb-12 px-4 leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Your reliable partner for live bus tracking in the city. Track buses in real-time and never miss your ride.
        </motion.p>
      </motion.div>

      {/* Action Buttons */}
      <motion.div 
        className="w-full space-y-4 z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Button 
          onClick={() => onShowScreen('driverLogin')}
          className="w-full bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 py-6 rounded-2xl transition-all duration-300 group"
          variant="outline"
        >
          <UserCog className="mr-3 group-hover:rotate-12 transition-transform" size={20} />
          Driver Portal
        </Button>
        
        <Button 
          onClick={() => onShowScreen('commuterSearch')}
          className="w-full bg-white text-indigo-600 hover:bg-white/90 py-6 rounded-2xl transition-all duration-300 group shadow-lg"
        >
          <Search className="mr-3 group-hover:scale-110 transition-transform" size={20} />
          Find My Bus
        </Button>
      </motion.div>

      {/* Bottom Accent */}
      <motion.div 
        className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/10 rounded-full blur-xl"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <motion.div 
        className="absolute -bottom-8 -right-8 w-32 h-32 bg-cyan-300/20 rounded-full blur-2xl"
        animate={{ scale: [1.2, 1, 1.2] }}
        transition={{ duration: 5, repeat: Infinity, delay: 1 }}
      />
    </div>
  );
}