import { PPFBanner } from '@/icons';
import { assetService } from '@/services/assetService';
import { createStyles } from '@/styles';
import { useTheme } from '@/theme';
import { CreatePPFData, PPFAccountsProps } from '@/types';
import { formatCurrency } from '@/utils';
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
import { AddDetailsButton, Banner } from '../UI';

export const PPFAccounts = ({
	accounts,
	onRefresh,
	userId,
}: PPFAccountsProps) => {
	const { colors } = useTheme();
	const styles = createStyles(colors);
	const [showAddModal, setShowAddModal] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [newAccount, setNewAccount] = useState<CreatePPFData>({
		accountNumber: '',
		financialYear: '2024-25',
		totalDeposits: 0,
		interestRate: 7.1,
		maturityDate: '2039-04-01',
	});

	// Add state for input strings to allow decimal typing
	const [totalDepositsInput, setTotalDepositsInput] = useState<string>('');
	const [interestRateInput, setInterestRateInput] = useState<string>('7.1');

	const calculateYearsToMaturity = (maturityDate: string): number => {
		const today = new Date();
		const maturity = new Date(maturityDate);
		const diffTime = maturity.getTime() - today.getTime();
		return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 365.25));
	};

	// Handle decimal input for total deposits
	const handleTotalDepositsInput = (text: string) => {
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

		// Limit to 2 decimal places
		const decimalIndex = cleanedText.indexOf('.');
		if (decimalIndex !== -1) {
			const decimalPart = cleanedText.substring(decimalIndex + 1);
			if (decimalPart.length > 2) {
				cleanedText = cleanedText.substring(0, decimalIndex + 3);
			}
		}

		setTotalDepositsInput(cleanedText);

		// Parse the value and update the account data
		let parsedValue: number;
		if (cleanedText === '' || cleanedText === '.') {
			parsedValue = 0;
		} else {
			parsedValue = parseFloat(cleanedText);
			if (isNaN(parsedValue)) parsedValue = 0;
		}

		setNewAccount({
			...newAccount,
			totalDeposits: parsedValue,
		});
	};

	// Handle decimal input for interest rate
	const handleInterestRateInput = (text: string) => {
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

		// Limit to 2 decimal places for interest rate
		const decimalIndex = cleanedText.indexOf('.');
		if (decimalIndex !== -1) {
			const decimalPart = cleanedText.substring(decimalIndex + 1);
			if (decimalPart.length > 2) {
				cleanedText = cleanedText.substring(0, decimalIndex + 3);
			}
		}

		setInterestRateInput(cleanedText);

		// Parse the value and update the account data
		let parsedValue: number;
		if (cleanedText === '' || cleanedText === '.') {
			parsedValue = 7.1; // Default value
		} else {
			parsedValue = parseFloat(cleanedText);
			if (isNaN(parsedValue)) parsedValue = 7.1;
		}

		setNewAccount({
			...newAccount,
			interestRate: parsedValue,
		});
	};

	// Format number for display (show empty string for 0)
	const formatNumberForInput = (num: number): string => {
		if (num === 0) return '';
		return num.toString();
	};

	const handleAddAccount = async (): Promise<void> => {
		if (!newAccount?.accountNumber?.trim()) {
			Alert.alert('Error', 'Please enter account number');
			return;
		}

		if (newAccount?.totalDeposits <= 0) {
			Alert.alert('Error', 'Total deposits must be greater than 0');
			return;
		}

		if (newAccount?.interestRate <= 0) {
			Alert.alert('Error', 'Interest rate must be greater than 0');
			return;
		}

		// Validate maturity date format
		const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
		if (!dateRegex.test(newAccount.maturityDate)) {
			Alert.alert('Error', 'Please enter a valid date in YYYY-MM-DD format');
			return;
		}

		setIsSubmitting(true);
		try {
			await assetService.createPPF(userId, newAccount);
			setShowAddModal(false);
			// Reset all states
			setNewAccount({
				accountNumber: '',
				financialYear: '2024-25',
				totalDeposits: 0,
				interestRate: 7.1,
				maturityDate: '2039-04-01',
			});
			setTotalDepositsInput('');
			setInterestRateInput('7.1');
			onRefresh();
			Alert.alert('Success', 'PPF account added successfully!');
		} catch (error) {
			console.error('Error adding PPF account:', error);
			Alert.alert('Error', 'Failed to add PPF account');
		} finally {
			setIsSubmitting(false);
		}
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

	return (
		<View style={{ padding: 20 }}>
			<Banner image={PPFBanner} title='PPF Balance' amount={totalBalance}>
				<View style={[styles.row, { marginTop: 8 }]}>
					<Text style={{ fontSize: 12, color: colors.platinum }}>
						Total Deposits: {formatCurrency(totalDeposits)} • {accounts.length}{' '}
						account{accounts.length !== 1 ? 's' : ''}
					</Text>
				</View>
			</Banner>
			<Text style={[styles.subHeading, { marginTop: 24, marginBottom: 16 }]}>
				Public Provident Fund Accounts
			</Text>

			<ScrollView
				showsVerticalScrollIndicator={false}
				style={{ maxHeight: 400 }}
				contentContainerStyle={{ flexGrow: 1 }}
				nestedScrollEnabled={true}
			>
				{accounts.map((account) => {
					const yearsToMaturity = calculateYearsToMaturity(
						account.maturityDate
					);

					return (
						<TouchableOpacity
							key={account.id}
							style={[
								styles.card,
								{
									marginBottom: 12,
									borderLeftWidth: 4,
									borderLeftColor: colors.primary,
								},
							]}
							onLongPress={() =>
								handleDeleteAccount(
									account.id,
									account?.accountNumber as string
								)
							}
						>
							<View
								style={[
									styles.row,
									styles.spaceBetween,
									{ alignItems: 'flex-start' },
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
										PPF Account
									</Text>
									<Text
										style={{ color: colors.gray, fontSize: 12, marginTop: 2 }}
									>
										{account.accountNumber} • FY {account.financialYear}
									</Text>

									<View
										style={[
											styles.row,
											{ justifyContent: 'space-between', marginTop: 8 },
										]}
									>
										<View>
											<Text style={{ color: colors.gray, fontSize: 12 }}>
												Deposits
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

									<View
										style={[
											styles.row,
											{ justifyContent: 'space-between', marginTop: 4 },
										]}
									>
										<Text style={{ color: colors.gray, fontSize: 12 }}>
											{account.interestRate}% interest
										</Text>
										<Text style={{ color: colors.gray, fontSize: 12 }}>
											{yearsToMaturity} years to maturity
										</Text>
									</View>

									<Text
										style={{ color: colors.gray, fontSize: 10, marginTop: 4 }}
									>
										Matures:{' '}
										{new Date(account.maturityDate).toLocaleDateString()}
									</Text>
								</View>
							</View>
						</TouchableOpacity>
					);
				})}
			</ScrollView>

			{/* Add New PPF Account Modal */}
			<Modal
				visible={showAddModal}
				animationType='slide'
				transparent={true}
				onRequestClose={() => {
					setShowAddModal(false);
					// Reset all states
					setNewAccount({
						accountNumber: '',
						financialYear: '2024-25',
						totalDeposits: 0,
						interestRate: 7.1,
						maturityDate: '2039-04-01',
					});
					setTotalDepositsInput('');
					setInterestRateInput('7.1');
				}}
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
							Add PPF Account
						</Text>

						<TextInput
							style={styles.input}
							placeholder='Account Number'
							value={newAccount.accountNumber}
							onChangeText={(text) =>
								setNewAccount({ ...newAccount, accountNumber: text })
							}
							placeholderTextColor={colors.gray}
						/>

						<TextInput
							style={styles.input}
							placeholder='Financial Year (e.g., 2024-25)'
							value={newAccount.financialYear}
							onChangeText={(text) =>
								setNewAccount({ ...newAccount, financialYear: text })
							}
							placeholderTextColor={colors.gray}
						/>

						<TextInput
							style={styles.input}
							placeholder='Total Deposits'
							value={totalDepositsInput}
							onChangeText={handleTotalDepositsInput}
							placeholderTextColor={colors.gray}
							keyboardType='decimal-pad'
						/>

						<TextInput
							style={styles.input}
							placeholder='Interest Rate (%)'
							value={interestRateInput}
							onChangeText={handleInterestRateInput}
							placeholderTextColor={colors.gray}
							keyboardType='decimal-pad'
						/>

						<TextInput
							style={styles.input}
							placeholder='Maturity Date (YYYY-MM-DD)'
							value={newAccount.maturityDate}
							onChangeText={(text) =>
								setNewAccount({ ...newAccount, maturityDate: text })
							}
							placeholderTextColor={colors.gray}
						/>

						<View style={[styles.row, { gap: 12, marginTop: 16 }]}>
							<TouchableOpacity
								style={[styles.button, styles.buttonSecondary, { flex: 1 }]}
								onPress={() => {
									setShowAddModal(false);
									// Reset all states
									setNewAccount({
										accountNumber: '',
										financialYear: '2024-25',
										totalDeposits: 0,
										interestRate: 7.1,
										maturityDate: '2039-04-01',
									});
									setTotalDepositsInput('');
									setInterestRateInput('7.1');
								}}
								disabled={isSubmitting}
							>
								<Text style={styles.buttonText}>Cancel</Text>
							</TouchableOpacity>

							<TouchableOpacity
								style={[styles.button, styles.buttonPrimary, { flex: 1 }]}
								onPress={handleAddAccount}
								disabled={isSubmitting}
							>
								<Text style={styles.buttonText}>
									{isSubmitting ? 'Adding...' : 'Add PPF Account'}
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			<AddDetailsButton
				label='PPF Account'
				onPress={() => setShowAddModal(true)}
			/>
		</View>
	);
};
