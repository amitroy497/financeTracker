import { NPSBanner } from '@/icons';
import { assetService } from '@/services/assetService';
import { createStyles } from '@/styles';
import { useTheme } from '@/theme';
import {
	CreateNPSData,
	NationalPensionScheme,
	NPSAccountsProps,
} from '@/types';
import { formatCurrency, formatNumber } from '@/utils';
import React, { useState } from 'react';
import {
	Alert,
	Modal,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { AddDetailsButton, AddEditFields, Banner, CardsView } from '../UI';

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

	// Add state for input strings to allow decimal typing
	const [totalContributionInput, setTotalContributionInput] =
		useState<string>('');
	const [currentValueInput, setCurrentValueInput] = useState<string>('');

	const getReturnColor = (returns: number): string => {
		return returns >= 0 ? colors.success : colors.danger;
	};

	// Handle decimal input with proper validation
	const handleDecimalInput = (
		text: string,
		type: 'totalContribution' | 'currentValue'
	) => {
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

		// Limit to 2 decimal places for both fields
		const decimalIndex = cleanedText.indexOf('.');
		if (decimalIndex !== -1) {
			const decimalPart = cleanedText.substring(decimalIndex + 1);
			if (decimalPart.length > 2) {
				cleanedText = cleanedText.substring(0, decimalIndex + 3);
			}
		}

		// Update the appropriate input state
		if (type === 'totalContribution') {
			setTotalContributionInput(cleanedText);
		} else {
			setCurrentValueInput(cleanedText);
		}

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
			[type]: parsedValue,
		});
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

	// Format number for display (show empty string for 0)
	const formatNumberForInput = (num: number): string => {
		if (num === 0) return '';
		return num.toString();
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
			resetForm();
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
		// Set input strings for display
		setTotalContributionInput(
			formatNumberForInput(account.totalContribution || 0)
		);
		setCurrentValueInput(formatNumberForInput(account.currentValue || 0));
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
			resetForm();
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

	// Reset form function
	const resetForm = () => {
		setNewAccount({
			pranNumber: '',
			totalContribution: 0,
			currentValue: 0,
			lastContributionDate: new Date().toISOString().split('T')[0],
			notes: '',
		});
		setTotalContributionInput('');
		setCurrentValueInput('');
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

	const renderAccountCard = (account: NationalPensionScheme) => {
		const returns = account.returns || 0;
		const absoluteReturns = account.currentValue - account.totalContribution;

		return (
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
								color: getReturnColor(returns),
								fontSize: 12,
								fontWeight: 'bold',
							}}
						>
							{returns >= 0 ? '+' : ''}
							{formatNumber(returns)}%
						</Text>
					</View>
				</View>

				<View style={[styles.row, styles.spaceBetween, { marginBottom: 4 }]}>
					<Text style={{ color: colors.gray, fontSize: 12 }}>
						Contribution: {formatCurrency(account.totalContribution || 0)}
					</Text>
					<Text style={{ color: colors.gray, fontSize: 12 }}>
						Returns: {formatCurrency(absoluteReturns)}
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
				<View
					style={[styles.row, { marginTop: 12, justifyContent: 'flex-end' }]}
				>
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
						<Text style={{ color: colors.danger, fontSize: 12 }}>
							🗑️ Delete
						</Text>
					</TouchableOpacity>
				</View>
			</TouchableOpacity>
		);
	};

	// Get input fields for modal
	const getModalInputFields = (isEdit: boolean) => {
		const inputFields = [
			{
				id: 'pranNumber',
				label: 'PRAN Number',
				placeholder: 'PRAN Number (Optional)',
				value: newAccount.pranNumber,
				onChangeText: (text: string) =>
					setNewAccount({ ...newAccount, pranNumber: text.toUpperCase() }),
				isMandatory: false,
			},
			{
				id: 'totalContribution',
				label: 'Total Contribution',
				placeholder: 'Total Contribution (₹)',
				value: totalContributionInput,
				onChangeText: (text: string) =>
					handleDecimalInput(text, 'totalContribution'),
				keyboardType: 'decimal-pad',
				isMandatory: true,
			},
			{
				id: 'currentValue',
				label: 'Current Value',
				placeholder: 'Current Portfolio Value (₹)',
				value: currentValueInput,
				onChangeText: (text: string) =>
					handleDecimalInput(text, 'currentValue'),
				keyboardType: 'decimal-pad',
				isMandatory: true,
			},
			{
				id: 'lastContributionDate',
				isDatePicker: true,
				onPressOpen: () => openDatePicker(),
				value: formatDate(newAccount.lastContributionDate as string),
				showDatePicker: showDatePicker,
				handleDateChange: handleDateChange,
				selectedDate: selectedDate,
				label: 'Last Contribution Date',
			},
			{
				id: 'notes',
				label: 'Notes',
				placeholder: 'Notes (Optional)',
				value: newAccount.notes,
				onChangeText: (text: string) =>
					setNewAccount({ ...newAccount, notes: text }),
				multiline: true,
				numberOfLines: 3,
				isMandatory: false,
			},
		];

		return inputFields;
	};

	const renderAddEditModal = (isEdit: boolean) => {
		const inputFields = getModalInputFields(isEdit);
		const totalContribution = newAccount.totalContribution || 0;
		const currentValue = newAccount.currentValue || 0;
		const absoluteReturns = currentValue - totalContribution;
		const returnPercentage =
			totalContribution > 0 ? (absoluteReturns / totalContribution) * 100 : 0;

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
								{isEdit ? 'Edit NPS Account' : 'Add NPS Account'}
							</Text>

							{/* Current Values Summary */}
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
								<View
									style={[styles.row, styles.spaceBetween, { marginBottom: 2 }]}
								>
									<Text style={{ color: colors.dark, fontSize: 12 }}>
										Contribution: {formatCurrency(totalContribution)}
									</Text>
									<Text style={{ color: colors.dark, fontSize: 12 }}>
										Current: {formatCurrency(currentValue)}
									</Text>
								</View>
								{newAccount.lastContributionDate && (
									<Text style={{ color: colors.dark, fontSize: 12 }}>
										Last Contribution:{' '}
										{formatDate(newAccount.lastContributionDate as string)}
									</Text>
								)}
								{absoluteReturns !== 0 && (
									<Text
										style={{
											color: getReturnColor(absoluteReturns),
											fontSize: 12,
											fontWeight: 'bold',
											marginTop: 4,
										}}
									>
										Returns: {formatCurrency(absoluteReturns)} (
										{formatNumber(returnPercentage)}%)
									</Text>
								)}
							</View>

							<AddEditFields fields={inputFields} />

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
										{isSubmitting
											? 'Saving...'
											: isEdit
											? 'Update Account'
											: 'Add Account'}
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
			<Banner
				image={NPSBanner}
				title='NPS Portfolio Value'
				amount={totalCurrentValue}
			>
				<View style={[styles.row, styles.spaceBetween, { marginTop: 8 }]}>
					<View>
						<Text style={{ fontSize: 12, color: colors.platinum }}>
							Total Contribution
						</Text>
						<Text
							style={{
								fontSize: 14,
								fontWeight: 'bold',
								color: colors.platinum,
							}}
						>
							{formatCurrency(totalContribution)}
						</Text>
					</View>

					<View style={{ alignItems: 'flex-end' }}>
						<Text style={{ fontSize: 12, color: colors.platinum }}>
							Returns
						</Text>
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
			</Banner>

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
				<CardsView details={accounts} renderCard={renderAccountCard} />
			)}

			<AddDetailsButton
				label='NPS Account'
				onPress={() => setShowAddModal(true)}
			/>

			{/* Modals */}
			{renderAddEditModal(false)}
			{renderAddEditModal(true)}
		</View>
	);
};
