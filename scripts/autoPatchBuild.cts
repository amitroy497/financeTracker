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

console.log('=== DEBUG START ===');
console.log('Initial app.json version:', appJson.expo.version);

/** STEP 2 — Increment version with proper rolling logic */
let [major, minor, patch] = (appJson.expo.version || '1.0.0')
	.split('.')
	.map(Number);

console.log(`Parsed: major=${major}, minor=${minor}, patch=${patch}`);

// Apply version increment logic
patch += 1;

if (patch > 9) {
	console.log(`Patch ${patch} > 9, rolling over`);
	patch = 0;
	minor += 1;
	console.log(`Minor incremented to ${minor}`);

	if (minor > 9) {
		console.log(`Minor ${minor} > 9, rolling over`);
		minor = 0;
		major += 1;
		console.log(`Major incremented to ${major}`);
	}
} else {
	console.log(`Patch ${patch} <= 9, simple increment`);
}

const newVersion = `${major}.${minor}.${patch}`;
appJson.expo.version = newVersion;

console.log(`New version calculated: ${newVersion}`);

/** STEP 3 — Sync versionCode + buildNumber */
const versionCode = major * 10000 + minor * 100 + patch;

if (!appJson.expo.android) appJson.expo.android = {};
appJson.expo.android.versionCode = versionCode;

if (!appJson.expo.ios) appJson.expo.ios = {};
appJson.expo.ios.buildNumber = String(versionCode);

/** STEP 4 — Save app.json */
fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));

console.log('Saved app.json with new version:', newVersion);

// Verify it was saved
const verifyAppJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
console.log(
	'Verified app.json version after save:',
	verifyAppJson.expo.version
);

/** STEP 5 — Check what npm run version:patch does */
console.log('\n=== Checking npm run version:patch ===');
try {
	// Check package.json for version:patch script
	const packageJsonPath = path.resolve('./package.json');
	const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

	if (packageJson.scripts && packageJson.scripts['version:patch']) {
		console.log(
			'version:patch script found:',
			packageJson.scripts['version:patch']
		);

		// Also check package.json version
		console.log('Current package.json version:', packageJson.version);

		// Update package.json version to match
		packageJson.version = newVersion;
		fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
		console.log('Updated package.json version to:', newVersion);
	} else {
		console.log('No version:patch script found in package.json');
	}
} catch (error) {
	console.log('Error checking package.json:', error);
}

/** STEP 6 — Run npm run version:patch */
console.log('\n=== Running npm run version:patch ===');
try {
	execSync('npm run version:patch', { stdio: 'inherit' });
} catch (error: any) {
	console.log('Error running version:patch:', error?.message);
}

// Check what happened to app.json after version:patch
const afterAppJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
console.log('\n=== After npm run version:patch ===');
console.log('App.json version after version:patch:', afterAppJson.expo.version);
console.log(
	'App.json android.versionCode:',
	afterAppJson.expo.android?.versionCode
);
console.log('App.json ios.buildNumber:', afterAppJson.expo.ios?.buildNumber);

// Check git status
console.log('\n=== Git status ===');
try {
	execSync('git status', { stdio: 'inherit' });
} catch (error) {
	console.log('Could not check git status');
}

console.log('\n=== DEBUG END ===\n');

/** STEP 7 — Run prebuild to generate /android */
console.log('✔ Running expo prebuild...');
execSync('npx expo prebuild', { stdio: 'inherit' });

/** STEP 8 — Build APK (Windows compatible) */
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
