import { assetService } from '@/services/assetService';
import { colors, styles } from '@/styles';
import { CreateNPSData, NationalPensionScheme } from '@/types';
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

interface NPSAccountsProps {
	accounts: NationalPensionScheme[];
	onRefresh: () => void;
	userId: string;
}

export const NPSAccounts: React.FC<NPSAccountsProps> = ({
	accounts,
	onRefresh,
	userId,
}) => {
	const [showAddModal, setShowAddModal] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [newAccount, setNewAccount] = useState<CreateNPSData>({
		pranNumber: '',
		totalContribution: 0,
		currentValue: 0,
		lastContributionDate: new Date().toISOString().split('T')[0],
	});

	const formatCurrency = (amount: number): string => {
		return new Intl.NumberFormat('en-IN', {
			style: 'currency',
			currency: 'INR',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(amount);
	};

	const getReturnColor = (returns: number): string => {
		return returns >= 0 ? colors.success : colors.danger;
	};

	const handleAddAccount = async (): Promise<void> => {
		if (!newAccount.pranNumber.trim()) {
			Alert.alert('Error', 'Please enter PRAN number');
			return;
		}

		if (newAccount.totalContribution <= 0) {
			Alert.alert('Error', 'Total contribution must be greater than 0');
			return;
		}

		if (newAccount.currentValue <= 0) {
			Alert.alert('Error', 'Current value must be greater than 0');
			return;
		}

		setIsSubmitting(true);
		try {
			await assetService.createNPS(userId, newAccount);
			setShowAddModal(false);
			setNewAccount({
				pranNumber: '',
				totalContribution: 0,
				currentValue: 0,
				lastContributionDate: new Date().toISOString().split('T')[0],
			});
			onRefresh();
			Alert.alert('Success', 'NPS account added successfully!');
		} catch (error) {
			console.error('Error adding NPS account:', error);
			Alert.alert('Error', 'Failed to add NPS account');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteAccount = async (
		accountId: string,
		pranNumber: string
	): Promise<void> => {
		Alert.alert(
			'Delete NPS Account',
			`Are you sure you want to delete NPS account ${pranNumber}?`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: async () => {
						try {
							await assetService.deleteNPS(userId, accountId);
							onRefresh();
							Alert.alert('Success', 'NPS account deleted successfully!');
						} catch (error) {
							console.error('Error deleting NPS account:', error);
							Alert.alert('Error', 'Failed to delete NPS account');
						}
					},
				},
			]
		);
	};

	const totalCurrentValue = accounts.reduce(
		(sum, account) => sum + account.currentValue,
		0
	);
	const totalContribution = accounts.reduce(
		(sum, account) => sum + account.totalContribution,
		0
	);
	const totalReturns = totalCurrentValue - totalContribution;
	const totalReturnPercentage =
		totalContribution > 0 ? (totalReturns / totalContribution) * 100 : 0;

	return (
		<View style={{ padding: 20 }}>
			{/* Summary Card */}
			<View style={[styles.card, { backgroundColor: colors.lightGray }]}>
				<View style={[styles.row, styles.spaceBetween, { marginBottom: 12 }]}>
					<View>
						<Text style={{ fontSize: 14, color: colors.gray }}>
							NPS Portfolio Value
						</Text>
						<Text
							style={{
								fontSize: 24,
								fontWeight: 'bold',
								color: colors.dark,
								marginTop: 4,
							}}
						>
							{formatCurrency(totalCurrentValue)}
						</Text>
					</View>
					<Text style={{ fontSize: 24 }}>👵</Text>
				</View>

				<View style={[styles.row, styles.spaceBetween]}>
					<View>
						<Text style={{ fontSize: 12, color: colors.gray }}>
							Total Contribution
						</Text>
						<Text
							style={{ fontSize: 14, fontWeight: 'bold', color: colors.dark }}
						>
							{formatCurrency(totalContribution)}
						</Text>
					</View>

					<View style={{ alignItems: 'flex-end' }}>
						<Text style={{ fontSize: 12, color: colors.gray }}>Returns</Text>
						<Text
							style={{
								fontSize: 14,
								fontWeight: 'bold',
								color: getReturnColor(totalReturns),
							}}
						>
							{formatCurrency(totalReturns)} ({totalReturnPercentage.toFixed(2)}
							%)
						</Text>
					</View>
				</View>
			</View>

			{/* NPS Accounts List */}
			<Text style={[styles.subHeading, { marginTop: 24, marginBottom: 16 }]}>
				National Pension Scheme Accounts
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
								borderLeftColor: colors.dark,
							},
						]}
						onLongPress={() =>
							handleDeleteAccount(account.id, account.pranNumber)
						}
					>
						<View
							style={[
								styles.row,
								styles.spaceBetween,
								{ alignItems: 'flex-start', marginBottom: 8 },
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
									NPS Account
								</Text>
								<Text style={{ color: colors.gray, fontSize: 12 }}>
									PRAN: {account.pranNumber}
								</Text>
							</View>

							<View style={{ alignItems: 'flex-end' }}>
								<Text
									style={{
										fontWeight: 'bold',
										color: colors.dark,
										fontSize: 16,
									}}
								>
									{formatCurrency(account.currentValue)}
								</Text>
								<Text
									style={{
										color: getReturnColor(account.returns),
										fontSize: 12,
										fontWeight: 'bold',
									}}
								>
									{account.returns >= 0 ? '+' : ''}
									{account.returns.toFixed(2)}%
								</Text>
							</View>
						</View>

						<View
							style={[styles.row, styles.spaceBetween, { marginBottom: 4 }]}
						>
							<Text style={{ color: colors.gray, fontSize: 12 }}>
								Contribution: {formatCurrency(account.totalContribution)}
							</Text>
							<Text style={{ color: colors.gray, fontSize: 12 }}>
								Current: {formatCurrency(account.currentValue)}
							</Text>
						</View>

						<View style={[styles.row, styles.spaceBetween]}>
							<Text style={{ color: colors.gray, fontSize: 12 }}>
								Last Contribution:{' '}
								{new Date(account.lastContributionDate).toLocaleDateString()}
							</Text>
							<Text style={{ color: colors.gray, fontSize: 12 }}>
								Updated: {new Date(account.lastUpdated).toLocaleDateString()}
							</Text>
						</View>
					</TouchableOpacity>
				))}
			</ScrollView>

			{/* Add New NPS Account Modal */}
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
							Add NPS Account
						</Text>

						<TextInput
							style={styles.input}
							placeholder='PRAN Number'
							value={newAccount.pranNumber}
							onChangeText={(text) =>
								setNewAccount({ ...newAccount, pranNumber: text.toUpperCase() })
							}
							placeholderTextColor={colors.gray}
						/>

						<TextInput
							style={styles.input}
							placeholder='Total Contribution'
							value={newAccount.totalContribution.toString()}
							onChangeText={(text) =>
								setNewAccount({
									...newAccount,
									totalContribution: parseFloat(text) || 0,
								})
							}
							placeholderTextColor={colors.gray}
							keyboardType='decimal-pad'
						/>

						<TextInput
							style={styles.input}
							placeholder='Current Portfolio Value'
							value={newAccount.currentValue.toString()}
							onChangeText={(text) =>
								setNewAccount({
									...newAccount,
									currentValue: parseFloat(text) || 0,
								})
							}
							placeholderTextColor={colors.gray}
							keyboardType='decimal-pad'
						/>

						<TextInput
							style={styles.input}
							placeholder='Last Contribution Date (YYYY-MM-DD)'
							value={newAccount.lastContributionDate}
							onChangeText={(text) =>
								setNewAccount({ ...newAccount, lastContributionDate: text })
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
									{isSubmitting ? 'Adding...' : 'Add NPS Account'}
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			{/* Add New NPS Account Button */}
			<TouchableOpacity
				style={[styles.button, styles.buttonPrimary, { marginTop: 16 }]}
				onPress={() => setShowAddModal(true)}
			>
				<Text style={styles.buttonText}>+ Add NPS Account</Text>
			</TouchableOpacity>
		</View>
	);
};
