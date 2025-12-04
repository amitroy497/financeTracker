import { createStyles } from '@/styles';
import { useTheme } from '@/theme';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export const ThemeToggle: React.FC = () => {
	const { theme, toggleTheme, colors } = useTheme();
	const styles = createStyles(colors);

	return (
		<TouchableOpacity
			onPress={toggleTheme}
			style={[
				styles.button,
				{
					backgroundColor: colors.lightGray,
					paddingHorizontal: 20,
					marginVertical: 10,
					alignSelf: 'center',
				},
			]}
		>
			<View style={[styles.row, { alignItems: 'center' }]}>
				<Text style={{ fontSize: 20, marginRight: 8 }}>
					{theme === 'light' ? '🌙' : '☀️'}
				</Text>
				<Text style={{ color: colors.text, fontWeight: '600' }}>
					{theme === 'light' ? 'Dark Mode' : 'Light Mode'}
				</Text>
			</View>
		</TouchableOpacity>
	);
};
