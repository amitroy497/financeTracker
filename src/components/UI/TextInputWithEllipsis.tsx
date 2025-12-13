import { createStyles } from '@/styles';
import { useTheme } from '@/theme';
import React from 'react';
import {
	Text,
	TextInput,
	TextInputProps,
	TouchableWithoutFeedback,
	View,
} from 'react-native';

type Props = TextInputProps & {
	placeholderText: string;
	placeholderStyle?: object;
	containerStyle?: object;
};

export const TextInputWithEllipsis = ({
	placeholderText,
	placeholderStyle,
	containerStyle,
	style,
	value,
	onFocus,
	onBlur,
	...rest
}: Props) => {
	const { colors } = useTheme();
	const styles = createStyles(colors);

	const showOverlayPlaceholder = !value || value === '';

	return (
		<View style={[styles.relative, containerStyle]}>
			<TextInput
				{...rest}
				value={value}
				onFocus={(e) => {
					onFocus?.(e);
				}}
				onBlur={(e) => {
					onBlur?.(e);
				}}
				style={[styles.input, style]}
			/>

			{showOverlayPlaceholder && (
				<TouchableWithoutFeedback
					onPress={() => {
						/* focuses input if needed; parent can forward ref to focus */
					}}
				>
					<View pointerEvents='none' style={styles.placeholderWrapper}>
						<Text
							numberOfLines={1}
							ellipsizeMode='tail'
							style={[styles.placeholder, placeholderStyle]}
						>
							{placeholderText}
						</Text>
					</View>
				</TouchableWithoutFeedback>
			)}
		</View>
	);
};
