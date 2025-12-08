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

/** STEP 1 — Read app.json */
const appJsonPath = path.resolve('./app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8')) as AppJson;

/** STEP 2 — Auto-increment patch version */
let [major, minor, patch] = (appJson.expo.version || '1.0.0')
	.split('.')
	.map(Number);

patch += 1;
const newVersion = `${major}.${minor}.${patch}`;
appJson.expo.version = newVersion;

/** STEP 3 — Auto-sync versionCode + buildNumber */
const versionCode = major * 10000 + minor * 100 + patch;

if (!appJson.expo.android) appJson.expo.android = {};
appJson.expo.android.versionCode = versionCode;

if (!appJson.expo.ios) appJson.expo.ios = {};
appJson.expo.ios.buildNumber = String(versionCode);

/** STEP 4 — Save */
fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));

console.log('✔ expo.version         →', newVersion);
console.log('✔ android.versionCode  →', versionCode);
console.log('✔ ios.buildNumber      →', versionCode);

/** STEP 5 — Run git version bump */
console.log('✔ Running npm run version:patch...');
execSync('npm run version:patch', { stdio: 'inherit' });

/** STEP 6 — Convert to native project */
console.log('✔ Running expo prebuild...');
execSync('npx expo prebuild', { stdio: 'inherit' });

/** STEP 7 — Build APK locally */
console.log('✔ Building APK locally...');
execSync('cd android && ./gradlew assembleRelease', { stdio: 'inherit' });

console.log(`
🎉 DONE!
Your local APK is ready at:
android/app/build/outputs/apk/release/app-release.apk
`);
