import { assetService } from '@/services/assetService';
import { createStyles } from '@/styles';
import { useTheme } from '@/theme';
import {
	CreateNPSData,
	NationalPensionScheme,
	NPSAccountsProps,
} from '@/types';
import DateTimePicker from '@react-native-community/datetimepicker';
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

export const NPSAccounts = ({
	accounts,
	onEdit,
	onDelete,
	onRefresh,
	userId,
}: NPSAccountsProps) => {
	const { colors } = useTheme();
	const styles = createStyles(colors);
	const [showAddModal, setShowAddModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [selectedDate, setSelectedDate] = useState(new Date());
	const [editingAccount, setEditingAccount] =
		useState<NationalPensionScheme | null>(null);
	const [newAccount, setNewAccount] = useState<CreateNPSData>({
		pranNumber: '',
		totalContribution: 0,
		currentValue: 0,
		lastContributionDate: new Date().toISOString().split('T')[0],
		notes: '',
	});

	const formatCurrency = (amount: number): string => {
		return new Intl.NumberFormat('en-IN', {
			style: 'currency',
			currency: 'INR',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		}).format(amount);
	};

	const formatNumber = (num: number, decimals: number = 2): string => {
		return num.toFixed(decimals);
	};

	const getReturnColor = (returns: number): string => {
		return returns >= 0 ? colors.success : colors.danger;
	};

	// Handle numeric input with decimal validation
	const handleNumericInput = (field: keyof CreateNPSData, value: string) => {
		const decimalCount = (value.match(/\./g) || []).length;
		if (decimalCount > 1) return;

		const regex = /^\d*\.?\d*$/;
		if (!regex.test(value) && value !== '') return;

		const numValue = parseFloat(value) || 0;
		setNewAccount({ ...newAccount, [field]: numValue });
	};

	const handleAddAccount = async (): Promise<void> => {
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
				notes: '',
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

	const handleEditAccount = (account: NationalPensionScheme) => {
		setEditingAccount(account);
		setNewAccount({
			pranNumber: account.pranNumber || '',
			totalContribution: account.totalContribution || 0,
			currentValue: account.currentValue || 0,
			lastContributionDate:
				account.lastContributionDate || new Date().toISOString().split('T')[0],
			notes: account.notes || '',
		});
		setShowEditModal(true);
	};

	const handleUpdateAccount = async (): Promise<void> => {
		if (!editingAccount) {
			Alert.alert('Error', 'No account selected for editing');
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
			await assetService.updateNPS(userId, editingAccount.id, newAccount);
			setShowEditModal(false);
			setEditingAccount(null);
			setNewAccount({
				pranNumber: '',
				totalContribution: 0,
				currentValue: 0,
				lastContributionDate: new Date().toISOString().split('T')[0],
				notes: '',
			});
			onRefresh();
			Alert.alert('Success', 'NPS account updated successfully!');
		} catch (error) {
			console.error('Error updating NPS account:', error);
			Alert.alert('Error', 'Failed to update NPS account');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteAccount = async (
		accountId: string,
		pranNumber: string
	): Promise<void> => {
		// Use the onDelete prop if provided, otherwise use direct service call
		if (onDelete) {
			onDelete('nps', accountId);
		} else {
			Alert.alert(
				'Delete NPS Account',
				`Are you sure you want to delete NPS account ${
					pranNumber || 'this account'
				}?`,
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
		}
	};

	// Handle date picker
	const handleDateChange = (event: any, date?: Date) => {
		setShowDatePicker(false);
		if (date) {
			setSelectedDate(date);
			const formattedDate = date.toISOString().split('T')[0];
			setNewAccount({ ...newAccount, lastContributionDate: formattedDate });
		}
	};

	// Open date picker
	const openDatePicker = () => {
		// Set initial date from form data or current date
		if (newAccount.lastContributionDate) {
			setSelectedDate(new Date(newAccount.lastContributionDate));
		} else {
			setSelectedDate(new Date());
		}

		setShowDatePicker(true);
	};

	const formatDate = (dateString: string): string => {
		return new Date(dateString).toLocaleDateString('en-IN', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
		});
	};

	const totalCurrentValue = accounts.reduce(
		(sum, account) => sum + (account.currentValue || 0),
		0
	);
	const totalContribution = accounts.reduce(
		(sum, account) => sum + (account.totalContribution || 0),
		0
	);
	const totalReturns = totalCurrentValue - totalContribution;
	const totalReturnPercentage =
		totalContribution > 0 ? (totalReturns / totalContribution) * 100 : 0;

	const renderAccountCard = (account: NationalPensionScheme) => (
		<TouchableOpacity
			key={account.id}
			style={[
				styles.card,
				{
					marginBottom: 12,
					borderLeftWidth: 4,
					borderLeftColor: colors.dark,
					padding: 16,
				},
			]}
			onPress={() => handleEditAccount(account)}
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
						NPS Account {account.pranNumber ? `(${account.pranNumber})` : ''}
					</Text>
					{account.pranNumber && (
						<Text style={{ color: colors.gray, fontSize: 12 }}>
							PRAN: {account.pranNumber}
						</Text>
					)}
				</View>

				<View style={{ alignItems: 'flex-end' }}>
					<Text
						style={{
							fontWeight: 'bold',
							color: colors.dark,
							fontSize: 16,
						}}
					>
						{formatCurrency(account.currentValue || 0)}
					</Text>
					<Text
						style={{
							color: getReturnColor(account.returns || 0),
							fontSize: 12,
							fontWeight: 'bold',
						}}
					>
						{(account.returns || 0) >= 0 ? '+' : ''}
						{formatNumber(account.returns || 0)}%
					</Text>
				</View>
			</View>

			<View style={[styles.row, styles.spaceBetween, { marginBottom: 4 }]}>
				<Text style={{ color: colors.gray, fontSize: 12 }}>
					Contribution: {formatCurrency(account.totalContribution || 0)}
				</Text>
				<Text style={{ color: colors.gray, fontSize: 12 }}>
					Current: {formatCurrency(account.currentValue || 0)}
				</Text>
			</View>

			<View style={[styles.row, styles.spaceBetween]}>
				<Text style={{ color: colors.gray, fontSize: 12 }}>
					📅 Last Contribution:{' '}
					{formatDate(
						account.lastContributionDate ||
							new Date().toISOString().split('T')[0]
					)}
				</Text>
				<Text style={{ color: colors.gray, fontSize: 10 }}>
					Updated:{' '}
					{new Date(account.lastUpdated || new Date()).toLocaleDateString()}
				</Text>
			</View>

			{account.notes && (
				<Text
					style={{
						color: colors.gray,
						fontSize: 11,
						marginTop: 8,
						fontStyle: 'italic',
					}}
				>
					{account.notes}
				</Text>
			)}

			{/* Edit/Delete Buttons */}
			<View style={[styles.row, { marginTop: 12, justifyContent: 'flex-end' }]}>
				<TouchableOpacity
					style={{ marginRight: 16 }}
					onPress={() => handleEditAccount(account)}
				>
					<Text style={{ color: colors.primary, fontSize: 12 }}>✏️ Edit</Text>
				</TouchableOpacity>
				<TouchableOpacity
					onPress={() =>
						handleDeleteAccount(account.id, account.pranNumber || '')
					}
				>
					<Text style={{ color: colors.danger, fontSize: 12 }}>🗑️ Delete</Text>
				</TouchableOpacity>
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
				setNewAccount({
					pranNumber: '',
					totalContribution: 0,
					currentValue: 0,
					lastContributionDate: new Date().toISOString().split('T')[0],
					notes: '',
				});
			}}
		>
			<View
				style={{
					flex: 1,
					justifyContent: 'center',
					backgroundColor: 'rgba(0,0,0,0.5)',
				}}
			>
				<ScrollView style={{ maxHeight: '90%' }}>
					<View style={[styles.card, { margin: 20 }]}>
						<Text style={[styles.subHeading, { marginBottom: 16 }]}>
							{isEdit ? 'Edit NPS Account' : 'Add NPS Account'}
						</Text>

						<TextInput
							style={styles.input}
							placeholder='PRAN Number (Optional)'
							value={newAccount.pranNumber}
							onChangeText={(text) =>
								setNewAccount({ ...newAccount, pranNumber: text.toUpperCase() })
							}
							placeholderTextColor={colors.gray}
						/>

						<TextInput
							style={styles.input}
							placeholder='Total Contribution (₹)'
							value={newAccount.totalContribution.toString()}
							onChangeText={(text) =>
								handleNumericInput('totalContribution', text)
							}
							placeholderTextColor={colors.gray}
							keyboardType='decimal-pad'
						/>

						<TextInput
							style={styles.input}
							placeholder='Current Portfolio Value (₹)'
							value={newAccount.currentValue.toString()}
							onChangeText={(text) => handleNumericInput('currentValue', text)}
							placeholderTextColor={colors.gray}
							keyboardType='decimal-pad'
						/>

						<TouchableOpacity
							style={[styles.input, { justifyContent: 'center' }]}
							onPress={openDatePicker}
						>
							<Text style={{ color: colors.dark }}>
								📅 Last Contribution Date:{' '}
								{formatDate(newAccount?.lastContributionDate as string)}
							</Text>
						</TouchableOpacity>

						<TextInput
							style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
							placeholder='Notes (Optional)'
							value={newAccount.notes}
							onChangeText={(text) =>
								setNewAccount({ ...newAccount, notes: text })
							}
							placeholderTextColor={colors.gray}
							multiline
							numberOfLines={3}
						/>

						{/* Date Picker */}
						{showDatePicker && (
							<DateTimePicker
								value={selectedDate}
								mode='date'
								display='default'
								onChange={handleDateChange}
							/>
						)}

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
									setNewAccount({
										pranNumber: '',
										totalContribution: 0,
										currentValue: 0,
										lastContributionDate: new Date()
											.toISOString()
											.split('T')[0],
										notes: '',
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
									{isSubmitting
										? 'Saving...'
										: isEdit
										? 'Update Account'
										: 'Add Account'}
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</ScrollView>
			</View>
		</Modal>
	);

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
							{formatCurrency(totalReturns)} (
							{formatNumber(totalReturnPercentage)}%)
						</Text>
					</View>
				</View>
			</View>

			{/* NPS Accounts List */}
			<Text style={[styles.subHeading, { marginTop: 24, marginBottom: 16 }]}>
				National Pension Scheme Accounts
			</Text>

			{accounts.length === 0 ? (
				<View
					style={[
						styles.card,
						styles.center,
						{ minHeight: 200, marginBottom: 16 },
					]}
				>
					<Text style={{ color: colors.gray }}>No NPS accounts found</Text>
					<Text style={{ color: colors.gray, fontSize: 12, marginTop: 8 }}>
						Add your first NPS account to get started
					</Text>
				</View>
			) : (
				<ScrollView
					showsVerticalScrollIndicator={false}
					style={{ maxHeight: 400 }}
				>
					{accounts.map(renderAccountCard)}
				</ScrollView>
			)}

			{/* Add New NPS Account Button */}
			<TouchableOpacity
				style={[styles.button, styles.buttonPrimary, { marginTop: 16 }]}
				onPress={() => setShowAddModal(true)}
			>
				<Text style={styles.buttonText}>+ Add NPS Account</Text>
			</TouchableOpacity>

			{/* Modals */}
			{renderAddEditModal(false)}
			{renderAddEditModal(true)}
		</View>
	);
};
