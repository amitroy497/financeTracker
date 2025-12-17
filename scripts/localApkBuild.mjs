#!/usr/bin/env node

import { execSync } from 'child_process';
import { access, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Helper Functions */
async function fileExists(filePath) {
	try {
		await access(filePath);
		return true;
	} catch {
		return false;
	}
}

function parseVersion(versionString) {
	const [major, minor, patch] = versionString.split('.').map(Number);
	return { major, minor, patch };
}

function determineVersionBump(currentVersion) {
	const { minor, patch } = parseVersion(currentVersion);

	if (patch < 9) {
		return 'patch';
	} else if (patch === 9 && minor < 9) {
		return 'minor';
	} else if (patch === 9 && minor === 9) {
		return 'major';
	} else {
		throw new Error(`Unexpected version format: ${currentVersion}`);
	}
}

async function main() {
	try {
		console.log('🚀 Starting APK build process with rolling version logic...');

		/** STEP 1 — Load both app.json and package.json */
		const appJsonPath = path.resolve('./app.json');
		const packageJsonPath = path.resolve('./package.json');

		if (!(await fileExists(appJsonPath))) {
			throw new Error('app.json not found');
		}
		if (!(await fileExists(packageJsonPath))) {
			throw new Error('package.json not found');
		}

		const [appJsonContent, packageJsonContent] = await Promise.all([
			readFile(appJsonPath, 'utf8'),
			readFile(packageJsonPath, 'utf8'),
		]);

		const appJson = JSON.parse(appJsonContent);
		const packageJson = JSON.parse(packageJsonContent);

		if (!appJson.expo) {
			throw new Error('Invalid app.json: missing expo configuration');
		}

		/** STEP 2 — Use package.json version as source of truth (or app.json if different) */
		const currentAppVersion = appJson.expo.version || '1.0.0';
		const currentPackageVersion = packageJson.version || '1.0.0';

		console.log(`📦 Current versions:`);
		console.log(`   app.json: ${currentAppVersion}`);
		console.log(`   package.json: ${currentPackageVersion}`);

		// Decide which version to use for bumping
		let versionToBump;
		if (currentAppVersion !== currentPackageVersion) {
			console.warn(
				`⚠️  Versions don't match. Using package.json version as source of truth.`
			);
			versionToBump = currentPackageVersion;
		} else {
			versionToBump = currentPackageVersion;
		}

		/** STEP 3 — Determine version bump type */
		const bumpType = determineVersionBump(versionToBump);
		console.log(`🎯 Determined version bump type: ${bumpType}`);

		/** STEP 4 — Calculate new version */
		let [major, minor, patch] = versionToBump.split('.').map(Number);

		if (isNaN(major) || isNaN(minor) || isNaN(patch)) {
			throw new Error(`Invalid version format: ${versionToBump}`);
		}

		// Apply the appropriate bump
		switch (bumpType) {
			case 'patch':
				patch += 1;
				break;
			case 'minor':
				patch = 0;
				minor += 1;
				break;
			case 'major':
				patch = 0;
				minor = 0;
				major += 1;
				break;
		}

		const newVersion = `${major}.${minor}.${patch}`;

		/** STEP 5 — Update both files with new version */
		appJson.expo.version = newVersion;
		packageJson.version = newVersion;

		/** STEP 6 — Update versionCode/buildNumber in app.json */
		const versionCode = major * 10000 + minor * 100 + patch;

		if (!appJson.expo.android) appJson.expo.android = {};
		appJson.expo.android.versionCode = versionCode;

		if (!appJson.expo.ios) appJson.expo.ios = {};
		appJson.expo.ios.buildNumber = String(versionCode);

		/** STEP 7 — Save both files */
		await Promise.all([
			writeFile(appJsonPath, JSON.stringify(appJson, null, 2)),
			writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2)),
		]);

		console.log(`✅ Updated both files to version: ${newVersion}`);
		console.log(`✅ Updated android.versionCode to: ${versionCode}`);

		/** STEP 8 — Run the appropriate git version bump command */
		console.log(`🔄 Running npm run version:${bumpType}...`);
		execSync(`npm run version:${bumpType}`, { stdio: 'inherit' });

		/** STEP 9 — Run prebuild to generate /android */
		console.log('🔄 Running expo prebuild...');
		execSync('npx expo prebuild', { stdio: 'inherit' });

		/** STEP 10 — Build APK */
		console.log('🔨 Building APK locally...');

		const isWindows = process.platform === 'win32';
		const gradlewCommand = isWindows ? 'gradlew.bat' : './gradlew';

		try {
			process.chdir('android');
			execSync(`${gradlewCommand} assembleRelease`, { stdio: 'inherit' });
			process.chdir('..');
		} catch (error) {
			console.error('❌ Gradle build failed:', error.message);
			throw error;
		}

		const apkPath = path.resolve(
			'./android/app/build/outputs/apk/release/app-release.apk'
		);

		console.log(`
🎉 APK build complete!

📊 Version Summary:
- Previous: ${versionToBump}
- New: ${newVersion}
- Bump: ${bumpType}
- Code: ${versionCode}

📁 APK: ${apkPath}
`);
	} catch (error) {
		console.error('\n❌ Build failed:', error.message);
		process.exit(1);
	}
}

// Run the script
main();
