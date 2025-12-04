import { assetService } from '@/services/assetService';
import { createStyles } from '@/styles';
import { useTheme } from '@/theme';
import { CreateFixedDepositData, FixedDepositsProps } from '@/types';
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

export const FixedDeposits = ({
	deposits,
	onRefresh,
	userId,
}: FixedDepositsProps) => {
	const { colors } = useTheme();
	const styles = createStyles(colors);
	const [showAddModal, setShowAddModal] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [newDeposit, setNewDeposit] = useState<CreateFixedDepositData>({
		bankName: '',
		depositNumber: '',
		amount: 0,
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

	const calculateDaysToMaturity = (maturityDate: string): number => {
		const today = new Date();
		const maturity = new Date(maturityDate);
		const diffTime = maturity.getTime() - today.getTime();
		return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	};

	const getStatusColor = (status: string): string => {
		return status === 'Active' ? colors.success : colors.gray;
	};

	const handleAddDeposit = async (): Promise<void> => {
		if (!newDeposit.bankName.trim() || !newDeposit.depositNumber.trim()) {
			Alert.alert('Error', 'Please fill in all required fields');
			return;
		}

		if (newDeposit.amount <= 0) {
			Alert.alert('Error', 'Amount must be greater than 0');
			return;
		}

		if (newDeposit.interestRate <= 0) {
			Alert.alert('Error', 'Interest rate must be greater than 0');
			return;
		}

		setIsSubmitting(true);
		try {
			await assetService.createFixedDeposit(userId, newDeposit);
			setShowAddModal(false);
			setNewDeposit({
				bankName: '',
				depositNumber: '',
				amount: 0,
				interestRate: 0,
				startDate: new Date().toISOString().split('T')[0],
				tenure: 12,
			});
			onRefresh();
			Alert.alert('Success', 'Fixed deposit added successfully!');
		} catch (error) {
			console.error('Error adding fixed deposit:', error);
			Alert.alert('Error', 'Failed to add fixed deposit');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteDeposit = async (
		depositId: string,
		bankName: string
	): Promise<void> => {
		Alert.alert(
			'Delete Fixed Deposit',
			`Are you sure you want to delete ${bankName} FD?`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: async () => {
						try {
							await assetService.deleteFixedDeposit(userId, depositId);
							onRefresh();
							Alert.alert('Success', 'Fixed deposit deleted successfully!');
						} catch (error) {
							console.error('Error deleting fixed deposit:', error);
							Alert.alert('Error', 'Failed to delete fixed deposit');
						}
					},
				},
			]
		);
	};

	const totalAmount = deposits.reduce(
		(sum, deposit) => sum + deposit.amount,
		0
	);
	const activeDeposits = deposits.filter(
		(deposit) => deposit.status === 'Active'
	);

	return (
		<View style={{ padding: 20 }}>
			{/* Summary Card */}
			<View style={[styles.card, { backgroundColor: colors.lightGray }]}>
				<View style={[styles.row, styles.spaceBetween]}>
					<View>
						<Text style={{ fontSize: 14, color: colors.gray }}>
							Total Fixed Deposits
						</Text>
						<Text
							style={{
								fontSize: 24,
								fontWeight: 'bold',
								color: colors.dark,
								marginTop: 4,
							}}
						>
							{formatCurrency(totalAmount)}
						</Text>
					</View>
					<Text style={{ fontSize: 24 }}>🏦</Text>
				</View>
				<View style={[styles.row, { marginTop: 8 }]}>
					<Text style={{ fontSize: 12, color: colors.gray }}>
						{activeDeposits.length} active •{' '}
						{deposits.length - activeDeposits.length} matured
					</Text>
				</View>
			</View>

			{/* Fixed Deposits List */}
			<Text style={[styles.subHeading, { marginTop: 24, marginBottom: 16 }]}>
				Fixed Deposits
			</Text>

			<ScrollView
				showsVerticalScrollIndicator={false}
				style={{ maxHeight: 400 }}
			>
				{deposits.map((deposit) => {
					const daysToMaturity = calculateDaysToMaturity(deposit.maturityDate);

					return (
						<TouchableOpacity
							key={deposit.id}
							style={[
								styles.card,
								{
									marginBottom: 12,
									borderLeftWidth: 4,
									borderLeftColor: getStatusColor(deposit.status),
								},
							]}
							onLongPress={() =>
								handleDeleteDeposit(deposit.id, deposit.bankName)
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
									<View
										style={[
											styles.row,
											styles.spaceBetween,
											{ marginBottom: 8 },
										]}
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
												color: getStatusColor(deposit.status),
												fontSize: 12,
												fontWeight: 'bold',
											}}
										>
											{deposit.status}
										</Text>
									</View>

									<Text
										style={{
											color: colors.gray,
											fontSize: 12,
											marginBottom: 4,
										}}
									>
										{deposit.depositNumber} • {deposit.interestRate}% interest
									</Text>

									<View
										style={[styles.row, { justifyContent: 'space-between' }]}
									>
										<Text style={{ color: colors.gray, fontSize: 12 }}>
											Matures in {daysToMaturity} days
										</Text>
										<Text
											style={{
												fontWeight: 'bold',
												color: colors.dark,
												fontSize: 16,
											}}
										>
											{formatCurrency(deposit.amount)}
										</Text>
									</View>

									<Text
										style={{ color: colors.gray, fontSize: 10, marginTop: 4 }}
									>
										{new Date(deposit.startDate).toLocaleDateString()} -{' '}
										{new Date(deposit.maturityDate).toLocaleDateString()}
									</Text>
								</View>
							</View>
						</TouchableOpacity>
					);
				})}
			</ScrollView>

			{/* Add New FD Modal */}
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
							Add Fixed Deposit
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
							placeholder='Deposit Number'
							value={newDeposit.depositNumber}
							onChangeText={(text) =>
								setNewDeposit({ ...newDeposit, depositNumber: text })
							}
							placeholderTextColor={colors.gray}
						/>

						<TextInput
							style={styles.input}
							placeholder='Amount'
							value={newDeposit.amount.toString()}
							onChangeText={(text) =>
								setNewDeposit({ ...newDeposit, amount: parseFloat(text) || 0 })
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
									{isSubmitting ? 'Adding...' : 'Add FD'}
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			{/* Add New FD Button */}
			<TouchableOpacity
				style={[styles.button, styles.buttonPrimary, { marginTop: 16 }]}
				onPress={() => setShowAddModal(true)}
			>
				<Text style={styles.buttonText}>+ Add Fixed Deposit</Text>
			</TouchableOpacity>
		</View>
	);
};
