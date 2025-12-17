// SelectDropdown.tsx - Fixed typing issue
import { createStyles } from '@/styles';
import { useTheme } from '@/theme';
import React, { useEffect, useRef } from 'react';
import {
	Animated,
	Dimensions,
	Keyboard,
	Modal,
	Platform,
	ScrollView,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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
	const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
	const backdropAnim = useRef(new Animated.Value(0)).current;
	const modalVisible = useRef(false);

	useEffect(() => {
		if (showDropDown && !modalVisible.current) {
			modalVisible.current = true;
			// Open animations
			Animated.parallel([
				Animated.timing(slideAnim, {
					toValue: 0,
					duration: 300,
					useNativeDriver: true,
				}),
				Animated.timing(backdropAnim, {
					toValue: 1,
					duration: 300,
					useNativeDriver: true,
				}),
			]).start();
		}
	}, [showDropDown]);

	const closeModal = () => {
		Keyboard.dismiss();
		modalVisible.current = false;
		Animated.parallel([
			Animated.timing(slideAnim, {
				toValue: SCREEN_HEIGHT,
				duration: 250,
				useNativeDriver: true,
			}),
			Animated.timing(backdropAnim, {
				toValue: 0,
				duration: 250,
				useNativeDriver: true,
			}),
		]).start(() => {
			setShowDropDown?.(false);
		});
	};

	const handleSelectOption = (option: string) => {
		handleDropDownSelectOption?.(option);
		closeModal();
	};

	// Handle text input change without closing
	const handleSearchChange = (text: string) => {
		setDropDownSearchValue?.(text);
	};

	// Don't render the full modal logic if not showing
	if (!showDropDown) {
		return (
			<TouchableOpacity
				style={[
					styles.input,
					{
						flexDirection: 'row',
						justifyContent: 'space-between',
						alignItems: 'center',
					},
				]}
				onPress={() => setShowDropDown?.(true)}
			>
				<Text
					style={{
						color: dropDownName ? colors.dark : colors.gray,
						flex: 1,
					}}
				>
					{dropDownName ||
						dropDownAlternativeName ||
						placeholder ||
						'Select...'}
				</Text>
				<Text style={{ color: colors.gray }}>▼</Text>
			</TouchableOpacity>
		);
	}

	return (
		<>
			{/* Trigger Button - Always visible */}
			<TouchableOpacity
				style={[
					styles.input,
					{
						flexDirection: 'row',
						justifyContent: 'space-between',
						alignItems: 'center',
					},
				]}
				onPress={() => setShowDropDown?.(true)}
			>
				<Text
					style={{
						color: dropDownName ? colors.dark : colors.gray,
						flex: 1,
					}}
				>
					{dropDownName ||
						dropDownAlternativeName ||
						placeholder ||
						'Select...'}
				</Text>
				<Text style={{ color: colors.gray }}>▼</Text>
			</TouchableOpacity>

			{/* Modal - Only animation changes, remains mounted */}
			<Modal
				visible={showDropDown}
				transparent={true}
				animationType='none'
				onRequestClose={closeModal}
			>
				{/* Backdrop with close handler */}
				<TouchableOpacity
					style={{ flex: 1 }}
					activeOpacity={1}
					onPress={closeModal}
				>
					<Animated.View
						style={{
							flex: 1,
							backgroundColor: 'rgba(0, 0, 0, 0.5)',
							opacity: backdropAnim,
							justifyContent: 'flex-end',
						}}
					>
						{/* Bottom Sheet - Prevent click through */}
						<TouchableOpacity
							activeOpacity={1}
							onPress={(e) => e.stopPropagation()}
							style={{ width: '100%' }}
						>
							<Animated.View
								style={{
									transform: [{ translateY: slideAnim }],
								}}
							>
								<View
									style={{
										backgroundColor: colors.white,
										borderTopLeftRadius: 20,
										borderTopRightRadius: 20,
										paddingBottom: Platform.OS === 'ios' ? 34 : 20,
										maxHeight: SCREEN_HEIGHT * 0.7,
									}}
								>
									{/* Drag Handle */}
									<View
										style={{
											paddingTop: 12,
											paddingBottom: 12,
											alignItems: 'center',
										}}
									>
										<View
											style={{
												width: 40,
												height: 4,
												backgroundColor: colors.lightGray,
												borderRadius: 2,
											}}
										/>
									</View>

									{/* Header */}
									<View
										style={{
											paddingHorizontal: 20,
											paddingBottom: 16,
										}}
									>
										<Text
											style={{
												fontSize: 18,
												fontWeight: '600',
												color: colors.dark,
												textAlign: 'center',
											}}
										>
											{placeholder || 'Select an option'}
										</Text>
									</View>

									{/* Search Input */}
									<View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
										<TextInput
											style={{
												borderWidth: 1,
												borderColor: colors.lightGray,
												borderRadius: 10,
												paddingHorizontal: 16,
												paddingVertical: 12,
												fontSize: 16,
												color: colors.dark,
											}}
											placeholder={`Search ${
												placeholder?.toLowerCase() || 'options'
											}`}
											placeholderTextColor={colors.gray}
											value={dropdownSearchValue}
											onChangeText={handleSearchChange} // Use wrapper function
											autoFocus={true}
										/>
									</View>

									{/* Options List */}
									<ScrollView
										style={{ maxHeight: SCREEN_HEIGHT * 0.4 }}
										showsVerticalScrollIndicator={true}
										keyboardShouldPersistTaps='handled'
									>
										{dropdownOptions?.map((item: string, index: number) => (
											<TouchableOpacity
												key={index}
												style={{
													paddingHorizontal: 20,
													paddingVertical: 16,
													borderBottomWidth: 1,
													borderBottomColor: colors.lightGray + '20',
												}}
												onPress={() => handleSelectOption(item)}
											>
												<Text style={{ color: colors.dark, fontSize: 16 }}>
													{item}
												</Text>
											</TouchableOpacity>
										))}

										{dropdownOptions?.length === 0 && (
											<View style={{ padding: 40, alignItems: 'center' }}>
												<Text style={{ color: colors.gray, fontSize: 16 }}>
													{dropDownNotFoundText || 'No options found'}
												</Text>
											</View>
										)}
									</ScrollView>
								</View>
							</Animated.View>
						</TouchableOpacity>
					</Animated.View>
				</TouchableOpacity>
			</Modal>
		</>
	);
};
