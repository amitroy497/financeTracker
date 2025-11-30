import { BiometricAuth } from '@/utils';
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';
import { AuthCredentials, LoginCredentials, User } from '../types';

const USERS_FILE_PATH = `${FileSystem.documentDirectory}users.json`;
const USER_DATA_DIR = `${FileSystem.documentDirectory}user_data/`;

// Initialize users file
const initializeUsersFile = async (): Promise<void> => {
	try {
		const fileInfo = await FileSystem.getInfoAsync(USERS_FILE_PATH);

		if (!fileInfo.exists) {
			const initialData = { users: [] };
			await FileSystem.writeAsStringAsync(
				USERS_FILE_PATH,
				JSON.stringify(initialData, null, 2)
			);
		}

		// Create user data directory if it doesn't exist
		const dirInfo = await FileSystem.getInfoAsync(USER_DATA_DIR);
		if (!dirInfo.exists) {
			await FileSystem.makeDirectoryAsync(USER_DATA_DIR, {
				intermediates: true,
			});
		}
	} catch (error) {
		console.error('Error initializing users file:', error);
		throw error;
	}
};

// Hash password/PIN
const hashData = async (data: string): Promise<string> => {
	return await Crypto.digestStringAsync(
		Crypto.CryptoDigestAlgorithm.SHA256,
		data
	);
};

// Verify hash
const verifyHash = async (data: string, hash: string): Promise<boolean> => {
	const dataHash = await hashData(data);
	return dataHash === hash;
};

// Generate user-specific data file path
const getUserDataPath = (userId: string): string => {
	return `${USER_DATA_DIR}${userId}_data.json`;
};

// User management
export const authService = {
	// Register new user
	register: async (credentials: AuthCredentials): Promise<boolean> => {
		try {
			await initializeUsersFile();

			const fileContent = await FileSystem.readAsStringAsync(USERS_FILE_PATH);
			const data = JSON.parse(fileContent);

			// Check if username already exists
			const existingUser = data.users.find(
				(user: User) => user.username === credentials.username
			);
			if (existingUser) {
				throw new Error('Username already exists');
			}

			// Hash password
			const passwordHash = await hashData(credentials.password);

			// Hash PIN if provided
			let pinHash: string | undefined;
			if (credentials.pin) {
				pinHash = await hashData(credentials.pin);
			}

			const newUser: User = {
				id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
				username: credentials.username,
				passwordHash,
				pinHash,
				biometricEnabled: credentials.biometricEnabled || false,
				createdAt: new Date().toISOString(),
			};

			data.users.push(newUser);
			await FileSystem.writeAsStringAsync(
				USERS_FILE_PATH,
				JSON.stringify(data, null, 2)
			);

			// Create user's data file
			const userDataPath = getUserDataPath(newUser.id);
			const initialUserData = {
				items: [],
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};
			await FileSystem.writeAsStringAsync(
				userDataPath,
				JSON.stringify(initialUserData, null, 2)
			);

			return true;
		} catch (error) {
			console.error('Registration error:', error);
			throw error;
		}
	},

	// Login user
	login: async (credentials: LoginCredentials): Promise<User | null> => {
		try {
			await initializeUsersFile();

			const fileContent = await FileSystem.readAsStringAsync(USERS_FILE_PATH);
			const data = JSON.parse(fileContent);

			const user = data.users.find(
				(u: User) => u.username === credentials.username
			);
			if (!user) {
				throw new Error('User not found');
			}

			let isValid = false;

			if (credentials.useBiometric && user.biometricEnabled) {
				// Biometric authentication
				isValid = await BiometricAuth.authenticate();
			} else if (credentials.pin && user.pinHash) {
				// PIN authentication
				isValid = await verifyHash(credentials.pin, user.pinHash);
			} else if (credentials.password) {
				// Password authentication
				isValid = await verifyHash(credentials.password, user.passwordHash);
			}

			if (isValid) {
				// Update last login
				user.lastLogin = new Date().toISOString();
				await FileSystem.writeAsStringAsync(
					USERS_FILE_PATH,
					JSON.stringify(data, null, 2)
				);
				return user;
			}

			return null;
		} catch (error) {
			console.error('Login error:', error);
			throw error;
		}
	},

	// Enable/disable biometric authentication
	enableBiometric: async (
		userId: string,
		enable: boolean
	): Promise<boolean> => {
		try {
			await initializeUsersFile();

			const fileContent = await FileSystem.readAsStringAsync(USERS_FILE_PATH);
			const data = JSON.parse(fileContent);

			const userIndex = data.users.findIndex(
				(user: User) => user.id === userId
			);
			if (userIndex === -1) {
				throw new Error('User not found');
			}

			data.users[userIndex].biometricEnabled = enable;
			await FileSystem.writeAsStringAsync(
				USERS_FILE_PATH,
				JSON.stringify(data, null, 2)
			);

			return true;
		} catch (error) {
			console.error('Error updating biometric setting:', error);
			throw error;
		}
	},

	// Change password
	changePassword: async (
		userId: string,
		oldPassword: string,
		newPassword: string
	): Promise<boolean> => {
		try {
			await initializeUsersFile();

			const fileContent = await FileSystem.readAsStringAsync(USERS_FILE_PATH);
			const data = JSON.parse(fileContent);

			const userIndex = data.users.findIndex(
				(user: User) => user.id === userId
			);
			if (userIndex === -1) {
				throw new Error('User not found');
			}

			// Verify old password
			const isOldPasswordValid = await verifyHash(
				oldPassword,
				data.users[userIndex].passwordHash
			);
			if (!isOldPasswordValid) {
				throw new Error('Current password is incorrect');
			}

			// Hash new password
			data.users[userIndex].passwordHash = await hashData(newPassword);
			await FileSystem.writeAsStringAsync(
				USERS_FILE_PATH,
				JSON.stringify(data, null, 2)
			);

			return true;
		} catch (error) {
			console.error('Error changing password:', error);
			throw error;
		}
	},

	// Change PIN
	changePin: async (userId: string, newPin: string): Promise<boolean> => {
		try {
			await initializeUsersFile();

			const fileContent = await FileSystem.readAsStringAsync(USERS_FILE_PATH);
			const data = JSON.parse(fileContent);

			const userIndex = data.users.findIndex(
				(user: User) => user.id === userId
			);
			if (userIndex === -1) {
				throw new Error('User not found');
			}

			// Hash new PIN
			data.users[userIndex].pinHash = await hashData(newPin);
			await FileSystem.writeAsStringAsync(
				USERS_FILE_PATH,
				JSON.stringify(data, null, 2)
			);

			return true;
		} catch (error) {
			console.error('Error changing PIN:', error);
			throw error;
		}
	},

	// Get user data file path
	getUserDataPath: (userId: string): string => {
		return getUserDataPath(userId);
	},

	// Check if biometric is supported
	isBiometricSupported: async (): Promise<boolean> => {
		return await BiometricAuth.isBiometricSupported();
	},
};
