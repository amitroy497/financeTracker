import { useTheme } from '@/theme';
import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

export const AutoThemeIndicator: React.FC = () => {
	const { autoTheme, toggleAutoTheme, theme, colors } = useTheme();

	if (!autoTheme) return null;

	return (
		<TouchableOpacity
			onPress={toggleAutoTheme}
			style={{
				position: 'absolute',
				top: 10,
				right: 10,
				backgroundColor: colors.cardBackground,
				paddingHorizontal: 10,
				paddingVertical: 5,
				borderRadius: 15,
				flexDirection: 'row',
				alignItems: 'center',
				borderWidth: 1,
				borderColor: colors.border,
				zIndex: 1000,
			}}
		>
			<Text style={{ fontSize: 12, marginRight: 4 }}>
				{theme === 'light' ? '☀️' : '🌙'}
			</Text>
			<Text style={{ color: colors.text, fontSize: 10, fontWeight: '600' }}>
				Auto
			</Text>
		</TouchableOpacity>
	);
};
