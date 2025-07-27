import axios from "axios";

const Api = axios.create({
    // Use environment variable for baseURL
    baseURL: process.env.REACT_APP_API_BASE_URL, 
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true, // IMPORTANT: Allows sending cookies (including HttpOnly if your backend uses them)
});

Api.interceptors.request.use(
    config => {
      const token = localStorage.getItem('userToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      return config;
    },
    error => Promise.reject(error)
);

export default Api;