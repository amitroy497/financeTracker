import { assetService } from '@/services/assetService';
import { createStyles } from '@/styles';
import { useTheme } from '@/theme';
import { CreateGoldETFData, GoldETF, GoldETFsProps } from '@/types';
import { formatCurrency, formatNumber } from '@/utils';
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
	const [newETF, setNewETF] = useState<CreateGoldETFData>({
		etfName: '',
		symbol: '',
		units: 0,
		currentPrice: 0,
		investedAmount: 0,
		notes: '',
	});

	// Add state for input strings to allow decimal typing
	const [unitsInput, setUnitsInput] = useState<string>('');
	const [currentPriceInput, setCurrentPriceInput] = useState<string>('');
	const [investedAmountInput, setInvestedAmountInput] = useState<string>('');

	const getReturnColor = (returns: number): string => {
		return returns >= 0 ? colors.success : colors.danger;
	};

	// Handle decimal input with proper validation
	const handleDecimalInput = (
		text: string,
		type: 'units' | 'currentPrice' | 'investedAmount'
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
		}

		// Parse the value and update the ETF data
		let parsedValue: number;
		if (cleanedText === '' || cleanedText === '.') {
			parsedValue = 0;
		} else {
			parsedValue = parseFloat(cleanedText);
			if (isNaN(parsedValue)) parsedValue = 0;
		}

		setNewETF({
			...newETF,
			[type]: parsedValue,
		});
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
			await assetService.createGoldETF(userId, newETF);
			setShowAddModal(false);
			// Reset all states
			setNewETF({
				etfName: '',
				symbol: '',
				units: 0,
				currentPrice: 0,
				investedAmount: 0,
				notes: '',
			});
			setUnitsInput('');
			setCurrentPriceInput('');
			setInvestedAmountInput('');
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
		setNewETF({
			etfName: etf.etfName,
			symbol: etf.symbol || '',
			units: etf.units,
			currentPrice: etf.currentPrice || 0,
			investedAmount: etf.investedAmount || 0,
			notes: etf.notes || '',
		});
		// Set input strings for display
		setUnitsInput(formatNumberForInput(etf.units));
		setCurrentPriceInput(formatNumberForInput(etf.currentPrice || 0));
		setInvestedAmountInput(formatNumberForInput(etf.investedAmount || 0));
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
			await assetService.updateGoldETF(userId, editingETF.id, newETF);
			setShowEditModal(false);
			setEditingETF(null);
			// Reset all states
			setNewETF({
				etfName: '',
				symbol: '',
				units: 0,
				currentPrice: 0,
				investedAmount: 0,
				notes: '',
			});
			setUnitsInput('');
			setCurrentPriceInput('');
			setInvestedAmountInput('');
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

	const renderAddEditModal = (isEdit: boolean) => (
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
				// Reset all states
				setNewETF({
					etfName: '',
					symbol: '',
					units: 0,
					currentPrice: 0,
					investedAmount: 0,
					notes: '',
				});
				setUnitsInput('');
				setCurrentPriceInput('');
				setInvestedAmountInput('');
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
							{isEdit ? 'Edit Gold ETF' : 'Add Gold ETF'}
						</Text>

						<TextInput
							style={styles.input}
							placeholder='ETF Name (e.g., Nippon India Gold ETF)'
							value={newETF.etfName}
							onChangeText={(text) => setNewETF({ ...newETF, etfName: text })}
							placeholderTextColor={colors.gray}
						/>

						<TextInput
							style={styles.input}
							placeholder='Symbol (e.g., GOLDBEES) (Optional)'
							value={newETF.symbol}
							onChangeText={(text) =>
								setNewETF({ ...newETF, symbol: text.toUpperCase() })
							}
							placeholderTextColor={colors.gray}
						/>

						<TextInput
							style={styles.input}
							placeholder='Number of Units'
							value={unitsInput}
							onChangeText={(text) => handleDecimalInput(text, 'units')}
							placeholderTextColor={colors.gray}
							keyboardType='decimal-pad'
						/>

						<TextInput
							style={styles.input}
							placeholder='Current Price per Unit (₹)'
							value={currentPriceInput}
							onChangeText={(text) => handleDecimalInput(text, 'currentPrice')}
							placeholderTextColor={colors.gray}
							keyboardType='decimal-pad'
						/>

						<TextInput
							style={styles.input}
							placeholder='Total Invested Amount (₹)'
							value={investedAmountInput}
							onChangeText={(text) =>
								handleDecimalInput(text, 'investedAmount')
							}
							placeholderTextColor={colors.gray}
							keyboardType='decimal-pad'
						/>

						<TextInput
							style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
							placeholder='Notes (Optional)'
							value={newETF.notes}
							onChangeText={(text) => setNewETF({ ...newETF, notes: text })}
							placeholderTextColor={colors.gray}
							multiline
							numberOfLines={3}
						/>

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
									// Reset all states
									setNewETF({
										etfName: '',
										symbol: '',
										units: 0,
										currentPrice: 0,
										investedAmount: 0,
										notes: '',
									});
									setUnitsInput('');
									setCurrentPriceInput('');
									setInvestedAmountInput('');
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
					</View>
				</ScrollView>
			</View>
		</Modal>
	);

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
