// src/components/Theme/SystemThemeListener.tsx
import { useTheme } from '@/theme';
import React, { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export const SystemThemeListener: React.FC = () => {
	const { autoTheme, toggleAutoTheme } = useTheme();

	useEffect(() => {
		if (!autoTheme) return;

		const handleAppStateChange = (nextAppState: AppStateStatus) => {
			if (nextAppState === 'active') {
				toggleAutoTheme && toggleAutoTheme();
			}
		};

		const subscription = AppState.addEventListener(
			'change',
			handleAppStateChange
		);

		return () => {
			subscription.remove();
		};
	}, [autoTheme]);

	// This component doesn't render anything
	return null;
};
