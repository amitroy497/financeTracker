import { assetService } from '@/services/assetService';
import { createStyles } from '@/styles';
import { useTheme } from '@/theme';
import {
	CreateFixedDepositData,
	FixedDeposit,
	FixedDepositsProps,
} from '@/types';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import {
	Alert,
	Modal,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { InputComponent } from '../UI';

export const FixedDeposits = ({
	deposits,
	onEdit,
	onDelete,
	onRefresh,
	userId,
}: FixedDepositsProps) => {
	const { colors } = useTheme();
	const styles = createStyles(colors);
	const [showAddModal, setShowAddModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [datePickerField, setDatePickerField] = useState<
		'startDate' | 'maturityDate'
	>('startDate');
	const [selectedDate, setSelectedDate] = useState(new Date());
	const [editingDeposit, setEditingDeposit] = useState<FixedDeposit | null>(
		null
	);
	const [newDeposit, setNewDeposit] = useState<CreateFixedDepositData>({
		bankName: '',
		depositNumber: '',
		amount: 0,
		interestRate: 0,
		startDate: new Date().toISOString().split('T')[0],
		tenure: 12,
		description: '',
	});

	const [amountInput, setAmountInput] = useState<string>('');
	const [interestRateInput, setInterestRateInput] = useState<string>('');

	const formatCurrency = (amount: number): string => {
		return new Intl.NumberFormat('en-IN', {
			style: 'currency',
			currency: 'INR',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		}).format(amount);
	};

	const calculateDaysToMaturity = (maturityDate: string): number => {
		const today = new Date();
		const maturity = new Date(maturityDate);
		const diffTime = maturity.getTime() - today.getTime();
		return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	};

	const getStatusColor = (status: string): string => {
		return status === 'Active' ? colors.success : colors.gray;
	};

	const handleDecimalInput = (
		text: string,
		type: 'amount' | 'interestRate'
	) => {
		let cleanedText = text.replace(/[^0-9.]/g, '');

		const decimalCount = (cleanedText.match(/\./g) || []).length;
		if (decimalCount > 1) {
			const firstDecimalIndex = cleanedText.indexOf('.');
			const beforeDecimal = cleanedText.substring(0, firstDecimalIndex + 1);
			const afterDecimal = cleanedText
				.substring(firstDecimalIndex + 1)
				.replace(/\./g, '');
			cleanedText = beforeDecimal + afterDecimal;
		}

		const decimalIndex = cleanedText.indexOf('.');
		if (decimalIndex !== -1) {
			const decimalPart = cleanedText.substring(decimalIndex + 1);
			if (decimalPart.length > 2) {
				cleanedText = cleanedText.substring(0, decimalIndex + 3);
			}
		}

		if (type === 'amount') {
			setAmountInput(cleanedText);
		} else {
			setInterestRateInput(cleanedText);
		}

		let parsedValue: number;
		if (cleanedText === '' || cleanedText === '.') {
			parsedValue = 0;
		} else {
			parsedValue = parseFloat(cleanedText);
			if (isNaN(parsedValue)) parsedValue = 0;
		}

		setNewDeposit({
			...newDeposit,
			[type === 'amount' ? 'amount' : 'interestRate']: parsedValue,
		});
	};

	const handleIntegerInput = (
		field: keyof CreateFixedDepositData,
		value: string
	) => {
		const intValue = parseInt(value) || 0;
		setNewDeposit({ ...newDeposit, [field]: intValue });
	};

	const handleTenureInput = (text: string) => {
		const cleanedText = text.replace(/[^0-9]/g, '');
		const parsedValue = cleanedText === '' ? 12 : parseInt(cleanedText, 10);

		if (!isNaN(parsedValue)) {
			setNewDeposit({
				...newDeposit,
				tenure: parsedValue,
			});
		}
	};

	const formatNumberForInput = (num: number): string => {
		if (num === 0) return '';
		return num.toString();
	};

	const handleAddDeposit = async (): Promise<void> => {
		if (!newDeposit.bankName.trim()) {
			Alert.alert('Error', 'Please enter bank name');
			return;
		}

		if (newDeposit.amount <= 0) {
			Alert.alert('Error', 'Amount must be greater than 0');
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
			await assetService.createFixedDeposit(userId, newDeposit);
			setShowAddModal(false);
			setNewDeposit({
				bankName: '',
				depositNumber: '',
				amount: 0,
				interestRate: 0,
				startDate: new Date().toISOString().split('T')[0],
				tenure: 12,
				description: '',
			});
			setAmountInput('');
			setInterestRateInput('');
			onRefresh();
			Alert.alert('Success', 'Fixed deposit added successfully!');
		} catch (error) {
			console.error('Error adding fixed deposit:', error);
			Alert.alert('Error', 'Failed to add fixed deposit');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleEditDeposit = (deposit: FixedDeposit) => {
		setEditingDeposit(deposit);
		setNewDeposit({
			bankName: deposit.bankName,
			depositNumber: deposit.depositNumber || '',
			amount: deposit.amount,
			interestRate: deposit.interestRate,
			startDate: deposit.startDate,
			tenure: deposit.tenure,
			description: deposit.description || '',
		});
		setAmountInput(formatNumberForInput(deposit.amount));
		setInterestRateInput(formatNumberForInput(deposit.interestRate));
		setShowEditModal(true);
	};

	const handleUpdateDeposit = async (): Promise<void> => {
		if (!editingDeposit || !newDeposit.bankName.trim()) {
			Alert.alert('Error', 'Please enter bank name');
			return;
		}

		if (newDeposit.amount <= 0) {
			Alert.alert('Error', 'Amount must be greater than 0');
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
			await assetService.updateFixedDeposit(
				userId,
				editingDeposit.id,
				newDeposit
			);
			setShowEditModal(false);
			setEditingDeposit(null);
			setNewDeposit({
				bankName: '',
				depositNumber: '',
				amount: 0,
				interestRate: 0,
				startDate: new Date().toISOString().split('T')[0],
				tenure: 12,
				description: '',
			});
			setAmountInput('');
			setInterestRateInput('');
			onRefresh();
			Alert.alert('Success', 'Fixed deposit updated successfully!');
		} catch (error) {
			console.error('Error updating fixed deposit:', error);
			Alert.alert('Error', 'Failed to update fixed deposit');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteDeposit = async (
		depositId: string,
		bankName: string
	): Promise<void> => {
		if (onDelete) {
			onDelete('fd', depositId);
		} else {
			Alert.alert(
				'Delete Fixed Deposit',
				`Are you sure you want to delete ${bankName} FD?`,
				[
					{ text: 'Cancel', style: 'cancel' },
					{
						text: 'Delete',
						style: 'destructive',
						onPress: async () => {
							try {
								await assetService.deleteFixedDeposit(userId, depositId);
								onRefresh();
								Alert.alert('Success', 'Fixed deposit deleted successfully!');
							} catch (error) {
								console.error('Error deleting fixed deposit:', error);
								Alert.alert('Error', 'Failed to delete fixed deposit');
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

			if (datePickerField === 'startDate') {
				setNewDeposit({ ...newDeposit, startDate: formattedDate });
			}
		}
	};

	const openDatePicker = (field: 'startDate') => {
		setDatePickerField(field);
		if (newDeposit[field]) {
			setSelectedDate(new Date(newDeposit[field] as string));
		} else {
			setSelectedDate(new Date());
		}

		setShowDatePicker(true);
	};

	const totalAmount = deposits.reduce(
		(sum, deposit) => sum + (deposit.amount || 0),
		0
	);
	const activeDeposits = deposits.filter(
		(deposit) => deposit.status === 'Active'
	);

	const formatDate = (dateString: string): string => {
		return new Date(dateString).toLocaleDateString('en-IN', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
		});
	};

	const renderDepositCard = (deposit: FixedDeposit) => {
		const daysToMaturity = calculateDaysToMaturity(deposit.maturityDate);
		const isMatured = deposit.status === 'Matured' || daysToMaturity <= 0;

		return (
			<TouchableOpacity
				key={deposit.id}
				style={[
					styles.card,
					{
						marginBottom: 12,
						borderLeftWidth: 4,
						borderLeftColor: getStatusColor(deposit.status),
						padding: 16,
					},
				]}
				onPress={() => handleEditDeposit(deposit)}
			>
				<View
					style={[
						styles.row,
						styles.spaceBetween,
						{ alignItems: 'flex-start', marginBottom: 8 },
					]}
				>
					<View style={{ flex: 1 }}>
						<View
							style={[styles.row, styles.spaceBetween, { marginBottom: 4 }]}
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
									color: getStatusColor(deposit.status),
									fontSize: 12,
									fontWeight: 'bold',
								}}
							>
								{isMatured ? 'Matured' : deposit.status}
							</Text>
						</View>
						{deposit.depositNumber && (
							<Text
								style={{
									color: colors.gray,
									fontSize: 12,
									marginBottom: 4,
								}}
							>
								FD No: {deposit.depositNumber}
							</Text>
						)}
						<Text
							style={{
								color: colors.gray,
								fontSize: 12,
								marginBottom: 8,
							}}
						>
							Interest: {deposit.interestRate}% • Tenure: {deposit.tenure}{' '}
							months
						</Text>
						<View
							style={[
								styles.row,
								{ justifyContent: 'space-between', marginBottom: 8 },
							]}
						>
							<Text style={{ color: colors.gray, fontSize: 12 }}>
								{isMatured ? 'Matured on' : 'Matures in'}{' '}
								{isMatured ? '' : daysToMaturity + ' days'}
							</Text>
							<Text
								style={{
									fontWeight: 'bold',
									color: colors.dark,
									fontSize: 18,
								}}
							>
								{formatCurrency(deposit.amount)}
							</Text>
						</View>

						<Text style={{ color: colors.gray, fontSize: 10, marginBottom: 4 }}>
							📅 {formatDate(deposit.startDate)} -{' '}
							{formatDate(deposit.maturityDate)}
						</Text>
						{deposit.description && (
							<Text
								style={{
									color: colors.gray,
									fontSize: 11,
									marginTop: 4,
									fontStyle: 'italic',
								}}
							>
								{deposit.description}
							</Text>
						)}
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
					depositNumber: '',
					amount: 0,
					interestRate: 0,
					startDate: new Date().toISOString().split('T')[0],
					tenure: 12,
					description: '',
				});
				setAmountInput('');
				setInterestRateInput('');
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
							{isEdit ? 'Edit Fixed Deposit' : 'Add Fixed Deposit'}
						</Text>
						<InputComponent
							label='Bank'
							placeholder='Bank Name'
							value={newDeposit.bankName}
							onChangeText={(text) =>
								setNewDeposit({ ...newDeposit, bankName: text })
							}
							isMandatory={true}
						/>
						<InputComponent
							label='FD Number'
							placeholder='FD Number (Optional)'
							value={newDeposit.depositNumber}
							onChangeText={(text) =>
								setNewDeposit({ ...newDeposit, depositNumber: text })
							}
						/>
						<InputComponent
							label='Amount'
							placeholder='Amount (₹)'
							value={amountInput}
							onChangeText={(text) => handleDecimalInput(text, 'amount')}
							keyboardType='decimal-pad'
							isMandatory={true}
						/>
						<InputComponent
							label='Interest Rate'
							placeholder='Interest Rate (%)'
							value={interestRateInput}
							onChangeText={(text) => handleDecimalInput(text, 'interestRate')}
							keyboardType='decimal-pad'
							isMandatory={true}
						/>
						<TouchableOpacity
							style={[styles.input, { justifyContent: 'center' }]}
							onPress={() => openDatePicker('startDate')}
						>
							<Text style={{ color: colors.dark }}>
								📅 Start Date: {formatDate(newDeposit.startDate)}
							</Text>
						</TouchableOpacity>
						{showDatePicker && (
							<DateTimePicker
								value={selectedDate}
								mode='date'
								display='default'
								onChange={handleDateChange}
							/>
						)}
						<InputComponent
							label='Tenure'
							placeholder='Tenure (months)'
							value={
								newDeposit.tenure === 0 ? '' : newDeposit.tenure.toString()
							}
							onChangeText={handleTenureInput}
							keyboardType='number-pad'
							isMandatory={true}
						/>
						<InputComponent
							label='Description'
							placeholder='Description (Optional)'
							value={newDeposit.description}
							onChangeText={(text) =>
								setNewDeposit({ ...newDeposit, description: text })
							}
							multiline={true}
							numberOfLines={3}
						/>
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
										depositNumber: '',
										amount: 0,
										interestRate: 0,
										startDate: new Date().toISOString().split('T')[0],
										tenure: 12,
										description: '',
									});
									setAmountInput('');
									setInterestRateInput('');
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
									{isSubmitting ? 'Saving...' : isEdit ? 'Update FD' : 'Add FD'}
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
			<View style={[styles.card, { backgroundColor: colors.lightGray }]}>
				<View style={[styles.row, styles.spaceBetween]}>
					<View>
						<Text style={{ fontSize: 14, color: colors.gray }}>
							Total Fixed Deposits
						</Text>
						<Text
							style={{
								fontSize: 24,
								fontWeight: 'bold',
								color: colors.dark,
								marginTop: 4,
							}}
						>
							{formatCurrency(totalAmount)}
						</Text>
					</View>
					<Text style={{ fontSize: 24 }}>🏦</Text>
				</View>
				<View style={[styles.row, { marginTop: 8 }]}>
					<Text style={{ fontSize: 12, color: colors.gray }}>
						{activeDeposits.length} active •{' '}
						{deposits.length - activeDeposits.length} matured
					</Text>
				</View>
			</View>
			<Text style={[styles.subHeading, { marginTop: 24, marginBottom: 16 }]}>
				Fixed Deposits
			</Text>
			{deposits.length === 0 ? (
				<View
					style={[
						styles.card,
						styles.center,
						{ minHeight: 200, marginBottom: 16 },
					]}
				>
					<Text style={{ color: colors.gray }}>No fixed deposits found</Text>
					<Text style={{ color: colors.gray, fontSize: 12, marginTop: 8 }}>
						Add your first fixed deposit to get started
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
				<Text style={styles.buttonText}>+ Add Fixed Deposit</Text>
			</TouchableOpacity>

			{renderAddEditModal(false)}
			{renderAddEditModal(true)}
		</View>
	);
};
