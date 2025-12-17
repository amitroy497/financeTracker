import { getBankIcon } from '@/assets';
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
	Image,
	KeyboardType,
	Modal,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { AddEditFields, EditDeleteButtons } from '../UI';

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

	// Bank dropdown states
	const [showBankDropdown, setShowBankDropdown] = useState(false);
	const [bankSearch, setBankSearch] = useState('');

	// Account type dropdown states
	const [showAccountTypeDropdown, setShowAccountTypeDropdown] = useState(false);
	// Add search state for account type if needed
	const [accountTypeSearch, setAccountTypeSearch] = useState('');

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
		accountType: '',
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

	const handleSelectAccountType = (type: string): void => {
		console.log('Account type selected:', type);
		setNewAccount({
			...newAccount,
			accountType: type,
		});
		setShowAccountTypeDropdown(false);
		setAccountTypeSearch('');
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
			resetForm();
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
			resetForm();
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

	const resetForm = () => {
		setNewAccount({
			accountName: '',
			bankName: '',
			accountNumber: '',
			accountType: 'Savings',
			balance: 0,
			currency: 'INR',
		});
		setBalanceInput('0');
		setShowBankDropdown(false);
		setShowAccountTypeDropdown(false);
		setBankSearch('');
		setAccountTypeSearch('');
	};

	const totalBalance = accounts.reduce(
		(sum, account) => sum + (account.balance || 0),
		0
	);

	const accountTypeOptions = ['Savings', 'Current', 'Salary'];

	const renderAccountCard = (account: BankAccount) => (
		<View
			key={account.id}
			style={[
				styles.card,
				{
					marginBottom: 12,
					borderLeftWidth: 4,
					borderLeftColor: getAccountTypeColor(account.accountType),
					paddingVertical: 16,
					paddingHorizontal: 8,
				},
			]}
		>
			<View style={[styles.row]}>
				<View
					style={{
						alignItems: 'flex-start',
						justifyContent: 'flex-start',
					}}
				>
					<Image
						source={getBankIcon(account.bankName)}
						style={{
							width: 30,
							height: 30,
							marginRight: 12,
							borderRadius: 8,
						}}
						resizeMode='contain'
					/>
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

					<View style={{ marginTop: 6 }}>
						<View style={[styles.row, { justifyContent: 'space-between' }]}>
							<Text style={{ color: colors.gray, fontSize: 12 }}>
								{getDisplayAccountNumber(account)}
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
						<Text style={{ color: colors.gray, fontSize: 12 }}>
							{account.accountType} Account
						</Text>
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
					<EditDeleteButtons
						onPressEdit={() => handleEditAccount(account)}
						onPressDelete={() =>
							handleDeleteAccount(account.id, account.accountName)
						}
					/>
				</View>
			</View>
		</View>
	);

	const getModalFormFields = (isEdit: boolean) => {
		const fields = [
			{
				id: 'accountName',
				label: 'Account Name',
				placeholder: 'Account Name (Optional)',
				value: newAccount.accountName || '',
				onChangeText: (text: string) =>
					setNewAccount({ ...newAccount, accountName: text }),
				keyboardType: 'default' as KeyboardType,
				isMandatory: false,
			},
			{
				id: 'bankName',
				label: 'Select Bank',
				placeholder: 'Search banks...',
				value: newAccount.bankName || '',
				onChangeText: undefined,
				isSelectDropDown: true,
				isMandatory: true,
				dropdownProps: {
					showDropDown: showBankDropdown,
					setShowDropDown: setShowBankDropdown,
					dropDownName: newAccount.bankName || '',
					dropDownAlternativeName: newAccount.bankName || 'Select a bank',
					dropdownSearchValue: bankSearch,
					setDropDownSearchValue: setBankSearch,
					dropdownOptions: filteredBanks,
					handleDropDownSelectOption: handleSelectBank,
					dropDownNotFoundText: 'No banks found',
				},
			},
			{
				id: 'accountNumber',
				label: 'Account Number',
				placeholder: 'Account Number',
				value: newAccount.accountNumber || '',
				onChangeText: (text: string) => {
					const cleanedText = text.replace(/\D/g, '');
					setNewAccount({ ...newAccount, accountNumber: cleanedText });
				},
				keyboardType: 'number-pad' as KeyboardType,
				maxLength: 18,
				isMandatory: true,
			},
			{
				id: 'accountType',
				label: 'Account Type',
				placeholder: 'Select Account Type',
				value: newAccount.accountType,
				onChangeText: undefined,
				isSelectDropDown: true,
				isMandatory: true,
				dropdownProps: {
					showDropDown: showAccountTypeDropdown,
					setShowDropDown: setShowAccountTypeDropdown,
					dropDownName: newAccount.accountType || '',
					dropDownAlternativeName:
						newAccount.accountType || 'Select Account Type',
					dropdownSearchValue: accountTypeSearch,
					setDropDownSearchValue: setAccountTypeSearch,
					dropdownOptions: accountTypeOptions,
					handleDropDownSelectOption: handleSelectAccountType,
					dropDownNotFoundText: 'No account types found',
				},
			},
			{
				id: 'balance',
				label: 'Balance',
				placeholder: 'Balance (₹)',
				value: balanceInput,
				onChangeText: handleBalanceChange,
				keyboardType: 'decimal-pad' as KeyboardType,
				isMandatory: true,
			},
		];

		return fields;
	};

	const renderAddEditModal = (isEdit: boolean) => {
		const formFields = getModalFormFields(isEdit);

		return (
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
								{isEdit ? 'Edit Bank Account' : 'Add Bank Account'}
							</Text>
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
								<Text style={{ color: colors.dark, fontSize: 12 }}>
									Balance: {formatCurrency(newAccount.balance)} | Account Type:{' '}
									{newAccount.accountType}
								</Text>
								{newAccount.accountNumber && (
									<Text
										style={{ color: colors.dark, fontSize: 12, marginTop: 2 }}
									>
										Account Number:{' '}
										{maskAccountNumber(newAccount.accountNumber)}
									</Text>
								)}
							</View>

							{newAccount.bankName && (
								<View
									style={[
										styles.row,
										{ alignItems: 'center', marginBottom: 12 },
									]}
								>
									<Image
										source={getBankIcon(newAccount.bankName)}
										style={{
											width: 24,
											height: 24,
											marginRight: 8,
											borderRadius: 6,
										}}
										resizeMode='contain'
									/>
									<Text style={{ color: colors.dark, fontSize: 14 }}>
										Selected: {newAccount.bankName}
									</Text>
								</View>
							)}

							<AddEditFields fields={formFields} />

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
										{isSubmitting ? 'Saving...' : isEdit ? 'Update' : 'Add'}
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
