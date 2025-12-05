import { useTheme } from '@/theme';
import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const StatusBarComponent = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	const { colors, theme } = useTheme();
	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
			<StatusBar
				barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
				backgroundColor={colors.background}
			/>
			{children}
		</SafeAreaView>
	);
};
