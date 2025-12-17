import { useAuth } from '@/hooks';
import { useTheme } from '@/theme';
import {
	DarkTheme,
	DefaultTheme,
	NavigationContainer,
} from '@react-navigation/native';
import React from 'react';
import { AdminTabNavigator } from './AdminTabNavigator';
import { UserTabNavigator } from './UserTabNavigator';

export const BottomTabNavigator: React.FC = () => {
	const { user } = useAuth();
	const { theme, colors } = useTheme();

	const navigationTheme = React.useMemo(() => {
		const baseTheme = theme === 'dark' ? DarkTheme : DefaultTheme;

		return {
			...baseTheme,
			colors: {
				...baseTheme.colors,
				primary: colors.primary,
				background: colors.background,
				card: colors.cardBackground,
				text: colors.text,
				border: colors.border,
				notification: colors.primary,
			},
		};
	}, [theme, colors]);

	return (
		<NavigationContainer theme={navigationTheme}>
			{user?.isAdmin ? <AdminTabNavigator /> : <UserTabNavigator />}
		</NavigationContainer>
	);
};
