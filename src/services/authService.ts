import { BiometricAuth } from '@/utils';
import { DataBackupService } from '@/utils/dataBackup';
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';
import { AuthCredentials, LoginCredentials, User } from '../types';

const USERS_FILE_PATH = `${FileSystem.documentDirectory}users.json`;
const USER_DATA_DIR = `${FileSystem.documentDirectory}user_data/`;

// Admin configuration
const ADMIN_CONFIG = {
	username: 'admin',
	password: 'admin123',
	email: 'admin@financetracker.com', // Add admin email
};

// Initialize users file with admin user
const initializeUsersFile = async (): Promise<void> => {
	try {
		const fileInfo = await FileSystem.getInfoAsync(USERS_FILE_PATH);

		// Create user data directory if it doesn't exist
		const dirInfo = await FileSystem.getInfoAsync(USER_DATA_DIR);
		if (!dirInfo.exists) {
			await FileSystem.makeDirectoryAsync(USER_DATA_DIR, {
				intermediates: true,
			});
		}

		if (!fileInfo.exists) {
			const initialData = { users: [] };
			await FileSystem.writeAsStringAsync(
				USERS_FILE_PATH,
				JSON.stringify(initialData, null, 2)
			);

			// Create admin user after file is initialized
			await createAdminUser();
		} else {
			// Check if admin user exists
			const fileContent = await FileSystem.readAsStringAsync(USERS_FILE_PATH);
			const data = JSON.parse(fileContent);

			const adminExists = data.users.some(
				(user: User) => user.username === ADMIN_CONFIG.username
			);

			if (!adminExists) {
				// Create admin user if it doesn't exist
				await createAdminUser();
			}
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

// Email validation function
const isValidEmail = (email: string): boolean => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
};

// Generate user-specific data file path
const getUserDataPath = (userId: string): string => {
	return `${USER_DATA_DIR}${userId}_data.json`;
};

// Helper function to create admin user
const createAdminUser = async (): Promise<boolean> => {
	try {
		const fileContent = await FileSystem.readAsStringAsync(USERS_FILE_PATH);
		const data = JSON.parse(fileContent);

		// Check if admin already exists
		const adminExists = data.users.some(
			(user: User) => user.username === ADMIN_CONFIG.username
		);

		if (adminExists) {
			console.log('Admin user already exists');
			return true;
		}

		// Hash admin password
		const passwordHash = await hashData(ADMIN_CONFIG.password);

		const adminUser: User = {
			id:
				'admin-' +
				Date.now().toString() +
				Math.random().toString(36).substr(2, 9),
			username: ADMIN_CONFIG.username,
			email: ADMIN_CONFIG.email,
			passwordHash,
			biometricEnabled: false,
			createdAt: new Date().toISOString(),
			isAdmin: true,
		};

		data.users.push(adminUser);
		await FileSystem.writeAsStringAsync(
			USERS_FILE_PATH,
			JSON.stringify(data, null, 2)
		);

		// Create admin's data file
		const adminDataPath = getUserDataPath(adminUser.id);
		const initialAdminData = {
			items: [],
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};
		await FileSystem.writeAsStringAsync(
			adminDataPath,
			JSON.stringify(initialAdminData, null, 2)
		);

		console.log('Admin user created successfully');
		return true;
	} catch (error) {
		console.error('Error creating admin user:', error);
		throw error;
	}
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
			const existingUsername = data.users.find(
				(user: User) => user.username === credentials.username
			);
			if (existingUsername) {
				throw new Error('Username already exists');
			}

			// Check if email already exists (if provided)
			if (credentials.email) {
				// Validate email format
				if (!isValidEmail(credentials.email)) {
					throw new Error('Please enter a valid email address');
				}

				const existingEmail = data.users.find(
					(user: User) => user.email === credentials.email
				);
				if (existingEmail) {
					throw new Error('Email already registered');
				}
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
				email: credentials.email,
				passwordHash,
				pinHash,
				biometricEnabled: credentials.biometricEnabled || false,
				createdAt: new Date().toISOString(),
				isAdmin: credentials.isAdmin || false,
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
			console.log('=== LOGIN ATTEMPT START ===');
			console.log('Username:', credentials.username);
			console.log('Email:', credentials.email);
			console.log('Has password:', !!credentials.password);
			console.log('Has PIN:', !!credentials.pin);
			console.log('Use biometric:', credentials.useBiometric);

			await initializeUsersFile();

			const fileContent = await FileSystem.readAsStringAsync(USERS_FILE_PATH);
			const data = JSON.parse(fileContent);

			console.log('Total users in file:', data.users.length);

			// Find user by username OR email
			let user: User | undefined;

			if (credentials.username) {
				// Try to find by username first
				user = data.users.find(
					(u: User) => u.username === credentials.username
				);
			}

			// If not found by username and email is provided, try by email
			if (!user && credentials.email) {
				user = data.users.find((u: User) => u.email === credentials.email);
				if (user) {
					console.log('User found by email:', credentials.email);
				}
			}

			if (!user) {
				console.log('User not found in users.json');

				// Check if it's the admin user trying to login
				if (credentials.username === ADMIN_CONFIG.username) {
					console.log('But username matches admin config');
					console.log('Checking admin password...');

					// For admin, check against the config
					if (credentials.password === ADMIN_CONFIG.password) {
						console.log('Admin password matches! Creating admin user...');
						// Create admin user on the fly if it doesn't exist
						const adminUser: User = {
							id:
								'admin-' +
								Date.now().toString() +
								Math.random().toString(36).substr(2, 9),
							username: ADMIN_CONFIG.username,
							email: ADMIN_CONFIG.email,
							passwordHash: await hashData(ADMIN_CONFIG.password),
							biometricEnabled: false,
							createdAt: new Date().toISOString(),
							isAdmin: true,
						};

						// Add admin to users list
						data.users.push(adminUser);
						await FileSystem.writeAsStringAsync(
							USERS_FILE_PATH,
							JSON.stringify(data, null, 2)
						);

						console.log('Admin user created successfully');
						console.log('=== LOGIN SUCCESS (Admin created) ===');
						return adminUser;
					} else {
						console.log('Admin password does NOT match');
					}
				}
				console.log('=== LOGIN FAILED (User not found) ===');
				return null;
			}

			console.log('User found:', user.username);
			console.log('User email:', user.email);
			console.log('User isAdmin:', user.isAdmin);
			console.log('User biometricEnabled:', user.biometricEnabled);

			let isValid = false;

			if (credentials.useBiometric && user.biometricEnabled) {
				// Biometric authentication
				console.log('Attempting biometric authentication...');
				isValid = await BiometricAuth.authenticate();
				console.log('Biometric result:', isValid);
			} else if (credentials.pin && user.pinHash) {
				// PIN authentication
				console.log('Attempting PIN verification...');
				isValid = await verifyHash(credentials.pin, user.pinHash);
				console.log('PIN verification result:', isValid);
			} else if (credentials.password) {
				// Password authentication for both regular users and admin
				console.log('Attempting password verification...');
				isValid = await verifyHash(credentials.password, user.passwordHash);
				console.log('Password verification result:', isValid);
			} else {
				console.log('No authentication method provided');
			}

			if (isValid) {
				// Update last login
				user.lastLogin = new Date().toISOString();

				// Update the user in the array
				const userIndex = data.users.findIndex((u: User) => u.id === user.id);
				if (userIndex !== -1) {
					data.users[userIndex] = user;
					await FileSystem.writeAsStringAsync(
						USERS_FILE_PATH,
						JSON.stringify(data, null, 2)
					);
				}

				console.log('=== LOGIN SUCCESS ===');
				return user;
			}

			console.log('=== LOGIN FAILED (Invalid credentials) ===');
			return null;
		} catch (error) {
			console.error('=== LOGIN ERROR ===', error);
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

	// Get user by ID
	getUserById: async (userId: string): Promise<User | null> => {
		try {
			await initializeUsersFile();

			const fileContent = await FileSystem.readAsStringAsync(USERS_FILE_PATH);
			const data = JSON.parse(fileContent);

			const user = data.users.find((u: User) => u.id === userId);
			return user || null;
		} catch (error) {
			console.error('Error getting user by ID:', error);
			return null;
		}
	},

	// Get all users (admin only)
	getAllUsers: async (): Promise<User[]> => {
		try {
			await initializeUsersFile();
			const fileContent = await FileSystem.readAsStringAsync(USERS_FILE_PATH);
			const data = JSON.parse(fileContent);
			return data.users || [];
		} catch (error) {
			console.error('Error getting users:', error);
			throw error;
		}
	},

	// Export user data as admin
	exportUserDataAsAdmin: async (userId: string): Promise<string> => {
		const user = await authService.getUserById(userId);
		if (!user) {
			throw new Error('User not found');
		}

		return await DataBackupService.exportUserData(userId, user.username);
	},

	// Import user data as admin
	importUserDataAsAdmin: async (
		userId: string,
		importData: any
	): Promise<boolean> => {
		return await DataBackupService.importUserData(userId, importData);
	},

	// Create admin user (for initial setup - public method)
	createAdminUser: async (): Promise<boolean> => {
		return await createAdminUser();
	},

	// Update user email
	updateUserEmail: async (
		userId: string,
		newEmail: string
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

			// Validate email format
			if (!isValidEmail(newEmail)) {
				throw new Error('Please enter a valid email address');
			}

			// Check if email already exists (excluding current user)
			const existingEmail = data.users.find(
				(user: User, index: number) =>
					user.email === newEmail && index !== userIndex
			);
			if (existingEmail) {
				throw new Error('Email already registered to another user');
			}

			data.users[userIndex].email = newEmail;
			await FileSystem.writeAsStringAsync(
				USERS_FILE_PATH,
				JSON.stringify(data, null, 2)
			);

			return true;
		} catch (error) {
			console.error('Error updating email:', error);
			throw error;
		}
	},
};
