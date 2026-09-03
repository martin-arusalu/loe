import Constants from "expo-constants";
import appJson from "../../app.json";

export const APP_VERSION = appJson.expo.version;

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;

export const API_BASE = extra.apiBaseUrl ?? "https://api.lauselt.ee";
export const GOOGLE_WEB_CLIENT_ID = extra.googleWebClientId ?? "";
export const GOOGLE_IOS_CLIENT_ID = extra.googleIosClientId ?? "";

// Set true only for offline UI testing without an account or API connection.
export const LOCAL_PREVIEW_MODE = false;
export const LOCAL_PREVIEW_USER = {
  id: "local-preview",
  email: "preview@localhost",
  name: "Kohalik eelvaade",
} as const;
