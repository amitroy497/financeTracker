import { assetService } from '@/services/assetService';
import { colors, styles } from '@/styles';
import { CreateMutualFundData, MutualFundsProps } from '@/types';
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

export const MutualFunds = ({ funds, onRefresh, userId }: MutualFundsProps) => {
	const [showAddModal, setShowAddModal] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [newFund, setNewFund] = useState<CreateMutualFundData>({
		fundName: '',
		fundHouse: '',
		folioNumber: '',
		investmentType: 'Equity',
		investedAmount: 0,
		units: 0,
		nav: 0,
	});

	const formatCurrency = (amount: number): string => {
		return new Intl.NumberFormat('en-IN', {
			style: 'currency',
			currency: 'INR',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(amount);
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

	const handleAddFund = async (): Promise<void> => {
		if (
			!newFund.fundName.trim() ||
			!newFund.fundHouse.trim() ||
			!newFund.folioNumber.trim()
		) {
			Alert.alert('Error', 'Please fill in all required fields');
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
				fundName: '',
				fundHouse: '',
				folioNumber: '',
				investmentType: 'Equity',
				investedAmount: 0,
				units: 0,
				nav: 0,
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

	const handleDeleteFund = async (
		fundId: string,
		fundName: string
	): Promise<void> => {
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
	};

	const totalCurrentValue = funds.reduce(
		(sum, fund) => sum + fund.currentValue,
		0
	);
	const totalInvested = funds.reduce(
		(sum, fund) => sum + fund.investedAmount,
		0
	);
	const totalReturns = totalCurrentValue - totalInvested;
	const totalReturnPercentage =
		totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;

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
							{formatCurrency(totalReturns)} ({totalReturnPercentage.toFixed(2)}
							%)
						</Text>
					</View>
				</View>
			</View>

			{/* Mutual Funds List */}
			<Text style={[styles.subHeading, { marginTop: 24, marginBottom: 16 }]}>
				Mutual Fund Portfolio
			</Text>

			<ScrollView
				showsVerticalScrollIndicator={false}
				style={{ maxHeight: 400 }}
			>
				{funds.map((fund) => (
					<TouchableOpacity
						key={fund.id}
						style={[
							styles.card,
							{
								marginBottom: 12,
								borderLeftWidth: 4,
								borderLeftColor: getFundTypeColor(fund.investmentType),
							},
						]}
						onLongPress={() => handleDeleteFund(fund.id, fund.fundName)}
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
									{fund.fundName}
								</Text>
								<Text style={{ color: colors.gray, fontSize: 12 }}>
									{fund.fundHouse} • {fund.investmentType}
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
									{formatCurrency(fund.currentValue)}
								</Text>
								<Text
									style={{
										color: getReturnColor(fund.returns),
										fontSize: 12,
										fontWeight: 'bold',
									}}
								>
									{fund.returns >= 0 ? '+' : ''}
									{fund.returns.toFixed(2)}%
								</Text>
							</View>
						</View>

						<View
							style={[styles.row, styles.spaceBetween, { marginBottom: 4 }]}
						>
							<Text style={{ color: colors.gray, fontSize: 12 }}>
								Folio: {fund.folioNumber}
							</Text>
							<Text style={{ color: colors.gray, fontSize: 12 }}>
								NAV: ₹{fund.nav.toFixed(2)}
							</Text>
						</View>

						<View style={[styles.row, styles.spaceBetween]}>
							<Text style={{ color: colors.gray, fontSize: 12 }}>
								Invested: {formatCurrency(fund.investedAmount)}
							</Text>
							<Text style={{ color: colors.gray, fontSize: 12 }}>
								Units: {fund.units.toFixed(2)}
							</Text>
						</View>
					</TouchableOpacity>
				))}
			</ScrollView>

			{/* Add New MF Modal */}
			<Modal
				visible={showAddModal}
				animationType='slide'
				transparent={true}
				onRequestClose={() => setShowAddModal(false)}
			>
				<View
					style={{
						flex: 1,
						justifyContent: 'center',
						backgroundColor: 'rgba(0,0,0,0.5)',
					}}
				>
					<View style={[styles.card, { margin: 20, maxHeight: '80%' }]}>
						<Text style={[styles.subHeading, { marginBottom: 16 }]}>
							Add Mutual Fund
						</Text>

						<TextInput
							style={styles.input}
							placeholder='Fund Name'
							value={newFund.fundName}
							onChangeText={(text) =>
								setNewFund({ ...newFund, fundName: text })
							}
							placeholderTextColor={colors.gray}
						/>

						<TextInput
							style={styles.input}
							placeholder='Fund House'
							value={newFund.fundHouse}
							onChangeText={(text) =>
								setNewFund({ ...newFund, fundHouse: text })
							}
							placeholderTextColor={colors.gray}
						/>

						<TextInput
							style={styles.input}
							placeholder='Folio Number'
							value={newFund.folioNumber}
							onChangeText={(text) =>
								setNewFund({ ...newFund, folioNumber: text })
							}
							placeholderTextColor={colors.gray}
						/>

						<TextInput
							style={styles.input}
							placeholder='Invested Amount'
							value={newFund.investedAmount.toString()}
							onChangeText={(text) =>
								setNewFund({
									...newFund,
									investedAmount: parseFloat(text) || 0,
								})
							}
							placeholderTextColor={colors.gray}
							keyboardType='decimal-pad'
						/>

						<TextInput
							style={styles.input}
							placeholder='Units'
							value={newFund.units.toString()}
							onChangeText={(text) =>
								setNewFund({ ...newFund, units: parseFloat(text) || 0 })
							}
							placeholderTextColor={colors.gray}
							keyboardType='decimal-pad'
						/>

						<TextInput
							style={styles.input}
							placeholder='NAV (Net Asset Value)'
							value={newFund.nav.toString()}
							onChangeText={(text) =>
								setNewFund({ ...newFund, nav: parseFloat(text) || 0 })
							}
							placeholderTextColor={colors.gray}
							keyboardType='decimal-pad'
						/>

						<View style={[styles.row, { gap: 12, marginTop: 16 }]}>
							<TouchableOpacity
								style={[styles.button, styles.buttonSecondary, { flex: 1 }]}
								onPress={() => setShowAddModal(false)}
								disabled={isSubmitting}
							>
								<Text style={styles.buttonText}>Cancel</Text>
							</TouchableOpacity>

							<TouchableOpacity
								style={[styles.button, styles.buttonPrimary, { flex: 1 }]}
								onPress={handleAddFund}
								disabled={isSubmitting}
							>
								<Text style={styles.buttonText}>
									{isSubmitting ? 'Adding...' : 'Add MF'}
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			{/* Add New MF Button */}
			<TouchableOpacity
				style={[styles.button, styles.buttonPrimary, { marginTop: 16 }]}
				onPress={() => setShowAddModal(true)}
			>
				<Text style={styles.buttonText}>+ Add Mutual Fund</Text>
			</TouchableOpacity>
		</View>
	);
};
