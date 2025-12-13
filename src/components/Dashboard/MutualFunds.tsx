import { assetService } from '@/services/assetService';
import { createStyles } from '@/styles';
import { useTheme } from '@/theme';
import { CreateMutualFundData, MutualFund, MutualFundsProps } from '@/types';
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
	const [newFund, setNewFund] = useState<CreateMutualFundData>({
		schemeName: '',
		fundHouse: '',
		folioNumber: '',
		fundType: 'Equity',
		investedAmount: 0,
		units: 0,
		nav: 0,
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

	const getFundTypeColor = (type: string): string => {
		const colorsMap: { [key: string]: string } = {
			Equity: colors.primary,
			Debt: colors.success,
			Hybrid: colors.warning,
			ELSS: colors.info,
		};

		return colorsMap[type] || colors.gray;
	};

	// Handle numeric input with decimal validation
	const handleNumericInput = (
		field: keyof CreateMutualFundData,
		value: string
	) => {
		const decimalCount = (value.match(/\./g) || []).length;
		if (decimalCount > 1) return;

		const regex = /^\d*\.?\d*$/;
		if (!regex.test(value) && value !== '') return;

		const numValue = parseFloat(value) || 0;
		setNewFund({ ...newFund, [field]: numValue });
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
			await assetService.createMutualFund(userId, newFund);
			setShowAddModal(false);
			setNewFund({
				schemeName: '',
				fundHouse: '',
				folioNumber: '',
				fundType: 'Equity',
				investedAmount: 0,
				units: 0,
				nav: 0,
				notes: '',
			});
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
		setNewFund({
			schemeName: fund.schemeName,
			fundHouse: fund.fundHouse || '',
			folioNumber: fund.folioNumber || '',
			fundType: fund.fundType || 'Equity',
			investedAmount: fund.investedAmount || 0,
			units: fund.units || 0,
			nav: fund.nav || 0,
			notes: fund.notes || '',
		});
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
			await assetService.updateMutualFund(userId, editingFund.id, newFund);
			setShowEditModal(false);
			setEditingFund(null);
			setNewFund({
				schemeName: '',
				fundHouse: '',
				folioNumber: '',
				fundType: 'Equity',
				investedAmount: 0,
				units: 0,
				nav: 0,
				notes: '',
			});
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

	const renderAddEditModal = (isEdit: boolean) => (
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
				setNewFund({
					schemeName: '',
					fundHouse: '',
					folioNumber: '',
					fundType: 'Equity',
					investedAmount: 0,
					units: 0,
					nav: 0,
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
							{isEdit ? 'Edit Mutual Fund' : 'Add Mutual Fund'}
						</Text>

						<TextInput
							style={styles.input}
							placeholder='Scheme Name (e.g., Mirae Asset Large Cap Fund)'
							value={newFund.schemeName}
							onChangeText={(text) =>
								setNewFund({ ...newFund, schemeName: text })
							}
							placeholderTextColor={colors.gray}
						/>

						<TextInput
							style={styles.input}
							placeholder='Fund House (e.g., Mirae Asset)'
							value={newFund.fundHouse}
							onChangeText={(text) =>
								setNewFund({ ...newFund, fundHouse: text })
							}
							placeholderTextColor={colors.gray}
						/>

						<TextInput
							style={styles.input}
							placeholder='Folio Number (Optional)'
							value={newFund.folioNumber}
							onChangeText={(text) =>
								setNewFund({ ...newFund, folioNumber: text })
							}
							placeholderTextColor={colors.gray}
						/>

						<TextInput
							style={styles.input}
							placeholder='Fund Type (e.g., Equity, Debt, Hybrid, ELSS)'
							value={newFund.fundType}
							onChangeText={(text) =>
								setNewFund({ ...newFund, fundType: text })
							}
							placeholderTextColor={colors.gray}
						/>

						<TextInput
							style={styles.input}
							placeholder='Total Invested Amount (₹)'
							value={newFund.investedAmount.toString()}
							onChangeText={(text) =>
								handleNumericInput('investedAmount', text)
							}
							placeholderTextColor={colors.gray}
							keyboardType='decimal-pad'
						/>

						<TextInput
							style={styles.input}
							placeholder='Units'
							value={newFund.units.toString()}
							onChangeText={(text) => handleNumericInput('units', text)}
							placeholderTextColor={colors.gray}
							keyboardType='decimal-pad'
						/>

						<TextInput
							style={styles.input}
							placeholder='NAV (Net Asset Value)'
							value={newFund.nav.toString()}
							onChangeText={(text) => handleNumericInput('nav', text)}
							placeholderTextColor={colors.gray}
							keyboardType='decimal-pad'
						/>

						<TextInput
							style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
							placeholder='Notes (Optional)'
							value={newFund.notes}
							onChangeText={(text) => setNewFund({ ...newFund, notes: text })}
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
										setEditingFund(null);
									} else {
										setShowAddModal(false);
									}
									setNewFund({
										schemeName: '',
										fundHouse: '',
										folioNumber: '',
										fundType: 'Equity',
										investedAmount: 0,
										units: 0,
										nav: 0,
										notes: '',
									});
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
