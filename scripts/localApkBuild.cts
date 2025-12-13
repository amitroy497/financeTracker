import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/** TYPES */
interface ExpoConfig {
	version?: string;
	android?: { versionCode?: number };
	ios?: { buildNumber?: string };
	[key: string]: any;
}

interface AppJson {
	expo: ExpoConfig;
}

/** STEP 1 — Load app.json */
const appJsonPath = path.resolve('./app.json');
const appJson: AppJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

/** STEP 2 — Increment version (patch) */
let [major, minor, patch] = (appJson.expo.version || '1.0.0')
	.split('.')
	.map(Number);

patch += 1;
const newVersion = `${major}.${minor}.${patch}`;
appJson.expo.version = newVersion;

/** STEP 3 — Sync versionCode + buildNumber */
const versionCode = major * 10000 + minor * 100 + patch;

if (!appJson.expo.android) appJson.expo.android = {};
appJson.expo.android.versionCode = versionCode;

if (!appJson.expo.ios) appJson.expo.ios = {};
appJson.expo.ios.buildNumber = String(versionCode);

/** STEP 4 — Save app.json */
fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));

console.log('✔ Updated expo.version        →', newVersion);
console.log('✔ Updated android.versionCode →', versionCode);
console.log('✔ Updated ios.buildNumber     →', versionCode);

/** STEP 5 — Run git version bump */
console.log('✔ Running npm run version:patch...');
execSync('npm run version:patch', { stdio: 'inherit' });

/** STEP 6 — Run prebuild to generate /android */
console.log('✔ Running expo prebuild...');
execSync('npx expo prebuild', { stdio: 'inherit' });

/** STEP 7 — Build APK (Windows compatible) */
console.log('✔ Building APK locally...');

const isWindows = process.platform === 'win32';

if (isWindows) {
	execSync('cd android && gradlew.bat assembleRelease', { stdio: 'inherit' });
} else {
	execSync('cd android && ./gradlew assembleRelease', { stdio: 'inherit' });
}

console.log(`
🎉 APK build complete!

Location:
android/app/build/outputs/apk/release/app-release.apk
`);
