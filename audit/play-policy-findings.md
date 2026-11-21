# Google Play policy findings

Sources: Google's official **Play Policy Insights** skill (github.com/android/skills, `play/play-policy-insights`, run in full: init → 9 workers → aggregate → report; output in [play-policy-insights-report.md](play-policy-insights-report.md)), plus manual review against the Play Developer Policy Center and the target API level requirements page.

The skill report status is "🟢 Compliant" with no policy risks. That is an automated, advisory result. **It is not a guarantee of approval.** The app is not on Play yet, so there was no live Data Safety declaration to compare against.

| # | Severity | Area | Location | Evidence | Policy | Fix | Implemented | How tested |
|---|---|---|---|---|---|---|---|---|
| P1 | PASS | Target API level | android/variables.gradle | targetSdk 36 / compileSdk 36 | "New apps and app updates must target Android 16 (API 36) or higher" (from Aug 31, 2026) | — | n/a | aapt2 badging: targetSdkVersion 36 |
| P2 | HIGH → fixed | Device & Network Abuse: promoting an off-Play APK / self-update inside the Play app | src/features/content/DownloadPage.tsx, FaqPage.tsx | The native app probed `/downloads/invoice-studio.apk` and its FAQ pointed to the APK | Apps distributed on Play must not update or install themselves from outside Play | Native build: APK probe skipped (and the Download page already showed "You're already using the app"); FAQ wording changed. The website keeps the APK offer | YES | tsc, unit tests, e2e suite |
| P3 | PASS | Permissions | Merged manifest | INTERNET, VIBRATE (haptics), the AndroidX dynamic-receiver permission. No restricted or sensitive permissions | Permissions policy | — | n/a | aapt2 dump |
| P4 | PASS | User account / account deletion | — | No accounts, no login | Account deletion requirement does not apply | — | n/a | Skill goal `user_account` |
| P5 | DEVELOPER DECLARATION | Data Safety form | Play Console | All data is stored locally. No transmission found. Any sharing is user-initiated through the share sheet | Data Safety policy | See draft below. **You must confirm it against actual behaviour** | NO (you fill it in) | Skill data_safety goals 1–8 |
| P6 | DEVELOPER DECLARATION | Privacy policy URL | /privacy page | The page exists in the website build | User Data policy: a privacy policy is required | Host it on your real domain and paste the URL into the Console | NO | — |
| P7 | MEDIUM | Minimum functionality / WebView apps | Whole app | The app is a full offline tool (editor, 21 templates, PDF, bulk, clients), not a wrapped website | Minimum Functionality / Spam (webview) policy | The official minimum-functionality page text could not be retrieved this session → wording NOT VERIFIED. Risk judged low because all content is bundled and works offline | n/a | Manual review |
| P8 | DEVELOPER DECLARATION | Content rating (IARC), target audience, ads declaration ("No ads" for the app) | Play Console | No ad SDK in the APK | — | Fill in the questionnaires | NO | — |
| P9 | MEDIUM | Financial features declaration | Play Console | Invoicing tool. No payments, loans or money transfer | Financial Services policy | Answer "no financial services" if accurate | NO | — |

## Draft Data Safety answers (for you to confirm; not submitted)
- **Does the app collect or share user data?** Based on the code, no data leaves the device under the app's control. Play's definition says that data sent off-device only by the user's own explicit action (the share sheet) is not "collection". Read the skill's suggested entries (Email address, Files and docs, Purchase history for "user-initiated sharing") with that in mind.
- **Encrypted in transit:** not applicable (no transmission).
- **Data deletion:** users delete data inside the app (or by clearing app storage).
