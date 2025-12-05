import { useTheme } from '@/theme';
import React, { useEffect } from 'react';
import { AppState, AppStateStatus, useColorScheme } from 'react-native';

export const SystemThemeListener: React.FC = () => {
	const { autoTheme } = useTheme();
	const systemColorScheme = useColorScheme();

	useEffect(() => {
		const handleAppStateChange = (nextAppState: AppStateStatus) => {
			if (nextAppState === 'active' && autoTheme) {
				// Force a re-evaluation of the system theme when app comes to foreground
				console.log('App active, checking system theme:', systemColorScheme);
				// The ThemeProvider will handle the actual theme sync
			}
		};

		const subscription = AppState.addEventListener(
			'change',
			handleAppStateChange
		);

		return () => {
			subscription.remove();
		};
	}, [autoTheme, systemColorScheme]);

	return null;
};
