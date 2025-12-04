import { assetService } from '@/services/assetService';
import { createStyles } from '@/styles';
import { useTheme } from '@/theme';
import { CreateStockData, StocksProps } from '@/types';
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

export const Stocks = ({ stocks, onRefresh, userId }: StocksProps) => {
	const { colors } = useTheme();
	const styles = createStyles(colors);
	const [showAddModal, setShowAddModal] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [newStock, setNewStock] = useState<CreateStockData>({
		companyName: '',
		symbol: '',
		exchange: 'NSE',
		quantity: 0,
		averagePrice: 0,
		currentPrice: 0,
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

	const getExchangeColor = (exchange: string): string => {
		return exchange === 'NSE' ? colors.primary : colors.info;
	};

	const handleAddStock = async (): Promise<void> => {
		if (!newStock.companyName.trim() || !newStock.symbol.trim()) {
			Alert.alert('Error', 'Please fill in all required fields');
			return;
		}

		if (newStock.quantity <= 0) {
			Alert.alert('Error', 'Quantity must be greater than 0');
			return;
		}

		if (newStock.averagePrice <= 0) {
			Alert.alert('Error', 'Average price must be greater than 0');
			return;
		}

		if (newStock.currentPrice <= 0) {
			Alert.alert('Error', 'Current price must be greater than 0');
			return;
		}

		setIsSubmitting(true);
		try {
			await assetService.createStock(userId, newStock);
			setShowAddModal(false);
			setNewStock({
				companyName: '',
				symbol: '',
				exchange: 'NSE',
				quantity: 0,
				averagePrice: 0,
				currentPrice: 0,
			});
			onRefresh();
			Alert.alert('Success', 'Stock added successfully!');
		} catch (error) {
			console.error('Error adding stock:', error);
			Alert.alert('Error', 'Failed to add stock');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteStock = async (
		stockId: string,
		companyName: string
	): Promise<void> => {
		Alert.alert(
			'Delete Stock',
			`Are you sure you want to delete ${companyName}?`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: async () => {
						try {
							await assetService.deleteStock(userId, stockId);
							onRefresh();
							Alert.alert('Success', 'Stock deleted successfully!');
						} catch (error) {
							console.error('Error deleting stock:', error);
							Alert.alert('Error', 'Failed to delete stock');
						}
					},
				},
			]
		);
	};

	const totalCurrentValue = stocks.reduce(
		(sum, stock) => sum + stock.currentValue,
		0
	);
	const totalInvested = stocks.reduce(
		(sum, stock) => sum + stock.investedAmount,
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
							Stocks Portfolio Value
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
					<Text style={{ fontSize: 24 }}>📈</Text>
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

			{/* Stocks List */}
			<Text style={[styles.subHeading, { marginTop: 24, marginBottom: 16 }]}>
				Stock Portfolio
			</Text>

			<ScrollView
				showsVerticalScrollIndicator={false}
				style={{ maxHeight: 400 }}
			>
				{stocks.map((stock) => (
					<TouchableOpacity
						key={stock.id}
						style={[
							styles.card,
							{
								marginBottom: 12,
								borderLeftWidth: 4,
								borderLeftColor: getExchangeColor(stock.exchange),
							},
						]}
						onLongPress={() => handleDeleteStock(stock.id, stock.companyName)}
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
									{stock.companyName}
								</Text>
								<Text style={{ color: colors.gray, fontSize: 12 }}>
									{stock.symbol} • {stock.exchange}
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
									{formatCurrency(stock.currentValue)}
								</Text>
								<Text
									style={{
										color: getReturnColor(stock.returns),
										fontSize: 12,
										fontWeight: 'bold',
									}}
								>
									{stock.returns >= 0 ? '+' : ''}
									{stock.returns.toFixed(2)}%
								</Text>
							</View>
						</View>

						<View
							style={[styles.row, styles.spaceBetween, { marginBottom: 4 }]}
						>
							<Text style={{ color: colors.gray, fontSize: 12 }}>
								Qty: {stock.quantity}
							</Text>
							<Text style={{ color: colors.gray, fontSize: 12 }}>
								Avg: ₹{stock.averagePrice.toFixed(2)}
							</Text>
						</View>

						<View style={[styles.row, styles.spaceBetween]}>
							<Text style={{ color: colors.gray, fontSize: 12 }}>
								Invested: {formatCurrency(stock.investedAmount)}
							</Text>
							<Text style={{ color: colors.gray, fontSize: 12 }}>
								Current: ₹{stock.currentPrice.toFixed(2)}
							</Text>
						</View>
					</TouchableOpacity>
				))}
			</ScrollView>

			{/* Add New Stock Modal */}
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
							Add Stock
						</Text>

						<TextInput
							style={styles.input}
							placeholder='Company Name'
							value={newStock.companyName}
							onChangeText={(text) =>
								setNewStock({ ...newStock, companyName: text })
							}
							placeholderTextColor={colors.gray}
						/>

						<TextInput
							style={styles.input}
							placeholder='Symbol (e.g., RELIANCE, TCS)'
							value={newStock.symbol}
							onChangeText={(text) =>
								setNewStock({ ...newStock, symbol: text.toUpperCase() })
							}
							placeholderTextColor={colors.gray}
						/>

						<View style={[styles.row, { gap: 12, marginBottom: 12 }]}>
							<TouchableOpacity
								style={[
									styles.button,
									{
										flex: 1,
										backgroundColor:
											newStock.exchange === 'NSE'
												? colors.primary
												: colors.lightGray,
									},
								]}
								onPress={() => setNewStock({ ...newStock, exchange: 'NSE' })}
							>
								<Text
									style={[
										styles.buttonText,
										{
											color:
												newStock.exchange === 'NSE'
													? colors.white
													: colors.dark,
										},
									]}
								>
									NSE
								</Text>
							</TouchableOpacity>

							<TouchableOpacity
								style={[
									styles.button,
									{
										flex: 1,
										backgroundColor:
											newStock.exchange === 'BSE'
												? colors.info
												: colors.lightGray,
									},
								]}
								onPress={() => setNewStock({ ...newStock, exchange: 'BSE' })}
							>
								<Text
									style={[
										styles.buttonText,
										{
											color:
												newStock.exchange === 'BSE'
													? colors.white
													: colors.dark,
										},
									]}
								>
									BSE
								</Text>
							</TouchableOpacity>
						</View>

						<TextInput
							style={styles.input}
							placeholder='Quantity'
							value={newStock.quantity.toString()}
							onChangeText={(text) =>
								setNewStock({ ...newStock, quantity: parseInt(text) || 0 })
							}
							placeholderTextColor={colors.gray}
							keyboardType='number-pad'
						/>

						<TextInput
							style={styles.input}
							placeholder='Average Buy Price'
							value={newStock.averagePrice.toString()}
							onChangeText={(text) =>
								setNewStock({
									...newStock,
									averagePrice: parseFloat(text) || 0,
								})
							}
							placeholderTextColor={colors.gray}
							keyboardType='decimal-pad'
						/>

						<TextInput
							style={styles.input}
							placeholder='Current Market Price'
							value={newStock.currentPrice.toString()}
							onChangeText={(text) =>
								setNewStock({
									...newStock,
									currentPrice: parseFloat(text) || 0,
								})
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
								onPress={handleAddStock}
								disabled={isSubmitting}
							>
								<Text style={styles.buttonText}>
									{isSubmitting ? 'Adding...' : 'Add Stock'}
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			{/* Add New Stock Button */}
			<TouchableOpacity
				style={[styles.button, styles.buttonPrimary, { marginTop: 16 }]}
				onPress={() => setShowAddModal(true)}
			>
				<Text style={styles.buttonText}>+ Add Stock</Text>
			</TouchableOpacity>
		</View>
	);
};
