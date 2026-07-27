const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = (tokenKey: 'driver_token' | 'admin_token' = 'driver_token') => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = localStorage.getItem(tokenKey);
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

async function handleResponse(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }
  return data;
}

export const api = {
  // Auth API
  driverRegister: async (payload: {
    name: string;
    phone: string;
    password: string;
    routeId?: string;
    startTime?: string;
    endTime?: string;
    stops?: string[];
  }) => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await handleResponse(res);
    if (data.token) {
      localStorage.setItem('driver_token', data.token);
    }
    return data;
  },

  driverLogin: async (payload: { phone: string; password: string }) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await handleResponse(res);
    if (data.token) {
      localStorage.setItem('driver_token', data.token);
    }
    return data;
  },

  adminLogin: async (payload: { username: string; password: string }) => {
    const res = await fetch(`${API_BASE_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await handleResponse(res);
    if (data.token) {
      localStorage.setItem('admin_token', data.token);
    }
    return data;
  },

  // Driver API
  getDriverProfile: async () => {
    const res = await fetch(`${API_BASE_URL}/driver/profile`, {
      headers: getHeaders('driver_token'),
    });
    return handleResponse(res);
  },

  updateDriverProfile: async (payload: { name?: string; phone?: string; password?: string }) => {
    const res = await fetch(`${API_BASE_URL}/driver/profile`, {
      method: 'PUT',
      headers: getHeaders('driver_token'),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  saveRouteConfig: async (payload: {
    routeId: string;
    startTime: string;
    endTime: string;
    stops: string[];
  }) => {
    const res = await fetch(`${API_BASE_URL}/driver/route`, {
      method: 'POST',
      headers: getHeaders('driver_token'),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  getRouteConfig: async () => {
    const res = await fetch(`${API_BASE_URL}/driver/route`, {
      headers: getHeaders('driver_token'),
    });
    return handleResponse(res);
  },

  deleteRouteConfig: async () => {
    const res = await fetch(`${API_BASE_URL}/driver/route`, {
      method: 'DELETE',
      headers: getHeaders('driver_token'),
    });
    return handleResponse(res);
  },

  // Bus / Commuter API
  searchBuses: async (params?: { start?: string; destination?: string; query?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.start) queryParams.append('start', params.start);
    if (params?.destination) queryParams.append('destination', params.destination);
    if (params?.query) queryParams.append('q', params.query);

    const url = `${API_BASE_URL}/buses/search${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const res = await fetch(url);
    return handleResponse(res);
  },

  getAllBuses: async () => {
    const res = await fetch(`${API_BASE_URL}/buses/all`);
    return handleResponse(res);
  },

  getBusByRouteId: async (routeId: string) => {
    const res = await fetch(`${API_BASE_URL}/buses/${encodeURIComponent(routeId)}`);
    return handleResponse(res);
  },

  // Admin API
  getAdminStats: async () => {
    const res = await fetch(`${API_BASE_URL}/admin/stats`, {
      headers: getHeaders('admin_token'),
    });
    return handleResponse(res);
  },

  getAllDrivers: async () => {
    const res = await fetch(`${API_BASE_URL}/admin/drivers`, {
      headers: getHeaders('admin_token'),
    });
    return handleResponse(res);
  },

  getDriverById: async (id: string) => {
    const res = await fetch(`${API_BASE_URL}/admin/drivers/${id}`, {
      headers: getHeaders('admin_token'),
    });
    return handleResponse(res);
  },

  createDriver: async (payload: {
    name: string;
    phone: string;
    password: string;
    routeId?: string;
    startTime?: string;
    endTime?: string;
    stops?: string[];
  }) => {
    const res = await fetch(`${API_BASE_URL}/admin/drivers`, {
      method: 'POST',
      headers: getHeaders('admin_token'),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  updateDriver: async (
    id: string,
    payload: {
      name?: string;
      phone?: string;
      password?: string;
      routeId?: string;
      startTime?: string;
      endTime?: string;
      stops?: string[];
    }
  ) => {
    const res = await fetch(`${API_BASE_URL}/admin/drivers/${id}`, {
      method: 'PUT',
      headers: getHeaders('admin_token'),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  deleteDriver: async (id: string) => {
    const res = await fetch(`${API_BASE_URL}/admin/drivers/${id}`, {
      method: 'DELETE',
      headers: getHeaders('admin_token'),
    });
    return handleResponse(res);
  },
};
