import { BANK_LIST } from '@/constants';
import { assetService } from '@/services/assetService';
import { createStyles } from '@/styles';
import { useTheme } from '@/theme';
import { BankAccount, BankAccountsProps, CreateBankAccountData } from '@/types';
import { formatCurrency, maskAccountNumber } from '@/utils';
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

export const BankAccounts = ({
	accounts,
	onEdit,
	onDelete,
	onRefresh,
	userId,
}: BankAccountsProps) => {
	const { colors } = useTheme();
	const styles = createStyles(colors);
	const [showAddModal, setShowAddModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showBankDropdown, setShowBankDropdown] = useState(false);
	const [bankSearch, setBankSearch] = useState('');
	const [unmaskedAccounts, setUnmaskedAccounts] = useState<Set<string>>(
		new Set()
	);
	const [editingAccount, setEditingAccount] = useState<BankAccount | null>(
		null
	);
	const [newAccount, setNewAccount] = useState<CreateBankAccountData>({
		accountName: '',
		bankName: '',
		accountNumber: '',
		accountType: 'Savings',
		balance: 0,
		currency: 'INR',
	});

	const [balanceInput, setBalanceInput] = useState<string>('0');

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
			? account.accountNumber || ''
			: maskAccountNumber(account.accountNumber || '');
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
		if (!newAccount.bankName.trim() || !newAccount?.accountNumber?.trim()) {
			Alert.alert('Error', 'Please fill in all required fields');
			return;
		}

		if (newAccount.balance < 0) {
			Alert.alert('Error', 'Balance cannot be negative');
			return;
		}

		const cleanedAccountNumber = newAccount.accountNumber.replace(/\D/g, '');

		const accountNumberRegex = /^\d+$/;
		if (!accountNumberRegex.test(cleanedAccountNumber)) {
			Alert.alert('Error', 'Please enter a valid account number');
			return;
		}

		if (cleanedAccountNumber.length < 9) {
			Alert.alert('Error', 'Account number should be at least 9 digits long');
			return;
		}

		setIsSubmitting(true);
		try {
			await assetService.createBankAccount(userId, {
				accountName: newAccount.accountName || newAccount.bankName,
				bankName: newAccount.bankName,
				accountNumber: cleanedAccountNumber,
				accountType: newAccount.accountType,
				balance: newAccount.balance,
				currency: newAccount.currency,
			});
			setShowAddModal(false);
			setNewAccount({
				accountName: '',
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

	const handleEditAccount = (account: BankAccount) => {
		setEditingAccount(account);
		setNewAccount({
			accountName: account.accountName,
			bankName: account.bankName,
			accountNumber: account.accountNumber || '',
			accountType: account.accountType,
			balance: account.balance || 0,
			currency: account.currency || 'INR',
		});
		setBalanceInput(account.balance?.toString() || '0');
		setShowEditModal(true);
	};

	const handleBalanceChange = (text: string) => {
		let cleanedText = text.replace(/[^0-9.]/g, '');
		const decimalCount = (cleanedText.match(/\./g) || []).length;
		if (decimalCount > 1) {
			cleanedText = cleanedText.slice(0, -1);
		}

		const decimalIndex = cleanedText.indexOf('.');
		if (decimalIndex !== -1) {
			const decimalPart = cleanedText.substring(decimalIndex + 1);
			if (decimalPart.length > 2) {
				cleanedText = cleanedText.substring(0, decimalIndex + 3);
			}
		}

		setBalanceInput(cleanedText);

		const parsedValue = cleanedText === '' ? 0 : parseFloat(cleanedText);
		if (!isNaN(parsedValue)) {
			setNewAccount({
				...newAccount,
				balance: parseFloat(parsedValue.toFixed(2)),
			});
		}
	};

	const handleUpdateAccount = async (): Promise<void> => {
		if (
			!editingAccount ||
			!newAccount?.bankName?.trim() ||
			!newAccount?.accountNumber?.trim()
		) {
			Alert.alert('Error', 'Please fill in all required fields');
			return;
		}

		if (newAccount.balance < 0) {
			Alert.alert('Error', 'Balance cannot be negative');
			return;
		}
		const cleanedAccountNumber = newAccount.accountNumber.replace(/\D/g, '');

		const accountNumberRegex = /^\d+$/;
		if (!accountNumberRegex.test(cleanedAccountNumber)) {
			Alert.alert('Error', 'Please enter a valid account number');
			return;
		}

		if (cleanedAccountNumber.length < 9) {
			Alert.alert('Error', 'Account number should be at least 9 digits long');
			return;
		}

		setIsSubmitting(true);
		try {
			await assetService.updateBankAccount(userId, editingAccount.id, {
				accountName: newAccount.accountName || newAccount.bankName,
				bankName: newAccount.bankName,
				accountNumber: cleanedAccountNumber,
				accountType: newAccount.accountType,
				balance: newAccount.balance,
				currency: newAccount.currency,
			});
			setShowEditModal(false);
			setEditingAccount(null);
			setNewAccount({
				accountName: '',
				bankName: '',
				accountNumber: '',
				accountType: 'Savings',
				balance: 0,
				currency: 'INR',
			});
			onRefresh();
			Alert.alert('Success', 'Bank account updated successfully!');
		} catch (error) {
			console.error('Error updating bank account:', error);
			Alert.alert('Error', 'Failed to update bank account');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteAccount = async (
		accountId: string,
		accountName: string
	): Promise<void> => {
		if (onDelete) {
			onDelete('cash', accountId);
		} else {
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
		}
	};

	const totalBalance = accounts.reduce(
		(sum, account) => sum + (account.balance || 0),
		0
	);

	const renderAccountCard = (account: BankAccount) => (
		<TouchableOpacity
			key={account.id}
			style={[
				styles.card,
				{
					marginBottom: 12,
					borderLeftWidth: 4,
					borderLeftColor: getAccountTypeColor(account.accountType),
					padding: 16,
				},
			]}
			onPress={() => handleEditAccount(account)}
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
				<View style={{ flex: 1, justifyContent: 'center' }}>
					<View style={[styles.row, styles.spaceBetween]}>
						<View style={{ flex: 1 }}>
							<Text
								style={{
									fontWeight: 'bold',
									color: colors.dark,
									fontSize: 16,
								}}
							>
								{account.accountName}
							</Text>
							<Text style={{ color: colors.gray, fontSize: 12 }}>
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
								{formatCurrency(account.balance || 0)}
							</Text>
							<Text style={{ color: colors.gray, fontSize: 12 }}>
								{account.currency}
							</Text>
						</View>
					</View>

					<View style={[styles.row, { alignItems: 'center', marginTop: 6 }]}>
						<Text style={{ color: colors.gray, fontSize: 12 }}>
							{getDisplayAccountNumber(account)} • {account.accountType} Account
						</Text>
						<TouchableOpacity
							onPress={() => toggleAccountNumberVisibility(account.id)}
							style={{ marginLeft: 8, padding: 4 }}
						>
							<Ionicons
								name={unmaskedAccounts.has(account.id) ? 'eye-off' : 'eye'}
								size={16}
								color={colors.gray}
							/>
						</TouchableOpacity>
					</View>

					{account.interestRate && (
						<Text style={{ color: colors.success, fontSize: 10, marginTop: 4 }}>
							Interest Rate: {account.interestRate}%
						</Text>
					)}

					<Text style={{ color: colors.gray, fontSize: 10, marginTop: 4 }}>
						Last updated:{' '}
						{new Date(
							account.lastUpdated || account.createdAt || new Date()
						).toLocaleDateString()}
					</Text>
					<View
						style={[styles.row, { marginTop: 12, justifyContent: 'flex-end' }]}
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
								handleDeleteAccount(account.id, account.accountName)
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

	const renderAddEditModal = (isEdit: boolean) => (
		<Modal
			visible={isEdit ? showEditModal : showAddModal}
			animationType='slide'
			transparent={true}
			onRequestClose={() => {
				if (isEdit) {
					setShowEditModal(false);
					setEditingAccount(null);
				} else {
					setShowAddModal(false);
				}
				setShowBankDropdown(false);
				setBankSearch('');
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
							{isEdit ? 'Edit Bank Account' : 'Add Bank Account'}
						</Text>
						<TextInput
							style={styles.input}
							placeholder='Account Name (Optional)'
							value={newAccount.accountName}
							onChangeText={(text) =>
								setNewAccount({ ...newAccount, accountName: text })
							}
							placeholderTextColor={colors.gray}
						/>

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
							onChangeText={(text) => {
								const cleanedText = text.replace(/\D/g, '');
								setNewAccount({ ...newAccount, accountNumber: cleanedText });
							}}
							placeholderTextColor={colors.gray}
							keyboardType='number-pad'
							maxLength={18}
						/>
						<TextInput
							style={styles.input}
							placeholder='Balance (₹)'
							value={balanceInput}
							onChangeText={handleBalanceChange}
							placeholderTextColor={colors.gray}
							keyboardType='decimal-pad'
						/>
						<View style={[styles.row, { gap: 12, marginTop: 16 }]}>
							<TouchableOpacity
								style={[styles.button, styles.buttonSecondary, { flex: 1 }]}
								onPress={() => {
									if (isEdit) {
										setShowEditModal(false);
										setEditingAccount(null);
									} else {
										setShowAddModal(false);
									}
									setShowBankDropdown(false);
									setBankSearch('');
									setNewAccount({
										accountName: '',
										bankName: '',
										accountNumber: '',
										accountType: 'Savings',
										balance: 0,
										currency: 'INR',
									});
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
									{isSubmitting ? 'Saving...' : isEdit ? 'Update' : 'Add'}
								</Text>
							</TouchableOpacity>
						</View>
					</ScrollView>
				</View>
			</View>
		</Modal>
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
			<Text style={[styles.subHeading, { marginTop: 24, marginBottom: 16 }]}>
				Bank Accounts
			</Text>
			{accounts.length === 0 ? (
				<View
					style={[
						styles.card,
						styles.center,
						{ minHeight: 200, marginBottom: 16 },
					]}
				>
					<Text style={{ color: colors.gray }}>No bank accounts found</Text>
					<Text style={{ color: colors.gray, fontSize: 12, marginTop: 8 }}>
						Add your first bank account to get started
					</Text>
				</View>
			) : (
				<ScrollView
					showsVerticalScrollIndicator={false}
					style={{ maxHeight: 400 }}
					contentContainerStyle={{ flexGrow: 1 }}
				>
					{accounts.map(renderAccountCard)}
				</ScrollView>
			)}
			<TouchableOpacity
				style={[styles.button, styles.buttonPrimary, { marginTop: 16 }]}
				onPress={() => setShowAddModal(true)}
			>
				<Text style={styles.buttonText}>+ Add Bank Account</Text>
			</TouchableOpacity>
			{renderAddEditModal(false)}
			{renderAddEditModal(true)}
		</View>
	);
};
