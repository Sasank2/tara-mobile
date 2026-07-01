import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://10.0.0.10:8080/api';
const FIREBASE_API_KEY = 'AIzaSyBjgzE1qZzv7EAd1HJOKTw-04uMkFC75_Y';

const api = axios.create({ baseURL: API_BASE_URL });

// Refresh Firebase token using refresh token
const refreshFirebaseToken = async (): Promise<string | null> => {
  try {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    if (!refreshToken) return null;
    const res = await axios.post(
      `https://securetoken.googleapis.com/v1/token?key=${FIREBASE_API_KEY}`,
      { grant_type: 'refresh_token', refresh_token: refreshToken }
    );
    const newToken = res.data.id_token;
    const newRefreshToken = res.data.refresh_token;
    await AsyncStorage.setItem('token', newToken);
    await AsyncStorage.setItem('refreshToken', newRefreshToken);
    return newToken;
  } catch (e) {
    console.log('Token refresh failed', e);
    return null;
  }
};

// Request interceptor — add token to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor — auto refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const newToken = await refreshFirebaseToken();
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export const authAPI = {
  login: (email: string, password: string) =>
    axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
      { email, password, returnSecureToken: true }
    ),
};

export const userAPI = {
  getUser: () => api.get('/user'),
};

export const profileAPI = {
  createBirthProfile: (data: any) => api.post('/profile/birth', data),
  getBirthProfile: () => api.get('/profile/birth'),
  updateBirthProfile: (data: any) => api.put('/profile/birth', data),
};

export const chartAPI = {
  getWesternChart: () => api.get('/charts/western'),
  getVedicChart: () => api.get('/charts/vedic'),
};

export const planetAPI = {
  getTodayPlanets: () => api.get('/planets/today'),
};

export const moodAPI = {
  saveMood: (data: any) => api.post('/mood', data),
  getLatestMood: () => api.get('/mood/latest'),
};

export const homeAPI = {
  getHome: () => api.get('/home'),
};

export const taraAPI = {
  chat: (data: any) => api.post('/taraAi/chat', { question: data.message || data.question }),
};

export const journalAPI = {
  getEntries: () => api.get('/journal'),
  createEntry: (data: any) => api.post('/journal', data),
};
