import { SAVINGS_CATEGORIES } from '@/constants';
import { useAuth } from '@/hooks';
import { colors, styles } from '@/styles';
import { Saving, SavingFormData, YearlyFinancialData } from '@/types';
import { getCurrentMonth } from '@/utils';
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

export const SavingsScreen = () => {
	const { user } = useAuth();
	const [savings, setSavings] = useState<Saving[]>([]);
	const [filteredSavings, setFilteredSavings] = useState<Saving[]>([]);
	const [loading, setLoading] = useState(true);
	const [showAddModal, setShowAddModal] = useState(false);
	const [showCategoryModal, setShowCategoryModal] = useState(false);
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [showMaturityDatePicker, setShowMaturityDatePicker] = useState(false);
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

	// Form state
	const [formData, setFormData] = useState<SavingFormData>({
		amount: '',
		description: '',
		category: '',
		date: new Date().toISOString().split('T')[0],
		notes: '',
		expectedReturn: '',
		maturityDate: '',
	});

	// Date states for the pickers
	const [selectedDate, setSelectedDate] = useState(new Date());
	const [selectedMaturityDate, setSelectedMaturityDate] = useState(new Date());

	// Load savings on component mount
	useEffect(() => {
		loadSavings();
	}, [user]);

	// Filter savings when search, category, or month changes
	useEffect(() => {
		filterSavings();
		calculateYearlyData();
	}, [savings, searchQuery, selectedCategory, selectedMonth]);

	const getSavingsFilePath = (): string => {
		if (!user) return '';
		return `${FileSystem.documentDirectory}savings_${user.id}.json`;
	};

	const getYearlyDataFilePath = (): string => {
		if (!user) return '';
		return `${FileSystem.documentDirectory}yearly_financial_${user.id}.json`;
	};

	// Get current financial year (April to March)
	const getCurrentFinancialYear = (): string => {
		const now = new Date();
		const year = now.getFullYear();
		const month = now.getMonth() + 1; // 1-12

		// If month is April (4) or later, financial year is current year - next year
		// If month is Jan-Mar, financial year is previous year - current year
		if (month >= 4) {
			return `${year}-${year + 1}`;
		} else {
			return `${year - 1}-${year}`;
		}
	};

	// Get financial year from a date
	const getFinancialYearFromDate = (dateString: string): string => {
		const date = new Date(dateString);
		const year = date.getFullYear();
		const month = date.getMonth() + 1; // 1-12

		if (month >= 4) {
			return `${year}-${year + 1}`;
		} else {
			return `${year - 1}-${year}`;
		}
	};

	const loadSavings = async (): Promise<void> => {
		if (!user) return;

		try {
			const filePath = getSavingsFilePath();
			const fileInfo = await FileSystem.getInfoAsync(filePath);

			if (fileInfo.exists) {
				const fileContent = await FileSystem.readAsStringAsync(filePath);
				const data = JSON.parse(fileContent);
				setSavings(data.savings || []);
			} else {
				// Initialize empty savings file
				const initialData = { savings: [] };
				await FileSystem.writeAsStringAsync(
					filePath,
					JSON.stringify(initialData, null, 2)
				);
				setSavings([]);
			}

			// Load yearly financial data
			await loadYearlyData();
		} catch (error) {
			console.error('Error loading savings:', error);
			Alert.alert('Error', 'Failed to load savings');
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
				// Initialize yearly data for current financial year
				const currentFY = getCurrentFinancialYear();
				const initialYearlyData: YearlyFinancialData = {
					year: currentFY,
					totalValue: 0,
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

	const saveSavings = async (updatedSavings: Saving[]): Promise<void> => {
		if (!user) return;

		try {
			const filePath = getSavingsFilePath();
			const data = { savings: updatedSavings };
			await FileSystem.writeAsStringAsync(
				filePath,
				JSON.stringify(data, null, 2)
			);
			setSavings(updatedSavings);
		} catch (error) {
			console.error('Error saving savings:', error);
			throw new Error('Failed to save savings');
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
		if (!savings.length) return;

		const currentFY = getCurrentFinancialYear();

		// Filter savings for current financial year
		const fySavings = savings.filter((saving) => {
			const savingFY = getFinancialYearFromDate(saving.date);
			return savingFY === currentFY;
		});

		// Calculate totals
		const totalValue = fySavings.reduce(
			(total, saving) => total + saving.amount,
			0
		);

		const categoryTotals: { [category: string]: number } = {};
		const monthlyTotals: { [month: string]: number } = {};

		fySavings.forEach((saving) => {
			// Category totals
			if (!categoryTotals[saving.category]) {
				categoryTotals[saving.category] = 0;
			}
			categoryTotals[saving.category] += saving.amount;

			// Monthly totals
			const savingDate = new Date(saving.date);
			const monthKey = `${savingDate.getFullYear()}-${(
				savingDate.getMonth() + 1
			)
				.toString()
				.padStart(2, '0')}`;

			if (!monthlyTotals[monthKey]) {
				monthlyTotals[monthKey] = 0;
			}
			monthlyTotals[monthKey] += saving.amount;
		});

		const updatedYearlyData: YearlyFinancialData = {
			year: currentFY,
			totalValue,
			categoryTotals,
			monthlyTotals,
			createdAt: yearlyData?.createdAt || new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		saveYearlyData(updatedYearlyData);
	};

	const filterSavings = (): void => {
		let filtered = [...savings];

		// Filter by search query
		if (searchQuery) {
			filtered = filtered.filter(
				(saving) =>
					saving.description
						.toLowerCase()
						.includes(searchQuery.toLowerCase()) ||
					saving.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
					saving.notes?.toLowerCase().includes(searchQuery.toLowerCase())
			);
		}

		// Filter by category
		if (selectedCategory !== 'all') {
			filtered = filtered.filter(
				(saving) => saving.category === selectedCategory
			);
		}

		// Filter by month
		if (selectedMonth) {
			filtered = filtered.filter((saving) => {
				const savingDate = new Date(saving.date);
				const savingMonth = `${savingDate.getFullYear()}-${(
					savingDate.getMonth() + 1
				)
					.toString()
					.padStart(2, '0')}`;
				return savingMonth === selectedMonth;
			});
		}

		// Sort by date (newest first)
		filtered.sort(
			(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
		);

		setFilteredSavings(filtered);
	};

	const handleAddSaving = async (): Promise<void> => {
		if (
			!formData.amount ||
			!formData.description ||
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

		let expectedReturn: any = 0.0;
		if (formData.expectedReturn) {
			expectedReturn = parseFloat(formData.expectedReturn);
			if (isNaN(expectedReturn)) {
				Alert.alert('Error', 'Please enter a valid expected return percentage');
				return;
			}
		}

		if (isEditing && formData.id) {
			// Update existing saving
			const updatedSavings = savings.map((saving) =>
				saving.id === formData.id
					? {
							...saving,
							amount,
							description: formData.description,
							category: formData.category,
							date: formData.date,
							notes: formData.notes || undefined,
							expectedReturn,
							maturityDate: formData.maturityDate || undefined,
					  }
					: saving
			);

			try {
				await saveSavings(updatedSavings);
				setShowAddModal(false);
				resetForm();
				Alert.alert('Success', 'Saving updated successfully!');
			} catch (error) {
				Alert.alert('Error', 'Failed to update saving');
			}
		} else {
			// Add new saving
			const newSaving: Saving = {
				id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
				amount,
				description: formData.description,
				category: formData.category,
				date: formData.date,
				createdAt: new Date().toISOString(),
				notes: formData.notes || undefined,
				expectedReturn: expectedReturn,
				maturityDate: formData.maturityDate || undefined,
			};

			try {
				const updatedSavings = [newSaving, ...savings];
				await saveSavings(updatedSavings);
				setShowAddModal(false);
				resetForm();
				Alert.alert('Success', 'Saving added successfully!');
			} catch (error) {
				Alert.alert('Error', 'Failed to add saving');
			}
		}
	};

	const handleDeleteSaving = (savingId: string): void => {
		Alert.alert(
			'Delete Saving',
			'Are you sure you want to delete this saving?',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: async () => {
						try {
							const updatedSavings = savings.filter(
								(saving) => saving.id !== savingId
							);
							await saveSavings(updatedSavings);
							Alert.alert('Success', 'Saving deleted successfully!');
						} catch (error) {
							Alert.alert('Error', 'Failed to delete saving');
						}
					},
				},
			]
		);
	};

	const handleEditSaving = (saving: Saving): void => {
		setFormData({
			id: saving.id,
			amount: saving.amount.toString(),
			description: saving.description,
			category: saving.category,
			date: saving.date,
			notes: saving.notes || '',
			expectedReturn: saving.expectedReturn?.toString() || '',
			maturityDate: saving.maturityDate || '',
		});
		setSelectedDate(new Date(saving.date));
		if (saving.maturityDate) {
			setSelectedMaturityDate(new Date(saving.maturityDate));
		}
		setIsEditing(true);
		setShowAddModal(true);
	};

	const handleBulkDeleteForDate = (date: string): void => {
		Alert.alert(
			'Delete All Savings for Date',
			`Are you sure you want to delete all savings for ${formatDate(date)}?`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete All',
					style: 'destructive',
					onPress: async () => {
						try {
							const updatedSavings = savings.filter(
								(saving) => saving.date !== date
							);
							await saveSavings(updatedSavings);
							setShowDateActionsModal(false);
							Alert.alert(
								'Success',
								`All savings for ${formatDate(date)} deleted successfully!`
							);
						} catch (error) {
							Alert.alert('Error', 'Failed to delete savings');
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
			description: '',
			category: '',
			date: new Date().toISOString().split('T')[0],
			notes: '',
			expectedReturn: '',
			maturityDate: '',
		});
		setSelectedDate(new Date());
		setSelectedMaturityDate(new Date());
		setIsEditing(false);
	};

	const getCategoryInfo = (categoryKey: string) => {
		return (
			SAVINGS_CATEGORIES.find((cat) => cat.key === categoryKey) || {
				key: categoryKey,
				name: categoryKey,
				emoji: '💰',
				color: colors.gray,
			}
		);
	};

	const getTotalSavings = (): number => {
		return filteredSavings.reduce((total, saving) => total + saving.amount, 0);
	};

	const getCategoryTotal = (category: string): number => {
		return savings
			.filter((saving) => saving.category === category)
			.reduce((total, saving) => total + saving.amount, 0);
	};

	const getMonthlyTotal = (): number => {
		return savings
			.filter((saving) => {
				const savingDate = new Date(saving.date);
				const savingMonth = `${savingDate.getFullYear()}-${(
					savingDate.getMonth() + 1
				)
					.toString()
					.padStart(2, '0')}`;
				return savingMonth === selectedMonth;
			})
			.reduce((total, saving) => total + saving.amount, 0);
	};

	// Get daily savings for the selected month
	const getDailySavingsForMonth = (): { date: string; amount: number }[] => {
		const dailySavings: { [date: string]: number } = {};

		savings.forEach((saving) => {
			const savingDate = new Date(saving.date);
			const savingMonth = `${savingDate.getFullYear()}-${(
				savingDate.getMonth() + 1
			)
				.toString()
				.padStart(2, '0')}`;

			if (savingMonth === selectedMonth) {
				const dateKey = saving.date;
				if (!dailySavings[dateKey]) {
					dailySavings[dateKey] = 0;
				}
				dailySavings[dateKey] += saving.amount;
			}
		});

		// Convert to array and sort by date
		return Object.keys(dailySavings)
			.map((date) => ({
				date,
				amount: dailySavings[date],
			}))
			.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
	};

	const formatCurrency = (amount: number): string => {
		return `₹${amount.toLocaleString('en-IN')}`;
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

	const handleMaturityDateChange = (event: any, date?: Date): void => {
		setShowMaturityDatePicker(false);
		if (date) {
			setSelectedMaturityDate(date);
			const formattedDate = date.toISOString().split('T')[0];
			setFormData({ ...formData, maturityDate: formattedDate });
		}
	};

	// Group savings by date for section list
	const getGroupedSavings = () => {
		const grouped: { [key: string]: Saving[] } = {};

		filteredSavings.forEach((saving) => {
			const dateKey = saving.date;
			if (!grouped[dateKey]) {
				grouped[dateKey] = [];
			}
			grouped[dateKey].push(saving);
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
					Loading savings...
				</Text>
			</View>
		);
	}

	// Show category tiles view
	if (showCategoryTiles) {
		const categoryTotals = yearlyData?.categoryTotals || {};
		const sortedCategories = SAVINGS_CATEGORIES.map((category) => ({
			...category,
			total: categoryTotals[category.key] || 0,
		}))
			.filter((cat) => cat.total > 0 || selectedCategory === 'all')
			.sort((a, b) => b.total - a.total);

		return (
			<View style={styles.container}>
				{/* Header */}
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
						<Text style={styles.header}>📊 Category Summary</Text>
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
							{formatCurrency(yearlyData?.totalValue || 0)}
						</Text>
						<Text
							style={{ color: colors.gray, fontSize: 12, textAlign: 'center' }}
						>
							Total Investment Value
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
												(category.total / (yearlyData?.totalValue || 1)) *
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
			<View style={{ padding: 20, backgroundColor: colors.white }}>
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
					<Text style={styles.header}>💰 Savings Tracker</Text>
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
					placeholder='Search savings...'
					value={searchQuery}
					onChangeText={setSearchQuery}
					placeholderTextColor={colors.gray}
				/>

				{/* Category Filters */}
				<View style={[styles.row, { marginBottom: 12 }]}>
					<ScrollView horizontal showsHorizontalScrollIndicator={false}>
						<TouchableOpacity
							style={[
								styles.button,
								selectedCategory === 'all'
									? styles.buttonPrimary
									: styles.buttonSecondary,
								{ marginRight: 8, paddingHorizontal: 16 },
							]}
							onPress={() => setSelectedCategory('all')}
						>
							<Text style={styles.buttonText}>All</Text>
						</TouchableOpacity>
						{SAVINGS_CATEGORIES.slice(0, 6).map((category) => (
							<TouchableOpacity
								key={category.key}
								style={[
									styles.button,
									selectedCategory === category.key
										? styles.buttonPrimary
										: styles.buttonSecondary,
									{ marginRight: 8, paddingHorizontal: 12 },
								]}
								onPress={() => setSelectedCategory(category.key)}
							>
								<Text style={styles.buttonText}>
									{category.emoji}{' '}
									{category.name.length > 8
										? category.name.substring(0, 8) + '...'
										: category.name}
								</Text>
							</TouchableOpacity>
						))}
					</ScrollView>
				</View>

				{/* Month Selector and Daily Savings */}
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
							{formatCurrency(yearlyData?.totalValue || 0)}
						</Text>
					</View>
				</View>

				{/* Daily Savings Summary for Selected Month */}
				{getDailySavingsForMonth().length > 0 && (
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
							📅 Daily Savings for {formatMonth(selectedMonth)}
						</Text>
						<ScrollView horizontal showsHorizontalScrollIndicator={false}>
							{getDailySavingsForMonth().map((daily, index) => (
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

			{/* Savings List */}
			{filteredSavings.length === 0 ? (
				<View style={[styles.center, { flex: 1, padding: 40 }]}>
					<Text style={{ fontSize: 48, marginBottom: 16 }}>💰</Text>
					<Text
						style={{ color: colors.gray, textAlign: 'center', marginBottom: 8 }}
					>
						No savings found
					</Text>
					<Text
						style={{ color: colors.gray, textAlign: 'center', fontSize: 12 }}
					>
						{searchQuery ||
						selectedCategory !== 'all' ||
						selectedMonth !== getCurrentMonth()
							? 'Try changing your filters'
							: 'Add your first saving to get started'}
					</Text>
				</View>
			) : (
				<SectionList
					sections={getGroupedSavings()}
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
								onPress={() => handleEditSaving(item)}
								onLongPress={() => handleDeleteSaving(item.id)}
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
											{item.description}
										</Text>
										<View style={[styles.row, { alignItems: 'center' }]}>
											<Text style={{ fontSize: 14, marginRight: 6 }}>
												{categoryInfo.emoji}
											</Text>
											<Text style={{ color: colors.gray, fontSize: 11 }}>
												{categoryInfo.name}
											</Text>
										</View>
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
										{item.maturityDate && (
											<Text
												style={{
													color: colors.info,
													fontSize: 10,
													marginTop: 2,
												}}
											>
												📅 Maturity: {formatDate(item.maturityDate)}
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
										{item.expectedReturn && (
											<Text
												style={{
													color: colors.success,
													fontSize: 10,
													marginTop: 2,
												}}
											>
												📈 {item.expectedReturn}% expected
											</Text>
										)}
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
										onPress={() => handleEditSaving(item)}
									>
										<Text style={{ color: colors.primary, fontSize: 12 }}>
											✏️ Edit
										</Text>
									</TouchableOpacity>
									<TouchableOpacity onPress={() => handleDeleteSaving(item.id)}>
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

			{/* Add Saving Button */}
			<TouchableOpacity
				style={{
					position: 'absolute',
					bottom: 20,
					right: 20,
					backgroundColor: colors.success,
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

			{/* Add/Edit Saving Modal */}
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
								{isEditing ? 'Edit Saving' : 'Add New Saving'}
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
								placeholder='Description'
								value={formData.description}
								onChangeText={(text) =>
									setFormData({ ...formData, description: text })
								}
								placeholderTextColor={colors.gray}
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

							{/* Investment Date */}
							<TouchableOpacity
								style={[styles.input, { justifyContent: 'center' }]}
								onPress={() => setShowDatePicker(true)}
							>
								<Text style={{ color: colors.dark }}>
									📅 Date: {formatDateForDisplay(formData.date)}
								</Text>
							</TouchableOpacity>

							{/* Maturity Date (Optional) */}
							<TouchableOpacity
								style={[styles.input, { justifyContent: 'center' }]}
								onPress={() => setShowMaturityDatePicker(true)}
							>
								<Text
									style={{
										color: formData.maturityDate ? colors.dark : colors.gray,
									}}
								>
									📅{' '}
									{formData.maturityDate
										? `Maturity Date: ${formatDateForDisplay(
												formData.maturityDate
										  )}`
										: 'Select Maturity Date (Optional)'}
								</Text>
							</TouchableOpacity>

							<TextInput
								style={styles.input}
								placeholder='Expected Return % (Optional)'
								value={formData.expectedReturn}
								onChangeText={(text) =>
									setFormData({ ...formData, expectedReturn: text })
								}
								placeholderTextColor={colors.gray}
								keyboardType='numeric'
							/>

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

							{/* Date Pickers */}
							{showDatePicker && (
								<DateTimePicker
									value={selectedDate}
									mode='date'
									display='default'
									onChange={handleDateChange}
									maximumDate={new Date()}
								/>
							)}

							{showMaturityDatePicker && (
								<DateTimePicker
									value={selectedMaturityDate}
									mode='date'
									display='default'
									onChange={handleMaturityDateChange}
									minimumDate={new Date()}
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
										styles.buttonSuccess,
										{ flex: 1, marginLeft: 8 },
									]}
									onPress={handleAddSaving}
								>
									<Text style={styles.buttonText}>
										{isEditing ? 'Update Saving' : 'Add Saving'}
									</Text>
								</TouchableOpacity>
							</View>
						</View>
					</ScrollView>
				</View>
			</Modal>

			{/* Date Actions Modal */}
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

						{/* Savings for this date */}
						<View style={{ marginBottom: 20 }}>
							<Text
								style={{ color: colors.gray, fontSize: 14, marginBottom: 8 }}
							>
								Savings on this date:
							</Text>
							{filteredSavings
								.filter((s) => s.date === selectedDateForActions)
								.map((saving) => {
									const categoryInfo = getCategoryInfo(saving.category);
									return (
										<View
											key={saving.id}
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
													{saving.description}
												</Text>
												<Text style={{ color: colors.gray, fontSize: 12 }}>
													{categoryInfo.name}
												</Text>
											</View>
											<View style={{ alignItems: 'flex-end' }}>
												<Text
													style={{ color: colors.success, fontWeight: '600' }}
												>
													{formatCurrency(saving.amount)}
												</Text>
												<View style={[styles.row, { marginTop: 4 }]}>
													<TouchableOpacity
														style={{ marginRight: 12 }}
														onPress={() => {
															setShowDateActionsModal(false);
															handleEditSaving(saving);
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
															handleDeleteSaving(saving.id);
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

						{/* Action Buttons */}
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
									➕ Add New Saving for this Date
								</Text>
							</TouchableOpacity>

							{filteredSavings.filter((s) => s.date === selectedDateForActions)
								.length > 0 && (
								<TouchableOpacity
									style={[styles.button, styles.buttonDanger]}
									onPress={() =>
										handleBulkDeleteForDate(selectedDateForActions)
									}
								>
									<Text style={styles.buttonText}>
										🗑️ Delete All Savings for this Date
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

			{/* Category Selection Modal */}
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
							data={SAVINGS_CATEGORIES}
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
