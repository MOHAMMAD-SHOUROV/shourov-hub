# MediaFlow Android Studio package

This folder contains the MediaFlow Expo source and the generated `android/`
native project. Open the `android/` folder in Android Studio to work with the
native Android project.

## Build steps

1. Install Node.js LTS, Android Studio, and an Android SDK.
2. Open a terminal in this project folder.
3. Run `npm install`.
4. Open the `android/` folder in Android Studio and let Gradle sync.
5. Build with **Build > Make Project** or run `./gradlew assembleDebug` from
   the `android/` folder.

The debug APK will be created at:

`android/app/build/outputs/apk/debug/app-debug.apk`

## YouTube live search

The current app works with a local catalog and authorized shared-link imports.
Live YouTube search/feed requires the official YouTube Data API. Google
provides a daily free quota, but you need your own Google Cloud project with
the API enabled. Do not put an API key directly in the mobile app; use a
small server or secure runtime configuration.

This app does not bypass DRM, remove watermarks, or download media from
platforms without permission.