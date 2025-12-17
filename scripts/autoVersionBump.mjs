#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFile } from 'fs/promises';
import path from 'path';

async function getCurrentVersion() {
	try {
		const packageJsonPath = path.join(process.cwd(), 'package.json');
		const packageJsonContent = await readFile(packageJsonPath, 'utf8');
		const packageJson = JSON.parse(packageJsonContent);
		return packageJson.version;
	} catch (error) {
		throw new Error(`Failed to read package.json: ${error.message}`);
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

function runVersionCommand(bumpType) {
	try {
		execSync(`npm run version:${bumpType}`, {
			stdio: 'inherit',
			cwd: process.cwd(),
		});
		console.log(`✅ Successfully bumped ${bumpType} version`);
	} catch (error) {
		console.error(`❌ Failed to run version:${bumpType}:`, error.message);
		process.exit(1);
	}
}

async function main() {
	try {
		console.log('🔍 Checking current version...');
		const currentVersion = await getCurrentVersion();
		console.log(`📦 Current version: ${currentVersion}`);

		const bumpType = determineVersionBump(currentVersion);
		console.log(`🎯 Determined bump type: ${bumpType}`);

		console.log(`🚀 Executing version bump...`);
		runVersionCommand(bumpType);
	} catch (error) {
		console.error('❌ Error:', error.message);
		process.exit(1);
	}
}

// Run the script
main();
