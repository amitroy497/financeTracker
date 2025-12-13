import { AuthProvider } from '@/auth';
import {
	AutoThemeIndicator,
	StatusBarComponent,
	SystemThemeListener,
} from '@/components';
import { useAuth } from '@/hooks';
import { BottomTabNavigator } from '@/Navigation/BottomTabNavigator';
import { AuthScreen } from '@/screens';
import { ThemeProvider } from '@/theme';
import * as NavigationBar from 'expo-navigation-bar';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';

const AppContent: React.FC = () => {
	const { isAuthenticated, isLoading } = useAuth();

	useEffect(() => {
		const setupEdgeToEdge = async () => {
			if (Platform.OS === 'android') {
				try {
					await NavigationBar.setVisibilityAsync('hidden');
				} catch (error) {
					console.log('Navigation bar setup error:', error);
				}
			}
		};

		setupEdgeToEdge();
	}, []);

	if (isLoading) {
		return (
			<StatusBarComponent>
				<AuthScreen />
			</StatusBarComponent>
		);
	}

	return (
		<StatusBarComponent>
			<SystemThemeListener />
			<AutoThemeIndicator />
			{isAuthenticated ? <BottomTabNavigator /> : <AuthScreen />}
		</StatusBarComponent>
	);
};

const App: React.FC = () => {
	return (
		<ThemeProvider>
			<AuthProvider>
				<AppContent />
			</AuthProvider>
		</ThemeProvider>
	);
};

export default App;
