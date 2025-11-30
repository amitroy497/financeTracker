import { useAuth } from '@/hooks';
import { colors, styles } from '@/styles';
import { getCurrentMonth } from '@/utils';
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

// Expense types
export interface Expense {
	id: string;
	amount: number;
	description: string;
	category: string;
	date: string;
	createdAt: string;
}

export interface ExpenseFormData {
	amount: string;
	description: string;
	category: string;
	date: string;
}

// Expense categories based on your list
export const EXPENSE_CATEGORIES = [
	{ key: 'transport', name: 'Transport', emoji: '🚗', color: '#FF6B6B' },
	{ key: 'in_laws', name: 'In Laws', emoji: '👨‍👩‍👧‍👦', color: '#4ECDC4' },
	{ key: 'gas', name: 'Gas', emoji: '🔥', color: '#45B7D1' },
	{
		key: 'snacks_desserts',
		name: 'Snacks & Desserts',
		emoji: '🍦',
		color: '#FFA07A',
	},
	{ key: 'medicine', name: 'Medicine', emoji: '💊', color: '#FFD700' },
	{
		key: 'ranchi_grocery',
		name: 'Ranchi Grocery',
		emoji: '🛒',
		color: '#98D8C8',
	},
	{
		key: 'kolkata_household',
		name: 'Kolkata Household',
		emoji: '🏠',
		color: '#A78BFA',
	},
	{
		key: 'rent_electricity',
		name: 'Rent & Electricity',
		emoji: '💡',
		color: '#F471B5',
	},
	{
		key: 'shivraj_maintenance',
		name: 'Shivraj Maintenance',
		emoji: '🔧',
		color: '#6EE7B7',
	},
	{
		key: 'entertainment',
		name: 'Entertainment',
		emoji: '🎬',
		color: '#F59E0B',
	},
	{ key: 'train', name: 'Train', emoji: '🚆', color: '#10B981' },
	{ key: 'petrol_bike', name: 'Petrol & Bike', emoji: '⛽', color: '#6366F1' },
	{
		key: 'wife_account',
		name: 'Wife Account & Cash',
		emoji: '👩',
		color: '#EC4899',
	},
	{
		key: 'wife_shopping',
		name: 'Wife Shopping & Parlour',
		emoji: '💄',
		color: '#8B5CF6',
	},
	{
		key: 'banking_charges',
		name: 'Banking & EMI Charges',
		emoji: '🏦',
		color: '#06B6D4',
	},
	{ key: 'wifi', name: 'Wifi', emoji: '📶', color: '#3B82F6' },
	{
		key: 'mobile_recharge',
		name: 'Mobile Recharge',
		emoji: '📱',
		color: '#EF4444',
	},
	{
		key: 'trading_charges',
		name: 'Trading Charges',
		emoji: '📈',
		color: '#84CC16',
	},
	{
		key: 'digital_gold',
		name: 'Digital Gold Charges',
		emoji: '💰',
		color: '#F59E0B',
	},
	{
		key: 'subscriptions',
		name: 'Subscriptions',
		emoji: '📺',
		color: '#8B5CF6',
	},
	{
		key: 'health_insurance',
		name: 'Health Insurance',
		emoji: '🏥',
		color: '#10B981',
	},
	{ key: 'street_food', name: 'Street Food', emoji: '🍢', color: '#F97316' },
	{ key: 'online_food', name: 'Online Food', emoji: '🍕', color: '#DC2626' },
	{ key: 'shopping', name: 'Online Shopping', emoji: '📦', color: '#7C3AED' },
	{ key: 'liquid', name: 'Liquid', emoji: '🥤', color: '#60A5FA' },
	{ key: 'donation', name: 'Donation', emoji: '🤲', color: '#059669' },
	{ key: 'neighbour', name: 'Neighbour', emoji: '🏡', color: '#6B7280' },
	{
		key: 'miscellaneous',
		name: 'Miscellaneous',
		emoji: '📝',
		color: '#9CA3AF',
	},
];

export const ExpensesScreen: React.FC = () => {
	const { user } = useAuth();
	const [expenses, setExpenses] = useState<Expense[]>([]);
	const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
	const [loading, setLoading] = useState(true);
	const [showAddModal, setShowAddModal] = useState(false);
	const [showCategoryModal, setShowCategoryModal] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedCategory, setSelectedCategory] = useState<string>('all');
	const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());

	// Form state
	const [formData, setFormData] = useState<ExpenseFormData>({
		amount: '',
		description: '',
		category: '',
		date: new Date().toISOString().split('T')[0], // Today's date
	});

	// Load expenses on component mount
	useEffect(() => {
		loadExpenses();
	}, [user]);

	// Filter expenses when search, category, or month changes
	useEffect(() => {
		filterExpenses();
	}, [expenses, searchQuery, selectedCategory, selectedMonth]);

	const getExpensesFilePath = (): string => {
		if (!user) return '';
		return `${FileSystem.documentDirectory}expenses_${user.id}.json`;
	};

	const loadExpenses = async (): Promise<void> => {
		if (!user) return;

		try {
			const filePath = getExpensesFilePath();
			const fileInfo = await FileSystem.getInfoAsync(filePath);

			if (fileInfo.exists) {
				const fileContent = await FileSystem.readAsStringAsync(filePath);
				const data = JSON.parse(fileContent);
				setExpenses(data.expenses || []);
			} else {
				// Initialize empty expenses file
				const initialData = { expenses: [] };
				await FileSystem.writeAsStringAsync(
					filePath,
					JSON.stringify(initialData, null, 2)
				);
				setExpenses([]);
			}
		} catch (error) {
			console.error('Error loading expenses:', error);
			Alert.alert('Error', 'Failed to load expenses');
		} finally {
			setLoading(false);
		}
	};

	const saveExpenses = async (updatedExpenses: Expense[]): Promise<void> => {
		if (!user) return;

		try {
			const filePath = getExpensesFilePath();
			const data = { expenses: updatedExpenses };
			await FileSystem.writeAsStringAsync(
				filePath,
				JSON.stringify(data, null, 2)
			);
			setExpenses(updatedExpenses);
		} catch (error) {
			console.error('Error saving expenses:', error);
			throw new Error('Failed to save expenses');
		}
	};

	const filterExpenses = (): void => {
		let filtered = [...expenses];

		// Filter by search query
		if (searchQuery) {
			filtered = filtered.filter(
				(expense) =>
					expense.description
						.toLowerCase()
						.includes(searchQuery.toLowerCase()) ||
					expense.category.toLowerCase().includes(searchQuery.toLowerCase())
			);
		}

		// Filter by category
		if (selectedCategory !== 'all') {
			filtered = filtered.filter(
				(expense) => expense.category === selectedCategory
			);
		}

		// Filter by month
		if (selectedMonth) {
			filtered = filtered.filter((expense) => {
				const expenseDate = new Date(expense.date);
				const expenseMonth = `${expenseDate.getFullYear()}-${(
					expenseDate.getMonth() + 1
				)
					.toString()
					.padStart(2, '0')}`;
				return expenseMonth === selectedMonth;
			});
		}

		// Sort by date (newest first)
		filtered.sort(
			(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
		);

		setFilteredExpenses(filtered);
	};

	const handleAddExpense = async (): Promise<void> => {
		if (
			!formData.amount ||
			!formData.description ||
			!formData.category ||
			!formData.date
		) {
			Alert.alert('Error', 'Please fill in all fields');
			return;
		}

		const amount = parseFloat(formData.amount);
		if (isNaN(amount) || amount <= 0) {
			Alert.alert('Error', 'Please enter a valid amount');
			return;
		}

		const newExpense: Expense = {
			id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
			amount,
			description: formData.description,
			category: formData.category,
			date: formData.date,
			createdAt: new Date().toISOString(),
		};

		try {
			const updatedExpenses = [newExpense, ...expenses];
			await saveExpenses(updatedExpenses);
			setShowAddModal(false);
			resetForm();
			Alert.alert('Success', 'Expense added successfully!');
		} catch (error) {
			Alert.alert('Error', 'Failed to add expense');
		}
	};

	const handleDeleteExpense = (expenseId: string): void => {
		Alert.alert(
			'Delete Expense',
			'Are you sure you want to delete this expense?',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: async () => {
						try {
							const updatedExpenses = expenses.filter(
								(expense) => expense.id !== expenseId
							);
							await saveExpenses(updatedExpenses);
						} catch (error) {
							Alert.alert('Error', 'Failed to delete expense');
						}
					},
				},
			]
		);
	};

	const resetForm = (): void => {
		setFormData({
			amount: '',
			description: '',
			category: '',
			date: new Date().toISOString().split('T')[0],
		});
	};

	const getCategoryInfo = (categoryKey: string) => {
		return (
			EXPENSE_CATEGORIES.find((cat) => cat.key === categoryKey) || {
				key: categoryKey,
				name: categoryKey,
				emoji: '📝',
				color: colors.gray,
			}
		);
	};

	const getTotalExpenses = (): number => {
		return filteredExpenses.reduce(
			(total, expense) => total + expense.amount,
			0
		);
	};

	const getCategoryTotal = (category: string): number => {
		return expenses
			.filter((expense) => expense.category === category)
			.reduce((total, expense) => total + expense.amount, 0);
	};

	const getMonthlyTotal = (): number => {
		return expenses
			.filter((expense) => {
				const expenseDate = new Date(expense.date);
				const expenseMonth = `${expenseDate.getFullYear()}-${(
					expenseDate.getMonth() + 1
				)
					.toString()
					.padStart(2, '0')}`;
				return expenseMonth === selectedMonth;
			})
			.reduce((total, expense) => total + expense.amount, 0);
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

	// Group expenses by date for section list
	const getGroupedExpenses = () => {
		const grouped: { [key: string]: Expense[] } = {};

		filteredExpenses.forEach((expense) => {
			const dateKey = expense.date;
			if (!grouped[dateKey]) {
				grouped[dateKey] = [];
			}
			grouped[dateKey].push(expense);
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
					Loading expenses...
				</Text>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			{/* Header */}
			<View style={{ padding: 20, backgroundColor: colors.white }}>
				<Text style={styles.header}>💰 Expense Tracker</Text>

				{/* Search Bar */}
				<TextInput
					style={[styles.input, { marginBottom: 12 }]}
					placeholder='Search expenses...'
					value={searchQuery}
					onChangeText={setSearchQuery}
					placeholderTextColor={colors.gray}
				/>

				{/* Filters */}
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
						{EXPENSE_CATEGORIES.slice(0, 6).map((category) => (
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
									{category.emoji} {category.name}
								</Text>
							</TouchableOpacity>
						))}
					</ScrollView>
				</View>

				{/* Month Selector and Stats */}
				<View
					style={[
						styles.row,
						{ justifyContent: 'space-between', alignItems: 'center' },
					]}
				>
					<TextInput
						style={[styles.input, { flex: 1, marginRight: 12 }]}
						placeholder='MMMM'
						value={selectedMonth}
						onChangeText={setSelectedMonth}
						placeholderTextColor={colors.gray}
					/>
					<View style={{ alignItems: 'flex-end' }}>
						<Text style={{ color: colors.gray, fontSize: 12 }}>
							Monthly Total
						</Text>
						<Text
							style={{ color: colors.danger, fontSize: 18, fontWeight: '600' }}
						>
							{formatCurrency(getMonthlyTotal())}
						</Text>
					</View>
				</View>
			</View>

			{/* Expenses List */}
			{filteredExpenses.length === 0 ? (
				<View style={[styles.center, { flex: 1, padding: 40 }]}>
					<Text style={{ fontSize: 48, marginBottom: 16 }}>💸</Text>
					<Text
						style={{ color: colors.gray, textAlign: 'center', marginBottom: 8 }}
					>
						No expenses found
					</Text>
					<Text
						style={{ color: colors.gray, textAlign: 'center', fontSize: 12 }}
					>
						{searchQuery ||
						selectedCategory !== 'all' ||
						selectedMonth !== getCurrentMonth()
							? 'Try changing your filters'
							: 'Add your first expense to get started'}
					</Text>
				</View>
			) : (
				<SectionList
					sections={getGroupedExpenses()}
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
								onLongPress={() => handleDeleteExpense(item.id)}
							>
								<View style={[styles.row, { justifyContent: 'space-between' }]}>
									<View style={{ flex: 1 }}>
										<Text
											style={{
												color: colors.dark,
												fontWeight: '600',
												marginBottom: 4,
											}}
										>
											{item.description}
										</Text>
										<View style={[styles.row, { alignItems: 'center' }]}>
											<Text style={{ fontSize: 16, marginRight: 6 }}>
												{categoryInfo.emoji}
											</Text>
											<Text style={{ color: colors.gray, fontSize: 12 }}>
												{categoryInfo.name}
											</Text>
										</View>
									</View>
									<View style={{ alignItems: 'flex-end' }}>
										<Text
											style={{
												color: colors.danger,
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
							</TouchableOpacity>
						);
					}}
					renderSectionHeader={({ section: { title } }) => (
						<View
							style={{
								backgroundColor: colors.lightGray,
								paddingHorizontal: 20,
								paddingVertical: 8,
							}}
						>
							<Text style={{ color: colors.dark, fontWeight: '600' }}>
								{title}
							</Text>
						</View>
					)}
				/>
			)}

			{/* Add Expense Button */}
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
				onPress={() => setShowAddModal(true)}
			>
				<Text style={{ color: colors.white, fontSize: 24, fontWeight: 'bold' }}>
					+
				</Text>
			</TouchableOpacity>

			{/* Add Expense Modal */}
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
					<View
						style={{
							backgroundColor: colors.white,
							borderTopLeftRadius: 20,
							borderTopRightRadius: 20,
							padding: 20,
						}}
					>
						<Text style={[styles.header, { marginBottom: 20 }]}>
							Add New Expense
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
								style={{ color: formData.category ? colors.dark : colors.gray }}
							>
								{formData.category
									? getCategoryInfo(formData.category).name
									: 'Select Category'}
							</Text>
						</TouchableOpacity>

						<TextInput
							style={styles.input}
							value={formData.date}
							onChangeText={(text) => setFormData({ ...formData, date: text })}
							placeholderTextColor={colors.gray}
						/>

						<View style={[styles.row, { marginTop: 20 }]}>
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
								onPress={handleAddExpense}
							>
								<Text style={styles.buttonText}>Add Expense</Text>
							</TouchableOpacity>
						</View>
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
							data={EXPENSE_CATEGORIES}
							keyExtractor={(item) => item.key}
							renderItem={({ item }) => (
								<TouchableOpacity
									style={[
										styles.row,
										{
											padding: 16,
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
									<Text style={{ fontSize: 20, marginRight: 12 }}>
										{item.emoji}
									</Text>
									<Text style={{ color: colors.dark, fontSize: 16 }}>
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
