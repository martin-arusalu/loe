import {
  init as amplitudeInit,
  reset as amplitudeReset,
  setUserId as amplitudeSetUserId,
  track as amplitudeTrack,
} from "@amplitude/analytics-react-native";
import { loadAuthUser } from "./auth";

const AMPLITUDE_API_KEY = "8f28bd7687521f98bbf342a0a78ee136";

export function initAnalytics(): void {
  amplitudeInit(AMPLITUDE_API_KEY, undefined, {
    serverZone: "EU",
    trackingSessionEvents: true,
  });
}

function getStoredUserId(): string | null {
  return loadAuthUser()?.id ?? null;
}

export function syncAmplitudeUser(): void {
  const userId = getStoredUserId();
  if (userId) {
    amplitudeSetUserId(userId);
  } else {
    amplitudeReset();
  }
}

export function trackEvent(
  eventName: string,
  eventProperties?: Record<string, unknown>,
) {
  const userId = getStoredUserId();
  if (userId) amplitudeSetUserId(userId);

  return amplitudeTrack(eventName, {
    ...(eventProperties ?? {}),
    ...(userId ? { userId } : {}),
  });
}
