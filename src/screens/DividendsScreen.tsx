import { DIVIDEND_CATEGORIES } from '@/constants';
import { useAuth } from '@/hooks';
import { createStyles } from '@/styles';
import { useTheme } from '@/theme';
import { Dividend, DividendFormData, YearlyFinancialData } from '@/types';
import { formatCurrency, getCurrentMonth } from '@/utils';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system/legacy';
import React, { useEffect, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	FlatList,
	Modal,
	ScrollView,
	SectionList,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';

export const DividendsScreen = () => {
	const { colors } = useTheme();
	const styles = createStyles(colors);
	const { user } = useAuth();
	const [dividends, setDividends] = useState<Dividend[]>([]);
	const [filteredDividends, setFilteredDividends] = useState<Dividend[]>([]);
	const [loading, setLoading] = useState(true);
	const [showAddModal, setShowAddModal] = useState(false);
	const [showCategoryModal, setShowCategoryModal] = useState(false);
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [showDateActionsModal, setShowDateActionsModal] = useState(false);
	const [selectedDateForActions, setSelectedDateForActions] =
		useState<string>('');
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedCategory, setSelectedCategory] = useState<string>('all');
	const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());
	const [yearlyData, setYearlyData] = useState<YearlyFinancialData | null>(
		null
	);
	const [showCategoryTiles, setShowCategoryTiles] = useState(false);
	const [isEditing, setIsEditing] = useState(false);

	const [formData, setFormData] = useState<DividendFormData>({
		amount: '',
		company: '',
		stockSymbol: '',
		category: '',
		date: new Date().toISOString().split('T')[0],
		notes: '',
		quantity: '',
		dividendPerShare: '',
	});

	const [selectedDate, setSelectedDate] = useState(new Date());

	useEffect(() => {
		loadDividends();
	}, [user]);

	useEffect(() => {
		filterDividends();
		calculateYearlyData();
	}, [dividends, searchQuery, selectedCategory, selectedMonth]);

	const getDividendsFilePath = (): string => {
		if (!user) return '';
		return `${FileSystem.documentDirectory}dividends_${user.id}.json`;
	};

	const getYearlyDataFilePath = (): string => {
		if (!user) return '';
		return `${FileSystem.documentDirectory}yearly_dividends_${user.id}.json`;
	};

	const getCurrentFinancialYear = (): string => {
		const now = new Date();
		const year = now.getFullYear();
		const month = now.getMonth() + 1;
		if (month >= 4) {
			return `${year}-${year + 1}`;
		} else {
			return `${year - 1}-${year}`;
		}
	};

	const getFinancialYearFromDate = (dateString: string): string => {
		const date = new Date(dateString);
		const year = date.getFullYear();
		const month = date.getMonth() + 1;
		if (month >= 4) {
			return `${year}-${year + 1}`;
		} else {
			return `${year - 1}-${year}`;
		}
	};

	const loadDividends = async (): Promise<void> => {
		if (!user) return;
		try {
			const filePath = getDividendsFilePath();
			const fileInfo = await FileSystem.getInfoAsync(filePath);
			if (fileInfo.exists) {
				const fileContent = await FileSystem.readAsStringAsync(filePath);
				const data = JSON.parse(fileContent);
				setDividends(data.dividends || []);
			} else {
				const initialData = { dividends: [] };
				await FileSystem.writeAsStringAsync(
					filePath,
					JSON.stringify(initialData, null, 2)
				);
				setDividends([]);
			}
			await loadYearlyData();
		} catch (error) {
			console.error('Error loading dividends:', error);
			Alert.alert('Error', 'Failed to load dividends');
		} finally {
			setLoading(false);
		}
	};

	const loadYearlyData = async (): Promise<void> => {
		if (!user) return;
		try {
			const filePath = getYearlyDataFilePath();
			const fileInfo = await FileSystem.getInfoAsync(filePath);

			if (fileInfo.exists) {
				const fileContent = await FileSystem.readAsStringAsync(filePath);
				const data = JSON.parse(fileContent);
				setYearlyData(data);
			} else {
				const currentFY = getCurrentFinancialYear();
				const initialYearlyData: YearlyFinancialData = {
					year: currentFY,
					totalIncome: 0,
					categoryTotals: {},
					monthlyTotals: {},
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				};
				setYearlyData(initialYearlyData);
			}
		} catch (error) {
			console.error('Error loading yearly data:', error);
		}
	};

	const saveDividends = async (updatedDividends: Dividend[]): Promise<void> => {
		if (!user) return;
		try {
			const filePath = getDividendsFilePath();
			const data = { dividends: updatedDividends };
			await FileSystem.writeAsStringAsync(
				filePath,
				JSON.stringify(data, null, 2)
			);
			setDividends(updatedDividends);
		} catch (error) {
			console.error('Error saving dividends:', error);
			throw new Error('Failed to save dividends');
		}
	};

	const saveYearlyData = async (
		updatedYearlyData: YearlyFinancialData
	): Promise<void> => {
		if (!user) return;
		try {
			const filePath = getYearlyDataFilePath();
			await FileSystem.writeAsStringAsync(
				filePath,
				JSON.stringify(updatedYearlyData, null, 2)
			);
			setYearlyData(updatedYearlyData);
		} catch (error) {
			console.error('Error saving yearly data:', error);
		}
	};

	const calculateYearlyData = (): void => {
		if (!dividends.length) return;

		const currentFY = getCurrentFinancialYear();
		const fyDividends = dividends.filter((dividend) => {
			const dividendFY = getFinancialYearFromDate(dividend.date);
			return dividendFY === currentFY;
		});

		const totalIncome = fyDividends.reduce(
			(total, dividend) => total + dividend.amount,
			0
		);

		const categoryTotals: { [category: string]: number } = {};
		const monthlyTotals: { [month: string]: number } = {};
		const companyTotals: { [company: string]: number } = {};

		fyDividends.forEach((dividend) => {
			if (!categoryTotals[dividend.category]) {
				categoryTotals[dividend.category] = 0;
			}
			categoryTotals[dividend.category] += dividend.amount;

			const dividendDate = new Date(dividend.date);
			const monthKey = `${dividendDate.getFullYear()}-${(
				dividendDate.getMonth() + 1
			)
				.toString()
				.padStart(2, '0')}`;

			if (!monthlyTotals[monthKey]) {
				monthlyTotals[monthKey] = 0;
			}
			monthlyTotals[monthKey] += dividend.amount;

			if (!companyTotals[dividend.company]) {
				companyTotals[dividend.company] = 0;
			}
			companyTotals[dividend.company] += dividend.amount;
		});

		const updatedYearlyData: YearlyFinancialData = {
			year: currentFY,
			totalIncome,
			categoryTotals,
			monthlyTotals,
			companyTotals,
			createdAt: yearlyData?.createdAt || new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		saveYearlyData(updatedYearlyData);
	};

	const filterDividends = (): void => {
		let filtered = [...dividends];
		if (searchQuery) {
			filtered = filtered.filter(
				(dividend) =>
					dividend.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
					dividend.stockSymbol
						?.toLowerCase()
						.includes(searchQuery.toLowerCase()) ||
					dividend.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
					dividend.notes?.toLowerCase().includes(searchQuery.toLowerCase())
			);
		}
		if (selectedCategory !== 'all') {
			filtered = filtered.filter(
				(dividend) => dividend.category === selectedCategory
			);
		}
		if (selectedMonth) {
			filtered = filtered.filter((dividend) => {
				const dividendDate = new Date(dividend.date);
				const dividendMonth = `${dividendDate.getFullYear()}-${(
					dividendDate.getMonth() + 1
				)
					.toString()
					.padStart(2, '0')}`;
				return dividendMonth === selectedMonth;
			});
		}
		filtered.sort(
			(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
		);
		setFilteredDividends(filtered);
	};

	const handleAddDividend = async (): Promise<void> => {
		if (
			!formData.amount ||
			!formData.company ||
			!formData.category ||
			!formData.date
		) {
			Alert.alert('Error', 'Please fill in all required fields');
			return;
		}

		const amount = parseFloat(formData.amount);
		if (isNaN(amount) || amount <= 0) {
			Alert.alert('Error', 'Please enter a valid amount');
			return;
		}

		const quantity = formData.quantity ? parseFloat(formData.quantity) : 0;
		const dividendPerShare = formData.dividendPerShare
			? parseFloat(formData.dividendPerShare)
			: 0;
		if (isEditing && formData.id) {
			const updatedDividends = dividends.map((dividend) =>
				dividend.id === formData.id
					? {
							...dividend,
							amount,
							company: formData.company,
							stockSymbol: formData.stockSymbol,
							category: formData.category,
							date: formData.date,
							notes: formData.notes || undefined,
							quantity: quantity || undefined,
							dividendPerShare: dividendPerShare || undefined,
					  }
					: dividend
			);
			try {
				await saveDividends(updatedDividends);
				setShowAddModal(false);
				resetForm();
				Alert.alert('Success', 'Dividend updated successfully!');
			} catch (error) {
				Alert.alert('Error', 'Failed to update dividend');
			}
		} else {
			const newDividend: Dividend = {
				id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
				amount,
				company: formData.company,
				stockSymbol: formData.stockSymbol || undefined,
				category: formData.category,
				date: formData.date,
				createdAt: new Date().toISOString(),
				notes: formData.notes || undefined,
				quantity: quantity || undefined,
				dividendPerShare: dividendPerShare || undefined,
			};
			try {
				const updatedDividends = [newDividend, ...dividends];
				await saveDividends(updatedDividends);
				setShowAddModal(false);
				resetForm();
				Alert.alert('Success', 'Dividend added successfully!');
			} catch (error) {
				Alert.alert('Error', 'Failed to add dividend');
			}
		}
	};

	const handleDeleteDividend = (dividendId: string): void => {
		Alert.alert(
			'Delete Dividend',
			'Are you sure you want to delete this dividend?',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: async () => {
						try {
							const updatedDividends = dividends.filter(
								(dividend) => dividend.id !== dividendId
							);
							await saveDividends(updatedDividends);
							Alert.alert('Success', 'Dividend deleted successfully!');
						} catch (error) {
							Alert.alert('Error', 'Failed to delete dividend');
						}
					},
				},
			]
		);
	};

	const handleEditDividend = (dividend: Dividend): void => {
		setFormData({
			id: dividend.id,
			amount: dividend.amount.toString(),
			company: dividend.company,
			stockSymbol: dividend.stockSymbol || '',
			category: dividend.category,
			date: dividend.date,
			notes: dividend.notes || '',
			quantity: dividend.quantity?.toString() || '',
			dividendPerShare: dividend.dividendPerShare?.toString() || '',
		});
		setSelectedDate(new Date(dividend.date));
		setIsEditing(true);
		setShowAddModal(true);
	};

	const handleBulkDeleteForDate = (date: string): void => {
		Alert.alert(
			'Delete All Dividends for Date',
			`Are you sure you want to delete all dividends for ${formatDate(date)}?`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete All',
					style: 'destructive',
					onPress: async () => {
						try {
							const updatedDividends = dividends.filter(
								(dividend) => dividend.date !== date
							);
							await saveDividends(updatedDividends);
							setShowDateActionsModal(false);
							Alert.alert(
								'Success',
								`All dividends for ${formatDate(date)} deleted successfully!`
							);
						} catch (error) {
							Alert.alert('Error', 'Failed to delete dividends');
						}
					},
				},
			]
		);
	};

	const handleAddForDate = (date: string): void => {
		setFormData({
			...formData,
			date: date,
		});
		setSelectedDate(new Date(date));
		setIsEditing(false);
		setShowDateActionsModal(false);
		setShowAddModal(true);
	};

	const resetForm = (): void => {
		setFormData({
			amount: '',
			company: '',
			stockSymbol: '',
			category: '',
			date: new Date().toISOString().split('T')[0],
			notes: '',
			quantity: '',
			dividendPerShare: '',
		});
		setSelectedDate(new Date());
		setIsEditing(false);
	};

	const getCategoryInfo = (categoryKey: string) => {
		return (
			DIVIDEND_CATEGORIES.find((cat) => cat.key === categoryKey) || {
				key: categoryKey,
				name: categoryKey,
				emoji: '📈',
				color: colors.gray,
			}
		);
	};

	const getTotalDividends = (): number => {
		return filteredDividends.reduce(
			(total, dividend) => total + dividend.amount,
			0
		);
	};

	const getCategoryTotal = (category: string): number => {
		return dividends
			.filter((dividend) => dividend.category === category)
			.reduce((total, dividend) => total + dividend.amount, 0);
	};

	const getMonthlyTotal = (): number => {
		return dividends
			.filter((dividend) => {
				const dividendDate = new Date(dividend.date);
				const dividendMonth = `${dividendDate.getFullYear()}-${(
					dividendDate.getMonth() + 1
				)
					.toString()
					.padStart(2, '0')}`;
				return dividendMonth === selectedMonth;
			})
			.reduce((total, dividend) => total + dividend.amount, 0);
	};

	// Get daily dividends for the selected month
	const getDailyDividendsForMonth = (): { date: string; amount: number }[] => {
		const dailyDividends: { [date: string]: number } = {};

		dividends.forEach((dividend) => {
			const dividendDate = new Date(dividend.date);
			const dividendMonth = `${dividendDate.getFullYear()}-${(
				dividendDate.getMonth() + 1
			)
				.toString()
				.padStart(2, '0')}`;

			if (dividendMonth === selectedMonth) {
				const dateKey = dividend.date;
				if (!dailyDividends[dateKey]) {
					dailyDividends[dateKey] = 0;
				}
				dailyDividends[dateKey] += dividend.amount;
			}
		});

		// Convert to array and sort by date
		return Object.keys(dailyDividends)
			.map((date) => ({
				date,
				amount: dailyDividends[date],
			}))
			.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
	};

	const formatDate = (dateString: string): string => {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-IN', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
		});
	};

	const formatDateForDisplay = (dateString: string): string => {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-IN', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
		});
	};

	const formatMonth = (monthString: string): string => {
		const [year, month] = monthString.split('-');
		const date = new Date(parseInt(year), parseInt(month) - 1, 1);
		return date.toLocaleDateString('en-IN', {
			month: 'long',
			year: 'numeric',
		});
	};

	const handleDateChange = (event: any, date?: Date): void => {
		setShowDatePicker(false);
		if (date) {
			setSelectedDate(date);
			const formattedDate = date.toISOString().split('T')[0];
			setFormData({ ...formData, date: formattedDate });
		}
	};

	// Group dividends by date for section list
	const getGroupedDividends = () => {
		const grouped: { [key: string]: Dividend[] } = {};

		filteredDividends.forEach((dividend) => {
			const dateKey = dividend.date;
			if (!grouped[dateKey]) {
				grouped[dateKey] = [];
			}
			grouped[dateKey].push(dividend);
		});

		return Object.keys(grouped).map((date) => ({
			title: formatDate(date),
			data: grouped[date],
		}));
	};

	if (loading) {
		return (
			<View style={[styles.container, styles.center]}>
				<ActivityIndicator size='large' color={colors.primary} />
				<Text style={{ marginTop: 16, color: colors.gray }}>
					Loading dividends...
				</Text>
			</View>
		);
	}

	// Show category tiles view
	if (showCategoryTiles) {
		const categoryTotals = yearlyData?.categoryTotals || {};
		const sortedCategories = DIVIDEND_CATEGORIES.map((category) => ({
			...category,
			total: categoryTotals[category.key] || 0,
		}))
			.filter((cat) => cat.total > 0 || selectedCategory === 'all')
			.sort((a, b) => b.total - a.total);

		return (
			<View style={styles.container}>
				<View style={{ padding: 20, backgroundColor: colors.white }}>
					<View style={{ marginBottom: 16 }}>
						<TouchableOpacity
							onPress={() => setShowCategoryTiles(false)}
							style={{
								flexDirection: 'row',
								alignItems: 'center',
								alignSelf: 'flex-start',
							}}
						>
							<Text style={{ fontSize: 24, marginRight: 8 }}>↩</Text>
						</TouchableOpacity>
					</View>
					<View
						style={[
							styles.row,
							{
								justifyContent: 'space-between',
								alignItems: 'center',
								marginBottom: 16,
							},
						]}
					>
						<Text style={styles.header}>📊 Dividend Categories</Text>
					</View>

					{/* Yearly Total */}
					<View
						style={{
							backgroundColor: colors.lightGray,
							padding: 16,
							borderRadius: 12,
							marginBottom: 16,
						}}
					>
						<Text
							style={{ color: colors.gray, fontSize: 12, textAlign: 'center' }}
						>
							Financial Year {yearlyData?.year}
						</Text>
						<Text
							style={{
								color: colors.success,
								fontSize: 24,
								fontWeight: 'bold',
								textAlign: 'center',
							}}
						>
							{formatCurrency(yearlyData?.totalIncome || 0)}
						</Text>
						<Text
							style={{ color: colors.gray, fontSize: 12, textAlign: 'center' }}
						>
							Total Dividend Income
						</Text>
					</View>
				</View>

				{/* Category Tiles Grid */}
				<ScrollView contentContainerStyle={{ padding: 20 }}>
					<View
						style={{
							flexDirection: 'row',
							flexWrap: 'wrap',
							justifyContent: 'space-between',
						}}
					>
						{sortedCategories.map((category) => (
							<TouchableOpacity
								key={category.key}
								style={[
									styles.card,
									{
										width: '48%',
										marginBottom: 12,
										borderLeftWidth: 4,
										borderLeftColor: category.color,
									},
								]}
								onPress={() => {
									setSelectedCategory(category.key);
									setShowCategoryTiles(false);
								}}
							>
								<View style={{ alignItems: 'center' }}>
									<Text style={{ fontSize: 32, marginBottom: 8 }}>
										{category.emoji}
									</Text>
									<Text
										style={{
											color: colors.dark,
											fontWeight: '600',
											fontSize: 12,
											textAlign: 'center',
											marginBottom: 4,
										}}
									>
										{category.name}
									</Text>
									<Text
										style={{
											color: colors.success,
											fontWeight: '600',
											fontSize: 14,
										}}
									>
										{formatCurrency(category.total)}
									</Text>
									{category.total > 0 && (
										<Text
											style={{ color: colors.gray, fontSize: 10, marginTop: 2 }}
										>
											{(
												(category.total / (yearlyData?.totalIncome || 1)) *
												100
											).toFixed(1)}
											% of total
										</Text>
									)}
								</View>
							</TouchableOpacity>
						))}
					</View>
				</ScrollView>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			{/* Header */}
			<View style={{ padding: 20, backgroundColor: colors.white }}>
				<View
					style={[
						styles.row,
						{
							justifyContent: 'space-between',
							alignItems: 'center',
						},
					]}
				>
					<Text style={styles.header}>📥 Dividend Tracker</Text>
				</View>
				<View style={{ alignItems: 'flex-end', marginBottom: 16 }}>
					<TouchableOpacity onPress={() => setShowCategoryTiles(true)}>
						<Text style={{ color: colors.primary, fontSize: 14 }}>
							📊 Categories
						</Text>
					</TouchableOpacity>
				</View>

				{/* Search Bar */}
				<TextInput
					style={[styles.input, { marginBottom: 12 }]}
					placeholder='Search dividends...'
					value={searchQuery}
					onChangeText={setSearchQuery}
					placeholderTextColor={colors.gray}
				/>

				{/* Category Filters - Horizontal Scroll */}
				<View style={{ marginBottom: 12 }}>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={{
							paddingRight: 20,
							flexGrow: 1,
						}}
					>
						<TouchableOpacity
							style={[
								{
									paddingHorizontal: 16,
									paddingVertical: 8,
									borderRadius: 20,
									marginRight: 8,
									backgroundColor:
										selectedCategory === 'all'
											? colors.primary
											: colors.lightGray,
									justifyContent: 'center',
									alignItems: 'center',
									minHeight: 36,
								},
							]}
							onPress={() => setSelectedCategory('all')}
						>
							<Text
								style={{
									color:
										selectedCategory === 'all' ? colors.white : colors.dark,
									fontWeight: '600',
									fontSize: 14,
								}}
							>
								All
							</Text>
						</TouchableOpacity>

						{DIVIDEND_CATEGORIES.map((category) => (
							<TouchableOpacity
								key={category.key}
								style={[
									{
										paddingHorizontal: 12,
										paddingVertical: 8,
										borderRadius: 20,
										marginRight: 8,
										backgroundColor:
											selectedCategory === category.key
												? category.color
												: colors.lightGray,
										justifyContent: 'center',
										alignItems: 'center',
										minHeight: 36,
										borderWidth: 1,
										borderColor:
											selectedCategory === category.key
												? category.color
												: 'transparent',
									},
								]}
								onPress={() => setSelectedCategory(category.key)}
							>
								<View style={{ flexDirection: 'row', alignItems: 'center' }}>
									<Text style={{ fontSize: 14, marginRight: 4 }}>
										{category.emoji}
									</Text>
									<Text
										style={{
											color:
												selectedCategory === category.key
													? colors.white
													: colors.dark,
											fontWeight: '600',
											fontSize: 12,
										}}
									>
										{category.name.length > 10
											? category.name.substring(0, 10) + '...'
											: category.name}
									</Text>
								</View>
							</TouchableOpacity>
						))}
					</ScrollView>
				</View>
				<View
					style={[
						styles.row,
						{
							justifyContent: 'space-between',
							alignItems: 'center',
							marginBottom: 12,
						},
					]}
				>
					<TextInput
						style={[styles.input, { flex: 1, marginRight: 12 }]}
						placeholder='YYYY-MM'
						value={selectedMonth}
						onChangeText={setSelectedMonth}
						placeholderTextColor={colors.gray}
					/>
					<View style={{ alignItems: 'flex-end' }}>
						<Text style={{ color: colors.gray, fontSize: 12 }}>
							Month Total
						</Text>
						<Text
							style={{ color: colors.success, fontSize: 18, fontWeight: '600' }}
						>
							{formatCurrency(getMonthlyTotal())}
						</Text>
					</View>
				</View>

				{/* Yearly Financial Summary */}
				<View
					style={{
						backgroundColor: colors.lightGray,
						padding: 12,
						borderRadius: 8,
						marginBottom: 8,
					}}
				>
					<View style={[styles.row, { justifyContent: 'space-between' }]}>
						<Text style={{ color: colors.gray, fontSize: 12 }}>
							Financial Year {yearlyData?.year}
						</Text>
						<Text
							style={{ color: colors.success, fontSize: 16, fontWeight: '600' }}
						>
							{formatCurrency(yearlyData?.totalIncome || 0)}
						</Text>
					</View>
				</View>

				{/* Daily Dividends Summary for Selected Month */}
				{getDailyDividendsForMonth().length > 0 && (
					<View
						style={{
							backgroundColor: colors.infoLight,
							padding: 12,
							borderRadius: 8,
						}}
					>
						<Text
							style={{
								color: colors.info,
								fontSize: 12,
								fontWeight: '600',
								marginBottom: 4,
							}}
						>
							📅 Daily Dividends for {formatMonth(selectedMonth)}
						</Text>
						<ScrollView horizontal showsHorizontalScrollIndicator={false}>
							{getDailyDividendsForMonth().map((daily, index) => (
								<TouchableOpacity
									key={daily.date}
									onPress={() => {
										setSelectedDateForActions(daily.date);
										setShowDateActionsModal(true);
									}}
									style={{
										marginRight: 12,
										alignItems: 'center',
										padding: 8,
										backgroundColor: colors.white,
										borderRadius: 6,
										minWidth: 70,
									}}
								>
									<Text style={{ color: colors.dark, fontSize: 10 }}>
										{new Date(daily.date).getDate()}
									</Text>
									<Text
										style={{
											color: colors.success,
											fontSize: 12,
											fontWeight: '600',
										}}
									>
										{formatCurrency(daily.amount)}
									</Text>
								</TouchableOpacity>
							))}
						</ScrollView>
					</View>
				)}
			</View>
			{filteredDividends.length === 0 ? (
				<View style={[styles.center, { flex: 1, padding: 40 }]}>
					<Text style={{ fontSize: 48, marginBottom: 16 }}>📈</Text>
					<Text
						style={{ color: colors.gray, textAlign: 'center', marginBottom: 8 }}
					>
						No dividends found
					</Text>
					<Text
						style={{ color: colors.gray, textAlign: 'center', fontSize: 12 }}
					>
						{searchQuery ||
						selectedCategory !== 'all' ||
						selectedMonth !== getCurrentMonth()
							? 'Try changing your filters'
							: 'Add your first dividend to get started'}
					</Text>
				</View>
			) : (
				<SectionList
					sections={getGroupedDividends()}
					keyExtractor={(item) => item.id}
					style={{ flex: 1 }}
					contentContainerStyle={{ paddingBottom: 20 }}
					renderItem={({ item }) => {
						const categoryInfo = getCategoryInfo(item.category);
						return (
							<TouchableOpacity
								style={[
									styles.card,
									{
										marginHorizontal: 20,
										marginVertical: 4,
										borderLeftWidth: 4,
										borderLeftColor: categoryInfo.color,
									},
								]}
								onPress={() => handleEditDividend(item)}
								onLongPress={() => handleDeleteDividend(item.id)}
							>
								<View style={[styles.row, { justifyContent: 'space-between' }]}>
									<View style={{ flex: 1 }}>
										<Text
											style={{
												color: colors.dark,
												fontWeight: '600',
												marginBottom: 4,
												fontSize: 14,
											}}
										>
											{item.company}
										</Text>
										{item.stockSymbol && (
											<Text
												style={{
													color: colors.gray,
													fontSize: 11,
													marginBottom: 4,
												}}
											>
												Symbol: {item.stockSymbol}
											</Text>
										)}
										<View style={[styles.row, { alignItems: 'center' }]}>
											<Text style={{ fontSize: 14, marginRight: 6 }}>
												{categoryInfo.emoji}
											</Text>
											<Text style={{ color: colors.gray, fontSize: 11 }}>
												{categoryInfo.name}
											</Text>
										</View>
										{item.quantity && item.dividendPerShare && (
											<Text
												style={{
													color: colors.gray,
													fontSize: 11,
													marginTop: 2,
												}}
											>
												{item.quantity} shares × ₹{item.dividendPerShare}/share
											</Text>
										)}
										{item.notes && (
											<Text
												style={{
													color: colors.gray,
													fontSize: 11,
													marginTop: 4,
												}}
											>
												{item.notes}
											</Text>
										)}
									</View>
									<View style={{ alignItems: 'flex-end' }}>
										<Text
											style={{
												color: colors.success,
												fontWeight: '600',
												fontSize: 16,
											}}
										>
											{formatCurrency(item.amount)}
										</Text>
										<Text style={{ color: colors.gray, fontSize: 10 }}>
											{new Date(item.date).toLocaleDateString('en-IN', {
												day: '2-digit',
												month: 'short',
											})}
										</Text>
									</View>
								</View>
								<View
									style={[
										styles.row,
										{ marginTop: 8, justifyContent: 'flex-end' },
									]}
								>
									<TouchableOpacity
										style={{ marginRight: 12 }}
										onPress={() => handleEditDividend(item)}
									>
										<Text style={{ color: colors.primary, fontSize: 12 }}>
											✏️ Edit
										</Text>
									</TouchableOpacity>
									<TouchableOpacity
										onPress={() => handleDeleteDividend(item.id)}
									>
										<Text style={{ color: colors.danger, fontSize: 12 }}>
											🗑️ Delete
										</Text>
									</TouchableOpacity>
								</View>
							</TouchableOpacity>
						);
					}}
					renderSectionHeader={({ section: { title, data } }) => (
						<TouchableOpacity
							style={{
								backgroundColor: colors.lightGray,
								paddingHorizontal: 20,
								paddingVertical: 8,
								flexDirection: 'row',
								justifyContent: 'space-between',
								alignItems: 'center',
							}}
							onPress={() => {
								// Find the date from the section data
								const dateMatch = data[0]?.date;
								if (dateMatch) {
									setSelectedDateForActions(dateMatch);
									setShowDateActionsModal(true);
								}
							}}
						>
							<Text style={{ color: colors.dark, fontWeight: '600' }}>
								{title}
							</Text>
							<Text style={{ color: colors.primary, fontSize: 12 }}>
								📅 Date Actions
							</Text>
						</TouchableOpacity>
					)}
				/>
			)}

			{/* Add Dividend Button */}
			<TouchableOpacity
				style={{
					position: 'absolute',
					bottom: 20,
					right: 20,
					backgroundColor: colors.primary,
					width: 60,
					height: 60,
					borderRadius: 30,
					justifyContent: 'center',
					alignItems: 'center',
					shadowColor: colors.dark,
					shadowOffset: { width: 0, height: 4 },
					shadowOpacity: 0.3,
					shadowRadius: 4,
					elevation: 6,
				}}
				onPress={() => {
					setIsEditing(false);
					resetForm();
					setShowAddModal(true);
				}}
			>
				<Text style={{ color: colors.white, fontSize: 24, fontWeight: 'bold' }}>
					+
				</Text>
			</TouchableOpacity>

			{/* Add/Edit Dividend Modal */}
			<Modal
				visible={showAddModal}
				animationType='slide'
				transparent={true}
				onRequestClose={() => {
					setShowAddModal(false);
					resetForm();
				}}
			>
				<View
					style={{
						flex: 1,
						backgroundColor: 'rgba(0,0,0,0.5)',
						justifyContent: 'flex-end',
					}}
				>
					<ScrollView style={{ maxHeight: '90%' }}>
						<View
							style={{
								backgroundColor: colors.white,
								borderTopLeftRadius: 20,
								borderTopRightRadius: 20,
								padding: 20,
							}}
						>
							<Text style={[styles.header, { marginBottom: 20 }]}>
								{isEditing ? 'Edit Dividend' : 'Add New Dividend'}
							</Text>

							<TextInput
								style={styles.input}
								placeholder='Amount (₹)'
								value={formData.amount}
								onChangeText={(text) =>
									setFormData({ ...formData, amount: text })
								}
								placeholderTextColor={colors.gray}
								keyboardType='numeric'
							/>

							<TextInput
								style={styles.input}
								placeholder='Company Name'
								value={formData.company}
								onChangeText={(text) =>
									setFormData({ ...formData, company: text })
								}
								placeholderTextColor={colors.gray}
							/>

							<TextInput
								style={styles.input}
								placeholder='Stock Symbol (Optional)'
								value={formData.stockSymbol}
								onChangeText={(text) =>
									setFormData({ ...formData, stockSymbol: text })
								}
								placeholderTextColor={colors.gray}
							/>
							<TextInput
								style={styles.input}
								placeholder='Quantity (Optional)'
								value={formData.quantity}
								onChangeText={(text) =>
									setFormData({ ...formData, quantity: text })
								}
								placeholderTextColor={colors.gray}
								keyboardType='numeric'
							/>
							<TextInput
								style={styles.input}
								placeholder='Dividend/Share (₹)'
								value={formData.dividendPerShare}
								onChangeText={(text) =>
									setFormData({ ...formData, dividendPerShare: text })
								}
								placeholderTextColor={colors.gray}
								keyboardType='numeric'
							/>

							<TouchableOpacity
								style={[styles.input, { justifyContent: 'center' }]}
								onPress={() => setShowCategoryModal(true)}
							>
								<Text
									style={{
										color: formData.category ? colors.dark : colors.gray,
									}}
								>
									{formData.category
										? getCategoryInfo(formData.category).name
										: 'Select Category'}
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[styles.input, { justifyContent: 'center' }]}
								onPress={() => setShowDatePicker(true)}
							>
								<Text style={{ color: colors.dark }}>
									📅 Date: {formatDateForDisplay(formData.date)}
								</Text>
							</TouchableOpacity>
							<TextInput
								style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
								placeholder='Notes (Optional)'
								value={formData.notes}
								onChangeText={(text) =>
									setFormData({ ...formData, notes: text })
								}
								placeholderTextColor={colors.gray}
								multiline
								numberOfLines={3}
							/>
							{showDatePicker && (
								<DateTimePicker
									value={selectedDate}
									mode='date'
									display='default'
									onChange={handleDateChange}
									maximumDate={new Date()}
								/>
							)}
							<View style={[styles.row, { marginTop: 20, marginBottom: 20 }]}>
								<TouchableOpacity
									style={[
										styles.button,
										styles.buttonSecondary,
										{ flex: 1, marginRight: 8 },
									]}
									onPress={() => {
										setShowAddModal(false);
										resetForm();
									}}
								>
									<Text style={styles.buttonText}>Cancel</Text>
								</TouchableOpacity>
								<TouchableOpacity
									style={[
										styles.button,
										styles.buttonPrimary,
										{ flex: 1, marginLeft: 8 },
									]}
									onPress={handleAddDividend}
								>
									<Text style={styles.buttonText}>
										{isEditing ? 'Update Dividend' : 'Add Dividend'}
									</Text>
								</TouchableOpacity>
							</View>
						</View>
					</ScrollView>
				</View>
			</Modal>
			<Modal
				visible={showDateActionsModal}
				animationType='slide'
				transparent={true}
				onRequestClose={() => setShowDateActionsModal(false)}
			>
				<View
					style={{
						flex: 1,
						backgroundColor: 'rgba(0,0,0,0.5)',
						justifyContent: 'flex-end',
					}}
				>
					<View
						style={{
							backgroundColor: colors.white,
							borderTopLeftRadius: 20,
							borderTopRightRadius: 20,
							padding: 20,
						}}
					>
						<Text style={[styles.header, { marginBottom: 20 }]}>
							📅 Actions for {formatDate(selectedDateForActions)}
						</Text>

						<View style={{ marginBottom: 20 }}>
							<Text
								style={{ color: colors.gray, fontSize: 14, marginBottom: 8 }}
							>
								Dividends on this date:
							</Text>
							{filteredDividends
								.filter((e) => e.date === selectedDateForActions)
								.map((dividend) => {
									const categoryInfo = getCategoryInfo(dividend.category);
									return (
										<View
											key={dividend.id}
											style={[
												styles.row,
												{
													justifyContent: 'space-between',
													alignItems: 'center',
													paddingVertical: 8,
													borderBottomWidth: 1,
													borderBottomColor: colors.lightGray,
												},
											]}
										>
											<View style={{ flex: 1 }}>
												<Text style={{ color: colors.dark, fontWeight: '600' }}>
													{dividend.company}
												</Text>
												<Text style={{ color: colors.gray, fontSize: 12 }}>
													{categoryInfo.name}
												</Text>
											</View>
											<View style={{ alignItems: 'flex-end' }}>
												<Text
													style={{ color: colors.success, fontWeight: '600' }}
												>
													{formatCurrency(dividend.amount)}
												</Text>
												<View style={[styles.row, { marginTop: 4 }]}>
													<TouchableOpacity
														style={{ marginRight: 12 }}
														onPress={() => {
															setShowDateActionsModal(false);
															handleEditDividend(dividend);
														}}
													>
														<Text
															style={{ color: colors.primary, fontSize: 12 }}
														>
															Edit
														</Text>
													</TouchableOpacity>
													<TouchableOpacity
														onPress={() => {
															setShowDateActionsModal(false);
															handleDeleteDividend(dividend.id);
														}}
													>
														<Text
															style={{ color: colors.danger, fontSize: 12 }}
														>
															Delete
														</Text>
													</TouchableOpacity>
												</View>
											</View>
										</View>
									);
								})}
						</View>
						<View style={{ marginBottom: 20 }}>
							<TouchableOpacity
								style={[
									styles.button,
									styles.buttonPrimary,
									{ marginBottom: 8 },
								]}
								onPress={() => handleAddForDate(selectedDateForActions)}
							>
								<Text style={styles.buttonText}>
									➕ Add New Dividend for this Date
								</Text>
							</TouchableOpacity>

							{filteredDividends.filter(
								(e) => e.date === selectedDateForActions
							).length > 0 && (
								<TouchableOpacity
									style={[styles.button, styles.buttonDanger]}
									onPress={() =>
										handleBulkDeleteForDate(selectedDateForActions)
									}
								>
									<Text style={styles.buttonText}>
										🗑️ Delete All Dividends for this Date
									</Text>
								</TouchableOpacity>
							)}
						</View>
						<TouchableOpacity
							style={[styles.button, styles.buttonSecondary]}
							onPress={() => setShowDateActionsModal(false)}
						>
							<Text style={styles.buttonText}>Close</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>
			<Modal
				visible={showCategoryModal}
				animationType='slide'
				transparent={true}
				onRequestClose={() => setShowCategoryModal(false)}
			>
				<View
					style={{
						flex: 1,
						backgroundColor: 'rgba(0,0,0,0.5)',
						justifyContent: 'flex-end',
					}}
				>
					<View
						style={{
							backgroundColor: colors.white,
							borderTopLeftRadius: 20,
							borderTopRightRadius: 20,
							padding: 20,
							maxHeight: '80%',
						}}
					>
						<Text style={[styles.header, { marginBottom: 20 }]}>
							Select Category
						</Text>

						<FlatList
							data={DIVIDEND_CATEGORIES}
							keyExtractor={(item) => item.key}
							renderItem={({ item }) => (
								<TouchableOpacity
									style={[
										styles.row,
										{
											padding: 12,
											borderBottomWidth: 1,
											borderBottomColor: colors.lightGray,
											alignItems: 'center',
										},
									]}
									onPress={() => {
										setFormData({ ...formData, category: item.key });
										setShowCategoryModal(false);
									}}
								>
									<Text style={{ fontSize: 20, marginRight: 12, width: 24 }}>
										{item.emoji}
									</Text>
									<Text style={{ color: colors.dark, fontSize: 14, flex: 1 }}>
										{item.name}
									</Text>
								</TouchableOpacity>
							)}
						/>
					</View>
				</View>
			</Modal>
		</View>
	);
};
