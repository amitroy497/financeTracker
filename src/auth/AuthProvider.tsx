// AuthProvider.tsx - Add this method
import React, { createContext, ReactNode, useEffect, useState } from 'react';
import { authService } from '../services/authService';
import {
	AuthContextType,
	AuthCredentials,
	AuthState,
	LoginCredentials,
} from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
	children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
	const [authState, setAuthState] = useState<AuthState>({
		user: null,
		isAuthenticated: false,
		isLoading: true,
		biometricSupported: false,
	});

	// Check biometric support on mount
	useEffect(() => {
		const checkBiometricSupport = async () => {
			const supported = await authService.isBiometricSupported();
			setAuthState((prev) => ({
				...prev,
				biometricSupported: supported,
				isLoading: false,
			}));
		};

		checkBiometricSupport();
	}, []);

	const login = async (credentials: LoginCredentials): Promise<boolean> => {
		try {
			console.log('AuthProvider: Attempting login for:', credentials.username);
			setAuthState((prev) => ({ ...prev, isLoading: true }));

			const user = await authService.login(credentials);

			if (user) {
				console.log(
					'AuthProvider: Login successful for:',
					user.username,
					'isAdmin:',
					user.isAdmin
				);
				setAuthState((prev) => ({
					...prev,
					user,
					isAuthenticated: true,
					isLoading: false,
				}));
				return true;
			}

			console.log(
				'AuthProvider: Login failed - invalid credentials for:',
				credentials.username
			);
			setAuthState((prev) => ({ ...prev, isLoading: false }));
			return false;
		} catch (error: any) {
			console.error('AuthProvider: Login error:', error);
			setAuthState((prev) => ({ ...prev, isLoading: false }));
			// Re-throw the error so the UI can show the specific error message
			throw error;
		}
	};

	const register = async (credentials: AuthCredentials): Promise<boolean> => {
		try {
			console.log(
				'AuthProvider: Attempting registration for:',
				credentials.username
			);
			setAuthState((prev) => ({ ...prev, isLoading: true }));

			const success = await authService.register(credentials);

			if (success) {
				console.log(
					'AuthProvider: Registration successful for:',
					credentials.username
				);

				// Auto-login after registration
				const loginCredentials: LoginCredentials = {
					username: credentials.username,
					password: credentials.password,
				};

				return await login(loginCredentials);
			}

			setAuthState((prev) => ({ ...prev, isLoading: false }));
			return false;
		} catch (error: any) {
			console.error('AuthProvider: Registration error:', error);
			setAuthState((prev) => ({ ...prev, isLoading: false }));
			throw error;
		}
	};

	const logout = (): void => {
		console.log('AuthProvider: Logging out user');
		setAuthState({
			user: null,
			isAuthenticated: false,
			isLoading: false,
			biometricSupported: authState.biometricSupported,
		});
	};

	const enableBiometric = async (enable: boolean): Promise<void> => {
		if (!authState.user) return;

		try {
			console.log('AuthProvider: Setting biometric to:', enable);
			await authService.enableBiometric(authState.user.id, enable);
			setAuthState((prev) => ({
				...prev,
				user: prev.user ? { ...prev.user, biometricEnabled: enable } : null,
			}));
		} catch (error) {
			console.error('AuthProvider: Error updating biometric setting:', error);
			throw error;
		}
	};

	const changePassword = async (
		oldPassword: string,
		newPassword: string
	): Promise<boolean> => {
		if (!authState.user) return false;

		try {
			console.log(
				'AuthProvider: Changing password for:',
				authState.user.username
			);
			return await authService.changePassword(
				authState.user.id,
				oldPassword,
				newPassword
			);
		} catch (error) {
			console.error('AuthProvider: Error changing password:', error);
			return false;
		}
	};

	const changePin = async (newPin: string): Promise<boolean> => {
		if (!authState.user) return false;

		try {
			console.log('AuthProvider: Changing PIN for:', authState.user.username);
			return await authService.changePin(authState.user.id, newPin);
		} catch (error) {
			console.error('AuthProvider: Error changing PIN:', error);
			return false;
		}
	};

	// Add method to update email
	const updateEmail = async (newEmail: string): Promise<boolean> => {
		if (!authState.user) return false;

		try {
			console.log('AuthProvider: Updating email for:', authState.user.username);
			const success = await authService.updateUserEmail(
				authState.user.id,
				newEmail
			);

			if (success) {
				// Update current user state
				setAuthState((prev) => ({
					...prev,
					user: prev.user ? { ...prev.user, email: newEmail } : null,
				}));
			}

			return success;
		} catch (error) {
			console.error('AuthProvider: Error updating email:', error);
			throw error;
		}
	};

	const value: AuthContextType = {
		...authState,
		login,
		register,
		logout,
		enableBiometric,
		changePassword,
		changePin,
		updateEmail, // Add this to the context value
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthContext };
