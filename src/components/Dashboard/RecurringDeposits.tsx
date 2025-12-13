import { assetService } from '@/services/assetService';
import { createStyles } from '@/styles';
import { useTheme } from '@/theme';
import {
	CreateRecurringDepositData,
	RecurringDeposit,
	RecurringDepositsProps,
} from '@/types';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import {
	Alert,
	Modal,
	ScrollView,
	Text,
	TextInput,
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

	const formatCurrency = (amount: number): string => {
		return new Intl.NumberFormat('en-IN', {
			style: 'currency',
			currency: 'INR',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(amount);
	};

	const calculateProgress = (
		completedMonths: number,
		tenure: number
	): number => {
		return (completedMonths / tenure) * 100;
	};

	const calculateDaysToMaturity = (maturityDate: string): number => {
		const today = new Date();
		const maturity = new Date(maturityDate);
		const diffTime = maturity.getTime() - today.getTime();
		return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	};

	// Handle numeric input with decimal validation
	const handleNumericInput = (
		field: keyof CreateRecurringDepositData,
		value: string
	) => {
		const decimalCount = (value.match(/\./g) || []).length;
		if (decimalCount > 1) return;

		const regex = /^\d*\.?\d*$/;
		if (!regex.test(value) && value !== '') return;

		const numValue = parseFloat(value) || 0;
		setNewDeposit({ ...newDeposit, [field]: numValue });
	};

	const handleAddDeposit = async (): Promise<void> => {
		if (!newDeposit.bankName.trim()) {
			Alert.alert('Error', 'Please enter bank name');
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
			setNewDeposit({
				bankName: '',
				accountNumber: '',
				monthlyAmount: 0,
				interestRate: 0,
				startDate: new Date().toISOString().split('T')[0],
				tenure: 12,
			});
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
		setEditingDeposit(deposit);
		setNewDeposit({
			bankName: deposit.bankName,
			accountNumber: deposit.accountNumber,
			monthlyAmount: deposit.monthlyAmount,
			interestRate: deposit.interestRate,
			startDate: deposit.startDate,
			tenure: deposit.tenure,
		});
		setShowEditModal(true);
	};

	const handleUpdateDeposit = async (): Promise<void> => {
		if (!editingDeposit || !newDeposit?.bankName?.trim()) {
			Alert.alert('Error', 'Please enter bank name');
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
			setNewDeposit({
				bankName: '',
				accountNumber: '',
				monthlyAmount: 0,
				interestRate: 0,
				startDate: new Date().toISOString().split('T')[0],
				tenure: 12,
			});
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
		// Use the onDelete prop if provided, otherwise use direct service call
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

	// Handle date picker
	const handleDateChange = (event: any, date?: Date) => {
		setShowDatePicker(false);
		if (date) {
			setSelectedDate(date);
			const formattedDate = date.toISOString().split('T')[0];
			setNewDeposit({ ...newDeposit, startDate: formattedDate });
		}
	};

	// Open date picker
	const openDatePicker = () => {
		if (newDeposit.startDate) {
			setSelectedDate(new Date(newDeposit.startDate));
		} else {
			setSelectedDate(new Date());
		}
		setShowDatePicker(true);
	};

	const formatDate = (dateString: string): string => {
		return new Date(dateString).toLocaleDateString('en-IN', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
		});
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
		const progress = calculateProgress(deposit.completedMonths, deposit.tenure);
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
				<View
					style={[
						styles.row,
						styles.spaceBetween,
						{ alignItems: 'flex-start' },
					]}
				>
					<View style={{ flex: 1 }}>
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

						{/* Progress Bar */}
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
									{deposit.completedMonths}/{deposit.tenure} months
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

				{/* Edit/Delete Buttons */}
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

	const renderAddEditModal = (isEdit: boolean) => (
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
				setNewDeposit({
					bankName: '',
					accountNumber: '',
					monthlyAmount: 0,
					interestRate: 0,
					startDate: new Date().toISOString().split('T')[0],
					tenure: 12,
				});
			}}
		>
			<View
				style={{
					flex: 1,
					justifyContent: 'center',
					backgroundColor: 'rgba(0,0,0,0.5)',
				}}
			>
				<ScrollView style={{ maxHeight: '90%' }}>
					<View style={[styles.card, { margin: 20 }]}>
						<Text style={[styles.subHeading, { marginBottom: 16 }]}>
							{isEdit ? 'Edit Recurring Deposit' : 'Add Recurring Deposit'}
						</Text>

						<TextInput
							style={styles.input}
							placeholder='Bank Name'
							value={newDeposit.bankName}
							onChangeText={(text) =>
								setNewDeposit({ ...newDeposit, bankName: text })
							}
							placeholderTextColor={colors.gray}
						/>

						<TextInput
							style={styles.input}
							placeholder='Account Number'
							value={newDeposit.accountNumber}
							onChangeText={(text) =>
								setNewDeposit({ ...newDeposit, accountNumber: text })
							}
							placeholderTextColor={colors.gray}
						/>

						<TextInput
							style={styles.input}
							placeholder='Monthly Amount (₹)'
							value={newDeposit.monthlyAmount.toString()}
							onChangeText={(text) => handleNumericInput('monthlyAmount', text)}
							placeholderTextColor={colors.gray}
							keyboardType='decimal-pad'
						/>

						<TextInput
							style={styles.input}
							placeholder='Interest Rate (%)'
							value={newDeposit.interestRate.toString()}
							onChangeText={(text) => handleNumericInput('interestRate', text)}
							placeholderTextColor={colors.gray}
							keyboardType='decimal-pad'
						/>

						<TouchableOpacity
							style={[styles.input, { justifyContent: 'center' }]}
							onPress={openDatePicker}
						>
							<Text style={{ color: colors.dark }}>
								📅 Start Date: {formatDate(newDeposit.startDate)}
							</Text>
						</TouchableOpacity>

						<TextInput
							style={styles.input}
							placeholder='Tenure (months)'
							value={newDeposit.tenure.toString()}
							onChangeText={(text) =>
								setNewDeposit({
									...newDeposit,
									tenure: parseInt(text) || 12,
								})
							}
							placeholderTextColor={colors.gray}
							keyboardType='number-pad'
						/>

						{/* Date Picker */}
						{showDatePicker && (
							<DateTimePicker
								value={selectedDate}
								mode='date'
								display='default'
								onChange={handleDateChange}
							/>
						)}

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
									setNewDeposit({
										bankName: '',
										accountNumber: '',
										monthlyAmount: 0,
										interestRate: 0,
										startDate: new Date().toISOString().split('T')[0],
										tenure: 12,
									});
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
									{isSubmitting ? 'Saving...' : isEdit ? 'Update RD' : 'Add RD'}
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</ScrollView>
			</View>
		</Modal>
	);

	return (
		<View style={{ padding: 20 }}>
			{/* Summary Card */}
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

			{/* Recurring Deposits List */}
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

			{/* Add New RD Button */}
			<TouchableOpacity
				style={[styles.button, styles.buttonPrimary, { marginTop: 16 }]}
				onPress={() => setShowAddModal(true)}
			>
				<Text style={styles.buttonText}>+ Add Recurring Deposit</Text>
			</TouchableOpacity>

			{/* Modals */}
			{renderAddEditModal(false)}
			{renderAddEditModal(true)}
		</View>
	);
};
