import { PPFBanner } from '@/icons';
import { assetService } from '@/services/assetService';
import { createStyles } from '@/styles';
import { useTheme } from '@/theme';
import { CreatePPFData, PPFAccountsProps } from '@/types';
import {
	formatCurrency,
	getCurrentFinancialYear,
	parseDateString,
} from '@/utils';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import {
	Alert,
	Modal,
	Platform,
	ScrollView,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import { AddDetailsButton, Banner, CardsView } from '../UI';

export const PPFAccounts = ({
	accounts,
	onRefresh,
	userId,
}: PPFAccountsProps) => {
	const { colors } = useTheme();
	const styles = createStyles(colors);
	const [showAddModal, setShowAddModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
	const [newAccount, setNewAccount] = useState<CreatePPFData>({
		accountNumber: '',
		financialYear: '',
		totalDeposits: 0,
		interestRate: 7.1,
		maturityDate: '',
		startDate: '',
		annualContributions: {},
	});
	const [interestRateInput, setInterestRateInput] = useState<string>('7.1');
	const [startDateInput, setStartDateInput] = useState<string>('');
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [selectedDate, setSelectedDate] = useState<Date>(new Date());
	const [financialYears, setFinancialYears] = useState<
		Array<{
			year: string;
			amount: string;
			interest: string;
			isFirstYear: boolean;
		}>
	>([
		{
			year: getCurrentFinancialYear(),
			amount: '',
			interest: '',
			isFirstYear: true,
		},
	]);

	const calculateMaturityDate = (startDate: string): string => {
		if (!startDate) return '';
		const start = new Date(startDate);
		const maturity = new Date(start);
		maturity.setFullYear(maturity.getFullYear() + 15);
		return maturity.toISOString().split('T')[0];
	};

	const formatDate = (date: Date): string => {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	};

	const getFinancialYearFromDate = (date: Date): string => {
		const year = date.getFullYear();
		const month = date.getMonth() + 1;

		if (month >= 4) {
			return `${year}-${(year + 1).toString().slice(-2)}`;
		} else {
			return `${year - 1}-${year.toString().slice(-2)}`;
		}
	};

	const getSuggestedFinancialYears = (startDate: string): string[] => {
		if (!startDate) return [getCurrentFinancialYear()];

		const start = new Date(startDate);
		const startFinancialYear = getFinancialYearFromDate(start);

		const suggestedYears: string[] = [];
		const currentDate = new Date();
		const currentYear = currentDate.getFullYear();
		const currentMonth = currentDate.getMonth() + 1;

		let maxFYEndYear = currentMonth >= 4 ? currentYear + 1 : currentYear;
		const startYear = parseInt(startFinancialYear.split('-')[0]);

		for (let year = startYear; year <= maxFYEndYear; year++) {
			const fy = `${year}-${(year + 1).toString().slice(-2)}`;
			suggestedYears.push(fy);
		}

		return suggestedYears;
	};

	const calculateYearsToMaturity = (maturityDate: string): number => {
		const today = new Date();
		const maturity = new Date(maturityDate);
		const diffTime = maturity.getTime() - today.getTime();
		return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 365.25)));
	};

	const calculateTotalInterest = (account: any): number => {
		if (!account.currentBalance || !account.totalDeposits) return 0;
		return parseFloat(
			(account.currentBalance - account.totalDeposits).toFixed(2)
		);
	};

	const handleDecimalInput = (
		text: string,
		type: 'interestRate' | 'amount' | 'interest'
	) => {
		let cleanedText = text.replace(/[^0-9.]/g, '');
		const decimalCount = (cleanedText.match(/\./g) || []).length;
		if (decimalCount > 1) {
			const firstDecimalIndex = cleanedText.indexOf('.');
			const beforeDecimal = cleanedText.substring(0, firstDecimalIndex + 1);
			const afterDecimal = cleanedText
				.substring(firstDecimalIndex + 1)
				.replace(/\./g, '');
			cleanedText = beforeDecimal + afterDecimal;
		}

		const decimalIndex = cleanedText.indexOf('.');
		if (decimalIndex !== -1) {
			const decimalPart = cleanedText.substring(decimalIndex + 1);
			if (decimalPart.length > 2) {
				cleanedText = cleanedText.substring(0, decimalIndex + 3);
			}
		}

		let parsedValue: number;
		if (cleanedText === '' || cleanedText === '.') {
			parsedValue = 0;
		} else {
			parsedValue = parseFloat(cleanedText);
			if (isNaN(parsedValue)) parsedValue = 0;
		}

		return { cleanedText, parsedValue };
	};

	const handleFYAmountChange = (index: number, amount: string) => {
		const { cleanedText } = handleDecimalInput(amount, 'amount');
		const updatedYears = [...financialYears];
		updatedYears[index] = { ...updatedYears[index], amount: cleanedText };
		setFinancialYears(updatedYears);
	};

	const handleFYInterestChange = (index: number, interest: string) => {
		const { cleanedText } = handleDecimalInput(interest, 'interest');
		const updatedYears = [...financialYears];
		updatedYears[index] = { ...updatedYears[index], interest: cleanedText };
		setFinancialYears(updatedYears);
	};

	const handleInterestRateInput = (text: string) => {
		const { cleanedText, parsedValue } = handleDecimalInput(
			text,
			'interestRate'
		);
		setInterestRateInput(cleanedText);
		setNewAccount({
			...newAccount,
			interestRate: cleanedText === '' ? 7.1 : parsedValue,
		});
	};

	const handleDateChange = (event: any, selectedDate?: Date) => {
		if (Platform.OS === 'android') {
			setShowDatePicker(false);
		}

		if (selectedDate) {
			setSelectedDate(selectedDate);
			const formattedDate = formatDate(selectedDate);
			setStartDateInput(formattedDate);
			const updatedAccount = {
				...newAccount,
				startDate: formattedDate,
			};

			const maturityDate = calculateMaturityDate(formattedDate);
			updatedAccount.maturityDate = maturityDate;
			const startFinancialYear = getFinancialYearFromDate(selectedDate);
			const updatedYears = [...financialYears];
			updatedYears[0] = {
				...updatedYears[0],
				year: startFinancialYear,
				isFirstYear: true,
			};

			const suggestedYears = getSuggestedFinancialYears(formattedDate);
			if (suggestedYears.length > 0) {
				setFinancialYears(updatedYears);
			}

			setNewAccount(updatedAccount);
		}
	};

	const showDatepicker = () => {
		// Make sure selectedDate is properly set before showing picker
		if (!selectedDate) {
			setSelectedDate(new Date());
		}
		setShowDatePicker(true);
	};

	const handleEditAccount = (account: any) => {
		setEditingAccountId(account.id);

		let annualContributions = account.annualContributions || {};

		if (Object.keys(annualContributions).length === 0 && account.notes) {
			try {
				const notesData = JSON.parse(account.notes);
				annualContributions = notesData.annualContributions || {};
			} catch (error) {
				console.warn('Failed to parse notes:', error);
			}
		}

		const fyEntries = Object.entries(annualContributions).map(
			([year, data]: [string, any], index) => ({
				year,
				amount: data.amount?.toString() || '',
				interest: data.interest?.toString() || '',
				isFirstYear: index === 0,
			})
		);

		if (fyEntries.length === 0) {
			fyEntries.push({
				year: account.financialYear || getCurrentFinancialYear(),
				amount: account.totalDeposits?.toString() || '',
				interest: '',
				isFirstYear: true,
			});
		}

		setFinancialYears(fyEntries);
		const startDate = parseDateString(account.startDate);
		setSelectedDate(startDate); // Make sure this is set
		setStartDateInput(account.startDate || formatDate(startDate)); // Format it properly

		setNewAccount({
			accountNumber: account.accountNumber || '',
			financialYear: account.financialYear || '',
			totalDeposits: account.totalDeposits || 0,
			interestRate: account.interestRate || 7.1,
			maturityDate:
				account.maturityDate ||
				calculateMaturityDate(account.startDate || formatDate(startDate)),
			startDate: account.startDate || formatDate(startDate),
			annualContributions: annualContributions,
		});
		setInterestRateInput((account.interestRate || 7.1).toString());
		setShowEditModal(true);
	};

	const handleUpdateAccount = async (): Promise<void> => {
		if (!newAccount?.accountNumber?.trim()) {
			Alert.alert('Error', 'Please enter account number');
			return;
		}
		if (!startDateInput) {
			Alert.alert('Error', 'Please enter account start date');
			return;
		}

		if (newAccount?.interestRate <= 0) {
			Alert.alert('Error', 'Interest rate must be greater than 0');
			return;
		}
		const hasValidAmount = financialYears.some((fy) => {
			const amount = parseFloat(fy.amount);
			return !isNaN(amount) && amount > 0;
		});

		if (!hasValidAmount) {
			Alert.alert(
				'Error',
				'Please enter at least one financial year contribution'
			);
			return;
		}

		const fyRegex = /^\d{4}-\d{2}$/;
		for (const fy of financialYears) {
			if (!fyRegex.test(fy.year)) {
				Alert.alert(
					'Error',
					`Invalid financial year format for "${fy.year}". Use format: YYYY-YY`
				);
				return;
			}
		}

		if (!editingAccountId) return;

		setIsSubmitting(true);
		try {
			const annualContributions: Record<
				string,
				{ amount: number; interest: number }
			> = {};

			financialYears.forEach((fy) => {
				const amount = parseFloat(fy.amount) || 0;
				const interest = parseFloat(fy.interest) || 0;
				annualContributions[fy.year] = {
					amount,
					interest,
				};
			});

			const updateData: CreatePPFData = {
				accountNumber: newAccount.accountNumber,
				financialYear: financialYears[0].year,
				totalDeposits: Object.values(annualContributions).reduce(
					(sum, fy) => sum + (fy.amount || 0),
					0
				),
				interestRate: newAccount.interestRate,
				maturityDate: newAccount.maturityDate,
				startDate: startDateInput,
				annualContributions: annualContributions,
			};

			await assetService.updatePPF(userId, editingAccountId, updateData);
			setShowEditModal(false);
			resetForm();
			onRefresh();
			Alert.alert('Success', 'PPF account updated successfully!');
		} catch (error: any) {
			console.error('Error updating PPF account:', error);
			Alert.alert('Error', `Failed to update PPF account: ${error.message}`);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleAddAccount = async (): Promise<void> => {
		if (!newAccount?.accountNumber?.trim()) {
			Alert.alert('Error', 'Please enter account number');
			return;
		}

		if (!startDateInput) {
			Alert.alert('Error', 'Please enter account start date');
			return;
		}

		if (newAccount?.interestRate <= 0) {
			Alert.alert('Error', 'Interest rate must be greater than 0');
			return;
		}

		const hasValidAmount = financialYears.some((fy) => {
			const amount = parseFloat(fy.amount);
			return !isNaN(amount) && amount > 0;
		});

		if (!hasValidAmount) {
			Alert.alert(
				'Error',
				'Please enter at least one financial year contribution'
			);
			return;
		}

		const fyRegex = /^\d{4}-\d{2}$/;
		for (const fy of financialYears) {
			if (!fyRegex.test(fy.year)) {
				Alert.alert(
					'Error',
					`Invalid financial year format for "${fy.year}". Use format: YYYY-YY`
				);
				return;
			}
		}

		setIsSubmitting(true);
		try {
			const annualContributions: Record<
				string,
				{ amount: number; interest: number }
			> = {};
			let totalDeposits = 0;
			let totalInterest = 0;

			financialYears.forEach((fy) => {
				const amount = parseFloat(fy.amount);
				const interest = parseFloat(fy.interest);

				if (!isNaN(amount) && amount > 0) {
					annualContributions[fy.year] = {
						amount,
						interest: !isNaN(interest) && interest >= 0 ? interest : 0,
					};
					totalDeposits += amount;
					totalInterest += !isNaN(interest) && interest >= 0 ? interest : 0;
				}
			});

			const accountData = {
				accountNumber: newAccount.accountNumber,
				financialYear: financialYears[0].year,
				totalDeposits,
				interestRate: newAccount.interestRate,
				maturityDate: newAccount.maturityDate,
				startDate: startDateInput,
				annualContributions,
			};

			await assetService.createPPF(userId, accountData);
			setShowAddModal(false);
			resetForm();
			onRefresh();
			Alert.alert('Success', 'PPF account added successfully!');
		} catch (error) {
			console.error('Error adding PPF account:', error);
			Alert.alert('Error', 'Failed to add PPF account');
		} finally {
			setIsSubmitting(false);
		}
	};

	const resetForm = () => {
		setEditingAccountId(null);

		const currentDate = new Date();
		const formattedCurrentDate = formatDate(currentDate);
		const startFinancialYear = getFinancialYearFromDate(currentDate);

		setNewAccount({
			accountNumber: '',
			financialYear: '',
			totalDeposits: 0,
			interestRate: 7.1,
			maturityDate: calculateMaturityDate(formattedCurrentDate),
			startDate: formattedCurrentDate,
			annualContributions: {},
		});

		setInterestRateInput('7.1');
		setStartDateInput(formattedCurrentDate);
		setSelectedDate(currentDate); // Make sure this is set
		setFinancialYears([
			{
				year: startFinancialYear,
				amount: '',
				interest: '',
				isFirstYear: true,
			},
		]);
	};

	const handleDeleteAccount = async (
		accountId: string,
		accountNumber: string
	): Promise<void> => {
		Alert.alert(
			'Delete PPF Account',
			`Are you sure you want to delete PPF account ${accountNumber}?`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: async () => {
						try {
							await assetService.deletePPF(userId, accountId);
							onRefresh();
							Alert.alert('Success', 'PPF account deleted successfully!');
						} catch (error) {
							console.error('Error deleting PPF account:', error);
							Alert.alert('Error', 'Failed to delete PPF account');
						}
					},
				},
			]
		);
	};

	const totalBalance = accounts.reduce(
		(sum, account) => sum + account.currentBalance,
		0
	);
	const totalDeposits = accounts.reduce(
		(sum, account) => sum + account.totalDeposits,
		0
	);
	const totalInterest = accounts.reduce(
		(sum, account) => sum + calculateTotalInterest(account),
		0
	);

	const parseAnnualContributions = (notes?: string) => {
		if (!notes) return {};
		try {
			const data = JSON.parse(notes);
			return data.annualContributions || {};
		} catch (error) {
			return {};
		}
	};

	const calculateTotalInterestFromContributions = (
		contributions: Record<string, { amount: number; interest: number }>
	): number => {
		return Object.values(contributions).reduce(
			(sum, fy) => sum + (fy.interest || 0),
			0
		);
	};

	const calculateTotalsFromFinancialYears = () => {
		let totalDeposits = 0;
		let totalInterest = 0;

		financialYears.forEach((fy) => {
			const amount = parseFloat(fy.amount);
			const interest = parseFloat(fy.interest);

			if (!isNaN(amount) && amount > 0) {
				totalDeposits += amount;
			}

			if (!isNaN(interest) && interest > 0) {
				totalInterest += interest;
			}
		});

		return { totalDeposits, totalInterest };
	};

	const renderDatePicker = () => {
		if (showDatePicker) {
			return (
				<DateTimePicker
					testID='dateTimePicker'
					value={selectedDate || new Date()} // Ensure we always have a value
					mode='date'
					display={Platform.OS === 'ios' ? 'spinner' : 'default'}
					onChange={handleDateChange}
					maximumDate={new Date()} // Allows past dates, prevents future dates
				/>
			);
		}
		return null;
	};

	const addFinancialYear = () => {
		const suggestedYears = getSuggestedFinancialYears(
			startDateInput || new Date().toISOString().split('T')[0]
		);
		const existingYears = financialYears.map((fy) => fy.year);
		let nextYear = '';
		for (const year of suggestedYears) {
			if (!existingYears.includes(year)) {
				nextYear = year;
				break;
			}
		}

		if (!nextYear && financialYears.length > 0) {
			const lastYear = financialYears[financialYears.length - 1].year;
			const lastYearNum = parseInt(lastYear.split('-')[0]);
			nextYear = `${lastYearNum + 1}-${(lastYearNum + 2).toString().slice(-2)}`;
		} else if (!nextYear) {
			nextYear = getCurrentFinancialYear();
		}

		setFinancialYears([
			...financialYears,
			{ year: nextYear, amount: '', interest: '', isFirstYear: false },
		]);
	};

	const removeFinancialYear = (index: number) => {
		if (financialYears.length > 1 && !financialYears[index].isFirstYear) {
			const updatedYears = [...financialYears];
			updatedYears.splice(index, 1);
			setFinancialYears(updatedYears);
		}
	};

	const onPressAddPPFAccount = () => {
		const currentDate = new Date();
		const formattedDate = formatDate(currentDate);
		setStartDateInput(formattedDate);

		// Set selectedDate to current date
		setSelectedDate(currentDate);

		const updatedAccount = {
			...newAccount,
			startDate: formattedDate,
			maturityDate: calculateMaturityDate(formattedDate),
		};

		setNewAccount(updatedAccount);

		const startFinancialYear = getFinancialYearFromDate(currentDate);
		const updatedYears = [...financialYears];
		updatedYears[0] = {
			...updatedYears[0],
			year: startFinancialYear,
			isFirstYear: true,
		};

		setFinancialYears(updatedYears);

		setShowAddModal(true);
	};

	const renderPPFAccountCard = (account: any) => {
		const yearsToMaturity = calculateYearsToMaturity(account.maturityDate);
		const totalInterest = calculateTotalInterest(account);
		const annualContributions = parseAnnualContributions(account.notes);
		const totalInterestFromContributions =
			calculateTotalInterestFromContributions(annualContributions);

		return (
			<TouchableOpacity
				key={account.id}
				style={[
					styles.card,
					{
						marginBottom: 12,
						borderLeftWidth: 4,
						borderLeftColor: colors.primary,
						paddingVertical: 16,
						paddingHorizontal: 8,
					},
				]}
				onPress={() => handleEditAccount(account)}
			>
				<View style={[styles.row, { alignItems: 'flex-start' }]}>
					<View style={{ flex: 1 }}>
						<Text
							style={{
								fontWeight: 'bold',
								color: colors.dark,
								fontSize: 16,
							}}
						>
							PPF Account
						</Text>
						<Text style={{ color: colors.gray, fontSize: 12, marginTop: 2 }}>
							{account.accountNumber} • {account.interestRate}% interest
						</Text>
						<View
							style={[
								styles.row,
								{ justifyContent: 'space-between', marginTop: 8 },
							]}
						>
							<View>
								<Text style={{ color: colors.gray, fontSize: 12 }}>
									Total Deposits
								</Text>
								<Text
									style={{
										fontWeight: 'bold',
										color: colors.dark,
										fontSize: 14,
									}}
								>
									{formatCurrency(account.totalDeposits)}
								</Text>
							</View>

							<View style={{ alignItems: 'center' }}>
								<Text style={{ color: colors.gray, fontSize: 12 }}>
									Total Interest
								</Text>
								<Text
									style={{
										fontWeight: 'bold',
										color: colors.dark,
										fontSize: 14,
									}}
								>
									{formatCurrency(totalInterest)}
								</Text>
							</View>

							<View style={{ alignItems: 'flex-end' }}>
								<Text style={{ color: colors.gray, fontSize: 12 }}>
									Current Balance
								</Text>
								<Text
									style={{
										fontWeight: 'bold',
										color: colors.dark,
										fontSize: 14,
									}}
								>
									{formatCurrency(account.currentBalance)}
								</Text>
							</View>
						</View>

						{/* Annual Contributions Section */}
						{Object.keys(annualContributions).length > 0 && (
							<View style={{ marginTop: 12 }}>
								<Text
									style={{
										color: colors.gray,
										fontSize: 12,
										marginBottom: 4,
									}}
								>
									Annual Contributions (Amount + Interest):
								</Text>
								{Object.entries(annualContributions).map(
									([fy, data]: [string, any]) => (
										<View
											key={fy}
											style={[
												styles.row,
												{
													justifyContent: 'space-between',
													marginBottom: 2,
												},
											]}
										>
											<Text style={{ color: colors.gray, fontSize: 10 }}>
												FY {fy}:
											</Text>
											<View style={[styles.row, { gap: 8 }]}>
												<Text style={{ color: colors.gray, fontSize: 10 }}>
													Amount: {formatCurrency(data.amount || 0)}
												</Text>
												<Text style={{ color: colors.gray, fontSize: 10 }}>
													Interest: {formatCurrency(data.interest || 0)}
												</Text>
											</View>
										</View>
									)
								)}
								{totalInterestFromContributions > 0 && (
									<View
										style={[
											styles.row,
											{ justifyContent: 'space-between', marginTop: 4 },
										]}
									>
										<Text
											style={{
												color: colors.primary,
												fontSize: 10,
												fontWeight: 'bold',
											}}
										>
											Total Interest from Contributions:
										</Text>
										<Text
											style={{
												color: colors.primary,
												fontSize: 10,
												fontWeight: 'bold',
											}}
										>
											{formatCurrency(totalInterestFromContributions)}
										</Text>
									</View>
								)}
							</View>
						)}

						{/* Maturity Info */}
						<View
							style={[
								styles.row,
								{ justifyContent: 'space-between', marginTop: 8 },
							]}
						>
							<Text style={{ color: colors.gray, fontSize: 12 }}>
								{yearsToMaturity} years to maturity
							</Text>
							<Text style={{ color: colors.gray, fontSize: 12 }}>
								Matures: {new Date(account.maturityDate).toLocaleDateString()}
							</Text>
						</View>

						{/* Edit and Delete Buttons */}
						<View
							style={[
								styles.row,
								{ marginTop: 12, justifyContent: 'flex-end' },
							]}
						>
							<TouchableOpacity
								style={{ marginRight: 16 }}
								onPress={() => handleEditAccount(account)}
							>
								<Text style={{ color: colors.primary, fontSize: 12 }}>
									✏️ Edit
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={() =>
									handleDeleteAccount(account.id, account.accountNumber || '')
								}
							>
								<Text style={{ color: colors.danger, fontSize: 12 }}>
									🗑️ Delete
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</TouchableOpacity>
		);
	};

	const renderFinancialYearFields = () => {
		return financialYears.map((fy, index) => (
			<View key={index} style={{ marginBottom: 12, gap: 8 }}>
				<View
					style={[
						styles.row,
						{
							justifyContent: 'space-between',
							paddingHorizontal: 16,
						},
					]}
				>
					<Text>FY {fy.year}</Text>
					{financialYears.length > 1 && !fy.isFirstYear && (
						<TouchableOpacity onPress={() => removeFinancialYear(index)}>
							<Text style={{ color: colors.danger, fontSize: 12 }}>
								🗑️ Delete
							</Text>
						</TouchableOpacity>
					)}
				</View>
				<View
					style={[styles.row, { justifyContent: 'space-between', gap: 10 }]}
				>
					<TextInput
						style={[styles.input, { flex: 1 }]}
						placeholder='Amount'
						value={fy.amount}
						onChangeText={(text) => handleFYAmountChange(index, text)}
						placeholderTextColor={colors.gray}
						keyboardType='decimal-pad'
					/>
					<TextInput
						style={[styles.input, { flex: 1 }]}
						placeholder='Interest'
						value={fy.interest}
						onChangeText={(text) => handleFYInterestChange(index, text)}
						placeholderTextColor={colors.gray}
						keyboardType='decimal-pad'
					/>
				</View>
			</View>
		));
	};

	const renderAddEditModal = (isEdit: boolean) => {
		return (
			<Modal
				visible={isEdit ? showEditModal : showAddModal}
				animationType='slide'
				transparent={true}
				onRequestClose={() => {
					if (isEdit) {
						setShowEditModal(false);
						setEditingAccountId(null);
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
								{isEdit ? 'Edit PPF Account' : 'Add PPF Account'}
							</Text>

							{/* Current Values Section */}
							{(() => {
								const { totalDeposits, totalInterest } =
									calculateTotalsFromFinancialYears();
								return (
									<View
										style={{
											marginBottom: 16,
											padding: 12,
											backgroundColor: colors.lightGray,
											borderRadius: 8,
										}}
									>
										<Text
											style={{
												color: colors.gray,
												fontSize: 12,
												marginBottom: 4,
											}}
										>
											Current Values:
										</Text>
										<View
											style={[
												styles.row,
												{ justifyContent: 'space-between', marginBottom: 4 },
											]}
										>
											<Text style={{ color: colors.dark, fontSize: 12 }}>
												Total Deposits:
											</Text>
											<Text
												style={{
													color: colors.dark,
													fontSize: 12,
													fontWeight: 'bold',
												}}
											>
												{formatCurrency(totalDeposits)}
											</Text>
										</View>
										<View
											style={[
												styles.row,
												{ justifyContent: 'space-between', marginBottom: 4 },
											]}
										>
											<Text style={{ color: colors.dark, fontSize: 12 }}>
												Total Interest:
											</Text>
											<Text
												style={{
													color: colors.dark,
													fontSize: 12,
													fontWeight: 'bold',
												}}
											>
												{formatCurrency(totalInterest)}
											</Text>
										</View>
										<View
											style={[styles.row, { justifyContent: 'space-between' }]}
										>
											<Text style={{ color: colors.primary, fontSize: 12 }}>
												Total Balance:
											</Text>
											<Text
												style={{
													color: colors.primary,
													fontSize: 12,
													fontWeight: 'bold',
												}}
											>
												{formatCurrency(totalDeposits + totalInterest)}
											</Text>
										</View>
									</View>
								);
							})()}

							{/* Account Number Field */}
							<Text style={[styles.label, { marginBottom: 4 }]}>
								Account Number *
							</Text>
							<TextInput
								style={styles.input}
								placeholder='Account Number *'
								value={newAccount.accountNumber}
								onChangeText={(text) =>
									setNewAccount({ ...newAccount, accountNumber: text })
								}
								placeholderTextColor={colors.gray}
							/>

							{/* Start Date Field - RENDER DIRECTLY */}
							<Text style={[styles.label, { marginTop: 12, marginBottom: 4 }]}>
								Start Date *
							</Text>
							<TouchableOpacity
								style={styles.input}
								onPress={() => {
									// Make sure we have a valid selectedDate
									if (!selectedDate && startDateInput) {
										setSelectedDate(new Date(startDateInput));
									} else if (!selectedDate) {
										setSelectedDate(new Date());
									}
									setShowDatePicker(true);
								}}
							>
								<View style={[styles.row, { justifyContent: 'space-between' }]}>
									<Text
										style={{
											color: startDateInput ? colors.dark : colors.gray,
										}}
									>
										{startDateInput || 'Select Start Date (YYYY-MM-DD)'}
									</Text>
									<Text style={{ color: colors.gray }}>📅</Text>
								</View>
							</TouchableOpacity>

							{/* Rest of the fields... */}
							<Text style={[styles.label, { marginTop: 16, marginBottom: 8 }]}>
								Financial Year Contributions (Amount + Interest Earned)
							</Text>

							{renderFinancialYearFields()}

							<TouchableOpacity
								style={[
									styles.button,
									styles.buttonSecondary,
									{ marginBottom: 16 },
								]}
								onPress={addFinancialYear}
							>
								<Text style={styles.buttonText}>
									+ Add Another Financial Year
								</Text>
							</TouchableOpacity>

							<TextInput
								style={styles.input}
								placeholder='Interest Rate (%) *'
								value={interestRateInput}
								onChangeText={handleInterestRateInput}
								placeholderTextColor={colors.gray}
								keyboardType='decimal-pad'
							/>

							<TextInput
								style={styles.input}
								placeholder='Maturity Date (Auto-calculated)'
								value={newAccount.maturityDate}
								editable={false}
								placeholderTextColor={colors.gray}
							/>

							<Text style={{ color: colors.gray, fontSize: 12, marginTop: 8 }}>
								Note: Maturity date is automatically calculated as 15 years from
								start date
							</Text>

							<View style={[styles.row, { gap: 12, marginTop: 16 }]}>
								<TouchableOpacity
									style={[styles.button, styles.buttonSecondary, { flex: 1 }]}
									onPress={() => {
										if (isEdit) {
											setShowEditModal(false);
											setEditingAccountId(null);
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
									onPress={isEdit ? handleUpdateAccount : handleAddAccount}
									disabled={isSubmitting}
								>
									<Text style={styles.buttonText}>
										{isSubmitting
											? 'Saving...'
											: isEdit
											? 'Update PPF'
											: 'Add PPF'}
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
			<Banner image={PPFBanner} title='PPF Balance' amount={totalBalance}>
				<View style={[styles.row, { marginTop: 8 }]}>
					<Text style={{ fontSize: 12, color: colors.platinum }}>
						Total Deposits: {formatCurrency(totalDeposits)} • Total Interest:{' '}
						{formatCurrency(totalInterest)} •{accounts.length} account
						{accounts.length !== 1 ? 's' : ''}
					</Text>
				</View>
			</Banner>
			<Text style={[styles.subHeading, { marginTop: 24, marginBottom: 16 }]}>
				Public Provident Fund Accounts
			</Text>

			{accounts.length === 0 ? (
				<View
					style={[
						styles.card,
						styles.center,
						{ minHeight: 200, marginBottom: 16 },
					]}
				>
					<Text style={{ color: colors.gray }}>No PPF accounts found</Text>
					<Text style={{ color: colors.gray, fontSize: 12, marginTop: 8 }}>
						Add your first PPF account to get started
					</Text>
				</View>
			) : (
				<CardsView details={accounts} renderCard={renderPPFAccountCard} />
			)}

			<AddDetailsButton label='PPF Account' onPress={onPressAddPPFAccount} />

			{renderAddEditModal(false)}
			{renderAddEditModal(true)}
			{renderDatePicker()}
		</View>
	);
};
