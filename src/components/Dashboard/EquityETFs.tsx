import { assetService } from '@/services/assetService';
import { createStyles } from '@/styles';
import { useTheme } from '@/theme';
import {
	CreateEquityETFData,
	EquityETF,
	EquityETFsProps,
	FormField,
} from '@/types';
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

export const EquityETFs = ({
	etfs,
	onEdit,
	onDelete,
	onRefresh,
	userId,
}: EquityETFsProps) => {
	const { colors } = useTheme();
	const styles = createStyles(colors);
	const [showAddModal, setShowAddModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [editingETF, setEditingETF] = useState<EquityETF | null>(null);
	const [newETF, setNewETF] = useState<CreateEquityETFData>({
		etfName: '',
		symbol: '',
		units: 0,
		currentNav: 0,
		investedAmount: 0,
		notes: '',
	});

	const formatCurrency = (amount: number): string => {
		return new Intl.NumberFormat('en-IN', {
			style: 'currency',
			currency: 'INR',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		}).format(amount);
	};

	const formatNumber = (num: number, decimals: number = 2): string => {
		return num.toFixed(decimals);
	};

	const getReturnColor = (returns: number): string => {
		return returns >= 0 ? colors.success : colors.danger;
	};

	// Handle numeric input with decimal validation
	const handleNumericInput = (
		field: keyof CreateEquityETFData,
		value: string
	) => {
		const decimalCount = (value.match(/\./g) || []).length;
		if (decimalCount > 1) return;

		const regex = /^\d*\.?\d*$/;
		if (!regex.test(value) && value !== '') return;

		const numValue = parseFloat(value) || 0;
		setNewETF({ ...newETF, [field]: numValue });
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

		if (newETF.currentNav <= 0) {
			Alert.alert('Error', 'Current NAV must be greater than 0');
			return;
		}

		if (newETF.investedAmount <= 0) {
			Alert.alert('Error', 'Invested amount must be greater than 0');
			return;
		}

		setIsSubmitting(true);
		try {
			await assetService.createEquityETF(userId, newETF);
			setShowAddModal(false);
			setNewETF({
				etfName: '',
				symbol: '',
				units: 0,
				currentNav: 0,
				investedAmount: 0,
				notes: '',
			});
			onRefresh();
			Alert.alert('Success', 'Equity ETF added successfully!');
		} catch (error) {
			console.error('Error adding equity ETF:', error);
			Alert.alert('Error', 'Failed to add equity ETF');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleEditETF = (etf: EquityETF) => {
		setEditingETF(etf);
		setNewETF({
			etfName: etf.etfName,
			symbol: etf.symbol || '',
			units: etf.units,
			currentNav: etf.currentNav,
			investedAmount: etf.investedAmount,
			notes: etf.notes || '',
		});
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

		if (newETF.currentNav <= 0) {
			Alert.alert('Error', 'Current NAV must be greater than 0');
			return;
		}

		if (newETF.investedAmount <= 0) {
			Alert.alert('Error', 'Invested amount must be greater than 0');
			return;
		}

		setIsSubmitting(true);
		try {
			await assetService.updateEquityETF(userId, editingETF.id, newETF);
			setShowEditModal(false);
			setEditingETF(null);
			setNewETF({
				etfName: '',
				symbol: '',
				units: 0,
				currentNav: 0,
				investedAmount: 0,
				notes: '',
			});
			onRefresh();
			Alert.alert('Success', 'Equity ETF updated successfully!');
		} catch (error) {
			console.error('Error updating equity ETF:', error);
			Alert.alert('Error', 'Failed to update equity ETF');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteETF = async (
		etfId: string,
		etfName: string
	): Promise<void> => {
		if (onDelete) {
			onDelete('equity', etfId);
		} else {
			Alert.alert(
				'Delete Equity ETF',
				`Are you sure you want to delete ${etfName}?`,
				[
					{ text: 'Cancel', style: 'cancel' },
					{
						text: 'Delete',
						style: 'destructive',
						onPress: async () => {
							try {
								await assetService.deleteEquityETF(userId, etfId);
								onRefresh();
								Alert.alert('Success', 'Equity ETF deleted successfully!');
							} catch (error) {
								console.error('Error deleting equity ETF:', error);
								Alert.alert('Error', 'Failed to delete equity ETF');
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

	const renderETFCard = (etf: EquityETF) => (
		<TouchableOpacity
			key={etf.id}
			style={[
				styles.card,
				{
					marginBottom: 12,
					borderLeftWidth: 4,
					borderLeftColor: colors.info,
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
					NAV: ₹{formatNumber(etf.currentNav || 0)}
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

	// Define form fields configuration
	const formFields: FormField[] = [
		{
			id: 'etfName',
			label: 'ETF Name',
			placeholder: 'ETF Name (e.g., Nippon India ETF Nifty 50)',
			value: newETF.etfName,
			onChangeText: (text: string) => setNewETF({ ...newETF, etfName: text }),
			isEllipsis: true,
			keyboardType: 'default' as KeyboardType,
			isMandatory: true,
		},
		{
			id: 'symbol',
			label: 'Symbol',
			placeholder: 'Symbol (e.g., NIFTYBEES)',
			value: newETF.symbol || '',
			onChangeText: (text: string) =>
				setNewETF({ ...newETF, symbol: text.toUpperCase() }),
			isEllipsis: true,
			keyboardType: 'default' as KeyboardType,
			isMandatory: false,
		},
		{
			id: 'units',
			label: 'Number of Units',
			placeholder: 'Number of Units',
			value: newETF.units.toString(),
			onChangeText: (text: string) => handleNumericInput('units', text),
			keyboardType: 'decimal-pad' as KeyboardType,
			isMandatory: true,
		},
		{
			id: 'currentNav',
			label: 'Current NAV (per unit)',
			placeholder: 'Current NAV (per unit)',
			value: newETF.currentNav.toString(),
			onChangeText: (text: string) => handleNumericInput('currentNav', text),
			keyboardType: 'decimal-pad' as KeyboardType,
			isMandatory: true,
		},
		{
			id: 'investedAmount',
			label: 'Total Invested Amount (₹)',
			placeholder: 'Total Invested Amount (₹)',
			value: newETF.investedAmount.toString(),
			onChangeText: (text: string) =>
				handleNumericInput('investedAmount', text),
			keyboardType: 'decimal-pad' as KeyboardType,
			isMandatory: true,
		},
		{
			id: 'notes',
			label: 'Notes (Optional)',
			placeholder: 'Notes (Optional)',
			value: newETF.notes || '',
			onChangeText: (text: string) => setNewETF({ ...newETF, notes: text }),
			multiline: true,
			numberOfLines: 3,
			keyboardType: 'default' as KeyboardType,
			isMandatory: false,
		},
	];

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
				setNewETF({
					etfName: '',
					symbol: '',
					units: 0,
					currentNav: 0,
					investedAmount: 0,
					notes: '',
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
							{isEdit ? 'Edit Equity ETF' : 'Add Equity ETF'}
						</Text>
						{formFields.map((field) => (
							<InputComponent
								key={field.id}
								label={field.label}
								placeholder={field.placeholder}
								value={field.value}
								onChangeText={field.onChangeText}
								keyboardType={field.keyboardType}
								multiline={field.multiline}
								numberOfLines={field.numberOfLines}
								isEllipsis={field.isEllipsis}
								isMandatory={field.isMandatory}
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
									setNewETF({
										etfName: '',
										symbol: '',
										units: 0,
										currentNav: 0,
										investedAmount: 0,
										notes: '',
									});
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
			<View style={[styles.card, { backgroundColor: colors.lightGray }]}>
				<View style={[styles.row, styles.spaceBetween, { marginBottom: 12 }]}>
					<View>
						<Text style={{ fontSize: 14, color: colors.gray }}>
							Equity ETFs Value
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
			<Text style={[styles.subHeading, { marginTop: 24, marginBottom: 16 }]}>
				Equity ETF Portfolio
			</Text>
			{etfs.length === 0 ? (
				<View
					style={[
						styles.card,
						styles.center,
						{ minHeight: 200, marginBottom: 16 },
					]}
				>
					<Text style={{ color: colors.gray }}>No equity ETFs found</Text>
					<Text style={{ color: colors.gray, fontSize: 12, marginTop: 8 }}>
						Add your first equity ETF to get started
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
			<TouchableOpacity
				style={[styles.button, styles.buttonPrimary, { marginTop: 16 }]}
				onPress={() => setShowAddModal(true)}
			>
				<Text style={styles.buttonText}>+ Add Equity ETF</Text>
			</TouchableOpacity>
			{renderAddEditModal(false)}
			{renderAddEditModal(true)}
		</View>
	);
};
