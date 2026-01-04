// controlApi.ts
import axios from "axios";
import type { AxiosInstance } from "axios";

const api = import.meta.env.VITE_CONTROL_API_URL as string;
const app_token = import.meta.env.VITE_CONTROL_TOKEN as string;

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

export const controlApi: AxiosInstance = axios.create({
  baseURL: api,
  headers: {
    "Content-Type": "application/json",
    accept: "application/json",
    "Accept-Language": getLanguage(),
    Token: app_token,
  },
});
