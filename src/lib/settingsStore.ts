import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Privacy settings for this phone: PIN lock and discreet mode.
 * Kept in its own small store ("saheli:privacy") so it covers every family profile.
 */
export const PRIVACY_STORE_KEY = "saheli:privacy";

interface PrivacyState {
  pinHash: string | null;
  pinSalt: string | null;
  lockAfterMin: number; // lock again when she comes back after this many minutes away
  discreet: boolean;
  setPin: (hash: string, salt: string) => void;
  clearPin: () => void;
  setLockAfter: (min: number) => void;
  setDiscreet: (on: boolean) => void;
}

export const usePrivacyStore = create<PrivacyState>()(
  persist(
    (set) => ({
      pinHash: null,
      pinSalt: null,
      lockAfterMin: 5,
      discreet: false,
      setPin: (pinHash, pinSalt) => set({ pinHash, pinSalt }),
      clearPin: () => set({ pinHash: null, pinSalt: null }),
      setLockAfter: (lockAfterMin) => set({ lockAfterMin }),
      setDiscreet: (discreet) => set({ discreet }),
    }),
    { name: PRIVACY_STORE_KEY, storage: createJSONStorage(() => localStorage), version: 1 },
  ),
);

/** For reminder code: a notification title that respects discreet mode. */
export function notificationTitle(): string {
  return usePrivacyStore.getState().discreet ? "Reminder" : "Saheli";
}
