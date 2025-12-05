import { AuthProvider } from '@/auth';
import { StatusBarComponent } from '@/components';
import { useAuth } from '@/hooks';
import { BottomTabNavigator } from '@/Navigation/BottomTabNavigator';
import { AuthScreen } from '@/screens';
import { ThemeProvider } from '@/theme';
import React from 'react';

const AppContent: React.FC = () => {
	const { isAuthenticated, isLoading } = useAuth();

	if (isLoading) {
		return (
			<StatusBarComponent>
				<AuthScreen />
			</StatusBarComponent>
		);
	}

	return (
		<StatusBarComponent>
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
