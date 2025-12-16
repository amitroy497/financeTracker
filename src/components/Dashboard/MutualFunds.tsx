import { assetService } from '@/services/assetService';
import { createStyles } from '@/styles';
import { useTheme } from '@/theme';
import { CreateMutualFundData, MutualFund, MutualFundsProps } from '@/types';
import { formatCurrency, formatNumber } from '@/utils';
import React, { useState } from 'react';
import {
	Alert,
	KeyboardType,
	Modal,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { InputComponent } from '../UI';

export const MutualFunds = ({
	funds,
	onEdit,
	onDelete,
	onRefresh,
	userId,
}: MutualFundsProps) => {
	const { colors } = useTheme();
	const styles = createStyles(colors);
	const [showAddModal, setShowAddModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [editingFund, setEditingFund] = useState<MutualFund | null>(null);

	// Updated state to include currentValue
	const [newFund, setNewFund] = useState<
		CreateMutualFundData & { currentValue?: number }
	>({
		schemeName: '',
		fundHouse: '',
		folioNumber: '',
		fundType: 'Equity',
		investedAmount: 0,
		units: 0,
		nav: 0,
		notes: '',
		currentValue: 0,
	});

	// Input states for string values (for better UX)
	const [investedAmountInput, setInvestedAmountInput] = useState<string>('');
	const [unitsInput, setUnitsInput] = useState<string>('');
	const [navInput, setNavInput] = useState<string>('');
	const [currentValueInput, setCurrentValueInput] = useState<string>('');

	// Fund type dropdown states
	const [showFundTypeDropdown, setShowFundTypeDropdown] = useState(false);
	const [fundTypeSearch, setFundTypeSearch] = useState('');

	const getReturnColor = (returns: number): string => {
		return returns >= 0 ? colors.success : colors.danger;
	};

	const getFundTypeColor = (type: string): string => {
		const colorsMap: { [key: string]: string } = {
			Equity: colors.primary,
			Debt: colors.success,
			Hybrid: colors.warning,
			ELSS: colors.info,
		};

		return colorsMap[type] || colors.gray;
	};

	// Handle decimal input with proper validation
	const handleDecimalInput = (
		text: string,
		type: 'investedAmount' | 'units' | 'nav' | 'currentValue'
	) => {
		// Allow only numbers and one decimal point
		let cleanedText = text.replace(/[^0-9.]/g, '');

		// Prevent more than one decimal point
		const decimalCount = (cleanedText.match(/\./g) || []).length;
		if (decimalCount > 1) {
			// Remove extra decimal points
			const firstDecimalIndex = cleanedText.indexOf('.');
			const beforeDecimal = cleanedText.substring(0, firstDecimalIndex + 1);
			const afterDecimal = cleanedText
				.substring(firstDecimalIndex + 1)
				.replace(/\./g, '');
			cleanedText = beforeDecimal + afterDecimal;
		}

		// For NAV and units, allow more decimal places (up to 4 for units, 2 for others)
		let maxDecimals = 2;
		if (type === 'units') {
			maxDecimals = 4;
		} else if (type === 'nav') {
			maxDecimals = 4; // NAV can have up to 4 decimal places
		}

		const decimalIndex = cleanedText.indexOf('.');
		if (decimalIndex !== -1) {
			const decimalPart = cleanedText.substring(decimalIndex + 1);
			if (decimalPart.length > maxDecimals) {
				cleanedText = cleanedText.substring(0, decimalIndex + maxDecimals + 1);
			}
		}

		// Update the appropriate input state
		switch (type) {
			case 'investedAmount':
				setInvestedAmountInput(cleanedText);
				break;
			case 'units':
				setUnitsInput(cleanedText);
				break;
			case 'nav':
				setNavInput(cleanedText);
				break;
			case 'currentValue':
				setCurrentValueInput(cleanedText);
				break;
		}

		// Parse the value and update the fund data
		let parsedValue: number;
		if (cleanedText === '' || cleanedText === '.') {
			parsedValue = 0;
		} else {
			parsedValue = parseFloat(cleanedText);
			if (isNaN(parsedValue)) parsedValue = 0;
		}

		const updatedFund = {
			...newFund,
			[type]: parsedValue,
		};

		// Calculate current value if not manually entered
		if (type !== 'currentValue') {
			const currentValue = updatedFund.units * updatedFund.nav;
			updatedFund.currentValue = currentValue;
			setCurrentValueInput(currentValue === 0 ? '' : currentValue.toFixed(2));
		}

		setNewFund(updatedFund);
	};

	// Calculate returns
	const calculateReturns = () => {
		if (!newFund.investedAmount || !newFund.currentValue) return 0;
		return (
			((newFund.currentValue - newFund.investedAmount) /
				newFund.investedAmount) *
			100
		);
	};

	// Handle fund type selection
	const handleSelectFundType = (type: string): void => {
		setNewFund({ ...newFund, fundType: type });
		setShowFundTypeDropdown(false);
		setFundTypeSearch('');
	};

	// Format number for display (show empty string for 0)
	const formatNumberForInput = (num: number): string => {
		if (num === 0) return '';
		return num.toString();
	};

	const handleAddFund = async (): Promise<void> => {
		if (!newFund.schemeName.trim() || !newFund.fundHouse.trim()) {
			Alert.alert('Error', 'Please enter scheme name and fund house');
			return;
		}

		if (newFund.investedAmount <= 0) {
			Alert.alert('Error', 'Invested amount must be greater than 0');
			return;
		}

		if (newFund.units <= 0) {
			Alert.alert('Error', 'Units must be greater than 0');
			return;
		}

		if (newFund.nav <= 0) {
			Alert.alert('Error', 'NAV must be greater than 0');
			return;
		}

		setIsSubmitting(true);
		try {
			// Remove currentValue from the data sent to API (it's calculated on server)
			const { currentValue, ...fundData } = newFund;
			await assetService.createMutualFund(userId, fundData);
			setShowAddModal(false);
			resetForm();
			onRefresh();
			Alert.alert('Success', 'Mutual fund added successfully!');
		} catch (error) {
			console.error('Error adding mutual fund:', error);
			Alert.alert('Error', 'Failed to add mutual fund');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleEditFund = (fund: MutualFund) => {
		setEditingFund(fund);
		const fundData = {
			schemeName: fund.schemeName,
			fundHouse: fund.fundHouse || '',
			folioNumber: fund.folioNumber || '',
			fundType: fund.fundType || 'Equity',
			investedAmount: fund.investedAmount || 0,
			units: fund.units || 0,
			nav: fund.nav || 0,
			notes: fund.notes || '',
			currentValue: fund.currentValue || 0,
		};
		setNewFund(fundData);
		// Set input strings for display
		setInvestedAmountInput(formatNumberForInput(fund.investedAmount || 0));
		setUnitsInput(formatNumberForInput(fund.units || 0));
		setNavInput(formatNumberForInput(fund.nav || 0));
		setCurrentValueInput(formatNumberForInput(fund.currentValue || 0));
		setShowEditModal(true);
	};

	const handleUpdateFund = async (): Promise<void> => {
		if (
			!editingFund ||
			!newFund.schemeName.trim() ||
			!newFund.fundHouse.trim()
		) {
			Alert.alert('Error', 'Please enter scheme name and fund house');
			return;
		}

		if (newFund.investedAmount <= 0) {
			Alert.alert('Error', 'Invested amount must be greater than 0');
			return;
		}

		if (newFund.units <= 0) {
			Alert.alert('Error', 'Units must be greater than 0');
			return;
		}

		if (newFund.nav <= 0) {
			Alert.alert('Error', 'NAV must be greater than 0');
			return;
		}

		setIsSubmitting(true);
		try {
			// Remove currentValue from the data sent to API
			const { currentValue, ...fundData } = newFund;
			await assetService.updateMutualFund(userId, editingFund.id, fundData);
			setShowEditModal(false);
			setEditingFund(null);
			resetForm();
			onRefresh();
			Alert.alert('Success', 'Mutual fund updated successfully!');
		} catch (error) {
			console.error('Error updating mutual fund:', error);
			Alert.alert('Error', 'Failed to update mutual fund');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteFund = async (
		fundId: string,
		fundName: string
	): Promise<void> => {
		// Use the onDelete prop if provided, otherwise use direct service call
		if (onDelete) {
			onDelete('mf', fundId);
		} else {
			Alert.alert(
				'Delete Mutual Fund',
				`Are you sure you want to delete ${fundName}?`,
				[
					{ text: 'Cancel', style: 'cancel' },
					{
						text: 'Delete',
						style: 'destructive',
						onPress: async () => {
							try {
								await assetService.deleteMutualFund(userId, fundId);
								onRefresh();
								Alert.alert('Success', 'Mutual fund deleted successfully!');
							} catch (error) {
								console.error('Error deleting mutual fund:', error);
								Alert.alert('Error', 'Failed to delete mutual fund');
							}
						},
					},
				]
			);
		}
	};

	// Reset form function
	const resetForm = () => {
		setNewFund({
			schemeName: '',
			fundHouse: '',
			folioNumber: '',
			fundType: 'Equity',
			investedAmount: 0,
			units: 0,
			nav: 0,
			notes: '',
			currentValue: 0,
		});
		setInvestedAmountInput('');
		setUnitsInput('');
		setNavInput('');
		setCurrentValueInput('');
		setShowFundTypeDropdown(false);
		setFundTypeSearch('');
	};

	const totalCurrentValue = funds.reduce(
		(sum, fund) => sum + (fund.currentValue || 0),
		0
	);
	const totalInvested = funds.reduce(
		(sum, fund) => sum + (fund.investedAmount || 0),
		0
	);
	const totalReturns = totalCurrentValue - totalInvested;
	const totalReturnPercentage =
		totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;

	const renderFundCard = (fund: MutualFund) => (
		<TouchableOpacity
			key={fund.id}
			style={[
				styles.card,
				{
					marginBottom: 12,
					borderLeftWidth: 4,
					borderLeftColor: getFundTypeColor(fund.fundType),
					padding: 16,
				},
			]}
			onPress={() => handleEditFund(fund)}
		>
			<View
				style={[
					styles.row,
					styles.spaceBetween,
					{ alignItems: 'flex-start', marginBottom: 8 },
				]}
			>
				<View style={{ flex: 1 }}>
					<Text
						style={{
							fontWeight: 'bold',
							color: colors.dark,
							fontSize: 16,
						}}
					>
						{fund.schemeName}
					</Text>
					<Text style={{ color: colors.gray, fontSize: 12 }}>
						{fund.fundHouse} • {fund.fundType}
					</Text>
				</View>

				<View style={{ alignItems: 'flex-end' }}>
					<Text
						style={{
							fontWeight: 'bold',
							color: colors.dark,
							fontSize: 16,
						}}
					>
						{formatCurrency(fund.currentValue || 0)}
					</Text>
					<Text
						style={{
							color: getReturnColor(fund.returns || 0),
							fontSize: 12,
							fontWeight: 'bold',
						}}
					>
						{(fund.returns || 0) >= 0 ? '+' : ''}
						{formatNumber(fund.returns || 0)}%
					</Text>
				</View>
			</View>

			<View style={[styles.row, styles.spaceBetween, { marginBottom: 4 }]}>
				{fund.folioNumber && (
					<Text style={{ color: colors.gray, fontSize: 12 }}>
						Folio: {fund.folioNumber}
					</Text>
				)}
				<Text style={{ color: colors.gray, fontSize: 12 }}>
					NAV: ₹{formatNumber(fund.nav || 0)}
				</Text>
			</View>

			<View style={[styles.row, styles.spaceBetween]}>
				<Text style={{ color: colors.gray, fontSize: 12 }}>
					Invested: {formatCurrency(fund.investedAmount || 0)}
				</Text>
				<Text style={{ color: colors.gray, fontSize: 12 }}>
					Units: {formatNumber(fund.units || 0, 4)}
				</Text>
			</View>

			{fund.notes && (
				<Text
					style={{
						color: colors.gray,
						fontSize: 11,
						marginTop: 8,
						fontStyle: 'italic',
					}}
				>
					{fund.notes}
				</Text>
			)}

			<Text style={{ color: colors.gray, fontSize: 10, marginTop: 4 }}>
				Last updated:{' '}
				{new Date(fund.lastUpdated || new Date()).toLocaleDateString()}
			</Text>

			{/* Edit/Delete Buttons */}
			<View style={[styles.row, { marginTop: 12, justifyContent: 'flex-end' }]}>
				<TouchableOpacity
					style={{ marginRight: 16 }}
					onPress={() => handleEditFund(fund)}
				>
					<Text style={{ color: colors.primary, fontSize: 12 }}>✏️ Edit</Text>
				</TouchableOpacity>
				<TouchableOpacity
					onPress={() => handleDeleteFund(fund.id, fund.schemeName)}
				>
					<Text style={{ color: colors.danger, fontSize: 12 }}>🗑️ Delete</Text>
				</TouchableOpacity>
			</View>
		</TouchableOpacity>
	);

	// Get input fields for modal
	const getModalInputFields = (isEdit: boolean) => {
		const returns = calculateReturns();
		const currentValue = newFund.currentValue || 0;
		const investedAmount = newFund.investedAmount || 0;
		const absoluteReturns = currentValue - investedAmount;

		const fields = [
			{
				id: 'schemeName',
				label: 'Scheme Name',
				placeholder: 'Scheme Name (e.g., Mirae Asset Large Cap Fund)',
				value: newFund.schemeName,
				onChangeText: (text: string) =>
					setNewFund({ ...newFund, schemeName: text }),
				isMandatory: true,
				isEllipsis: true,
			},
			{
				id: 'fundHouse',
				label: 'Fund House',
				placeholder: 'Fund House (e.g., Mirae Asset)',
				value: newFund.fundHouse,
				onChangeText: (text: string) =>
					setNewFund({ ...newFund, fundHouse: text }),
				isMandatory: true,
			},
			{
				id: 'folioNumber',
				label: 'Folio Number',
				placeholder: 'Folio Number (Optional)',
				value: newFund.folioNumber,
				onChangeText: (text: string) =>
					setNewFund({ ...newFund, folioNumber: text }),
				isMandatory: false,
			},
			{
				id: 'fundType',
				label: 'Fund Type',
				placeholder: 'Select Fund Type',
				value: newFund.fundType,
				onChangeText: undefined,
				isSelectDropDown: true,
				isMandatory: true,
				dropdownProps: {
					showDropDown: showFundTypeDropdown,
					setShowDropDown: setShowFundTypeDropdown,
					dropDownName: newFund.fundType,
					dropDownAlternativeName: newFund.fundType || 'Select Fund Type',
					dropdownSearchValue: fundTypeSearch,
					setDropDownSearchValue: setFundTypeSearch,
					dropdownOptions: ['Equity', 'Debt', 'Hybrid', 'ELSS'],
					handleDropDownSelectOption: handleSelectFundType,
					dropDownNotFoundText: 'No fund types found',
				},
			},
			{
				id: 'investedAmount',
				label: 'Invested Amount (₹)',
				placeholder: 'Total Invested Amount',
				value: investedAmountInput,
				onChangeText: (text: string) =>
					handleDecimalInput(text, 'investedAmount'),
				keyboardType: 'decimal-pad' as KeyboardType,
				isMandatory: true,
			},
			{
				id: 'units',
				label: 'Units',
				placeholder: 'Units',
				value: unitsInput,
				onChangeText: (text: string) => handleDecimalInput(text, 'units'),
				keyboardType: 'decimal-pad' as KeyboardType,
				isMandatory: true,
			},
			{
				id: 'nav',
				label: 'NAV',
				placeholder: 'Net Asset Value',
				value: navInput,
				onChangeText: (text: string) => handleDecimalInput(text, 'nav'),
				keyboardType: 'decimal-pad' as KeyboardType,
				isMandatory: true,
			},
			{
				id: 'currentValue',
				label: 'Current Value (₹)',
				placeholder: 'Current Value (Auto-calculated)',
				value: currentValueInput,
				onChangeText: (text: string) =>
					handleDecimalInput(text, 'currentValue'),
				keyboardType: 'decimal-pad' as KeyboardType,
				isMandatory: false,
			},
			{
				id: 'notes',
				label: 'Notes',
				placeholder: 'Notes (Optional)',
				value: newFund.notes,
				onChangeText: (text: string) => setNewFund({ ...newFund, notes: text }),
				multiline: true,
				numberOfLines: 3,
				isMandatory: false,
			},
		];

		return { fields, returns, currentValue, absoluteReturns };
	};

	const renderAddEditModal = (isEdit: boolean) => {
		const { fields, returns, currentValue, absoluteReturns } =
			getModalInputFields(isEdit);

		return (
			<Modal
				visible={isEdit ? showEditModal : showAddModal}
				animationType='slide'
				transparent={true}
				onRequestClose={() => {
					if (isEdit) {
						setShowEditModal(false);
						setEditingFund(null);
					} else {
						setShowAddModal(false);
					}
					resetForm();
				}}
			>
				<View
					style={{
						flex: 1,
						justifyContent: 'center',
						backgroundColor: 'rgba(0,0,0,0.5)',
					}}
				>
					<View style={[styles.card, { margin: 20, maxHeight: '90%' }]}>
						<ScrollView
							showsVerticalScrollIndicator={false}
							contentContainerStyle={{ flexGrow: 1 }}
						>
							<Text style={[styles.subHeading, { marginBottom: 16 }]}>
								{isEdit ? 'Edit Mutual Fund' : 'Add Mutual Fund'}
							</Text>

							{/* Current Values Summary */}
							<View
								style={{
									marginBottom: 16,
									padding: 12,
									backgroundColor: colors.lightGray,
									borderRadius: 8,
								}}
							>
								<Text
									style={{ color: colors.gray, fontSize: 12, marginBottom: 4 }}
								>
									Current Values:
								</Text>
								<View
									style={[styles.row, styles.spaceBetween, { marginBottom: 2 }]}
								>
									<Text style={{ color: colors.dark, fontSize: 12 }}>
										Invested: {formatCurrency(newFund.investedAmount)}
									</Text>
									<Text style={{ color: colors.dark, fontSize: 12 }}>
										Current: {formatCurrency(currentValue)}
									</Text>
								</View>
								<View style={[styles.row, styles.spaceBetween]}>
									<Text style={{ color: colors.dark, fontSize: 12 }}>
										Units: {formatNumber(newFund.units, 4)}
									</Text>
									<Text style={{ color: colors.dark, fontSize: 12 }}>
										NAV: {formatNumber(newFund.nav, 4)}
									</Text>
								</View>
								{absoluteReturns !== 0 && (
									<Text
										style={{
											color: getReturnColor(absoluteReturns),
											fontSize: 12,
											fontWeight: 'bold',
											marginTop: 4,
										}}
									>
										Returns: {formatCurrency(absoluteReturns)} (
										{formatNumber(returns)}%)
									</Text>
								)}
							</View>

							{fields.map((field) => (
								<InputComponent
									key={field.id}
									label={field.label}
									placeholder={field.placeholder}
									value={field.value}
									onChangeText={field.onChangeText}
									keyboardType={field.keyboardType}
									multiline={field.multiline}
									numberOfLines={field.numberOfLines}
									isMandatory={field.isMandatory}
									isEllipsis={field.isEllipsis}
									isSelectDropDown={field.isSelectDropDown}
									showDropDown={field.dropdownProps?.showDropDown}
									setShowDropDown={field.dropdownProps?.setShowDropDown}
									dropDownName={field.dropdownProps?.dropDownName}
									dropDownAlternativeName={
										field.dropdownProps?.dropDownAlternativeName
									}
									dropdownSearchValue={field.dropdownProps?.dropdownSearchValue}
									setDropDownSearchValue={
										field.dropdownProps?.setDropDownSearchValue
									}
									dropdownOptions={field.dropdownProps?.dropdownOptions}
									handleDropDownSelectOption={
										field.dropdownProps?.handleDropDownSelectOption
									}
									dropDownNotFoundText={
										field.dropdownProps?.dropDownNotFoundText
									}
								/>
							))}

							<View style={[styles.row, { gap: 12, marginTop: 16 }]}>
								<TouchableOpacity
									style={[styles.button, styles.buttonSecondary, { flex: 1 }]}
									onPress={() => {
										if (isEdit) {
											setShowEditModal(false);
											setEditingFund(null);
										} else {
											setShowAddModal(false);
										}
										resetForm();
									}}
									disabled={isSubmitting}
								>
									<Text style={styles.buttonText}>Cancel</Text>
								</TouchableOpacity>

								<TouchableOpacity
									style={[styles.button, styles.buttonPrimary, { flex: 1 }]}
									onPress={isEdit ? handleUpdateFund : handleAddFund}
									disabled={isSubmitting}
								>
									<Text style={styles.buttonText}>
										{isSubmitting
											? 'Saving...'
											: isEdit
											? 'Update Fund'
											: 'Add Fund'}
									</Text>
								</TouchableOpacity>
							</View>
						</ScrollView>
					</View>
				</View>
			</Modal>
		);
	};

	return (
		<View style={{ padding: 20 }}>
			{/* Summary Card */}
			<View style={[styles.card, { backgroundColor: colors.lightGray }]}>
				<View style={[styles.row, styles.spaceBetween, { marginBottom: 12 }]}>
					<View>
						<Text style={{ fontSize: 14, color: colors.gray }}>
							Current Value
						</Text>
						<Text
							style={{
								fontSize: 24,
								fontWeight: 'bold',
								color: colors.dark,
								marginTop: 4,
							}}
						>
							{formatCurrency(totalCurrentValue)}
						</Text>
					</View>
					<Text style={{ fontSize: 24 }}>📊</Text>
				</View>

				<View style={[styles.row, styles.spaceBetween]}>
					<View>
						<Text style={{ fontSize: 12, color: colors.gray }}>Invested</Text>
						<Text
							style={{ fontSize: 14, fontWeight: 'bold', color: colors.dark }}
						>
							{formatCurrency(totalInvested)}
						</Text>
					</View>

					<View style={{ alignItems: 'flex-end' }}>
						<Text style={{ fontSize: 12, color: colors.gray }}>Returns</Text>
						<Text
							style={{
								fontSize: 14,
								fontWeight: 'bold',
								color: getReturnColor(totalReturns),
							}}
						>
							{formatCurrency(totalReturns)} (
							{formatNumber(totalReturnPercentage)}%)
						</Text>
					</View>
				</View>
			</View>

			{/* Mutual Funds List */}
			<Text style={[styles.subHeading, { marginTop: 24, marginBottom: 16 }]}>
				Mutual Fund Portfolio
			</Text>

			{funds.length === 0 ? (
				<View
					style={[
						styles.card,
						styles.center,
						{ minHeight: 200, marginBottom: 16 },
					]}
				>
					<Text style={{ color: colors.gray }}>No mutual funds found</Text>
					<Text style={{ color: colors.gray, fontSize: 12, marginTop: 8 }}>
						Add your first mutual fund to get started
					</Text>
				</View>
			) : (
				<ScrollView
					showsVerticalScrollIndicator={false}
					style={{ maxHeight: 400 }}
				>
					{funds.map(renderFundCard)}
				</ScrollView>
			)}

			<TouchableOpacity
				style={[styles.button, styles.buttonPrimary, { marginTop: 16 }]}
				onPress={() => setShowAddModal(true)}
			>
				<Text style={styles.buttonText}>+ Add Mutual Fund</Text>
			</TouchableOpacity>

			{renderAddEditModal(false)}
			{renderAddEditModal(true)}
		</View>
	);
};
