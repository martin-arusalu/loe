/** Base URL for the Neurokõne text-to-speech API. */
export const TTS_API_URL = "https://api.tartunlp.ai/text-to-speech/v2";

/**
 * Voice to use for synthesis.
 * Available speakers (from GET /v2): mari, vesta, tambet, liivika, kalev, külli, ...
 */
export const TTS_SPEAKER = "vesta";

/**
 * Playback speed multiplier sent to the API.
 * Valid range: 0.5 – 2.0  (1.0 = normal speed)
 */
export const TTS_SPEED = 1.0;
