import { AuthProvider } from '@/auth';
import { useAuth } from '@/hooks';
import { BottomTabNavigator } from '@/Navigation/BottomTabNavigator';
import { AuthScreen } from '@/screens';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider'; // Add this import
import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Update AppContent to use theme
const AppContent: React.FC = () => {
	const { isAuthenticated, isLoading } = useAuth();
	const { colors } = useTheme(); // Get colors from theme

	if (isLoading) {
		return (
			<SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
				<StatusBar
					barStyle={
						colors.text === '#f5f5f7' ? 'light-content' : 'dark-content'
					}
					backgroundColor={colors.background}
				/>
				<AuthScreen />
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
			<StatusBar
				barStyle={colors.text === '#f5f5f7' ? 'light-content' : 'dark-content'}
				backgroundColor={colors.background}
			/>
			{isAuthenticated ? <BottomTabNavigator /> : <AuthScreen />}
		</SafeAreaView>
	);
};

// Update main App component
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
