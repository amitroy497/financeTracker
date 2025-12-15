import { createStyles } from '@/styles';
import { useTheme } from '@/theme';
import React from 'react';
import {
	ScrollView,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';

export const SelectDropdown = ({
	showDropDown,
	setShowDropDown,
	dropDownName,
	dropDownAlternativeName,
	placeholder,
	dropdownSearchValue,
	setDropDownSearchValue,
	dropdownOptions,
	handleDropDownSelectOption,
	dropDownNotFoundText,
}: any) => {
	const { colors } = useTheme();
	const styles = createStyles(colors);

	return (
		<>
			<TouchableOpacity
				style={[
					styles.input,
					{
						flexDirection: 'row',
						justifyContent: 'space-between',
						alignItems: 'center',
					},
				]}
				onPress={() => setShowDropDown?.(!showDropDown)}
			>
				<Text
					style={{
						color: dropDownName ? colors.dark : colors.gray,
					}}
				>
					{dropDownAlternativeName}
				</Text>
				<Text>{showDropDown ? '▲' : '▼'}</Text>
			</TouchableOpacity>
			{showDropDown && (
				<View
					style={{
						backgroundColor: colors.white,
						borderRadius: 8,
						borderWidth: 1,
						borderColor: colors.lightGray,
						maxHeight: 200,
						marginTop: 4,
					}}
				>
					<TextInput
						style={[
							styles.input,
							{
								borderWidth: 0,
								borderBottomWidth: 1,
								borderRadius: 0,
								marginBottom: 0,
							},
						]}
						placeholder={placeholder}
						value={dropdownSearchValue}
						onChangeText={setDropDownSearchValue}
						placeholderTextColor={colors.gray}
						autoFocus={true}
					/>
					<ScrollView
						style={{ maxHeight: 150 }}
						showsVerticalScrollIndicator={true}
						contentContainerStyle={{ flexGrow: 1 }}
					>
						{dropdownOptions?.map((item: any) => (
							<TouchableOpacity
								key={item}
								style={{
									padding: 12,
									borderBottomWidth: 1,
									borderBottomColor: colors.lightGray,
								}}
								onPress={() => handleDropDownSelectOption?.(item)}
							>
								<Text style={{ color: colors.dark }}>{item}</Text>
							</TouchableOpacity>
						))}
						{dropdownOptions?.length === 0 && (
							<View style={{ padding: 12 }}>
								<Text style={{ color: colors.gray, textAlign: 'center' }}>
									{dropDownNotFoundText}
								</Text>
							</View>
						)}
					</ScrollView>
				</View>
			)}
		</>
	);
};
