import axios from "axios";
import { useAuthStore } from "./auth-store";

export const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) || "http://127.0.0.1:8000";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export function extractErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
    if (error.message === "Network Error") {
      return "Can't reach the NidhiAI server. Make sure the backend is running.";
    }
  }
  return fallback;
}

// ---- Types ----

export interface Profile {
  email: string;
  id: string;
  full_name?: string;
  role: "student" | "parent" | "admin";
  standard?: string | null;
  [key: string]: unknown;
}

export interface Subject {
  id: string;
  name: string;
  standard: string;
  description?: string | null;
  created_at?: string;
}

export interface AskResponse {
  answer: string;
  used_textbook: boolean;
  source_pages: number[];
}

export interface InfographicResponse {
  id: string;
  title: string;
  points: string[];
  png_url: string;
  pdf_url: string;
}

// ---- Auth ----

export async function signup(payload: {
  email: string;
  password: string;
  full_name: string;
  role: "student" | "parent";
  standard?: string;
}) {
  const { data } = await api.post("/auth/signup", payload);
  return data;
}

export async function login(payload: { email: string; password: string }) {
  const { data } = await api.post<{
    access_token: string;
    refresh_token: string;
    user_id: string;
  }>("/auth/login", payload);
  return data;
}

export async function fetchMe() {
  const { data } = await api.get<Profile>("/auth/me");
  return data;
}

// ---- Subjects ----

export async function fetchSubjects() {
  const { data } = await api.get<Subject[]>("/subjects");
  return data;
}

export async function createSubject(payload: { name: string; standard: string; description?: string }) {
  const { data } = await api.post<Subject>("/subjects", payload);
  return data;
}

// ---- Ask ----

export async function askQuestion(payload: {
  question: string;
  subject?: string;
  subject_id?: string;
  standard?: string;
}) {
  const { data } = await api.post<AskResponse>("/ask", payload);
  return data;
}

// ---- Infographics ----

export async function generateInfographic(payload: { topic: string; standard?: string }) {
  const { data } = await api.post<InfographicResponse>("/infographics/generate", payload);
  return data;
}

export function infographicDownloadUrl(fileId: string, format: "png" | "pdf") {
  return `${API_BASE_URL}/infographics/${fileId}/download?format=${format}`;
}
