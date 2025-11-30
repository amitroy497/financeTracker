import { colors, styles } from '@/styles/global';
import { SearchBarProps } from '@/types';
import React from 'react';
import { TextInput, View } from 'react-native';

export const SearchBar: React.FC<SearchBarProps> = ({
	searchQuery,
	onSearchChange,
	placeholder = 'Search items...',
}) => {
	return (
		<View style={styles.card}>
			<TextInput
				style={styles.input}
				placeholder={placeholder}
				value={searchQuery}
				onChangeText={onSearchChange}
				placeholderTextColor={colors.gray}
				clearButtonMode='while-editing'
			/>
		</View>
	);
};
