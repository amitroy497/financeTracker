import { assetService } from '@/services/assetService';
import { createStyles } from '@/styles';
import { useTheme } from '@/theme';
import {
	CreateFRBData,
	FloatingRateBond,
	FloatingRateBondsProps,
} from '@/types';
import { formatCurrency } from '@/utils';
import React, { useState } from 'react';
import {
	Alert,
	Modal,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { AddEditFields } from '../UI';

export const FloatingRateBonds = ({
	bonds,
	onEdit,
	onDelete,
	onRefresh,
	userId,
}: FloatingRateBondsProps) => {
	const { colors } = useTheme();
	const styles = createStyles(colors);
	const [showAddModal, setShowAddModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [datePickerField, setDatePickerField] = useState<
		'purchaseDate' | 'maturityDate'
	>('purchaseDate');
	const [selectedDate, setSelectedDate] = useState(new Date());
	const [editingBond, setEditingBond] = useState<FloatingRateBond | null>(null);
	const [newBond, setNewBond] = useState<CreateFRBData>({
		bondName: '',
		certificateNumber: '',
		investmentAmount: 0,
		interestRate: 7.15,
		purchaseDate: new Date().toISOString().split('T')[0],
		maturityDate: new Date(new Date().setFullYear(new Date().getFullYear() + 5))
			.toISOString()
			.split('T')[0],
		notes: '',
	});

	const [investmentAmountInput, setInvestmentAmountInput] =
		useState<string>('');
	const [interestRateInput, setInterestRateInput] = useState<string>('7.15');

	const calculateDaysToMaturity = (maturityDate: string): number => {
		const today = new Date();
		const maturity = new Date(maturityDate);
		const diffTime = maturity.getTime() - today.getTime();
		return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	};

	const handleDecimalInput = (
		text: string,
		type: 'investmentAmount' | 'interestRate'
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

		if (type === 'investmentAmount') {
			setInvestmentAmountInput(cleanedText);
		} else {
			setInterestRateInput(cleanedText);
		}

		let parsedValue: number;
		if (cleanedText === '' || cleanedText === '.') {
			if (type === 'investmentAmount') {
				parsedValue = 0;
			} else {
				parsedValue = 7.15;
			}
		} else {
			parsedValue = parseFloat(cleanedText);
			if (isNaN(parsedValue)) {
				parsedValue = type === 'investmentAmount' ? 0 : 7.15;
			}
		}

		setNewBond({
			...newBond,
			[type]: parsedValue,
		});
	};

	const formatNumberForInput = (num: number): string => {
		if (num === 0) return '';
		return num.toString();
	};

	// Handle date picker
	const handleDateChange = (event: any, date?: Date) => {
		setShowDatePicker(false);
		if (date) {
			setSelectedDate(date);
			const formattedDate = date.toISOString().split('T')[0];

			if (datePickerField === 'purchaseDate') {
				setNewBond({ ...newBond, purchaseDate: formattedDate });
			} else if (datePickerField === 'maturityDate') {
				setNewBond({ ...newBond, maturityDate: formattedDate });
			}
		}
	};

	// Open date picker
	const openDatePicker = (field: 'purchaseDate' | 'maturityDate') => {
		setDatePickerField(field);

		// Set initial date from form data or current date
		if (newBond[field]) {
			setSelectedDate(new Date(newBond[field] as string));
		} else {
			setSelectedDate(new Date());
		}

		setShowDatePicker(true);
	};

	const handleAddBond = async (): Promise<void> => {
		if (!newBond.bondName.trim()) {
			Alert.alert('Error', 'Please enter bond name');
			return;
		}

		if (newBond.investmentAmount <= 0) {
			Alert.alert('Error', 'Investment amount must be greater than 0');
			return;
		}

		if (newBond.interestRate <= 0) {
			Alert.alert('Error', 'Interest rate must be greater than 0');
			return;
		}

		setIsSubmitting(true);
		try {
			await assetService.createFRB(userId, newBond);
			setShowAddModal(false);
			resetForm();
			onRefresh();
			Alert.alert('Success', 'Floating Rate Bond added successfully!');
		} catch (error) {
			console.error('Error adding floating rate bond:', error);
			Alert.alert('Error', 'Failed to add floating rate bond');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleEditBond = (bond: FloatingRateBond) => {
		setEditingBond(bond);
		setNewBond({
			bondName: bond.bondName,
			certificateNumber: bond.certificateNumber || '',
			investmentAmount: bond.investmentAmount,
			interestRate: bond.interestRate,
			purchaseDate: bond.purchaseDate || new Date().toISOString().split('T')[0],
			maturityDate: bond.maturityDate,
			notes: bond.notes || '',
		});
		// Set input strings for display
		setInvestmentAmountInput(formatNumberForInput(bond.investmentAmount));
		setInterestRateInput(formatNumberForInput(bond.interestRate));
		setShowEditModal(true);
	};

	const handleUpdateBond = async (): Promise<void> => {
		if (!editingBond || !newBond.bondName.trim()) {
			Alert.alert('Error', 'Please enter bond name');
			return;
		}

		if (newBond.investmentAmount <= 0) {
			Alert.alert('Error', 'Investment amount must be greater than 0');
			return;
		}

		if (newBond.interestRate <= 0) {
			Alert.alert('Error', 'Interest rate must be greater than 0');
			return;
		}

		setIsSubmitting(true);
		try {
			await assetService.updateFRB(userId, editingBond.id, newBond);
			setShowEditModal(false);
			setEditingBond(null);
			resetForm();
			onRefresh();
			Alert.alert('Success', 'Floating Rate Bond updated successfully!');
		} catch (error) {
			console.error('Error updating floating rate bond:', error);
			Alert.alert('Error', 'Failed to update floating rate bond');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteBond = async (
		bondId: string,
		bondName: string
	): Promise<void> => {
		// Use the onDelete prop if provided, otherwise use direct service call
		if (onDelete) {
			onDelete('frb', bondId);
		} else {
			Alert.alert(
				'Delete Floating Rate Bond',
				`Are you sure you want to delete ${bondName}?`,
				[
					{ text: 'Cancel', style: 'cancel' },
					{
						text: 'Delete',
						style: 'destructive',
						onPress: async () => {
							try {
								await assetService.deleteFRB(userId, bondId);
								onRefresh();
								Alert.alert(
									'Success',
									'Floating Rate Bond deleted successfully!'
								);
							} catch (error) {
								console.error('Error deleting floating rate bond:', error);
								Alert.alert('Error', 'Failed to delete floating rate bond');
							}
						},
					},
				]
			);
		}
	};

	// Reset form function
	const resetForm = () => {
		setNewBond({
			bondName: '',
			certificateNumber: '',
			investmentAmount: 0,
			interestRate: 7.15,
			purchaseDate: new Date().toISOString().split('T')[0],
			maturityDate: new Date(
				new Date().setFullYear(new Date().getFullYear() + 5)
			)
				.toISOString()
				.split('T')[0],
			notes: '',
		});
		setInvestmentAmountInput('');
		setInterestRateInput('7.15');
	};

	const totalCurrentValue = bonds.reduce(
		(sum, bond) => sum + (bond.currentValue || 0),
		0
	);
	const totalInvestment = bonds.reduce(
		(sum, bond) => sum + (bond.investmentAmount || 0),
		0
	);

	const formatDate = (dateString: string): string => {
		return new Date(dateString).toLocaleDateString('en-IN', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
		});
	};

	const renderBondCard = (bond: FloatingRateBond) => {
		const daysToMaturity = calculateDaysToMaturity(bond.maturityDate);
		const isMatured = daysToMaturity <= 0;
		const yearsToMaturity = Math.ceil(daysToMaturity / 365);

		return (
			<TouchableOpacity
				key={bond.id}
				style={[
					styles.card,
					{
						marginBottom: 12,
						borderLeftWidth: 4,
						borderLeftColor: isMatured ? colors.gray : colors.secondary,
						padding: 16,
					},
				]}
				onPress={() => handleEditBond(bond)}
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
								{bond.bondName}
							</Text>
							<Text style={{ color: colors.gray, fontSize: 12 }}>
								{isMatured ? 'Matured' : `${yearsToMaturity} years`}
							</Text>
						</View>

						{bond.certificateNumber && (
							<Text
								style={{ color: colors.gray, fontSize: 12, marginBottom: 4 }}
							>
								Certificate: {bond.certificateNumber}
							</Text>
						)}

						<View
							style={[
								styles.row,
								{ justifyContent: 'space-between', marginTop: 8 },
							]}
						>
							<View>
								<Text style={{ color: colors.gray, fontSize: 12 }}>
									Investment
								</Text>
								<Text
									style={{
										fontWeight: 'bold',
										color: colors.dark,
										fontSize: 14,
									}}
								>
									{formatCurrency(bond.investmentAmount || 0)}
								</Text>
							</View>

							<View style={{ alignItems: 'flex-end' }}>
								<Text style={{ color: colors.gray, fontSize: 12 }}>
									Current Value
								</Text>
								<Text
									style={{
										fontWeight: 'bold',
										color: colors.success,
										fontSize: 14,
									}}
								>
									{formatCurrency(bond.currentValue || 0)}
								</Text>
							</View>
						</View>

						<View
							style={[
								styles.row,
								{ justifyContent: 'space-between', marginTop: 4 },
							]}
						>
							<Text style={{ color: colors.gray, fontSize: 12 }}>
								{bond.interestRate}% interest
							</Text>
							<Text style={{ color: colors.gray, fontSize: 12 }}>
								{isMatured ? 'Matured' : `${daysToMaturity} days to maturity`}
							</Text>
						</View>

						<Text style={{ color: colors.gray, fontSize: 10, marginTop: 4 }}>
							📅 Purchased:{' '}
							{formatDate(
								bond.purchaseDate || new Date().toISOString().split('T')[0]
							)}{' '}
							• Matures: {formatDate(bond.maturityDate)}
						</Text>

						{bond.notes && (
							<Text
								style={{
									color: colors.gray,
									fontSize: 11,
									marginTop: 8,
									fontStyle: 'italic',
								}}
							>
								{bond.notes}
							</Text>
						)}
					</View>
				</View>

				{/* Edit/Delete Buttons */}
				<View
					style={[styles.row, { marginTop: 12, justifyContent: 'flex-end' }]}
				>
					<TouchableOpacity
						style={{ marginRight: 16 }}
						onPress={() => handleEditBond(bond)}
					>
						<Text style={{ color: colors.primary, fontSize: 12 }}>✏️ Edit</Text>
					</TouchableOpacity>
					<TouchableOpacity
						onPress={() => handleDeleteBond(bond.id, bond.bondName)}
					>
						<Text style={{ color: colors.danger, fontSize: 12 }}>
							🗑️ Delete
						</Text>
					</TouchableOpacity>
				</View>
			</TouchableOpacity>
		);
	};

	// Get input fields for modal
	const getModalInputFields = (isEdit: boolean) => {
		const inputFields = [
			{
				id: 'bondName',
				label: 'Bond Name',
				placeholder: 'Bond Name (e.g., RBI Floating Rate Bond 2023)',
				value: newBond.bondName,
				onChangeText: (text: string) =>
					setNewBond({ ...newBond, bondName: text }),
				isMandatory: true,
				isEllipsis: true,
			},
			{
				id: 'certificateNumber',
				label: 'Certificate Number',
				placeholder: 'Certificate Number (Optional)',
				value: newBond.certificateNumber,
				onChangeText: (text: string) =>
					setNewBond({ ...newBond, certificateNumber: text }),
				isMandatory: false,
			},
			{
				id: 'investmentAmount',
				label: 'Investment Amount',
				placeholder: 'Investment Amount (₹)',
				value: investmentAmountInput,
				onChangeText: (text: string) =>
					handleDecimalInput(text, 'investmentAmount'),
				keyboardType: 'decimal-pad',
				isMandatory: true,
			},
			{
				id: 'interestRate',
				label: 'Interest Rate',
				placeholder: 'Interest Rate (%)',
				value: interestRateInput,
				onChangeText: (text: string) =>
					handleDecimalInput(text, 'interestRate'),
				keyboardType: 'decimal-pad',
				isMandatory: true,
			},
			{
				id: 'purchaseDate',
				isDatePicker: true,
				onPressOpen: () => openDatePicker('purchaseDate'),
				value: formatDate(newBond.purchaseDate as string),
				showDatePicker: showDatePicker && datePickerField === 'purchaseDate',
				handleDateChange: handleDateChange,
				selectedDate: selectedDate,
				label: 'Purchase Date',
			},
			{
				id: 'maturityDate',
				isDatePicker: true,
				onPressOpen: () => openDatePicker('maturityDate'),
				value: formatDate(newBond.maturityDate),
				showDatePicker: showDatePicker && datePickerField === 'maturityDate',
				handleDateChange: handleDateChange,
				selectedDate: selectedDate,
				label: 'Maturity Date',
			},
			{
				id: 'notes',
				label: 'Notes',
				placeholder: 'Notes (Optional)',
				value: newBond.notes,
				onChangeText: (text: string) => setNewBond({ ...newBond, notes: text }),
				multiline: true,
				numberOfLines: 3,
				isMandatory: false,
			},
		];

		return inputFields;
	};

	const renderAddEditModal = (isEdit: boolean) => {
		const inputFields = getModalInputFields(isEdit);

		return (
			<Modal
				visible={isEdit ? showEditModal : showAddModal}
				animationType='slide'
				transparent={true}
				onRequestClose={() => {
					if (isEdit) {
						setShowEditModal(false);
						setEditingBond(null);
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
								{isEdit ? 'Edit Floating Rate Bond' : 'Add Floating Rate Bond'}
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
								<Text style={{ color: colors.dark, fontSize: 12 }}>
									Investment: {formatCurrency(newBond.investmentAmount)} |
									Interest Rate: {newBond.interestRate}%
								</Text>
								{newBond.purchaseDate && (
									<Text
										style={{ color: colors.dark, fontSize: 12, marginTop: 2 }}
									>
										Purchase Date: {formatDate(newBond.purchaseDate as string)}
									</Text>
								)}
								{newBond.maturityDate && (
									<Text
										style={{ color: colors.dark, fontSize: 12, marginTop: 2 }}
									>
										Maturity Date: {formatDate(newBond.maturityDate)}
									</Text>
								)}
							</View>

							<AddEditFields fields={inputFields} />

							<View style={[styles.row, { gap: 12, marginTop: 16 }]}>
								<TouchableOpacity
									style={[styles.button, styles.buttonSecondary, { flex: 1 }]}
									onPress={() => {
										if (isEdit) {
											setShowEditModal(false);
											setEditingBond(null);
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
									onPress={isEdit ? handleUpdateBond : handleAddBond}
									disabled={isSubmitting}
								>
									<Text style={styles.buttonText}>
										{isSubmitting
											? 'Saving...'
											: isEdit
											? 'Update Bond'
											: 'Add Bond'}
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
				<View style={[styles.row, styles.spaceBetween]}>
					<View>
						<Text style={{ fontSize: 14, color: colors.gray }}>
							Floating Rate Bonds
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
					<Text style={{ fontSize: 24 }}>📄</Text>
				</View>
				<View style={[styles.row, { marginTop: 8 }]}>
					<Text style={{ fontSize: 12, color: colors.gray }}>
						Total Investment: {formatCurrency(totalInvestment)} • {bonds.length}{' '}
						bond{bonds.length !== 1 ? 's' : ''}
					</Text>
				</View>
			</View>

			{/* Floating Rate Bonds List */}
			<Text style={[styles.subHeading, { marginTop: 24, marginBottom: 16 }]}>
				Floating Rate Saving Bonds
			</Text>

			{bonds.length === 0 ? (
				<View
					style={[
						styles.card,
						styles.center,
						{ minHeight: 200, marginBottom: 16 },
					]}
				>
					<Text style={{ color: colors.gray }}>
						No floating rate bonds found
					</Text>
					<Text style={{ color: colors.gray, fontSize: 12, marginTop: 8 }}>
						Add your first floating rate bond to get started
					</Text>
				</View>
			) : (
				<ScrollView
					showsVerticalScrollIndicator={false}
					style={{ maxHeight: 400 }}
				>
					{bonds.map(renderBondCard)}
				</ScrollView>
			)}

			{/* Add New FRB Button */}
			<TouchableOpacity
				style={[styles.button, styles.buttonPrimary, { marginTop: 16 }]}
				onPress={() => setShowAddModal(true)}
			>
				<Text style={styles.buttonText}>+ Add Floating Rate Bond</Text>
			</TouchableOpacity>

			{/* Modals */}
			{renderAddEditModal(false)}
			{renderAddEditModal(true)}
		</View>
	);
};
