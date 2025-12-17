import { createStyles } from '@/styles';
import { useTheme } from '@/theme';
import { formatCurrency } from '@/utils';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ImageBackground, StyleSheet, Text } from 'react-native';

export const Banner = ({ image, title, amount, children }: any) => {
	const { colors } = useTheme();
	const styles = createStyles(colors);
	return (
		<ImageBackground
			source={image}
			style={styles.card}
			imageStyle={{ borderRadius: 12 }}
			resizeMode='stretch'
		>
			<LinearGradient
				colors={[
					'rgba(0, 0, 0, 0.8)',
					'rgba(0, 0, 0, 0.5)',
					'rgba(0, 0, 0, 0.2)',
				]}
				style={{ ...StyleSheet.absoluteFillObject, borderRadius: 12 }}
				start={{ x: 0, y: 0 }}
				end={{ x: 0, y: 1 }}
			/>
			<Text style={{ fontSize: 14, color: colors.platinum }}>{title}</Text>
			<Text
				style={{
					fontSize: 24,
					fontWeight: 'bold',
					color: colors.themWhite,
					marginTop: 4,
				}}
			>
				{formatCurrency(amount)}
			</Text>
			{children}
		</ImageBackground>
	);
};
