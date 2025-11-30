import { assetService } from '@/services/assetService';
import { colors, styles } from '@/styles';
import { BankAccount, CreateBankAccountData } from '@/types';
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

	const getBankIcon = (bankName: string): string => {
		const bankIcons: { [key: string]: string } = {
			'Axis Bank': '🏦',
			'Kotak Mahindra Bank': '💳',
			'HDFC Bank': '🏛️',
			'ICICI Bank': '🏢',
			SBI: '🇮🇳',
			Default: '🏦',
		};

		return bankIcons[bankName] || bankIcons['Default'];
	};

	const getAccountTypeColor = (type: string): string => {
		const colorsMap: { [key: string]: string } = {
			Savings: colors.success,
			Current: colors.primary,
			Salary: colors.info,
		};

		return colorsMap[type] || colors.gray;
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
			{/* Summary Card */}
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
						<View
							style={[
								styles.row,
								styles.spaceBetween,
								{ alignItems: 'flex-start' },
							]}
						>
							<View style={[styles.row, { alignItems: 'flex-start', flex: 1 }]}>
								<Text style={{ fontSize: 20, marginRight: 12, marginTop: 2 }}>
									{getBankIcon(account.bankName)}
								</Text>
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
									<Text
										style={{ color: colors.gray, fontSize: 12, marginTop: 2 }}
									>
										{account.accountNumber} • {account.accountType} Account
									</Text>
									<Text
										style={{ color: colors.gray, fontSize: 10, marginTop: 4 }}
									>
										Last updated:{' '}
										{new Date(account.lastUpdated).toLocaleDateString()}
									</Text>
								</View>
							</View>

							<View style={{ alignItems: 'flex-end' }}>
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
					</TouchableOpacity>
				))}
			</ScrollView>

			{/* Add New Account Modal */}
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
							Add Bank Account
						</Text>

						<TextInput
							style={styles.input}
							placeholder='Bank Name'
							value={newAccount.bankName}
							onChangeText={(text) =>
								setNewAccount({ ...newAccount, bankName: text })
							}
							placeholderTextColor={colors.gray}
						/>

						<TextInput
							style={styles.input}
							placeholder='Account Number'
							value={newAccount.accountNumber}
							onChangeText={(text) =>
								setNewAccount({ ...newAccount, accountNumber: text })
							}
							placeholderTextColor={colors.gray}
							keyboardType='number-pad'
						/>

						<TextInput
							style={styles.input}
							placeholder='Balance'
							value={newAccount.balance.toString()}
							onChangeText={(text) =>
								setNewAccount({ ...newAccount, balance: parseFloat(text) || 0 })
							}
							placeholderTextColor={colors.gray}
							keyboardType='decimal-pad'
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
									{isSubmitting ? 'Adding...' : 'Add Account'}
								</Text>
							</TouchableOpacity>
						</View>
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
