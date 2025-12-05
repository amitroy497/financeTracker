import { useTheme } from '@/theme';
import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

export const AutoThemeIndicator: React.FC = () => {
	const { autoTheme, toggleAutoTheme, theme, colors } = useTheme();

	const getIndicatorText = () => {
		if (autoTheme) {
			return theme === 'light' ? 'Auto ☀️' : 'Auto 🌙';
		}
		return theme === 'light' ? '☀️' : '🌙';
	};

	return (
		<TouchableOpacity
			onPress={toggleAutoTheme}
			style={{
				position: 'absolute',
				top: 10,
				right: 10,
				backgroundColor: colors.cardBackground,
				paddingHorizontal: 12,
				paddingVertical: 6,
				borderRadius: 15,
				flexDirection: 'row',
				alignItems: 'center',
				borderWidth: 1,
				borderColor: colors.border,
				zIndex: 1000,
				shadowColor: colors.shadow,
				shadowOffset: { width: 0, height: 2 },
				shadowOpacity: 0.1,
				shadowRadius: 4,
				elevation: 3,
				marginTop: 25,
			}}
			activeOpacity={0.7}
		>
			<Text
				style={{
					color: colors.text,
					fontSize: 11,
					fontWeight: '600',
					marginRight: 4,
				}}
			>
				{getIndicatorText()}
			</Text>
			<Text
				style={{
					fontSize: 10,
					color: autoTheme ? colors.primary : colors.gray,
					fontWeight: 'bold',
				}}
			>
				{autoTheme ? '⚙️' : '⚙️'}
			</Text>
		</TouchableOpacity>
	);
};
