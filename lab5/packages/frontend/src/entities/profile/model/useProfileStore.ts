import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ProfileData {
  id: string;
  nickname: string;
  password: string;
}

interface ProfileState {
  profile: ProfileData | null;
  setProfile: (profile: ProfileData) => void;
  clearProfile: () => void;
}

const storageKey = "strategy-profile";

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profile: null,
      setProfile: (profile) => set({ profile }),
      clearProfile: () => set({ profile: null }),
    }),
    { name: storageKey }
  )
);
