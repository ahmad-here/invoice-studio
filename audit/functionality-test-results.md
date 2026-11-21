# Functionality test results (after remediation, 2026-11-19)

| Check | Result | Notes |
|---|---|---|
| TypeScript build (`tsc -b`) | PASS | |
| Unit tests (vitest) | PASS: 39/39 | Money, tax, CSV/JSON parsing, migrations |
| E2E (Playwright, desktop + Pixel 7 mobile) | PASS: 49/49 | First run had 2 failures caused by a stale app-only `dist` (no APK, no sitemap). They passed after `npm run build`. Not a code defect |
| Website production build + prerender | PASS | |
| Gradle assembleDebug / assembleRelease / bundleRelease | PASS | |
| Compiled manifest check (aapt2) | PASS | targetSdk 36, allowBackup=false, dataExtractionRules, 2 normal permissions |
| MobSF static analysis | Ran. Score 57. Findings triaged in security-findings.md | |
| Play Policy Insights skill | Ran in full. No policy risks | Advisory |
| On-device install, PDF share, back button, offline, edge-to-edge | **NOT VERIFIED** | No emulator or device |
| MobSF dynamic analysis | **NOT VERIFIED** | Needs an emulator |
