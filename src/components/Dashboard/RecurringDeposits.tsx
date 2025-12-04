import { assetService } from '@/services/assetService';
import { colors, styles } from '@/styles';
import { CreateRecurringDepositData, RecurringDepositsProps } from '@/types';
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

export const RecurringDeposits = ({
	deposits,
	onRefresh,
	userId,
}: RecurringDepositsProps) => {
	const [showAddModal, setShowAddModal] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [newDeposit, setNewDeposit] = useState<CreateRecurringDepositData>({
		bankName: '',
		accountNumber: '',
		monthlyAmount: 0,
		interestRate: 0,
		startDate: new Date().toISOString().split('T')[0],
		tenure: 12,
	});

	const formatCurrency = (amount: number): string => {
		return new Intl.NumberFormat('en-IN', {
			style: 'currency',
			currency: 'INR',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(amount);
	};

	const calculateProgress = (
		completedMonths: number,
		tenure: number
	): number => {
		return (completedMonths / tenure) * 100;
	};

	const calculateDaysToMaturity = (maturityDate: string): number => {
		const today = new Date();
		const maturity = new Date(maturityDate);
		const diffTime = maturity.getTime() - today.getTime();
		return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	};

	const handleAddDeposit = async (): Promise<void> => {
		if (!newDeposit.bankName.trim() || !newDeposit.accountNumber.trim()) {
			Alert.alert('Error', 'Please fill in all required fields');
			return;
		}

		if (newDeposit.monthlyAmount <= 0) {
			Alert.alert('Error', 'Monthly amount must be greater than 0');
			return;
		}

		if (newDeposit.interestRate <= 0) {
			Alert.alert('Error', 'Interest rate must be greater than 0');
			return;
		}

		setIsSubmitting(true);
		try {
			await assetService.createRecurringDeposit(userId, newDeposit);
			setShowAddModal(false);
			setNewDeposit({
				bankName: '',
				accountNumber: '',
				monthlyAmount: 0,
				interestRate: 0,
				startDate: new Date().toISOString().split('T')[0],
				tenure: 12,
			});
			onRefresh();
			Alert.alert('Success', 'Recurring deposit added successfully!');
		} catch (error) {
			console.error('Error adding recurring deposit:', error);
			Alert.alert('Error', 'Failed to add recurring deposit');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteDeposit = async (
		depositId: string,
		bankName: string
	): Promise<void> => {
		Alert.alert(
			'Delete Recurring Deposit',
			`Are you sure you want to delete ${bankName} RD?`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: async () => {
						try {
							await assetService.deleteRecurringDeposit(userId, depositId);
							onRefresh();
							Alert.alert('Success', 'Recurring deposit deleted successfully!');
						} catch (error) {
							console.error('Error deleting recurring deposit:', error);
							Alert.alert('Error', 'Failed to delete recurring deposit');
						}
					},
				},
			]
		);
	};

	const totalInvested = deposits.reduce(
		(sum, deposit) => sum + deposit.totalAmount,
		0
	);
	const totalMonthly = deposits.reduce(
		(sum, deposit) => sum + deposit.monthlyAmount,
		0
	);

	return (
		<View style={{ padding: 20 }}>
			{/* Summary Card */}
			<View style={[styles.card, { backgroundColor: colors.lightGray }]}>
				<View style={[styles.row, styles.spaceBetween]}>
					<View>
						<Text style={{ fontSize: 14, color: colors.gray }}>
							Total Recurring Deposits
						</Text>
						<Text
							style={{
								fontSize: 24,
								fontWeight: 'bold',
								color: colors.dark,
								marginTop: 4,
							}}
						>
							{formatCurrency(totalInvested)}
						</Text>
					</View>
					<Text style={{ fontSize: 24 }}>📈</Text>
				</View>
				<View style={[styles.row, { marginTop: 8 }]}>
					<Text style={{ fontSize: 12, color: colors.gray }}>
						Monthly investment: {formatCurrency(totalMonthly)}
					</Text>
				</View>
			</View>

			{/* Recurring Deposits List */}
			<Text style={[styles.subHeading, { marginTop: 24, marginBottom: 16 }]}>
				Recurring Deposits
			</Text>

			<ScrollView
				showsVerticalScrollIndicator={false}
				style={{ maxHeight: 400 }}
			>
				{deposits.map((deposit) => {
					const progress = calculateProgress(
						deposit.completedMonths,
						deposit.tenure
					);
					const daysToMaturity = calculateDaysToMaturity(deposit.maturityDate);

					return (
						<TouchableOpacity
							key={deposit.id}
							style={[styles.card, { marginBottom: 12 }]}
							onLongPress={() =>
								handleDeleteDeposit(deposit.id, deposit.bankName)
							}
						>
							<View
								style={[styles.row, styles.spaceBetween, { marginBottom: 12 }]}
							>
								<Text
									style={{
										fontWeight: 'bold',
										color: colors.dark,
										fontSize: 16,
									}}
								>
									{deposit.bankName}
								</Text>
								<Text
									style={{
										fontWeight: 'bold',
										color: colors.dark,
										fontSize: 16,
									}}
								>
									{formatCurrency(deposit.totalAmount)}
								</Text>
							</View>

							<Text
								style={{ color: colors.gray, fontSize: 12, marginBottom: 8 }}
							>
								{deposit.accountNumber} • {deposit.interestRate}% interest
							</Text>

							{/* Progress Bar */}
							<View style={{ marginBottom: 8 }}>
								<View
									style={{
										height: 6,
										backgroundColor: colors.lightGray,
										borderRadius: 3,
										overflow: 'hidden',
									}}
								>
									<View
										style={{
											height: '100%',
											backgroundColor: colors.primary,
											width: `${progress}%`,
											borderRadius: 3,
										}}
									/>
								</View>
								<View
									style={[styles.row, styles.spaceBetween, { marginTop: 4 }]}
								>
									<Text style={{ color: colors.gray, fontSize: 10 }}>
										{deposit.completedMonths}/{deposit.tenure} months
									</Text>
									<Text style={{ color: colors.gray, fontSize: 10 }}>
										{progress.toFixed(1)}%
									</Text>
								</View>
							</View>

							<View style={[styles.row, styles.spaceBetween]}>
								<Text style={{ color: colors.gray, fontSize: 12 }}>
									{formatCurrency(deposit.monthlyAmount)}/month
								</Text>
								<Text style={{ color: colors.gray, fontSize: 12 }}>
									Matures in {daysToMaturity} days
								</Text>
							</View>
						</TouchableOpacity>
					);
				})}
			</ScrollView>

			{/* Add New RD Modal */}
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
							Add Recurring Deposit
						</Text>

						<TextInput
							style={styles.input}
							placeholder='Bank Name'
							value={newDeposit.bankName}
							onChangeText={(text) =>
								setNewDeposit({ ...newDeposit, bankName: text })
							}
							placeholderTextColor={colors.gray}
						/>

						<TextInput
							style={styles.input}
							placeholder='Account Number'
							value={newDeposit.accountNumber}
							onChangeText={(text) =>
								setNewDeposit({ ...newDeposit, accountNumber: text })
							}
							placeholderTextColor={colors.gray}
						/>

						<TextInput
							style={styles.input}
							placeholder='Monthly Amount'
							value={newDeposit.monthlyAmount.toString()}
							onChangeText={(text) =>
								setNewDeposit({
									...newDeposit,
									monthlyAmount: parseFloat(text) || 0,
								})
							}
							placeholderTextColor={colors.gray}
							keyboardType='decimal-pad'
						/>

						<TextInput
							style={styles.input}
							placeholder='Interest Rate (%)'
							value={newDeposit.interestRate.toString()}
							onChangeText={(text) =>
								setNewDeposit({
									...newDeposit,
									interestRate: parseFloat(text) || 0,
								})
							}
							placeholderTextColor={colors.gray}
							keyboardType='decimal-pad'
						/>

						<TextInput
							style={styles.input}
							placeholder='Start Date (YYYY-MM-DD)'
							value={newDeposit.startDate}
							onChangeText={(text) =>
								setNewDeposit({ ...newDeposit, startDate: text })
							}
							placeholderTextColor={colors.gray}
						/>

						<TextInput
							style={styles.input}
							placeholder='Tenure (months)'
							value={newDeposit.tenure.toString()}
							onChangeText={(text) =>
								setNewDeposit({ ...newDeposit, tenure: parseInt(text) || 12 })
							}
							placeholderTextColor={colors.gray}
							keyboardType='number-pad'
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
								onPress={handleAddDeposit}
								disabled={isSubmitting}
							>
								<Text style={styles.buttonText}>
									{isSubmitting ? 'Adding...' : 'Add RD'}
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			{/* Add New RD Button */}
			<TouchableOpacity
				style={[styles.button, styles.buttonPrimary, { marginTop: 16 }]}
				onPress={() => setShowAddModal(true)}
			>
				<Text style={styles.buttonText}>+ Add Recurring Deposit</Text>
			</TouchableOpacity>
		</View>
	);
};
