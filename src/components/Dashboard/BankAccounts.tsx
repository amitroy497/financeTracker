import { BANK_LIST } from '@/constants';
import { assetService } from '@/services/assetService';
import { colors, styles } from '@/styles';
import { BankAccount, CreateBankAccountData } from '@/types';
import { maskAccountNumber } from '@/utils';
import { Ionicons } from '@expo/vector-icons';
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

interface BankAccountsProps {
	accounts: BankAccount[];
	onRefresh: () => void;
	userId: string;
}

export const BankAccounts: React.FC<BankAccountsProps> = ({
	accounts,
	onRefresh,
	userId,
}) => {
	const [showAddModal, setShowAddModal] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showBankDropdown, setShowBankDropdown] = useState(false);
	const [bankSearch, setBankSearch] = useState('');
	const [unmaskedAccounts, setUnmaskedAccounts] = useState<Set<string>>(
		new Set()
	);
	const [newAccount, setNewAccount] = useState<CreateBankAccountData>({
		bankName: '',
		accountNumber: '',
		accountType: 'Savings',
		balance: 0,
		currency: 'INR',
	});

	const formatCurrency = (amount: number): string => {
		return new Intl.NumberFormat('en-IN', {
			style: 'currency',
			currency: 'INR',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(amount);
	};

	const toggleAccountNumberVisibility = (accountId: string): void => {
		const newUnmaskedAccounts = new Set(unmaskedAccounts);
		if (newUnmaskedAccounts.has(accountId)) {
			newUnmaskedAccounts.delete(accountId);
		} else {
			newUnmaskedAccounts.add(accountId);
		}
		setUnmaskedAccounts(newUnmaskedAccounts);
	};

	const getDisplayAccountNumber = (account: BankAccount): string => {
		return unmaskedAccounts.has(account.id)
			? account.accountNumber
			: maskAccountNumber(account.accountNumber);
	};

	const getBankIcon = (bankName: string): string => {
		const bankIcons: { [key: string]: string } = {
			'Axis Bank': '🏦',
			'Kotak Mahindra Bank': '💳',
			'HDFC Bank': '🏛️',
			'ICICI Bank': '🏢',
			SBI: '🇮🇳',
			'State Bank of India (SBI)': '🇮🇳',
			Default: '🏦',
		};

		return bankIcons[bankName] || bankIcons['Default'];
	};

	const getAccountTypeColor = (type: string): string => {
		const colorsMap: { [key: string]: string } = {
			Savings: colors.success,
			Current: colors.info,
			Salary: colors.primary,
		};

		return colorsMap[type] || colors.gray;
	};

	const filteredBanks = BANK_LIST.sort().filter((bank) =>
		bank.toLowerCase().includes(bankSearch.toLowerCase())
	);

	const handleSelectBank = (bank: string): void => {
		setNewAccount({ ...newAccount, bankName: bank });
		setShowBankDropdown(false);
		setBankSearch('');
	};

	const handleAddAccount = async (): Promise<void> => {
		if (!newAccount.bankName.trim() || !newAccount.accountNumber.trim()) {
			Alert.alert('Error', 'Please fill in all required fields');
			return;
		}

		if (newAccount.balance < 0) {
			Alert.alert('Error', 'Balance cannot be negative');
			return;
		}

		// Validate account number (only digits, at least 9 characters)
		const accountNumberRegex = /^\d+$/;
		if (!accountNumberRegex.test(newAccount.accountNumber)) {
			Alert.alert('Error', 'Account number should contain only digits');
			return;
		}

		if (newAccount.accountNumber.length < 9) {
			Alert.alert('Error', 'Account number should be at least 9 digits long');
			return;
		}

		setIsSubmitting(true);
		try {
			await assetService.createBankAccount(userId, newAccount);
			setShowAddModal(false);
			setNewAccount({
				bankName: '',
				accountNumber: '',
				accountType: 'Savings',
				balance: 0,
				currency: 'INR',
			});
			onRefresh();
			Alert.alert('Success', 'Bank account added successfully!');
		} catch (error) {
			console.error('Error adding bank account:', error);
			Alert.alert('Error', 'Failed to add bank account');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteAccount = async (
		accountId: string,
		accountName: string
	): Promise<void> => {
		Alert.alert(
			'Delete Bank Account',
			`Are you sure you want to delete ${accountName}?`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: async () => {
						try {
							await assetService.deleteBankAccount(userId, accountId);
							// Remove from unmasked accounts if present
							const newUnmaskedAccounts = new Set(unmaskedAccounts);
							newUnmaskedAccounts.delete(accountId);
							setUnmaskedAccounts(newUnmaskedAccounts);
							onRefresh();
							Alert.alert('Success', 'Bank account deleted successfully!');
						} catch (error) {
							console.error('Error deleting bank account:', error);
							Alert.alert('Error', 'Failed to delete bank account');
						}
					},
				},
			]
		);
	};

	const totalBalance = accounts.reduce(
		(sum, account) => sum + account.balance,
		0
	);

	return (
		<View style={{ padding: 20 }}>
			<View style={[styles.card, { backgroundColor: colors.lightGray }]}>
				<View style={[styles.row, styles.spaceBetween]}>
					<View>
						<Text style={{ fontSize: 14, color: colors.gray }}>
							Total Cash Balance
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
					<Text style={{ fontSize: 24 }}>💰</Text>
				</View>
				<Text style={{ fontSize: 12, color: colors.gray, marginTop: 8 }}>
					Across {accounts.length} bank account
					{accounts.length !== 1 ? 's' : ''}
				</Text>
			</View>

			{/* Bank Accounts List */}
			<Text style={[styles.subHeading, { marginTop: 24, marginBottom: 16 }]}>
				Bank Accounts
			</Text>

			<ScrollView
				showsVerticalScrollIndicator={false}
				style={{ maxHeight: 400 }}
				contentContainerStyle={{ flexGrow: 1 }}
			>
				{accounts.map((account) => (
					<TouchableOpacity
						key={account.id}
						style={[
							styles.card,
							{
								marginBottom: 12,
								borderLeftWidth: 4,
								borderLeftColor: getAccountTypeColor(account.accountType),
							},
						]}
						onLongPress={() =>
							handleDeleteAccount(account.id, account.bankName)
						}
					>
						<View style={[styles.row]}>
							<View
								style={{
									alignItems: 'flex-start',
									justifyContent: 'flex-start',
								}}
							>
								<Text style={{ fontSize: 20, marginRight: 12, marginTop: 2 }}>
									{getBankIcon(account.bankName)}
								</Text>
							</View>
							<View style={{ justifyContent: 'center' }}>
								<View style={[styles.row, styles.spaceBetween]}>
									<View style={{ flex: 1 }}>
										<Text
											style={{
												fontWeight: 'bold',
												color: colors.dark,
												fontSize: 16,
											}}
										>
											{account.bankName}
										</Text>
									</View>
									<View
										style={{
											alignItems: 'flex-end',
											flexDirection: 'row',
											gap: 4,
										}}
									>
										<Text
											style={{
												fontWeight: 'bold',
												color: colors.dark,
												fontSize: 16,
											}}
										>
											{formatCurrency(account.balance)}
										</Text>
										<Text style={{ color: colors.gray, fontSize: 12 }}>
											{account.currency}
										</Text>
									</View>
								</View>
								<View>
									<View
										style={[
											styles.row,
											{
												alignItems: 'center',
												marginTop: 6,
											},
										]}
									>
										<Text style={{ color: colors.gray, fontSize: 12 }}>
											{getDisplayAccountNumber(account)} • {account.accountType}{' '}
											Account
										</Text>
										<TouchableOpacity
											onPress={() => toggleAccountNumberVisibility(account.id)}
											style={{ marginLeft: 8, padding: 4 }}
										>
											<Ionicons
												name={
													unmaskedAccounts.has(account.id) ? 'eye-off' : 'eye'
												}
												size={16}
												color={colors.gray}
											/>
										</TouchableOpacity>
									</View>
									<Text
										style={{ color: colors.gray, fontSize: 10, marginTop: 4 }}
									>
										Last updated:{' '}
										{new Date(account.lastUpdated).toLocaleDateString()}
									</Text>
								</View>
							</View>
						</View>
					</TouchableOpacity>
				))}
			</ScrollView>
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
					<View style={[styles.card, { margin: 20, maxHeight: '90%' }]}>
						<ScrollView
							showsVerticalScrollIndicator={false}
							contentContainerStyle={{ flexGrow: 1 }}
						>
							<Text style={[styles.subHeading, { marginBottom: 16 }]}>
								Add Bank Account
							</Text>
							<View style={{ marginBottom: 16 }}>
								<Text style={{ marginBottom: 8, color: colors.dark }}>
									Select Bank
								</Text>
								<TouchableOpacity
									style={[
										styles.input,
										{
											flexDirection: 'row',
											justifyContent: 'space-between',
											alignItems: 'center',
										},
									]}
									onPress={() => setShowBankDropdown(!showBankDropdown)}
								>
									<Text
										style={{
											color: newAccount.bankName ? colors.dark : colors.gray,
										}}
									>
										{newAccount.bankName || 'Select a bank'}
									</Text>
									<Text>{showBankDropdown ? '▲' : '▼'}</Text>
								</TouchableOpacity>
								{showBankDropdown && (
									<View
										style={{
											backgroundColor: colors.white,
											borderRadius: 8,
											borderWidth: 1,
											borderColor: colors.lightGray,
											maxHeight: 200,
											marginTop: 4,
										}}
									>
										<TextInput
											style={[
												styles.input,
												{
													borderWidth: 0,
													borderBottomWidth: 1,
													borderRadius: 0,
													marginBottom: 0,
												},
											]}
											placeholder='Search banks...'
											value={bankSearch}
											onChangeText={setBankSearch}
											placeholderTextColor={colors.gray}
											autoFocus={true}
										/>

										{/* Bank List */}
										<ScrollView
											style={{ maxHeight: 150 }}
											showsVerticalScrollIndicator={true}
											contentContainerStyle={{ flexGrow: 1 }}
										>
											{filteredBanks.map((bank) => (
												<TouchableOpacity
													key={bank}
													style={{
														padding: 12,
														borderBottomWidth: 1,
														borderBottomColor: colors.lightGray,
													}}
													onPress={() => handleSelectBank(bank)}
												>
													<Text style={{ color: colors.dark }}>{bank}</Text>
												</TouchableOpacity>
											))}
											{filteredBanks.length === 0 && (
												<View style={{ padding: 12 }}>
													<Text
														style={{ color: colors.gray, textAlign: 'center' }}
													>
														No banks found
													</Text>
												</View>
											)}
										</ScrollView>
									</View>
								)}
							</View>

							<TextInput
								style={styles.input}
								placeholder='Account Number'
								value={newAccount.accountNumber}
								onChangeText={(text) =>
									setNewAccount({ ...newAccount, accountNumber: text })
								}
								placeholderTextColor={colors.gray}
								keyboardType='number-pad'
								maxLength={18}
							/>

							<TextInput
								style={styles.input}
								placeholder='Balance'
								value={newAccount.balance.toString()}
								onChangeText={(text) =>
									setNewAccount({
										...newAccount,
										balance: parseFloat(text) || 0,
									})
								}
								placeholderTextColor={colors.gray}
								keyboardType='decimal-pad'
							/>

							<View style={[styles.row, { gap: 12, marginTop: 16 }]}>
								<TouchableOpacity
									style={[styles.button, styles.buttonSecondary, { flex: 1 }]}
									onPress={() => {
										setShowAddModal(false);
										setShowBankDropdown(false);
										setBankSearch('');
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
										{isSubmitting ? 'Adding...' : 'Add Account'}
									</Text>
								</TouchableOpacity>
							</View>
						</ScrollView>
					</View>
				</View>
			</Modal>

			{/* Add New Account Button */}
			<TouchableOpacity
				style={[styles.button, styles.buttonPrimary, { marginTop: 16 }]}
				onPress={() => setShowAddModal(true)}
			>
				<Text style={styles.buttonText}>+ Add Bank Account</Text>
			</TouchableOpacity>
		</View>
	);
};
