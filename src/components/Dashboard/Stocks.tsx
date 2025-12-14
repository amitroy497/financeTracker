import { assetService } from '@/services/assetService';
import { createStyles } from '@/styles';
import { useTheme } from '@/theme';
import { CreateStockData, Stock, StocksProps } from '@/types';
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
import { TextInputWithEllipsis } from '../UI';

export const Stocks = ({
	stocks,
	onEdit,
	onDelete,
	onRefresh,
	userId,
}: StocksProps) => {
	const { colors } = useTheme();
	const styles = createStyles(colors);
	const [showAddModal, setShowAddModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [editingStock, setEditingStock] = useState<Stock | null>(null);
	const [newStock, setNewStock] = useState<CreateStockData>({
		companyName: '',
		symbol: '',
		exchange: 'NSE',
		quantity: 0,
		averagePrice: 0,
		currentPrice: 0,
	});

	// Add state for input strings to allow decimal typing
	const [quantityInput, setQuantityInput] = useState<string>('');
	const [averagePriceInput, setAveragePriceInput] = useState<string>('');
	const [currentPriceInput, setCurrentPriceInput] = useState<string>('');

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

	// Handle integer input for quantity
	const handleQuantityInput = (text: string) => {
		// Allow only numbers (integer input for quantity)
		const cleanedText = text.replace(/[^0-9]/g, '');

		setQuantityInput(cleanedText);

		// Parse the value
		const parsedValue = cleanedText === '' ? 0 : parseInt(cleanedText, 10);

		if (!isNaN(parsedValue)) {
			setNewStock({
				...newStock,
				quantity: parsedValue,
			});
		}
	};

	// Handle decimal input for prices
	const handleDecimalInput = (
		text: string,
		type: 'averagePrice' | 'currentPrice'
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

		// Limit to 2 decimal places for prices
		const decimalIndex = cleanedText.indexOf('.');
		if (decimalIndex !== -1) {
			const decimalPart = cleanedText.substring(decimalIndex + 1);
			if (decimalPart.length > 2) {
				cleanedText = cleanedText.substring(0, decimalIndex + 3);
			}
		}

		// Update the appropriate input state
		if (type === 'averagePrice') {
			setAveragePriceInput(cleanedText);
		} else {
			setCurrentPriceInput(cleanedText);
		}

		// Parse the value and update the stock data
		let parsedValue: number;
		if (cleanedText === '' || cleanedText === '.') {
			parsedValue = 0;
		} else {
			parsedValue = parseFloat(cleanedText);
			if (isNaN(parsedValue)) parsedValue = 0;
		}

		setNewStock({
			...newStock,
			[type]: parsedValue,
		});
	};

	// Format number for display (show empty string for 0)
	const formatNumberForInput = (num: number): string => {
		if (num === 0) return '';
		return num.toString();
	};

	const handleAddStock = async (): Promise<void> => {
		if (!newStock.companyName.trim()) {
			Alert.alert('Error', 'Please enter company name');
			return;
		}

		if (!newStock?.symbol?.trim()) {
			Alert.alert('Error', 'Please enter stock symbol');
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
			// Reset all states
			setNewStock({
				companyName: '',
				symbol: '',
				exchange: 'NSE',
				quantity: 0,
				averagePrice: 0,
				currentPrice: 0,
			});
			setQuantityInput('');
			setAveragePriceInput('');
			setCurrentPriceInput('');
			onRefresh();
			Alert.alert('Success', 'Stock added successfully!');
		} catch (error) {
			console.error('Error adding stock:', error);
			Alert.alert('Error', 'Failed to add stock');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleEditStock = (stock: Stock) => {
		setEditingStock(stock);
		setNewStock({
			companyName: stock.companyName,
			symbol: stock.symbol || '',
			exchange: stock.exchange || 'NSE',
			quantity: stock.quantity,
			averagePrice: stock.averagePrice,
			currentPrice: stock.currentPrice,
		});
		// Set input strings for display
		setQuantityInput(formatNumberForInput(stock.quantity));
		setAveragePriceInput(formatNumberForInput(stock.averagePrice));
		setCurrentPriceInput(formatNumberForInput(stock.currentPrice));
		setShowEditModal(true);
	};

	const handleUpdateStock = async (): Promise<void> => {
		if (!editingStock || !newStock?.companyName?.trim()) {
			Alert.alert('Error', 'Please enter company name');
			return;
		}

		if (!newStock?.symbol?.trim()) {
			Alert.alert('Error', 'Please enter stock symbol');
			return;
		}

		if (newStock?.quantity <= 0) {
			Alert.alert('Error', 'Quantity must be greater than 0');
			return;
		}

		if (newStock?.averagePrice <= 0) {
			Alert.alert('Error', 'Average price must be greater than 0');
			return;
		}

		if (newStock?.currentPrice <= 0) {
			Alert.alert('Error', 'Current price must be greater than 0');
			return;
		}

		setIsSubmitting(true);
		try {
			await assetService.updateStock(userId, editingStock.id, newStock);
			setShowEditModal(false);
			setEditingStock(null);
			// Reset all states
			setNewStock({
				companyName: '',
				symbol: '',
				exchange: 'NSE',
				quantity: 0,
				averagePrice: 0,
				currentPrice: 0,
			});
			setQuantityInput('');
			setAveragePriceInput('');
			setCurrentPriceInput('');
			onRefresh();
			Alert.alert('Success', 'Stock updated successfully!');
		} catch (error) {
			console.error('Error updating stock:', error);
			Alert.alert('Error', 'Failed to update stock');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteStock = async (
		stockId: string,
		companyName: string
	): Promise<void> => {
		// Use the onDelete prop if provided, otherwise use direct service call
		if (onDelete) {
			onDelete('stock', stockId);
		} else {
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
		}
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

	const formatNumber = (num: number, decimals: number = 2): string => {
		return num.toFixed(decimals);
	};

	const renderStockCard = (stock: Stock) => {
		const returnPercentage =
			stock.investedAmount > 0
				? ((stock.currentValue - stock.investedAmount) / stock.investedAmount) *
				  100
				: 0;

		return (
			<TouchableOpacity
				key={stock.id}
				style={[
					styles.card,
					{
						marginBottom: 12,
						borderLeftWidth: 4,
						borderLeftColor: getExchangeColor(stock?.exchange || ''),
						padding: 16,
					},
				]}
				onPress={() => handleEditStock(stock)}
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
								{stock.companyName}
							</Text>
							<Text
								style={{
									fontWeight: 'bold',
									color: getReturnColor(returnPercentage),
									fontSize: 12,
								}}
							>
								{returnPercentage >= 0 ? '+' : ''}
								{formatNumber(returnPercentage)}%
							</Text>
						</View>

						<Text style={{ color: colors.gray, fontSize: 12, marginBottom: 8 }}>
							{stock.symbol} • {stock.exchange}
						</Text>

						<View
							style={[
								styles.row,
								{ justifyContent: 'space-between', marginBottom: 4 },
							]}
						>
							<View>
								<Text style={{ color: colors.gray, fontSize: 12 }}>
									Quantity
								</Text>
								<Text
									style={{
										fontWeight: 'bold',
										color: colors.dark,
										fontSize: 14,
									}}
								>
									{stock.quantity} shares
								</Text>
							</View>

							<View style={{ alignItems: 'center' }}>
								<Text style={{ color: colors.gray, fontSize: 12 }}>
									Avg Price
								</Text>
								<Text
									style={{
										fontWeight: 'bold',
										color: colors.dark,
										fontSize: 14,
									}}
								>
									₹{formatNumber(stock.averagePrice)}
								</Text>
							</View>

							<View style={{ alignItems: 'flex-end' }}>
								<Text style={{ color: colors.gray, fontSize: 12 }}>
									Current Price
								</Text>
								<Text
									style={{
										fontWeight: 'bold',
										color: colors.dark,
										fontSize: 14,
									}}
								>
									₹{formatNumber(stock.currentPrice)}
								</Text>
							</View>
						</View>

						<View
							style={[
								styles.row,
								{ justifyContent: 'space-between', marginTop: 8 },
							]}
						>
							<View>
								<Text style={{ color: colors.gray, fontSize: 12 }}>
									Invested
								</Text>
								<Text
									style={{
										fontWeight: 'bold',
										color: colors.dark,
										fontSize: 14,
									}}
								>
									{formatCurrency(stock.investedAmount)}
								</Text>
							</View>

							<View style={{ alignItems: 'flex-end' }}>
								<Text style={{ color: colors.gray, fontSize: 12 }}>
									Current Value
								</Text>
								<Text
									style={{
										fontWeight: 'bold',
										color: getReturnColor(returnPercentage),
										fontSize: 14,
									}}
								>
									{formatCurrency(stock.currentValue)}
								</Text>
							</View>
						</View>
					</View>
				</View>

				<View
					style={[styles.row, { marginTop: 12, justifyContent: 'flex-end' }]}
				>
					<TouchableOpacity
						style={{ marginRight: 16 }}
						onPress={() => handleEditStock(stock)}
					>
						<Text style={{ color: colors.primary, fontSize: 12 }}>✏️ Edit</Text>
					</TouchableOpacity>
					<TouchableOpacity
						onPress={() => handleDeleteStock(stock.id, stock.companyName)}
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
					setEditingStock(null);
				} else {
					setShowAddModal(false);
				}
				// Reset all states
				setNewStock({
					companyName: '',
					symbol: '',
					exchange: 'NSE',
					quantity: 0,
					averagePrice: 0,
					currentPrice: 0,
				});
				setQuantityInput('');
				setAveragePriceInput('');
				setCurrentPriceInput('');
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
							{isEdit ? 'Edit Stock' : 'Add Stock'}
						</Text>
						<TextInputWithEllipsis
							placeholderText='Company Name (e.g., Reliance Industries)'
							value={newStock.companyName}
							onChangeText={(text: string) =>
								setNewStock({ ...newStock, companyName: text })
							}
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
							value={quantityInput}
							onChangeText={handleQuantityInput}
							placeholderTextColor={colors.gray}
							keyboardType='number-pad'
						/>

						<TextInput
							style={styles.input}
							placeholder='Average Buy Price (₹)'
							value={averagePriceInput}
							onChangeText={(text) => handleDecimalInput(text, 'averagePrice')}
							placeholderTextColor={colors.gray}
							keyboardType='decimal-pad'
						/>

						<TextInput
							style={styles.input}
							placeholder='Current Market Price (₹)'
							value={currentPriceInput}
							onChangeText={(text) => handleDecimalInput(text, 'currentPrice')}
							placeholderTextColor={colors.gray}
							keyboardType='decimal-pad'
						/>

						<View style={[styles.row, { gap: 12, marginTop: 16 }]}>
							<TouchableOpacity
								style={[styles.button, styles.buttonSecondary, { flex: 1 }]}
								onPress={() => {
									if (isEdit) {
										setShowEditModal(false);
										setEditingStock(null);
									} else {
										setShowAddModal(false);
									}
									// Reset all states
									setNewStock({
										companyName: '',
										symbol: '',
										exchange: 'NSE',
										quantity: 0,
										averagePrice: 0,
										currentPrice: 0,
									});
									setQuantityInput('');
									setAveragePriceInput('');
									setCurrentPriceInput('');
								}}
								disabled={isSubmitting}
							>
								<Text style={styles.buttonText}>Cancel</Text>
							</TouchableOpacity>

							<TouchableOpacity
								style={[styles.button, styles.buttonPrimary, { flex: 1 }]}
								onPress={isEdit ? handleUpdateStock : handleAddStock}
								disabled={isSubmitting}
							>
								<Text style={styles.buttonText}>
									{isSubmitting
										? 'Saving...'
										: isEdit
										? 'Update Stock'
										: 'Add Stock'}
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

			{stocks.length === 0 ? (
				<View
					style={[
						styles.card,
						styles.center,
						{ minHeight: 200, marginBottom: 16 },
					]}
				>
					<Text style={{ color: colors.gray }}>No stocks found</Text>
					<Text style={{ color: colors.gray, fontSize: 12, marginTop: 8 }}>
						Add your first stock to build your portfolio
					</Text>
				</View>
			) : (
				<ScrollView
					showsVerticalScrollIndicator={false}
					style={{ maxHeight: 400 }}
				>
					{stocks.map(renderStockCard)}
				</ScrollView>
			)}

			{/* Add New Stock Button */}
			<TouchableOpacity
				style={[styles.button, styles.buttonPrimary, { marginTop: 16 }]}
				onPress={() => setShowAddModal(true)}
			>
				<Text style={styles.buttonText}>+ Add Stock</Text>
			</TouchableOpacity>

			{/* Modals */}
			{renderAddEditModal(false)}
			{renderAddEditModal(true)}
		</View>
	);
};
