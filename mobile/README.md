# Lauselt — native app

React Native / Expo port of the Lauselt PWA, targeting the App Store and Google Play.
See [PLAN.md](PLAN.md) for the full porting plan, milestones and store checklist.

## Status

Milestone 0 (scaffold) is done: project config, theme, data/auth/API layer,
navigation, and first-pass ports of every screen. It is **not yet runnable
end-to-end** — see "Before it runs" below.

## Getting started

```bash
cd mobile
npm install
npm install
npx expo install --fix         # pins every package to the versions your Expo SDK expects
npx expo-doctor
```

Then, because several native modules are used (Google Sign-In, Apple
Authentication, SQLite, SecureStore, Audio), this needs a **development build**,
not Expo Go:

```bash
npx expo run:ios       # or
npx expo run:android
```

## Local preview mode

The project currently has `LOCAL_PREVIEW_MODE` enabled in `src/lib/constants.ts`.
This skips OAuth and backend sync, opens the home screen directly, and lets you
test local EPUB import and reading. Set it to `false` when your credentials are ready.
The `app/login.tsx` route is also intentionally omitted in this mode; restore it
from version control when enabling OAuth.

## Before a real account/build

These placeholders in `app.json` / `eas.json` must be filled in:

| Placeholder                                      | Where to get it                                                                  |
| ------------------------------------------------ | -------------------------------------------------------------------------------- |
| Google OAuth client IDs                          | Google Cloud console (iOS client ID + reversed URL scheme, Android SHA-1 client) |
| `REPLACE_WITH_EAS_PROJECT_ID`                    | `eas init`                                                                       |
| `REPLACE_WITH_APPLE_ID` / `TEAM_ID` / `ascAppId` | App Store Connect                                                                |
| `secrets/play-service-account.json`              | Play Console → API access                                                        |

Backend work also required (see PLAN.md §2.4 and §6):

- `POST /auth/apple` — Sign in with Apple is mandatory alongside Google.
- `DELETE /auth/account` — in-app account deletion is mandatory.

## Layout

```
app/         expo-router routes (index, login, privaatsus, tingimused)
src/lib/     api / auth / storage / chunker / parseEpub / analytics
src/screens/ ports of the web components
src/hooks/   useTts (expo-audio)
src/theme.ts design tokens mirrored from the web globals.css
```

`src/lib/api.ts` and `src/lib/chunker.ts` are byte-identical copies of the web
versions — keep them in sync when either side changes.
