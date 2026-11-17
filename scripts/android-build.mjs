// Cross-platform Gradle runner: node scripts/android-build.mjs [assembleDebug|assembleRelease|bundleRelease]
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'

const task = process.argv[2] || 'assembleDebug'
const win = process.platform === 'win32'
// Absolute path: some Windows shells don't search the current directory for executables
const gradlew = resolve('android', win ? 'gradlew.bat' : 'gradlew')
execFileSync(gradlew, [task], { cwd: 'android', stdio: 'inherit', shell: win })
