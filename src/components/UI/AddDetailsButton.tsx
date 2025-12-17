import { createStyles } from '@/styles';
import { useTheme } from '@/theme';
import { AddDetailsButtonProps } from '@/types';
import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

export const AddDetailsButton = ({ label, onPress }: AddDetailsButtonProps) => {
	const { colors } = useTheme();
	const styles = createStyles(colors);

	return (
		<TouchableOpacity
			style={[styles.button, styles.buttonPrimary, { marginTop: 16 }]}
			onPress={onPress}
		>
			<Text style={styles.buttonText}>+ Add {label}</Text>
		</TouchableOpacity>
	);
};
