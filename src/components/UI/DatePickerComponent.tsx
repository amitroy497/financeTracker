import { createStyles } from '@/styles';
import { useTheme } from '@/theme';
import { DatePickerComponentProps } from '@/types';
import DateTimePicker from '@react-native-community/datetimepicker';
import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

export const DatePickerComponent = ({
	onPressOpen,
	startDate,
	show,
	handleChange,
	selected,
	label = 'Start Date',
}: DatePickerComponentProps) => {
	const { colors } = useTheme();
	const styles = createStyles(colors);

	return (
		<>
			<TouchableOpacity
				style={[styles.input, { justifyContent: 'center' }]}
				onPress={onPressOpen}
			>
				<Text style={{ color: startDate ? colors.dark : colors.gray }}>
					📅 {label}: {startDate || 'Select date'}
				</Text>
			</TouchableOpacity>
			{show && (
				<DateTimePicker
					value={selected || new Date()}
					mode='date'
					display='default'
					onChange={handleChange}
				/>
			)}
		</>
	);
};
