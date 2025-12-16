import { createStyles } from '@/styles';
import { useTheme } from '@/theme';
import { InputComponentProps, InputMode } from '@/types';
import { Text, TextInput, View } from 'react-native';
import { DatePickerComponent } from './DatePickerComponent';
import { SelectDropdown } from './SelectDropdown';
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
	maxLength,
	isSelectDropDown = false,
	showDropDown = false,
	setShowDropDown,
	dropDownName,
	dropDownAlternativeName,
	dropdownOptions,
	dropdownSearchValue,
	setDropDownSearchValue,
	handleDropDownSelectOption,
	dropDownNotFoundText,
	// Date picker props
	isDatePicker = false,
	onPressOpen,
	showDatePicker,
	handleDateChange,
	selectedDate,
	datePickerLabel = 'Start Date',
}: InputComponentProps) => {
	const { colors } = useTheme();
	const styles = createStyles(colors);

	console.log('Mahadev', dropDownAlternativeName);

	const getInputMode = (): InputMode => {
		if (isSelectDropDown) return InputMode.SELECT_DROPDOWN;
		if (isEllipsis) return InputMode.ELLIPSIS;
		if (isDatePicker) return InputMode.DATE_PICKER;
		return InputMode.DEFAULT;
	};

	const renderInput = () => {
		switch (getInputMode()) {
			case InputMode.SELECT_DROPDOWN:
				return (
					<SelectDropdown
						showDropDown={showDropDown}
						setShowDropDown={setShowDropDown}
						dropDownName={dropDownName}
						dropDownAlternativeName={dropDownAlternativeName}
						placeholder={placeholder}
						dropdownSearchValue={dropdownSearchValue}
						setDropDownSearchValue={setDropDownSearchValue}
						dropdownOptions={dropdownOptions}
						handleDropDownSelectOption={handleDropDownSelectOption}
						dropDownNotFoundText={dropDownNotFoundText}
					/>
				);

			case InputMode.ELLIPSIS:
				return (
					<TextInputWithEllipsis
						placeholderText={placeholder || ''}
						value={value}
						onChangeText={onChangeText}
					/>
				);

			case InputMode.DATE_PICKER:
				return (
					<DatePickerComponent
						onPressOpen={onPressOpen}
						startDate={value}
						show={showDatePicker}
						handleChange={handleDateChange}
						selected={selectedDate}
						label={datePickerLabel}
					/>
				);

			case InputMode.DEFAULT:
			default:
				return (
					<TextInput
						style={styles.input}
						placeholder={placeholder}
						value={value}
						onChangeText={onChangeText}
						placeholderTextColor={colors.gray}
						keyboardType={keyboardType}
						multiline={multiline}
						numberOfLines={numberOfLines}
						maxLength={maxLength}
					/>
				);
		}
	};

	return (
		<View style={styles.inputContainer}>
			<Text style={styles.label}>
				{label}
				{isMandatory && <Text style={styles.mandatoryAsterisk}> *</Text>} :
			</Text>

			{renderInput()}
		</View>
	);
};
