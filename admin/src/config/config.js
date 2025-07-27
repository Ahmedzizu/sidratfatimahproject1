import axios from "axios";

const Api = axios.create({
  baseURL: process.env.REACT_APP_API_URL, 
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

Api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("adminToken"); 
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default Api;