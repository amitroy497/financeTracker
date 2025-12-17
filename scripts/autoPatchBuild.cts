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

/** STEP 2 — Get current version */
const currentVersion = appJson.expo.version || '1.0.0';
console.log(`Current version: ${currentVersion}`);

let [major, minor, patch] = currentVersion.split('.').map(Number);

/** STEP 3 — Apply rolling logic CORRECTLY */
// Increment patch
patch += 1;

// Check if patch needs to roll over (when it becomes 10 or more)
if (patch >= 60) {
	patch = 0;
	minor += 1;

	// Check if minor needs to roll over (when it becomes 10 or more)
	if (minor >= 10) {
		minor = 0;
		major += 1;
	}
}

const newVersion = `${major}.${minor}.${patch}`;
console.log(`New calculated version: ${newVersion}`);

/** STEP 4 — Update BOTH app.json AND package.json BEFORE running npm version patch */
appJson.expo.version = newVersion;

// Update package.json first!
const packageJsonPath = path.resolve('./package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
console.log('Updated package.json to:', newVersion);

/** STEP 5 — Calculate versionCode */
const versionCode = major * 10000 + minor * 100 + patch;

if (!appJson.expo.android) appJson.expo.android = {};
appJson.expo.android.versionCode = versionCode;

if (!appJson.expo.ios) appJson.expo.ios = {};
appJson.expo.ios.buildNumber = String(versionCode);

/** STEP 6 — Save app.json */
fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
console.log('Updated app.json to:', newVersion);

/** STEP 7 — Now run your npm run version:patch */
console.log('Running npm run version:patch...');
try {
	execSync('npm run version:patch', { stdio: 'inherit' });
} catch (error: any) {
	console.error('Error running version:patch:', error?.message || error);
}

/** STEP 8 — Verify the versions */
console.log('\n=== VERIFICATION ===');
const finalPackageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const finalAppJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
console.log('Final package.json version:', finalPackageJson.version);
console.log('Final app.json version:', finalAppJson.expo.version);
console.log('Expected version:', newVersion);

/** STEP 9 — Run prebuild */
console.log('\nRunning expo prebuild...');
execSync('npx expo prebuild', { stdio: 'inherit' });

/** STEP 10 — Build APK */
console.log('\nBuilding APK...');
const isWindows = process.platform === 'win32';

if (isWindows) {
	execSync('cd android && gradlew.bat assembleRelease', { stdio: 'inherit' });
} else {
	execSync('cd android && ./gradlew assembleRelease', { stdio: 'inherit' });
}

console.log(`
🎉 BUILD COMPLETE!

Version: ${newVersion}
Version Code: ${versionCode}

APK Location:
android/app/build/outputs/apk/release/app-release.apk
`);
