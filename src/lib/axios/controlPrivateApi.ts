import axios from "axios";
import type { InternalAxiosRequestConfig, AxiosError } from "axios";
import { useAuthStore } from "@/store/auth";

// const clearData = (): void => {
//   useAuthStore.getState().clearAuth();
// };

const api = import.meta.env.VITE_CONTROL_API_URL as string;
const app_token = import.meta.env.VITE_CONTROL_TOKEN as string;

axios.defaults.baseURL = api;

const getLanguage = (): string => {
  try {
    const langItem = localStorage.getItem("lang");
    if (langItem) {
      const lang = langItem as string;
      return lang || "az";
    }
  } catch (error) {
    console.error("Error parsing language from localStorage:", error);
  }
  return "az";
};

axios.interceptors.request.use(
  async (
    config: InternalAxiosRequestConfig,
  ): Promise<InternalAxiosRequestConfig> => {
    const token = useAuthStore.getState().token;

    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
      config.headers.set("Accept-Language", getLanguage());
      config.headers.set("Token", app_token);
    }

    return config;
  },
  (error: AxiosError): Promise<never> => Promise.reject(error),
);

// axios.interceptors.response.use(
//   (response: AxiosResponse): AxiosResponse => response,
//   async (error: AxiosError): Promise<never> => {
//     if (error?.response?.status === 401) {
//       clearData();
//       window.location.href = window.location.origin + "/auth/signin";
//       throw error;
//     }
//     return Promise.reject(error);
//   }
// );

export const controlPrivateApi = axios;
