import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('Connected to Socket.io server:', socket?.id);
    });

    socket.on('connect_error', (error) => {
      console.warn('Socket connection error:', error.message);
    });
  }
  return socket;
};

export const socketService = {
  // Driver socket actions
  startDriverTracking: (routeId: string) => {
    const s = getSocket();
    s.emit('driver_start_tracking', routeId);
  },

  stopDriverTracking: (routeId: string) => {
    const s = getSocket();
    s.emit('driver_stop_tracking', routeId);
  },

  updateDriverLocation: (data: { routeId: string; lat: number; lng: number; timestamp?: number }) => {
    const s = getSocket();
    s.emit('driver_update_location', {
      ...data,
      timestamp: data.timestamp || Date.now(),
    });
  },

  // Commuter socket actions
  joinCommuterTracking: (routeId: string) => {
    const s = getSocket();
    s.emit('commuter_join_tracking', routeId);
  },

  leaveCommuterTracking: (routeId: string) => {
    const s = getSocket();
    s.emit('commuter_leave_tracking', routeId);
  },

  // Listeners
  onBusLocationChange: (callback: (data: { routeId: string; lat: number; lng: number; timestamp: number; isLive?: boolean }) => void) => {
    const s = getSocket();
    s.on('bus_location_change', callback);
    return () => {
      s.off('bus_location_change', callback);
    };
  },

  onBusStatusChange: (callback: (data: { routeId: string; isLive: boolean }) => void) => {
    const s = getSocket();
    s.on('bus_status_change', callback);
    return () => {
      s.off('bus_status_change', callback);
    };
  },
};
