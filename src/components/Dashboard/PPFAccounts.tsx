import { assetService } from '@/services/assetService';
import { colors, styles } from '@/styles';
import { CreatePPFData, PPFAccountsProps } from '@/types';
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

export const PPFAccounts = ({
	accounts,
	onRefresh,
	userId,
}: PPFAccountsProps) => {
	const [showAddModal, setShowAddModal] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [newAccount, setNewAccount] = useState<CreatePPFData>({
		accountNumber: '',
		financialYear: '2024-25',
		totalDeposits: 0,
		interestRate: 7.1,
		maturityDate: '2039-04-01',
	});

	const formatCurrency = (amount: number): string => {
		return new Intl.NumberFormat('en-IN', {
			style: 'currency',
			currency: 'INR',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(amount);
	};

	const calculateYearsToMaturity = (maturityDate: string): number => {
		const today = new Date();
		const maturity = new Date(maturityDate);
		const diffTime = maturity.getTime() - today.getTime();
		return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 365.25));
	};

	const handleAddAccount = async (): Promise<void> => {
		if (!newAccount.accountNumber.trim()) {
			Alert.alert('Error', 'Please enter account number');
			return;
		}

		if (newAccount.totalDeposits <= 0) {
			Alert.alert('Error', 'Total deposits must be greater than 0');
			return;
		}

		if (newAccount.interestRate <= 0) {
			Alert.alert('Error', 'Interest rate must be greater than 0');
			return;
		}

		setIsSubmitting(true);
		try {
			await assetService.createPPF(userId, newAccount);
			setShowAddModal(false);
			setNewAccount({
				accountNumber: '',
				financialYear: '2024-25',
				totalDeposits: 0,
				interestRate: 7.1,
				maturityDate: '2039-04-01',
			});
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
			{/* Summary Card */}
			<View style={[styles.card, { backgroundColor: colors.lightGray }]}>
				<View style={[styles.row, styles.spaceBetween]}>
					<View>
						<Text style={{ fontSize: 14, color: colors.gray }}>
							PPF Balance
						</Text>
						<Text
							style={{
								fontSize: 24,
								fontWeight: 'bold',
								color: colors.dark,
								marginTop: 4,
							}}
						>
							{formatCurrency(totalBalance)}
						</Text>
					</View>
					<Text style={{ fontSize: 24 }}>🏛️</Text>
				</View>
				<View style={[styles.row, { marginTop: 8 }]}>
					<Text style={{ fontSize: 12, color: colors.gray }}>
						Total Deposits: {formatCurrency(totalDeposits)} • {accounts.length}{' '}
						account{accounts.length !== 1 ? 's' : ''}
					</Text>
				</View>
			</View>

			{/* PPF Accounts List */}
			<Text style={[styles.subHeading, { marginTop: 24, marginBottom: 16 }]}>
				Public Provident Fund Accounts
			</Text>

			<ScrollView
				showsVerticalScrollIndicator={false}
				style={{ maxHeight: 400 }}
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
								handleDeleteAccount(account.id, account.accountNumber)
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
							value={newAccount.totalDeposits.toString()}
							onChangeText={(text) =>
								setNewAccount({
									...newAccount,
									totalDeposits: parseFloat(text) || 0,
								})
							}
							placeholderTextColor={colors.gray}
							keyboardType='decimal-pad'
						/>

						<TextInput
							style={styles.input}
							placeholder='Interest Rate (%)'
							value={newAccount.interestRate.toString()}
							onChangeText={(text) =>
								setNewAccount({
									...newAccount,
									interestRate: parseFloat(text) || 7.1,
								})
							}
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
								onPress={() => setShowAddModal(false)}
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

			{/* Add New PPF Account Button */}
			<TouchableOpacity
				style={[styles.button, styles.buttonPrimary, { marginTop: 16 }]}
				onPress={() => setShowAddModal(true)}
			>
				<Text style={styles.buttonText}>+ Add PPF Account</Text>
			</TouchableOpacity>
		</View>
	);
};
