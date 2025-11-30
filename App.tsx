import { AuthProvider } from '@/auth';
import { MainApp } from '@/components/MainApp';
import { useAuth } from '@/hooks';
import { AuthScreen } from '@/screens';
import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './src/styles/global';

// Main app component that conditionally renders based on auth state
const AppContent: React.FC = () => {
	const { isAuthenticated, isLoading } = useAuth();

	if (isLoading) {
		return (
			<SafeAreaView style={styles.safeArea}>
				<StatusBar barStyle='dark-content' backgroundColor='#f8f9fa' />
				<AuthScreen />
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.safeArea}>
			<StatusBar barStyle='dark-content' backgroundColor='#f8f9fa' />
			{isAuthenticated ? <MainApp /> : <AuthScreen />}
		</SafeAreaView>
	);
};

// Root app component with auth provider
const App: React.FC = () => {
	return (
		<AuthProvider>
			<AppContent />
		</AuthProvider>
	);
};

export default App;
