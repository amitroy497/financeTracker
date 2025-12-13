import { createStyles } from '@/styles';
import { useTheme } from '@/theme';
import { InputComponentProps } from '@/types';
import { Text, TextInput, View } from 'react-native';
import { TextInputWithEllipsis } from './TextInputWithEllipsis';

export const InputComponent = ({
	label,
	value,
	placeholder,
	onChangeText,
	isEllipsis = false,
	keyboardType = 'default',
	multiline = false,
	numberOfLines = 1,
	isMandatory = false,
}: InputComponentProps) => {
	const { colors } = useTheme();
	const styles = createStyles(colors);

	return (
		<View style={styles.inputContainer}>
			<Text style={styles.label}>
				{label}
				{isMandatory && <Text style={styles.mandatoryAsterisk}> *</Text>} :
			</Text>
			{isEllipsis ? (
				<TextInputWithEllipsis
					placeholderText={placeholder || ''}
					value={value}
					onChangeText={onChangeText}
				/>
			) : (
				<TextInput
					style={styles.input}
					placeholder={placeholder}
					value={value}
					onChangeText={onChangeText}
					placeholderTextColor={colors.gray}
					keyboardType={keyboardType}
					multiline={multiline}
					numberOfLines={numberOfLines}
				/>
			)}
		</View>
	);
};
