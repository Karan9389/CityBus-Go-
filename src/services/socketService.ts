import { io, Socket } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log('⚡ Connected to CityBus Go Socket Server:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from Socket Server:', reason);
    });

    socket.on('connect_error', (error) => {
      console.warn('⚠️ Socket connection warning:', error.message);
    });
  }

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
};

export const emitDriverLocation = (data: {
  routeId: string;
  lat: number;
  lng: number;
  speed?: number | null;
  heading?: number | null;
  timestamp?: number;
}) => {
  const s = getSocket();
  s.emit('driver_update_location', data);
};

export const emitStopTracking = (routeId: string) => {
  const s = getSocket();
  s.emit('driver_stop_tracking', routeId);
};

export const joinTrackingRoom = (routeId: string, onLocationChange: (data: any) => void) => {
  const s = getSocket();
  s.emit('commuter_join_tracking', routeId);
  s.off('bus_location_change');
  s.on('bus_location_change', onLocationChange);
};

export const leaveTrackingRoom = (routeId: string) => {
  const s = getSocket();
  s.emit('commuter_leave_tracking', routeId);
  s.off('bus_location_change');
};
