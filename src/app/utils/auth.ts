import type { Driver, RouteConfig } from '../App';

const API_BASE_URL = ((import.meta as any).env?.VITE_API_BASE_URL as string) || 'http://localhost:5000';
const AUTH_STORAGE_KEY = 'driver_auth';
const LOCAL_DRIVER_PREFIX = 'driver_';

console.debug('[Auth] API base URL:', API_BASE_URL);

export interface DriverAuthPayload {
  token: string;
  driver: Driver;
}

export interface LocalDriver extends Driver {
  password: string;
}

export const getApiBaseUrl = () => API_BASE_URL;

export const loginDriverApi = async (phone: string, password: string): Promise<DriverAuthPayload> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ phone, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || 'Login failed');
  }

  return {
    token: data.token,
    driver: data.driver,
  };
};

export const registerDriverApi = async (name: string, phone: string, password: string): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, phone, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || 'Registration failed');
  }

  return data;
};

export const getDriverAuth = (): DriverAuthPayload | null => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn('Failed to read auth from storage:', error);
    return null;
  }
};

export const setDriverAuth = (payload: DriverAuthPayload): void => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
};

export const clearDriverAuth = (): void => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

export const getLocalDriver = (phone: string): LocalDriver | null => {
  try {
    const raw = localStorage.getItem(`${LOCAL_DRIVER_PREFIX}${phone}`);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn('Failed to read local driver from storage:', error);
    return null;
  }
};

export const setLocalDriver = (driver: LocalDriver): void => {
  localStorage.setItem(`${LOCAL_DRIVER_PREFIX}${driver.phone}`, JSON.stringify(driver));
};

export const getRouteConfig = (phone: string): RouteConfig | null => {
  try {
    const raw = localStorage.getItem(`route_config_${phone}`);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn('Failed to read route config from storage:', error);
    return null;
  }
};

export const setRouteConfig = (phone: string, config: RouteConfig): void => {
  localStorage.setItem(`route_config_${phone}`, JSON.stringify(config));
};
