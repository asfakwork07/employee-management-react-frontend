import axios from "axios";

export const API_URL =
  window.location.hostname === "localhost"
    ? "http://13.49.241.55:8080/api"
    : "https://employee-management-backend-spring-boot-1.onrender.com/api";

let pending = 0;

const listeners = new Set();

const emit = () => {
  listeners.forEach((fn) => fn(pending > 0));
};

export const subscribeLoading = (fn) => {
  listeners.add(fn);

  return () => listeners.delete(fn);
};

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(
  (config) => {
    const skipLoader = config.skipGlobalLoader === true;

    if (!skipLoader) {
      pending++;
      emit();
    }

    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },

  (error) => {
    if (!error.config?.skipGlobalLoader) {
      pending = Math.max(0, pending - 1);
      emit();
    }

    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => {
    if (!response.config?.skipGlobalLoader) {
      pending = Math.max(0, pending - 1);
      emit();
    }

    return response;
  },

  (error) => {
    if (!error.config?.skipGlobalLoader) {
      pending = Math.max(0, pending - 1);
      emit();
    }

    if (error.response?.status === 401 && localStorage.getItem("token")) {
      localStorage.clear();
      location.href = "/login";
    }

    return Promise.reject(error);
  },
);

export const errorMessage = (error, fallback = "Something went wrong.") =>
  typeof error?.response?.data === "string"
    ? error.response.data
    : error?.response?.data?.detail ||
      error?.response?.data?.message ||
      error?.message ||
      fallback;

export default api;
