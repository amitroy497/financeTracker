import React from 'react';
import { InputComponent } from './InputComponent';

export const AddEditFields = ({ fields }: any) => {
	return (
		<>
			{fields.map((field: any) => (
				<InputComponent
					key={field?.id}
					label={field?.label}
					placeholder={field?.placeholder}
					value={field?.value}
					onChangeText={field?.onChangeText}
					isSelectDropDown={field?.isSelectDropDown}
					isMandatory={field?.isMandatory}
					showDropDown={field?.dropdownProps?.showDropDown}
					setShowDropDown={field?.dropdownProps?.setShowDropDown}
					dropDownName={field?.dropdownProps?.dropDownName}
					dropDownAlternativeName={
						field?.dropdownProps?.dropDownAlternativeName
					}
					dropdownSearchValue={field?.dropdownProps?.dropdownSearchValue}
					setDropDownSearchValue={field?.dropdownProps?.setDropDownSearchValue}
					dropdownOptions={field?.dropdownProps?.dropdownOptions}
					handleDropDownSelectOption={
						field?.dropdownProps?.handleDropDownSelectOption
					}
					dropDownNotFoundText={field?.dropdownProps?.dropDownNotFoundText}
					isDatePicker={field?.isDatePicker}
					onPressOpen={field?.onPressOpen}
					showDatePicker={field?.showDatePicker}
					handleDateChange={field?.handleDateChange}
					selectedDate={field?.selectedDate}
					keyboardType={field?.keyboardType}
					isEllipsis={field?.isEllipsis}
				/>
			))}
		</>
	);
	// 	<>
	// 		{fields?.map((field: any) => {
	// 			if (field?.isSelectDropDown && field?.dropdownProps) {
	// 				return (
	// 					<InputComponent
	// 						key={field?.id}
	// 						label={field?.label}
	// 						placeholder={field?.placeholder}
	// 						value={field?.value}
	// 						onChangeText={field?.onChangeText}
	// 						isSelectDropDown={field?.isSelectDropDown}
	// 						isMandatory={field?.isMandatory}
	// 						showDropDown={field?.dropdownProps?.showDropDown}
	// 						setShowDropDown={field?.dropdownProps?.setShowDropDown}
	// 						dropDownName={field?.dropdownProps?.dropDownName}
	// 						dropDownAlternativeName={
	// 							field?.dropdownProps?.dropDownAlternativeName
	// 						}
	// 						dropdownSearchValue={field?.dropdownProps?.dropdownSearchValue}
	// 						setDropDownSearchValue={
	// 							field?.dropdownProps?.setDropDownSearchValue
	// 						}
	// 						dropdownOptions={field?.dropdownProps?.dropdownOptions}
	// 						handleDropDownSelectOption={
	// 							field?.dropdownProps?.handleDropDownSelectOption
	// 						}
	// 						dropDownNotFoundText={field?.dropdownProps?.dropDownNotFoundText}
	// 					/>
	// 				);
	// 			}

	// 			if (field?.isDatePicker) {
	// 				return (
	// 					<InputComponent
	// 						key={field?.id}
	// 						label={field?.label}
	// 						value={field?.value}
	// 						isDatePicker={field?.isDatePicker}
	// 						onPressOpen={field?.onPressOpen}
	// 						showDatePicker={field?.showDatePicker}
	// 						handleDateChange={field?.handleDateChange}
	// 						selectedDate={field?.selectedDate}
	// 					/>
	// 				);
	// 			}

	// 			return (
	// 				<InputComponent
	// 					key={field?.id}
	// 					label={field?.label}
	// 					placeholder={field?.placeholder}
	// 					value={field?.value}
	// 					onChangeText={field?.onChangeText}
	// 					keyboardType={field?.keyboardType}
	// 					isMandatory={field?.isMandatory}
	// 					isEllipsis={field?.isEllipsis}
	// 				/>
	// 			);
	// 		})}
	// 	</>
	// );
};
