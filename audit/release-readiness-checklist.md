# Release readiness checklist

| Item | Status | Notes |
|---|---|---|
| targetSdk ≥ 36 | PASS | 36 |
| compileSdk | PASS | 36 |
| applicationId final | PASS | io.invoicestudio.app (cannot change after publishing) |
| versionCode / versionName | PASS | 1 / 1.0.0. Increase versionCode on every upload |
| AAB builds | PASS | `android/app/build/outputs/bundle/release/app-release.aab` (unsigned) |
| Upload key + signing | DEVELOPER ACTION | `keytool -genkeypair -v -keystore android/release.keystore -alias invoicestudio -keyalg RSA -keysize 2048 -validity 10000`, then copy `android/keystore.properties.example` → `keystore.properties`. Back up the keystore offline. Enrol in Play App Signing |
| R8 / minify | NOT VERIFIED | Off. Turn on only after on-device testing |
| allowBackup / data extraction | PASS | Fixed |
| FileProvider scope | PASS | Cache only |
| No off-Play APK promotion in the native app | PASS | Fixed |
| Edge-to-edge (forced at API 35+) | NOT VERIFIED | `StatusBar overlaysWebView:false`. Check on an Android 15/16 device that the app bar and bottom tabs are not under the system bars |
| Store listing assets (512 px icon, 1024×500 feature graphic, ≥2 phone screenshots) | DEVELOPER ACTION | Not in the repo |
| Privacy policy URL | DEVELOPER ACTION | Host /privacy on the real domain |
| Data Safety form | DEVELOPER DECLARATION | Draft in play-policy-findings.md |
| Content rating, target audience, ads, app access | DEVELOPER DECLARATION | No login, so no reviewer credentials needed |
| Closed testing (new personal accounts: 12 testers × 14 days) | DEVELOPER ACTION | Needed before production access on new personal developer accounts |
| On-device test pass | NOT VERIFIED | No device or emulator available |
