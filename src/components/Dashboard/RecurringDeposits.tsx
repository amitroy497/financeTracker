import { getBankIcon } from '@/assets';
import { AddEditFields } from '@/components/UI';
import { BANK_LIST } from '@/constants';
import { assetService } from '@/services/assetService';
import { createStyles } from '@/styles';
import { useTheme } from '@/theme';
import {
	CreateRecurringDepositData,
	RecurringDeposit,
	RecurringDepositsProps,
} from '@/types';
import { formatCurrency } from '@/utils';
import React, { useState } from 'react';
import {
	Alert,
	Image,
	KeyboardType,
	Modal,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';

export const RecurringDeposits = ({
	deposits,
	onEdit,
	onDelete,
	onRefresh,
	userId,
}: RecurringDepositsProps) => {
	const { colors } = useTheme();
	const styles = createStyles(colors);
	const [showAddModal, setShowAddModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [selectedDate, setSelectedDate] = useState(new Date());
	const [editingDeposit, setEditingDeposit] = useState<RecurringDeposit | null>(
		null
	);
	const [newDeposit, setNewDeposit] = useState<CreateRecurringDepositData>({
		bankName: '',
		accountNumber: '',
		monthlyAmount: 0,
		interestRate: 0,
		startDate: new Date().toISOString().split('T')[0],
		tenure: 12,
	});

	// Add state for bank dropdown
	const [showBankDropdown, setShowBankDropdown] = useState(false);
	const [bankSearch, setBankSearch] = useState('');

	const calculateProgress = (deposit: RecurringDeposit): number => {
		try {
			const startDate = new Date(deposit.startDate);
			const today = new Date();

			// Ensure start date is in the past
			if (startDate > today) return 0;

			// Calculate total months in tenure
			const totalMonths = deposit.tenure;

			// Calculate elapsed months
			let elapsedMonths = (today.getFullYear() - startDate.getFullYear()) * 12;
			elapsedMonths += today.getMonth() - startDate.getMonth();

			// Adjust for days
			if (today.getDate() < startDate.getDate()) {
				elapsedMonths--;
			}

			// Ensure elapsed months is not negative
			elapsedMonths = Math.max(0, elapsedMonths);

			// Cap at total months (can't exceed tenure)
			elapsedMonths = Math.min(elapsedMonths, totalMonths);

			// Calculate percentage
			const progress = (elapsedMonths / totalMonths) * 100;
			return Math.min(Math.max(progress, 0), 100);
		} catch (error) {
			console.error('Error calculating progress:', error);
			return 0;
		}
	};

	const getCompletedMonths = (deposit: RecurringDeposit): number => {
		try {
			const startDate = new Date(deposit.startDate);
			const today = new Date();

			if (startDate > today) return 0;

			let completedMonths =
				(today.getFullYear() - startDate.getFullYear()) * 12;
			completedMonths += today.getMonth() - startDate.getMonth();

			// Adjust for days
			if (today.getDate() < startDate.getDate()) {
				completedMonths--;
			}

			return Math.max(0, Math.min(completedMonths, deposit.tenure));
		} catch (error) {
			console.error('Error calculating completed months:', error);
			return deposit.completedMonths || 0;
		}
	};

	const calculateDaysToMaturity = (maturityDate: string): number => {
		try {
			const today = new Date();
			const maturity = new Date(maturityDate);
			const diffTime = maturity.getTime() - today.getTime();
			return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		} catch (error) {
			console.error('Error calculating days to maturity:', error);
			return 0;
		}
	};

	const filteredBanks = BANK_LIST.sort().filter((bank) =>
		bank.toLowerCase().includes(bankSearch.toLowerCase())
	);

	const handleSelectBank = (bank: string): void => {
		setNewDeposit({ ...newDeposit, bankName: bank });
		setShowBankDropdown(false);
		setBankSearch('');
	};

	// FIXED: Simplified decimal input handling
	const handleDecimalInput = (
		text: string,
		type: 'monthlyAmount' | 'interestRate'
	) => {
		// Remove all non-numeric characters except decimal point
		let cleanedText = text.replace(/[^0-9.]/g, '');

		// Handle multiple decimal points
		const parts = cleanedText.split('.');
		if (parts.length > 2) {
			cleanedText = parts[0] + '.' + parts.slice(1).join('');
		}

		// Limit to 2 decimal places
		if (parts.length === 2 && parts[1].length > 2) {
			cleanedText = parts[0] + '.' + parts[1].substring(0, 2);
		}

		// Parse the value
		let parsedValue = 0;
		if (cleanedText !== '' && cleanedText !== '.') {
			parsedValue = parseFloat(cleanedText);
			if (isNaN(parsedValue)) parsedValue = 0;
		}

		// Update the newDeposit state
		setNewDeposit({
			...newDeposit,
			[type]: parsedValue,
		});
	};

	const handleTenureInput = (text: string) => {
		const cleanedText = text.replace(/[^0-9]/g, '');
		const parsedValue = cleanedText === '' ? 0 : parseInt(cleanedText, 10);

		if (!isNaN(parsedValue)) {
			setNewDeposit({
				...newDeposit,
				tenure: parsedValue,
			});
		}
	};

	// FIXED: Get the input value from newDeposit
	const getInputValue = (
		field: 'monthlyAmount' | 'interestRate' | 'tenure'
	): string => {
		const value = newDeposit[field];
		if (value === 0) return '';
		if (field === 'interestRate' && value % 1 !== 0) {
			return value.toFixed(2);
		}
		return value.toString();
	};

	const handleAddDeposit = async (): Promise<void> => {
		// FIXED: Log for debugging
		console.log('Adding deposit with data:', newDeposit);

		if (!newDeposit.bankName.trim()) {
			Alert.alert('Error', 'Please select a bank');
			return;
		}

		if (!newDeposit?.accountNumber?.trim()) {
			Alert.alert('Error', 'Please enter account number');
			return;
		}

		if (newDeposit.monthlyAmount <= 0) {
			Alert.alert('Error', 'Monthly amount must be greater than 0');
			return;
		}

		if (newDeposit.interestRate <= 0) {
			Alert.alert('Error', 'Interest rate must be greater than 0');
			return;
		}

		if (newDeposit.tenure <= 0) {
			Alert.alert('Error', 'Tenure must be greater than 0');
			return;
		}

		setIsSubmitting(true);
		try {
			await assetService.createRecurringDeposit(userId, newDeposit);
			setShowAddModal(false);
			resetForm();
			onRefresh();
			Alert.alert('Success', 'Recurring deposit added successfully!');
		} catch (error) {
			console.error('Error adding recurring deposit:', error);
			Alert.alert('Error', 'Failed to add recurring deposit');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleEditDeposit = (deposit: RecurringDeposit) => {
		console.log('Editing deposit:', deposit);
		setEditingDeposit(deposit);
		setNewDeposit({
			bankName: deposit.bankName,
			accountNumber: deposit.accountNumber || '',
			monthlyAmount: deposit.monthlyAmount,
			interestRate: deposit.interestRate,
			startDate: deposit.startDate,
			tenure: deposit.tenure,
		});
		setShowEditModal(true);
	};

	const handleUpdateDeposit = async (): Promise<void> => {
		if (!editingDeposit || !newDeposit.bankName.trim()) {
			Alert.alert('Error', 'Please select a bank');
			return;
		}

		if (!newDeposit?.accountNumber?.trim()) {
			Alert.alert('Error', 'Please enter account number');
			return;
		}

		if (newDeposit?.monthlyAmount <= 0) {
			Alert.alert('Error', 'Monthly amount must be greater than 0');
			return;
		}

		if (newDeposit?.interestRate <= 0) {
			Alert.alert('Error', 'Interest rate must be greater than 0');
			return;
		}

		if (newDeposit?.tenure <= 0) {
			Alert.alert('Error', 'Tenure must be greater than 0');
			return;
		}

		setIsSubmitting(true);
		try {
			await assetService.updateRecurringDeposit(
				userId,
				editingDeposit.id,
				newDeposit
			);
			setShowEditModal(false);
			setEditingDeposit(null);
			resetForm();
			onRefresh();
			Alert.alert('Success', 'Recurring deposit updated successfully!');
		} catch (error) {
			console.error('Error updating recurring deposit:', error);
			Alert.alert('Error', 'Failed to update recurring deposit');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteDeposit = async (
		depositId: string,
		bankName: string
	): Promise<void> => {
		if (onDelete) {
			onDelete('recurring-deposit', depositId);
		} else {
			Alert.alert(
				'Delete Recurring Deposit',
				`Are you sure you want to delete ${bankName} RD?`,
				[
					{ text: 'Cancel', style: 'cancel' },
					{
						text: 'Delete',
						style: 'destructive',
						onPress: async () => {
							try {
								await assetService.deleteRecurringDeposit(userId, depositId);
								onRefresh();
								Alert.alert(
									'Success',
									'Recurring deposit deleted successfully!'
								);
							} catch (error) {
								console.error('Error deleting recurring deposit:', error);
								Alert.alert('Error', 'Failed to delete recurring deposit');
							}
						},
					},
				]
			);
		}
	};

	const handleDateChange = (event: any, date?: Date) => {
		setShowDatePicker(false);
		if (date) {
			setSelectedDate(date);
			const formattedDate = date.toISOString().split('T')[0];
			setNewDeposit({ ...newDeposit, startDate: formattedDate });
		}
	};

	const openDatePicker = () => {
		if (newDeposit.startDate) {
			setSelectedDate(new Date(newDeposit.startDate));
		} else {
			setSelectedDate(new Date());
		}
		setShowDatePicker(true);
	};

	const resetForm = () => {
		setNewDeposit({
			bankName: '',
			accountNumber: '',
			monthlyAmount: 0,
			interestRate: 0,
			startDate: new Date().toISOString().split('T')[0],
			tenure: 12,
		});
		setShowBankDropdown(false);
		setBankSearch('');
	};

	const formatDate = (dateString: string): string => {
		try {
			return new Date(dateString).toLocaleDateString('en-IN', {
				day: '2-digit',
				month: 'short',
				year: 'numeric',
			});
		} catch (error) {
			console.error('Error formatting date:', error);
			return dateString;
		}
	};

	const totalInvested = deposits.reduce(
		(sum, deposit) => sum + deposit.totalAmount,
		0
	);
	const totalMonthly = deposits.reduce(
		(sum, deposit) => sum + deposit.monthlyAmount,
		0
	);

	const renderDepositCard = (deposit: RecurringDeposit) => {
		const completedMonths = getCompletedMonths(deposit);
		const progress = calculateProgress(deposit);
		const daysToMaturity = calculateDaysToMaturity(deposit.maturityDate);
		const isMatured = daysToMaturity <= 0;

		return (
			<TouchableOpacity
				key={deposit.id}
				style={[
					styles.card,
					{
						marginBottom: 12,
						borderLeftWidth: 4,
						borderLeftColor: isMatured ? colors.gray : colors.primary,
						padding: 16,
					},
				]}
				onPress={() => handleEditDeposit(deposit)}
			>
				<View style={[styles.row]}>
					<View
						style={{
							alignItems: 'flex-start',
							justifyContent: 'flex-start',
							marginRight: 12,
						}}
					>
						<Image
							source={getBankIcon(deposit.bankName)}
							style={{
								width: 30,
								height: 30,
								borderRadius: 8,
							}}
							resizeMode='contain'
						/>
					</View>
					<View style={{ flex: 1, justifyContent: 'center' }}>
						<View
							style={[styles.row, styles.spaceBetween, { marginBottom: 8 }]}
						>
							<Text
								style={{
									fontWeight: 'bold',
									color: colors.dark,
									fontSize: 16,
								}}
							>
								{deposit.bankName}
							</Text>
							<Text
								style={{
									fontWeight: 'bold',
									color: colors.dark,
									fontSize: 16,
								}}
							>
								{formatCurrency(deposit.totalAmount)}
							</Text>
						</View>

						<Text style={{ color: colors.gray, fontSize: 12, marginBottom: 8 }}>
							{deposit.accountNumber} • {deposit.interestRate}% interest
						</Text>
						<View style={{ marginBottom: 12 }}>
							<View
								style={{
									height: 6,
									backgroundColor: colors.lightGray,
									borderRadius: 3,
									overflow: 'hidden',
								}}
							>
								<View
									style={{
										height: '100%',
										backgroundColor: colors.primary,
										width: `${progress}%`,
										borderRadius: 3,
									}}
								/>
							</View>
							<View style={[styles.row, styles.spaceBetween, { marginTop: 4 }]}>
								<Text style={{ color: colors.gray, fontSize: 10 }}>
									{completedMonths}/{deposit.tenure} months
								</Text>
								<Text style={{ color: colors.gray, fontSize: 10 }}>
									{progress.toFixed(1)}%
								</Text>
							</View>
						</View>

						<View
							style={[
								styles.row,
								{ justifyContent: 'space-between', marginBottom: 8 },
							]}
						>
							<View>
								<Text style={{ color: colors.gray, fontSize: 12 }}>
									Monthly Payment
								</Text>
								<Text
									style={{
										fontWeight: 'bold',
										color: colors.dark,
										fontSize: 14,
									}}
								>
									{formatCurrency(deposit.monthlyAmount)}
								</Text>
							</View>

							<View style={{ alignItems: 'flex-end' }}>
								<Text style={{ color: colors.gray, fontSize: 12 }}>
									Maturity Date
								</Text>
								<Text
									style={{
										fontWeight: 'bold',
										color: isMatured ? colors.gray : colors.success,
										fontSize: 14,
									}}
								>
									{isMatured ? 'Matured' : formatDate(deposit.maturityDate)}
								</Text>
							</View>
						</View>

						<Text style={{ color: colors.gray, fontSize: 10 }}>
							📅 Started: {formatDate(deposit.startDate)} •{' '}
							{isMatured ? 'Matured' : `${daysToMaturity} days to maturity`}
						</Text>
					</View>
				</View>
				<View
					style={[styles.row, { marginTop: 12, justifyContent: 'flex-end' }]}
				>
					<TouchableOpacity
						style={{ marginRight: 16 }}
						onPress={() => handleEditDeposit(deposit)}
					>
						<Text style={{ color: colors.primary, fontSize: 12 }}>✏️ Edit</Text>
					</TouchableOpacity>
					<TouchableOpacity
						onPress={() => handleDeleteDeposit(deposit.id, deposit.bankName)}
					>
						<Text style={{ color: colors.danger, fontSize: 12 }}>
							🗑️ Delete
						</Text>
					</TouchableOpacity>
				</View>
			</TouchableOpacity>
		);
	};

	const renderAddEditModal = (isEdit: boolean) => {
		// FIXED: Use getInputValue to get the correct display value
		const fields = [
			{
				id: 'bankName',
				label: 'Select Bank',
				placeholder: 'Search banks...',
				value: newDeposit.bankName || '',
				onChangeText: undefined,
				isSelectDropDown: true,
				isMandatory: true,
				dropdownProps: {
					showDropDown: showBankDropdown,
					setShowDropDown: setShowBankDropdown,
					dropDownName: newDeposit.bankName || '',
					dropDownAlternativeName: newDeposit.bankName || 'Select a bank',
					dropdownSearchValue: bankSearch,
					setDropDownSearchValue: setBankSearch,
					dropdownOptions: filteredBanks,
					handleDropDownSelectOption: handleSelectBank,
					dropDownNotFoundText: 'No banks found',
				},
			},
			{
				id: 'accountNumber',
				label: 'Account Number',
				placeholder: 'Account Number',
				value: newDeposit.accountNumber || '',
				onChangeText: (text: string) =>
					setNewDeposit({ ...newDeposit, accountNumber: text }),
				keyboardType: 'default' as KeyboardType,
				isMandatory: true,
			},
			{
				id: 'monthlyAmount',
				label: 'Monthly Amount',
				placeholder: 'Monthly Amount (₹)',
				value: getInputValue('monthlyAmount'),
				onChangeText: (text: string) =>
					handleDecimalInput(text, 'monthlyAmount'),
				keyboardType: 'decimal-pad' as KeyboardType,
				isMandatory: true,
			},
			{
				id: 'interestRate',
				label: 'Interest Rate',
				placeholder: 'Interest Rate (%)',
				value: getInputValue('interestRate'),
				onChangeText: (text: string) =>
					handleDecimalInput(text, 'interestRate'),
				keyboardType: 'decimal-pad' as KeyboardType,
				isMandatory: true,
			},
			{
				id: 'startDate',
				isDatePicker: true,
				onPressOpen: openDatePicker,
				value: formatDate(newDeposit.startDate),
				showDatePicker: showDatePicker,
				handleDateChange: handleDateChange,
				selectedDate: selectedDate,
				label: 'Start Date',
			},
			{
				id: 'tenure',
				label: 'Tenure',
				placeholder: 'Tenure (months)',
				value: getInputValue('tenure'),
				onChangeText: handleTenureInput,
				keyboardType: 'number-pad' as KeyboardType,
				isMandatory: true,
			},
		];

		return (
			<Modal
				visible={isEdit ? showEditModal : showAddModal}
				animationType='slide'
				transparent={true}
				onRequestClose={() => {
					if (isEdit) {
						setShowEditModal(false);
						setEditingDeposit(null);
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
								{isEdit ? 'Edit Recurring Deposit' : 'Add Recurring Deposit'}
							</Text>

							{/* FIXED: Show current deposit values for debugging */}
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
								<Text style={{ color: colors.dark, fontSize: 12 }}>
									Monthly Amount: ₹{newDeposit.monthlyAmount} | Interest Rate:{' '}
									{newDeposit.interestRate}% | Tenure: {newDeposit.tenure}{' '}
									months
								</Text>
							</View>

							{newDeposit.bankName && (
								<View
									style={[
										styles.row,
										{ alignItems: 'center', marginBottom: 12 },
									]}
								>
									<Image
										source={getBankIcon(newDeposit.bankName)}
										style={{
											width: 24,
											height: 24,
											marginRight: 8,
											borderRadius: 6,
										}}
										resizeMode='contain'
									/>
									<Text style={{ color: colors.dark, fontSize: 14 }}>
										Selected: {newDeposit.bankName}
									</Text>
								</View>
							)}

							<AddEditFields fields={fields} />

							<View style={[styles.row, { gap: 12, marginTop: 16 }]}>
								<TouchableOpacity
									style={[styles.button, styles.buttonSecondary, { flex: 1 }]}
									onPress={() => {
										if (isEdit) {
											setShowEditModal(false);
											setEditingDeposit(null);
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
									onPress={isEdit ? handleUpdateDeposit : handleAddDeposit}
									disabled={isSubmitting}
								>
									<Text style={styles.buttonText}>
										{isSubmitting
											? 'Saving...'
											: isEdit
											? 'Update RD'
											: 'Add RD'}
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
			<View style={[styles.card, { backgroundColor: colors.lightGray }]}>
				<View style={[styles.row, styles.spaceBetween]}>
					<View>
						<Text style={{ fontSize: 14, color: colors.gray }}>
							Total Recurring Deposits
						</Text>
						<Text
							style={{
								fontSize: 24,
								fontWeight: 'bold',
								color: colors.dark,
								marginTop: 4,
							}}
						>
							{formatCurrency(totalInvested)}
						</Text>
					</View>
					<Text style={{ fontSize: 24 }}>📈</Text>
				</View>
				<View style={[styles.row, { marginTop: 8 }]}>
					<Text style={{ fontSize: 12, color: colors.gray }}>
						Monthly investment: {formatCurrency(totalMonthly)} •{' '}
						{deposits.length} RD{deposits.length !== 1 ? 's' : ''}
					</Text>
				</View>
			</View>

			<Text style={[styles.subHeading, { marginTop: 24, marginBottom: 16 }]}>
				Recurring Deposits
			</Text>

			{deposits.length === 0 ? (
				<View
					style={[
						styles.card,
						styles.center,
						{ minHeight: 200, marginBottom: 16 },
					]}
				>
					<Text style={{ color: colors.gray }}>
						No recurring deposits found
					</Text>
					<Text style={{ color: colors.gray, fontSize: 12, marginTop: 8 }}>
						Add your first recurring deposit to get started
					</Text>
				</View>
			) : (
				<ScrollView
					showsVerticalScrollIndicator={false}
					style={{ maxHeight: 400 }}
				>
					{deposits.map(renderDepositCard)}
				</ScrollView>
			)}

			<TouchableOpacity
				style={[styles.button, styles.buttonPrimary, { marginTop: 16 }]}
				onPress={() => setShowAddModal(true)}
			>
				<Text style={styles.buttonText}>+ Add Recurring Deposit</Text>
			</TouchableOpacity>

			{renderAddEditModal(false)}
			{renderAddEditModal(true)}
		</View>
	);
};
