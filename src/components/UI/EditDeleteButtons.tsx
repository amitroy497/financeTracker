import { createStyles } from '@/styles';
import { useTheme } from '@/theme';
import { EditDeleteButtonsProps } from '@/types';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export const EditDeleteButtons = ({
	onPressEdit,
	onPressDelete,
}: EditDeleteButtonsProps) => {
	const { colors } = useTheme();
	const styles = createStyles(colors);

	return (
		<View
			style={[
				styles.row,
				{ marginTop: 12, marginRight: 10, justifyContent: 'flex-end' },
			]}
		>
			<TouchableOpacity style={{ marginRight: 16 }} onPress={onPressEdit}>
				<Text style={{ color: colors.primary, fontSize: 12 }}>✏️ Edit</Text>
			</TouchableOpacity>
			<TouchableOpacity onPress={onPressDelete}>
				<Text style={{ color: colors.danger, fontSize: 12 }}>🗑️ Delete</Text>
			</TouchableOpacity>
		</View>
	);
};
