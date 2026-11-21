# Remediation plan

## Done in this pass
1. P2: the native app no longer probes for or promotes the sideload APK (DownloadPage, FaqPage).
2. S2: `allowBackup=false` + `data_extraction_rules.xml` (no cloud backup; device transfer kept).
3. S3: FileProvider restricted to `cache-path`.
4. S1: release `signingConfigs` reads the gitignored `keystore.properties`; template file added. No secrets were created.
5. versionName → 1.0.0.

## Remaining (by priority)
| Priority | Item | Owner |
|---|---|---|
| HIGH | Create the upload keystore and sign the AAB | Developer |
| HIGH | Fill in Data Safety, privacy URL, content rating, ads = No, target audience | Developer |
| HIGH | Install on a real Android 15/16 device: check edge-to-edge, PDF share (FileProvider change), back button, offline | Developer / QA |
| MEDIUM | Decide on minSdk (24 → 26+) | Developer |
| MEDIUM | Try R8 (`minifyEnabled true`, `shrinkResources true`) with Capacitor keep rules, then test on a device | Dev |
| LOW | Closed testing track per account requirements | Developer |
