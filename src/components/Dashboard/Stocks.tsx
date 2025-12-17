import { StocksBanner } from '@/icons';
import { assetService } from '@/services/assetService';
import { createStyles } from '@/styles';
import { useTheme } from '@/theme';
import { CreateStockData, Stock, StocksProps } from '@/types';
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
import { AddDetailsButton, Banner, CardsView, InputComponent } from '../UI';

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

	// Updated state to include currentValue and investedAmount
	const [newStock, setNewStock] = useState<
		CreateStockData & {
			currentValue?: number;
			investedAmount?: number;
		}
	>({
		companyName: '',
		symbol: '',
		exchange: 'NSE',
		quantity: 0,
		averagePrice: 0,
		currentPrice: 0,
		currentValue: 0,
		investedAmount: 0,
	});

	// Input states for string values (for better UX)
	const [quantityInput, setQuantityInput] = useState<string>('');
	const [averagePriceInput, setAveragePriceInput] = useState<string>('');
	const [currentPriceInput, setCurrentPriceInput] = useState<string>('');
	const [currentValueInput, setCurrentValueInput] = useState<string>('');
	const [investedAmountInput, setInvestedAmountInput] = useState<string>('');

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
			const updatedStock = {
				...newStock,
				quantity: parsedValue,
			};

			// Calculate invested amount and current value
			const investedAmount = parsedValue * newStock.averagePrice;
			const currentValue = parsedValue * newStock.currentPrice;

			updatedStock.investedAmount = investedAmount;
			updatedStock.currentValue = currentValue;

			setInvestedAmountInput(
				investedAmount === 0 ? '' : investedAmount.toFixed(2)
			);
			setCurrentValueInput(currentValue === 0 ? '' : currentValue.toFixed(2));

			setNewStock(updatedStock);
		}
	};

	// Handle decimal input for prices
	const handleDecimalInput = (
		text: string,
		type: 'averagePrice' | 'currentPrice' | 'currentValue' | 'investedAmount'
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
		switch (type) {
			case 'averagePrice':
				setAveragePriceInput(cleanedText);
				break;
			case 'currentPrice':
				setCurrentPriceInput(cleanedText);
				break;
			case 'currentValue':
				setCurrentValueInput(cleanedText);
				break;
			case 'investedAmount':
				setInvestedAmountInput(cleanedText);
				break;
		}

		// Parse the value and update the stock data
		let parsedValue: number;
		if (cleanedText === '' || cleanedText === '.') {
			parsedValue = 0;
		} else {
			parsedValue = parseFloat(cleanedText);
			if (isNaN(parsedValue)) parsedValue = 0;
		}

		const updatedStock = {
			...newStock,
			[type]: parsedValue,
		};

		// Calculate derived values when averagePrice or currentPrice changes
		if (type === 'averagePrice' || type === 'currentPrice') {
			if (type === 'averagePrice') {
				const investedAmount = newStock.quantity * parsedValue;
				updatedStock.investedAmount = investedAmount;
				setInvestedAmountInput(
					investedAmount === 0 ? '' : investedAmount.toFixed(2)
				);
			}

			if (type === 'currentPrice') {
				const currentValue = newStock.quantity * parsedValue;
				updatedStock.currentValue = currentValue;
				setCurrentValueInput(currentValue === 0 ? '' : currentValue.toFixed(2));
			}
		}

		setNewStock(updatedStock);
	};

	// Calculate returns
	const calculateReturns = () => {
		if (!newStock.investedAmount || !newStock.currentValue) return 0;
		return (
			((newStock.currentValue - newStock.investedAmount) /
				newStock.investedAmount) *
			100
		);
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
			// Remove calculated fields from the data sent to API
			const { currentValue, investedAmount, ...stockData } = newStock;
			await assetService.createStock(userId, stockData);
			setShowAddModal(false);
			resetForm();
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
		const stockData = {
			companyName: stock.companyName,
			symbol: stock.symbol || '',
			exchange: stock.exchange || 'NSE',
			quantity: stock.quantity,
			averagePrice: stock.averagePrice,
			currentPrice: stock.currentPrice,
			currentValue: stock.currentValue,
			investedAmount: stock.investedAmount,
		};
		setNewStock(stockData);
		// Set input strings for display
		setQuantityInput(formatNumberForInput(stock.quantity));
		setAveragePriceInput(formatNumberForInput(stock.averagePrice));
		setCurrentPriceInput(formatNumberForInput(stock.currentPrice));
		setCurrentValueInput(formatNumberForInput(stock.currentValue));
		setInvestedAmountInput(formatNumberForInput(stock.investedAmount));
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
			// Remove calculated fields from the data sent to API
			const { currentValue, investedAmount, ...stockData } = newStock;
			await assetService.updateStock(userId, editingStock.id, stockData);
			setShowEditModal(false);
			setEditingStock(null);
			resetForm();
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

	// Reset form function
	const resetForm = () => {
		setNewStock({
			companyName: '',
			symbol: '',
			exchange: 'NSE',
			quantity: 0,
			averagePrice: 0,
			currentPrice: 0,
			currentValue: 0,
			investedAmount: 0,
		});
		setQuantityInput('');
		setAveragePriceInput('');
		setCurrentPriceInput('');
		setCurrentValueInput('');
		setInvestedAmountInput('');
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

	// Get input fields for modal
	const getModalInputFields = (isEdit: boolean) => {
		const returns = calculateReturns();
		const currentValue = newStock.currentValue || 0;
		const investedAmount = newStock.investedAmount || 0;
		const absoluteReturns = currentValue - investedAmount;

		const fields = [
			{
				id: 'companyName',
				label: 'Company Name',
				placeholder: 'Company Name (e.g., Reliance Industries)',
				value: newStock.companyName,
				onChangeText: (text: string) =>
					setNewStock({ ...newStock, companyName: text }),
				isEllipsis: true,
				isMandatory: true,
			},
			{
				id: 'symbol',
				label: 'Symbol',
				placeholder: 'Symbol (e.g., RELIANCE, TCS)',
				value: newStock.symbol,
				onChangeText: (text: string) =>
					setNewStock({ ...newStock, symbol: text.toUpperCase() }),
				isMandatory: true,
			},
			{
				id: 'quantity',
				label: 'Quantity',
				placeholder: 'Number of Shares',
				value: quantityInput,
				onChangeText: handleQuantityInput,
				keyboardType: 'number-pad' as KeyboardType,
				isMandatory: true,
			},
			{
				id: 'averagePrice',
				label: 'Average Price (₹)',
				placeholder: 'Average Buy Price per Share',
				value: averagePriceInput,
				onChangeText: (text: string) =>
					handleDecimalInput(text, 'averagePrice'),
				keyboardType: 'decimal-pad' as KeyboardType,
				isMandatory: true,
			},
			{
				id: 'currentPrice',
				label: 'Current Price (₹)',
				placeholder: 'Current Market Price per Share',
				value: currentPriceInput,
				onChangeText: (text: string) =>
					handleDecimalInput(text, 'currentPrice'),
				keyboardType: 'decimal-pad' as KeyboardType,
				isMandatory: true,
			},
			{
				id: 'investedAmount',
				label: 'Invested Amount (₹)',
				placeholder: 'Total Invested Amount (Auto-calculated)',
				value: investedAmountInput,
				onChangeText: (text: string) =>
					handleDecimalInput(text, 'investedAmount'),
				keyboardType: 'decimal-pad' as KeyboardType,
				isMandatory: false,
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
		];

		return { fields, returns, currentValue, investedAmount, absoluteReturns };
	};

	const renderAddEditModal = (isEdit: boolean) => {
		const { fields, returns, currentValue, investedAmount, absoluteReturns } =
			getModalInputFields(isEdit);

		return (
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
								{isEdit ? 'Edit Stock' : 'Add Stock'}
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
										Invested: {formatCurrency(investedAmount)}
									</Text>
									<Text style={{ color: colors.dark, fontSize: 12 }}>
										Current: {formatCurrency(currentValue)}
									</Text>
								</View>
								<View style={[styles.row, styles.spaceBetween]}>
									<Text style={{ color: colors.dark, fontSize: 12 }}>
										Quantity: {newStock.quantity} shares
									</Text>
									<Text style={{ color: colors.dark, fontSize: 12 }}>
										Exchange: {newStock.exchange}
									</Text>
								</View>
								<View
									style={[styles.row, styles.spaceBetween, { marginTop: 2 }]}
								>
									<Text style={{ color: colors.dark, fontSize: 12 }}>
										Avg Price: ₹{formatNumber(newStock.averagePrice)}
									</Text>
									<Text style={{ color: colors.dark, fontSize: 12 }}>
										Curr Price: ₹{formatNumber(newStock.currentPrice)}
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
									isEllipsis={field.isEllipsis}
									isMandatory={field.isMandatory}
								/>
							))}

							{/* Exchange Selection Buttons */}
							<View style={{ marginBottom: 12 }}>
								<Text style={styles.label}>Exchange:</Text>
								<View style={[styles.row, { gap: 12, marginTop: 4 }]}>
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
										onPress={() =>
											setNewStock({ ...newStock, exchange: 'NSE' })
										}
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
										onPress={() =>
											setNewStock({ ...newStock, exchange: 'BSE' })
										}
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
							</View>

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
										resetForm();
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
						</ScrollView>
					</View>
				</View>
			</Modal>
		);
	};

	return (
		<View style={{ padding: 20 }}>
			<Banner
				image={StocksBanner}
				title='Stocks Portfolio Value'
				amount={totalCurrentValue}
			>
				<View style={[styles.row, styles.spaceBetween]}>
					<View>
						<Text style={{ fontSize: 12, color: colors.platinum }}>
							Invested
						</Text>
						<Text
							style={{
								fontSize: 14,
								fontWeight: 'bold',
								color: colors.platinum,
							}}
						>
							{formatCurrency(totalInvested)}
						</Text>
					</View>

					<View style={{ alignItems: 'flex-end' }}>
						<Text style={{ fontSize: 12, color: colors.platinum }}>
							Returns
						</Text>
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
			</Banner>
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
				<CardsView details={stocks} renderCard={renderStockCard} />
			)}

			<AddDetailsButton label='Stock' onPress={() => setShowAddModal(true)} />

			{/* Modals */}
			{renderAddEditModal(false)}
			{renderAddEditModal(true)}
		</View>
	);
};
