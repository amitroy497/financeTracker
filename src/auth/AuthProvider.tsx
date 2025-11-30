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
			setAuthState((prev) => ({ ...prev, isLoading: true }));

			const user = await authService.login(credentials);
			if (user) {
				setAuthState((prev) => ({
					...prev,
					user,
					isAuthenticated: true,
					isLoading: false,
				}));
				return true;
			}

			setAuthState((prev) => ({ ...prev, isLoading: false }));
			return false;
		} catch (error) {
			console.error('Login error:', error);
			setAuthState((prev) => ({ ...prev, isLoading: false }));
			return false;
		}
	};

	const register = async (credentials: AuthCredentials): Promise<boolean> => {
		try {
			setAuthState((prev) => ({ ...prev, isLoading: true }));

			const success = await authService.register(credentials);
			if (success) {
				// Auto-login after registration
				const loginCredentials: LoginCredentials = {
					username: credentials.username,
					password: credentials.password,
				};
				return await login(loginCredentials);
			}

			setAuthState((prev) => ({ ...prev, isLoading: false }));
			return false;
		} catch (error) {
			console.error('Registration error:', error);
			setAuthState((prev) => ({ ...prev, isLoading: false }));
			return false;
		}
	};

	const logout = (): void => {
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
			await authService.enableBiometric(authState.user.id, enable);
			setAuthState((prev) => ({
				...prev,
				user: prev.user ? { ...prev.user, biometricEnabled: enable } : null,
			}));
		} catch (error) {
			console.error('Error updating biometric setting:', error);
			throw error;
		}
	};

	const changePassword = async (
		oldPassword: string,
		newPassword: string
	): Promise<boolean> => {
		if (!authState.user) return false;

		try {
			return await authService.changePassword(
				authState.user.id,
				oldPassword,
				newPassword
			);
		} catch (error) {
			console.error('Error changing password:', error);
			return false;
		}
	};

	const changePin = async (newPin: string): Promise<boolean> => {
		if (!authState.user) return false;

		try {
			return await authService.changePin(authState.user.id, newPin);
		} catch (error) {
			console.error('Error changing PIN:', error);
			return false;
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
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthContext };
