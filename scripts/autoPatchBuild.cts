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

/** STEP 2 — Increment version with proper rolling logic */
let [major, minor, patch] = (appJson.expo.version || '1.0.0')
	.split('.')
	.map(Number);

console.log(`Current version: ${major}.${minor}.${patch}`);

// Apply version increment logic
if (patch >= 9) {
	// If patch is 9 or greater, reset to 0 and increment minor
	patch = 0;
	minor += 1;

	if (minor > 9) {
		minor = 0;
		major += 1;
	}
} else {
	// Otherwise just increment patch normally
	patch += 1;
}
// This would make 1.1.54 -> 1.2.0

const newVersion = `${major}.${minor}.${patch}`;
appJson.expo.version = newVersion;

console.log(`New version: ${newVersion}`);

/** STEP 3 — Sync versionCode + buildNumber */
const versionCode = major * 10000 + minor * 100 + patch;

if (!appJson.expo.android) appJson.expo.android = {};
appJson.expo.android.versionCode = versionCode;

if (!appJson.expo.ios) appJson.expo.ios = {};
appJson.expo.ios.buildNumber = String(versionCode);

/** STEP 4 — Save app.json FIRST, before running npm run version:patch */
fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));

console.log('✔ Updated expo.version        →', newVersion);
console.log('✔ Updated android.versionCode →', versionCode);
console.log('✔ Updated ios.buildNumber     →', versionCode);

/** STEP 5 — Instead of running npm run version:patch, create our own git commit and tag */
console.log('✔ Creating git commit and tag...');

try {
	// Stage the app.json changes
	execSync('git add app.json', { stdio: 'inherit' });

	// Commit the version bump
	execSync(`git commit -m "chore: bump version to ${newVersion}"`, {
		stdio: 'inherit',
	});

	// Create a git tag
	execSync(`git tag -a "v${newVersion}" -m "Version ${newVersion}"`, {
		stdio: 'inherit',
	});

	console.log('✔ Git version bump completed successfully');
} catch (error: any) {
	console.warn('⚠ Git operations failed. Continuing with APK build...');
	console.warn('Error:', error?.message || 'Unknown error');
}

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
