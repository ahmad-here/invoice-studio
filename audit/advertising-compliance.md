# Advertising compliance

| # | Severity | Finding | Evidence | Notes |
|---|---|---|---|---|
| A1 | PASS | No ad SDK or ad code in the Android app | grep of src/ and package.json: no AdMob, adsbygoogle, GPT, gtag or analytics. MobSF: 0 trackers | Answer "No, my app does not contain ads" in the Console **if this stays true** |
| A2 | PASS | `workbox-google-analytics` appears only as a transitive dependency in package-lock | Not included in dist/sw.js (0 references) | Not shipped |
| A3 | NOT VERIFIED | Ads on the live **website** | No ad code exists in this repository | The website ads must be added outside this codebase. They could not be audited here. If ads are ever added to the web code, gate them with `!isNative()` so they never appear in the Play build. Otherwise you must declare ads and comply with the Families/AdMob policies |

No ad integration was invented or added.
