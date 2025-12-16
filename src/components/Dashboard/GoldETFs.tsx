import { assetService } from '@/services/assetService';
import { createStyles } from '@/styles';
import { useTheme } from '@/theme';
import { CreateGoldETFData, GoldETF, GoldETFsProps } from '@/types';
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

export const GoldETFs = ({
	etfs,
	onEdit,
	onDelete,
	onRefresh,
	userId,
}: GoldETFsProps) => {
	const { colors } = useTheme();
	const styles = createStyles(colors);
	const [showAddModal, setShowAddModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [editingETF, setEditingETF] = useState<GoldETF | null>(null);

	// Updated state to include currentValue
	const [newETF, setNewETF] = useState<
		CreateGoldETFData & { currentValue?: number }
	>({
		etfName: '',
		symbol: '',
		units: 0,
		currentPrice: 0,
		investedAmount: 0,
		notes: '',
		currentValue: 0,
	});

	// Input states for string values (for better UX)
	const [unitsInput, setUnitsInput] = useState<string>('');
	const [currentPriceInput, setCurrentPriceInput] = useState<string>('');
	const [investedAmountInput, setInvestedAmountInput] = useState<string>('');
	const [currentValueInput, setCurrentValueInput] = useState<string>('');

	const getReturnColor = (returns: number): string => {
		return returns >= 0 ? colors.success : colors.danger;
	};

	// Handle decimal input with proper validation
	const handleDecimalInput = (
		text: string,
		type: 'units' | 'currentPrice' | 'investedAmount' | 'currentValue'
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

		// For units, allow more decimal places (up to 4 for ETF units)
		let maxDecimals = 2;
		if (type === 'units') {
			maxDecimals = 4; // Allow up to 4 decimal places for units
		} else if (type === 'currentPrice') {
			maxDecimals = 4; // Gold prices can have up to 4 decimal places
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
			case 'units':
				setUnitsInput(cleanedText);
				break;
			case 'currentPrice':
				setCurrentPriceInput(cleanedText);
				break;
			case 'investedAmount':
				setInvestedAmountInput(cleanedText);
				break;
			case 'currentValue':
				setCurrentValueInput(cleanedText);
				break;
		}

		// Parse the value and update the ETF data
		let parsedValue: number;
		if (cleanedText === '' || cleanedText === '.') {
			parsedValue = 0;
		} else {
			parsedValue = parseFloat(cleanedText);
			if (isNaN(parsedValue)) parsedValue = 0;
		}

		const updatedETF = {
			...newETF,
			[type]: parsedValue,
		};

		// Calculate current value if not manually entered
		if (type !== 'currentValue') {
			const currentValue = updatedETF.units * updatedETF.currentPrice;
			updatedETF.currentValue = currentValue;
			setCurrentValueInput(currentValue === 0 ? '' : currentValue.toFixed(2));
		}

		setNewETF(updatedETF);
	};

	// Calculate returns
	const calculateReturns = () => {
		if (!newETF.investedAmount || !newETF.currentValue) return 0;
		return (
			((newETF.currentValue - newETF.investedAmount) / newETF.investedAmount) *
			100
		);
	};

	// Format number for display (show empty string for 0)
	const formatNumberForInput = (num: number): string => {
		if (num === 0) return '';
		return num.toString();
	};

	const handleAddETF = async (): Promise<void> => {
		if (!newETF.etfName.trim()) {
			Alert.alert('Error', 'Please enter ETF name');
			return;
		}

		if (newETF.units <= 0) {
			Alert.alert('Error', 'Units must be greater than 0');
			return;
		}

		if (newETF.currentPrice <= 0) {
			Alert.alert('Error', 'Current price must be greater than 0');
			return;
		}

		if (newETF.investedAmount <= 0) {
			Alert.alert('Error', 'Invested amount must be greater than 0');
			return;
		}

		setIsSubmitting(true);
		try {
			// Remove currentValue from the data sent to API (it's calculated on server)
			const { currentValue, ...etfData } = newETF;
			await assetService.createGoldETF(userId, etfData);
			setShowAddModal(false);
			resetForm();
			onRefresh();
			Alert.alert('Success', 'Gold ETF added successfully!');
		} catch (error) {
			console.error('Error adding gold ETF:', error);
			Alert.alert('Error', 'Failed to add gold ETF');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleEditETF = (etf: GoldETF) => {
		setEditingETF(etf);
		const etfData = {
			etfName: etf.etfName,
			symbol: etf.symbol || '',
			units: etf.units,
			currentPrice: etf.currentPrice || 0,
			investedAmount: etf.investedAmount || 0,
			notes: etf.notes || '',
			currentValue: etf.currentValue || 0,
		};
		setNewETF(etfData);
		// Set input strings for display
		setUnitsInput(formatNumberForInput(etf.units));
		setCurrentPriceInput(formatNumberForInput(etf.currentPrice || 0));
		setInvestedAmountInput(formatNumberForInput(etf.investedAmount || 0));
		setCurrentValueInput(formatNumberForInput(etf.currentValue || 0));
		setShowEditModal(true);
	};

	const handleUpdateETF = async (): Promise<void> => {
		if (!editingETF || !newETF.etfName.trim()) {
			Alert.alert('Error', 'Please enter ETF name');
			return;
		}

		if (newETF.units <= 0) {
			Alert.alert('Error', 'Units must be greater than 0');
			return;
		}

		if (newETF.currentPrice <= 0) {
			Alert.alert('Error', 'Current price must be greater than 0');
			return;
		}

		if (newETF.investedAmount <= 0) {
			Alert.alert('Error', 'Invested amount must be greater than 0');
			return;
		}

		setIsSubmitting(true);
		try {
			// Remove currentValue from the data sent to API
			const { currentValue, ...etfData } = newETF;
			await assetService.updateGoldETF(userId, editingETF.id, etfData);
			setShowEditModal(false);
			setEditingETF(null);
			resetForm();
			onRefresh();
			Alert.alert('Success', 'Gold ETF updated successfully!');
		} catch (error) {
			console.error('Error updating gold ETF:', error);
			Alert.alert('Error', 'Failed to update gold ETF');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteETF = async (
		etfId: string,
		etfName: string
	): Promise<void> => {
		// Use the onDelete prop if provided, otherwise use direct service call
		if (onDelete) {
			onDelete('gold', etfId);
		} else {
			Alert.alert(
				'Delete Gold ETF',
				`Are you sure you want to delete ${etfName}?`,
				[
					{ text: 'Cancel', style: 'cancel' },
					{
						text: 'Delete',
						style: 'destructive',
						onPress: async () => {
							try {
								await assetService.deleteGoldETF(userId, etfId);
								onRefresh();
								Alert.alert('Success', 'Gold ETF deleted successfully!');
							} catch (error) {
								console.error('Error deleting gold ETF:', error);
								Alert.alert('Error', 'Failed to delete gold ETF');
							}
						},
					},
				]
			);
		}
	};

	// Reset form function
	const resetForm = () => {
		setNewETF({
			etfName: '',
			symbol: '',
			units: 0,
			currentPrice: 0,
			investedAmount: 0,
			notes: '',
			currentValue: 0,
		});
		setUnitsInput('');
		setCurrentPriceInput('');
		setInvestedAmountInput('');
		setCurrentValueInput('');
	};

	const totalCurrentValue = etfs.reduce(
		(sum, etf) => sum + (etf.currentValue || 0),
		0
	);
	const totalInvested = etfs.reduce(
		(sum, etf) => sum + (etf.investedAmount || 0),
		0
	);
	const totalReturns = totalCurrentValue - totalInvested;
	const totalReturnPercentage =
		totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;

	const renderETFCard = (etf: GoldETF) => (
		<TouchableOpacity
			key={etf.id}
			style={[
				styles.card,
				{
					marginBottom: 12,
					borderLeftWidth: 4,
					borderLeftColor: colors.warning,
					padding: 16,
				},
			]}
			onPress={() => handleEditETF(etf)}
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
						{etf.etfName}
					</Text>
					{etf.symbol && (
						<Text style={{ color: colors.gray, fontSize: 12 }}>
							{etf.symbol}
						</Text>
					)}
				</View>

				<View style={{ alignItems: 'flex-end' }}>
					<Text
						style={{
							fontWeight: 'bold',
							color: colors.dark,
							fontSize: 16,
						}}
					>
						{formatCurrency(etf.currentValue || 0)}
					</Text>
					<Text
						style={{
							color: getReturnColor(etf.returns || 0),
							fontSize: 12,
							fontWeight: 'bold',
						}}
					>
						{(etf.returns || 0) >= 0 ? '+' : ''}
						{formatNumber(etf.returns || 0)}%
					</Text>
				</View>
			</View>

			<View style={[styles.row, styles.spaceBetween, { marginBottom: 4 }]}>
				<Text style={{ color: colors.gray, fontSize: 12 }}>
					Units: {formatNumber(etf.units, 4)}
				</Text>
				<Text style={{ color: colors.gray, fontSize: 12 }}>
					Price: ₹{formatNumber(etf.currentPrice || 0)}
				</Text>
			</View>

			<View style={[styles.row, styles.spaceBetween]}>
				<Text style={{ color: colors.gray, fontSize: 12 }}>
					Invested: {formatCurrency(etf.investedAmount || 0)}
				</Text>
				<Text style={{ color: colors.gray, fontSize: 12 }}>
					Current: {formatCurrency(etf.currentValue || 0)}
				</Text>
			</View>

			{etf.notes && (
				<Text
					style={{
						color: colors.gray,
						fontSize: 11,
						marginTop: 8,
						fontStyle: 'italic',
					}}
				>
					{etf.notes}
				</Text>
			)}

			<Text style={{ color: colors.gray, fontSize: 10, marginTop: 4 }}>
				Last updated:{' '}
				{new Date(etf.lastUpdated || new Date()).toLocaleDateString()}
			</Text>

			<View style={[styles.row, { marginTop: 12, justifyContent: 'flex-end' }]}>
				<TouchableOpacity
					style={{ marginRight: 16 }}
					onPress={() => handleEditETF(etf)}
				>
					<Text style={{ color: colors.primary, fontSize: 12 }}>✏️ Edit</Text>
				</TouchableOpacity>
				<TouchableOpacity onPress={() => handleDeleteETF(etf.id, etf.etfName)}>
					<Text style={{ color: colors.danger, fontSize: 12 }}>🗑️ Delete</Text>
				</TouchableOpacity>
			</View>
		</TouchableOpacity>
	);

	// Get input fields for modal
	const getModalInputFields = (isEdit: boolean) => {
		const returns = calculateReturns();
		const currentValue = newETF.currentValue || 0;
		const investedAmount = newETF.investedAmount || 0;
		const absoluteReturns = currentValue - investedAmount;

		const fields = [
			{
				id: 'etfName',
				label: 'ETF Name',
				placeholder: 'ETF Name (e.g., Nippon India Gold ETF)',
				value: newETF.etfName,
				onChangeText: (text: string) => setNewETF({ ...newETF, etfName: text }),
				isMandatory: true,
				isEllipsis: true,
			},
			{
				id: 'symbol',
				label: 'Symbol',
				placeholder: 'Symbol (e.g., GOLDBEES) (Optional)',
				value: newETF.symbol,
				onChangeText: (text: string) =>
					setNewETF({ ...newETF, symbol: text.toUpperCase() }),
				isMandatory: false,
				isEllipsis: true,
			},
			{
				id: 'units',
				label: 'Units',
				placeholder: 'Number of Units',
				value: unitsInput,
				onChangeText: (text: string) => handleDecimalInput(text, 'units'),
				keyboardType: 'decimal-pad' as KeyboardType,
				isMandatory: true,
			},
			{
				id: 'currentPrice',
				label: 'Current Price (₹)',
				placeholder: 'Current Price per Unit',
				value: currentPriceInput,
				onChangeText: (text: string) =>
					handleDecimalInput(text, 'currentPrice'),
				keyboardType: 'decimal-pad' as KeyboardType,
				isMandatory: true,
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
				value: newETF.notes,
				onChangeText: (text: string) => setNewETF({ ...newETF, notes: text }),
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
						setEditingETF(null);
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
								{isEdit ? 'Edit Gold ETF' : 'Add Gold ETF'}
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
										Invested: {formatCurrency(newETF.investedAmount)}
									</Text>
									<Text style={{ color: colors.dark, fontSize: 12 }}>
										Current: {formatCurrency(currentValue)}
									</Text>
								</View>
								<View style={[styles.row, styles.spaceBetween]}>
									<Text style={{ color: colors.dark, fontSize: 12 }}>
										Units: {formatNumber(newETF.units, 4)}
									</Text>
									<Text style={{ color: colors.dark, fontSize: 12 }}>
										Price: {formatNumber(newETF.currentPrice, 4)}
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
								/>
							))}

							<View style={[styles.row, { gap: 12, marginTop: 16 }]}>
								<TouchableOpacity
									style={[styles.button, styles.buttonSecondary, { flex: 1 }]}
									onPress={() => {
										if (isEdit) {
											setShowEditModal(false);
											setEditingETF(null);
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
									onPress={isEdit ? handleUpdateETF : handleAddETF}
									disabled={isSubmitting}
								>
									<Text style={styles.buttonText}>
										{isSubmitting
											? 'Saving...'
											: isEdit
											? 'Update ETF'
											: 'Add ETF'}
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
							Gold ETFs Value
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
					<Text style={{ fontSize: 24 }}>🥇</Text>
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

			{/* Gold ETFs List */}
			<Text style={[styles.subHeading, { marginTop: 24, marginBottom: 16 }]}>
				Gold ETF Portfolio
			</Text>

			{etfs.length === 0 ? (
				<View
					style={[
						styles.card,
						styles.center,
						{ minHeight: 200, marginBottom: 16 },
					]}
				>
					<Text style={{ color: colors.gray }}>No gold ETFs found</Text>
					<Text style={{ color: colors.gray, fontSize: 12, marginTop: 8 }}>
						Add your first gold ETF to get started
					</Text>
				</View>
			) : (
				<ScrollView
					showsVerticalScrollIndicator={false}
					style={{ maxHeight: 400 }}
				>
					{etfs.map(renderETFCard)}
				</ScrollView>
			)}

			{/* Add New Gold ETF Button */}
			<TouchableOpacity
				style={[styles.button, styles.buttonPrimary, { marginTop: 16 }]}
				onPress={() => setShowAddModal(true)}
			>
				<Text style={styles.buttonText}>+ Add Gold ETF</Text>
			</TouchableOpacity>

			{/* Modals */}
			{renderAddEditModal(false)}
			{renderAddEditModal(true)}
		</View>
	);
};
