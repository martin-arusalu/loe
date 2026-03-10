import {
  reset as amplitudeReset,
  setUserId as amplitudeSetUserId,
  track as amplitudeTrack,
} from "@amplitude/analytics-browser";
import { loadAuthUser } from "@/lib/auth";

function getStoredUserId(): string | null {
  const user = loadAuthUser();
  return user?.id ?? null;
}

export function syncAmplitudeUserFromLocalStorage(): void {
  const userId = getStoredUserId();
  if (userId) {
    amplitudeSetUserId(userId);
  } else {
    amplitudeReset();
  }
}

export function trackEvent(eventName: string, eventProperties?: Record<string, unknown>) {
  const userId = getStoredUserId();
  if (userId) {
    amplitudeSetUserId(userId);
  }

  return amplitudeTrack(eventName, {
    ...(eventProperties ?? {}),
    ...(userId ? { userId } : {}),
  });
}

