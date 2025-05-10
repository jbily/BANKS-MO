import axios from 'axios';

// Create an axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle specific error codes
    if (error.response) {
      const { status } = error.response;
      
      // Handle 401 Unauthorized
      if (status === 401) {
        // If the error is due to token expiration, this will be handled in AuthContext
        // This is for other 401 errors
        console.error('Unauthorized access');
      }
      
      // Handle 403 Forbidden
      if (status === 403) {
        console.error('Forbidden resource');
      }
      
      // Handle 500 Server Error
      if (status >= 500) {
        console.error('Server error');
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Network error - no response received');
    } else {
      // Something happened in setting up the request
      console.error('Request configuration error', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api; 