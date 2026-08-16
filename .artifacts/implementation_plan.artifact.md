# Shourov Hub - Crash Fix Implementation Plan

এই প্ল্যানটি অ্যাপের "Keeps Stopping" এরর সমাধান করার জন্য।

## User Review Required

> [!IMPORTANT]
> **Version Downgrade:** আমি আপনার প্রজেক্টের লাইব্রেরি ভার্সনগুলো কিছুটা কমিয়ে আনব যাতে সেগুলো এক্সপো (Expo) এর সাথে ঠিকমতো কাজ করে। এতে আপনার কোড হারাবে না, শুধু অ্যাপটি স্টেবল হবে।

## Proposed Changes

### [Library Versions]

#### [MODIFY] [package.json](file:///D:/media-flow-android-studio/media-flow-android-studio/package.json)
- `react` এবং `react-native` এর ভার্সন Expo 54 এর রিকমেন্ডেড ভার্সনে সেট করা হবে।

### [App Configuration]

#### [MODIFY] [app.json](file:///D:/media-flow-android-studio/media-flow-android-studio/app.json)
- `reactCompiler` সাময়িকভাবে বন্ধ করা হবে কারণ এটি নতুন ভার্সনে অনেক সময় ক্র্যাশ ঘটায়।

### [Initial State]

#### [MODIFY] [MediaFlowProvider.tsx](file:///D:/media-flow-android-studio/media-flow-android-studio/state/MediaFlowProvider.tsx)
- নোটিফিকেশন হ্যান্ডলারটি আরও সতর্কভাবে (Safe initialization) লোড করা হবে।

## Verification Plan

### Manual Verification
1. `npm install` চালিয়ে দেখা যে কোনো এরর আসে কি না।
2. `npx expo start` দিয়ে পিসিতে চেক করা।
3. সব ঠিক থাকলে আবার `eas build` করা।
