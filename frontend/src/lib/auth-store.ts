import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Profile } from "./api";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  profile: Profile | null;
  setSession: (tokens: { accessToken: string; refreshToken: string }) => void;
  setProfile: (profile: Profile | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      profile: null,
      setSession: ({ accessToken, refreshToken }) => set({ accessToken, refreshToken }),
      setProfile: (profile) => set({ profile }),
      logout: () => set({ accessToken: null, refreshToken: null, profile: null }),
    }),
    { name: "nidhiai-auth" }
  )
);
