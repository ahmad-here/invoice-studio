# Google Play audit summary: Invoice Studio (io.invoicestudio.app)

Date: 2026-11-19. Nothing was submitted or published. Play Console was not accessed.

## Architecture
React 19 + TypeScript + Vite SPA, bundled offline into a Capacitor 8 Android shell (WebView loads local assets). All data is stored in IndexedDB on the device. No backend, no accounts, no analytics, no ads in the app. PDFs are generated on the device (html-to-image + jsPDF) and shared through the system share sheet (FileProvider, cache directory).

## Verdict
No blocking code-level policy violations were found by the automated tools or the manual review **after** the fixes below. This is not a guarantee of approval. Google Play review has final authority.

| Category | Status |
|---|---|
| Automated checks passed | Play Policy Insights (no risks); MobSF static (0 trackers, no real secrets; only remaining HIGH items are unsigned build and minSdk); tsc; 39 unit + 49 e2e tests; Gradle release builds; manifest dump |
| Manual checks passed | Permissions, network use, ads absence in the app, account policy N/A, target SDK 36 |
| Developer declarations required | Data Safety, privacy policy URL, content rating, ads = No, target audience, financial features, upload key |
| NOT VERIFIED | On-device behaviour (edge-to-edge, sharing after the FileProvider change), MobSF dynamic analysis, R8, website ads, official minimum-functionality policy wording |
| Play review | Pending (not submitted) |

## Before → after
| Item | Before | After |
|---|---|---|
| Native app promotes or probes sideload APK | Yes (HIGH) | No |
| allowBackup | true (cloud backup of client data) | false + data extraction rules |
| FileProvider | external root + cache | cache only |
| Release signing config | none | reads gitignored keystore.properties |
| versionName | 1.0 | 1.0.0 |
| targetSdk | 36 | 36 |

Details: [play-policy-findings.md](play-policy-findings.md), [security-findings.md](security-findings.md), [advertising-compliance.md](advertising-compliance.md), [functionality-test-results.md](functionality-test-results.md), [release-readiness-checklist.md](release-readiness-checklist.md), [remediation-plan.md](remediation-plan.md), [play-policy-insights-report.md](play-policy-insights-report.md), [mobsf-report.pdf](mobsf-report.pdf).
