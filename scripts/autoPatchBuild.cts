import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface ExpoConfig {
	version?: string;
	android?: {
		versionCode?: number;
		[key: string]: any;
	};
	ios?: {
		buildNumber?: string;
		[key: string]: any;
	};
	[key: string]: any;
}

interface AppJson {
	expo: ExpoConfig;
}

// ---- Read app.json ----
const appJsonPath = path.resolve('./app.json');
const appJsonContent = fs.readFileSync(appJsonPath, 'utf8');
const appJson: AppJson = JSON.parse(appJsonContent);

// ---- STEP 1: Increment version with proper rolling logic ----
let version = appJson.expo.version || '1.0.0';
let [major, minor, patch] = version.split('.').map(Number);

// Apply version increment logic
patch += 1;

if (patch > 9) {
	patch = 0; // Reset patch to 0
	minor += 1; // Increment minor version

	if (minor > 9) {
		minor = 0; // Reset minor to 0
		major += 1; // Increment major version
	}
}

const newVersion = `${major}.${minor}.${patch}`;
appJson.expo.version = newVersion;

// ---- STEP 2: Convert version to versionCode ----
// major.minor.patch → major*10000 + minor*100 + patch
const versionCode = major * 10000 + minor * 100 + patch;

// ---- Apply to android ----
if (!appJson.expo.android) appJson.expo.android = {};
appJson.expo.android.versionCode = versionCode;

// ---- Apply to ios ----
if (!appJson.expo.ios) appJson.expo.ios = {};
appJson.expo.ios.buildNumber = versionCode.toString();

// ---- Save updated app.json ----
fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));

console.log('✔ Updated expo.version →', newVersion);
console.log('✔ android.versionCode →', versionCode);
console.log('✔ ios.buildNumber →', versionCode.toString());

// ---- STEP 3: Run git version bump ----
console.log('✔ Running npm run version:patch...');
execSync('npm run version:patch', { stdio: 'inherit' });

// ---- STEP 4: Run EAS preview build ----
console.log('✔ Running EAS preview build...');
execSync('eas build -p android --profile preview', { stdio: 'inherit' });

console.log('🎉 Finished! Version synced with git tag + EAS build started!');
