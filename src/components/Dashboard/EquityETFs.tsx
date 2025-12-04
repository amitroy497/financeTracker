import { assetService } from '@/services/assetService';
import { createStyles } from '@/styles';
import { useTheme } from '@/theme';
import { CreateEquityETFData, EquityETFsProps } from '@/types';
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

export const EquityETFs = ({ etfs, onRefresh, userId }: EquityETFsProps) => {
	const { colors } = useTheme();
	const styles = createStyles(colors);
	const [showAddModal, setShowAddModal] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [newETF, setNewETF] = useState<CreateEquityETFData>({
		etfName: '',
		symbol: '',
		units: 0,
		currentNav: 0,
		investedAmount: 0,
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

	const handleAddETF = async (): Promise<void> => {
		if (!newETF.etfName.trim() || !newETF.symbol.trim()) {
			Alert.alert('Error', 'Please fill in all required fields');
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

	const handleDeleteETF = async (
		etfId: string,
		etfName: string
	): Promise<void> => {
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
	};

	const totalCurrentValue = etfs.reduce(
		(sum, etf) => sum + etf.currentValue,
		0
	);
	const totalInvested = etfs.reduce((sum, etf) => sum + etf.investedAmount, 0);
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
							{formatCurrency(totalReturns)} ({totalReturnPercentage.toFixed(2)}
							%)
						</Text>
					</View>
				</View>
			</View>

			{/* Equity ETFs List */}
			<Text style={[styles.subHeading, { marginTop: 24, marginBottom: 16 }]}>
				Equity ETF Portfolio
			</Text>

			<ScrollView
				showsVerticalScrollIndicator={false}
				style={{ maxHeight: 400 }}
			>
				{etfs.map((etf) => (
					<TouchableOpacity
						key={etf.id}
						style={[
							styles.card,
							{
								marginBottom: 12,
								borderLeftWidth: 4,
								borderLeftColor: colors.info,
							},
						]}
						onLongPress={() => handleDeleteETF(etf.id, etf.etfName)}
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
								<Text style={{ color: colors.gray, fontSize: 12 }}>
									{etf.symbol}
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
									{formatCurrency(etf.currentValue)}
								</Text>
								<Text
									style={{
										color: getReturnColor(etf.returns),
										fontSize: 12,
										fontWeight: 'bold',
									}}
								>
									{etf.returns >= 0 ? '+' : ''}
									{etf.returns.toFixed(2)}%
								</Text>
							</View>
						</View>

						<View
							style={[styles.row, styles.spaceBetween, { marginBottom: 4 }]}
						>
							<Text style={{ color: colors.gray, fontSize: 12 }}>
								Units: {etf.units.toFixed(4)}
							</Text>
							<Text style={{ color: colors.gray, fontSize: 12 }}>
								NAV: ₹{etf.currentNav.toFixed(2)}
							</Text>
						</View>

						<View style={[styles.row, styles.spaceBetween]}>
							<Text style={{ color: colors.gray, fontSize: 12 }}>
								Invested: {formatCurrency(etf.investedAmount)}
							</Text>
							<Text style={{ color: colors.gray, fontSize: 12 }}>
								Current: {formatCurrency(etf.currentValue)}
							</Text>
						</View>
					</TouchableOpacity>
				))}
			</ScrollView>

			{/* Add New Equity ETF Modal */}
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
							Add Equity ETF
						</Text>

						<TextInput
							style={styles.input}
							placeholder='ETF Name (e.g., Nippon India ETF Nifty 50)'
							value={newETF.etfName}
							onChangeText={(text) => setNewETF({ ...newETF, etfName: text })}
							placeholderTextColor={colors.gray}
						/>

						<TextInput
							style={styles.input}
							placeholder='Symbol (e.g., NIFTYBEES)'
							value={newETF.symbol}
							onChangeText={(text) =>
								setNewETF({ ...newETF, symbol: text.toUpperCase() })
							}
							placeholderTextColor={colors.gray}
						/>

						<TextInput
							style={styles.input}
							placeholder='Units'
							value={newETF.units.toString()}
							onChangeText={(text) =>
								setNewETF({ ...newETF, units: parseFloat(text) || 0 })
							}
							placeholderTextColor={colors.gray}
							keyboardType='decimal-pad'
						/>

						<TextInput
							style={styles.input}
							placeholder='Current NAV'
							value={newETF.currentNav.toString()}
							onChangeText={(text) =>
								setNewETF({ ...newETF, currentNav: parseFloat(text) || 0 })
							}
							placeholderTextColor={colors.gray}
							keyboardType='decimal-pad'
						/>

						<TextInput
							style={styles.input}
							placeholder='Total Invested Amount'
							value={newETF.investedAmount.toString()}
							onChangeText={(text) =>
								setNewETF({ ...newETF, investedAmount: parseFloat(text) || 0 })
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
								onPress={handleAddETF}
								disabled={isSubmitting}
							>
								<Text style={styles.buttonText}>
									{isSubmitting ? 'Adding...' : 'Add Equity ETF'}
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			{/* Add New Equity ETF Button */}
			<TouchableOpacity
				style={[styles.button, styles.buttonPrimary, { marginTop: 16 }]}
				onPress={() => setShowAddModal(true)}
			>
				<Text style={styles.buttonText}>+ Add Equity ETF</Text>
			</TouchableOpacity>
		</View>
	);
};
