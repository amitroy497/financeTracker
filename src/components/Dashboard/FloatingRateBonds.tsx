import { assetService } from '@/services/assetService';
import { colors, styles } from '@/styles';
import { CreateFRBData, FloatingRateBondsProps } from '@/types';
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

export const FloatingRateBonds = ({
	bonds,
	onRefresh,
	userId,
}: FloatingRateBondsProps) => {
	const [showAddModal, setShowAddModal] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [newBond, setNewBond] = useState<CreateFRBData>({
		bondName: '',
		certificateNumber: '',
		investmentAmount: 0,
		interestRate: 7.15,
		purchaseDate: new Date().toISOString().split('T')[0],
		maturityDate: '2027-07-01',
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

	const handleAddBond = async (): Promise<void> => {
		if (!newBond.bondName.trim() || !newBond.certificateNumber.trim()) {
			Alert.alert('Error', 'Please fill in all required fields');
			return;
		}

		if (newBond.investmentAmount <= 0) {
			Alert.alert('Error', 'Investment amount must be greater than 0');
			return;
		}

		if (newBond.interestRate <= 0) {
			Alert.alert('Error', 'Interest rate must be greater than 0');
			return;
		}

		setIsSubmitting(true);
		try {
			await assetService.createFRB(userId, newBond);
			setShowAddModal(false);
			setNewBond({
				bondName: '',
				certificateNumber: '',
				investmentAmount: 0,
				interestRate: 7.15,
				purchaseDate: new Date().toISOString().split('T')[0],
				maturityDate: '2027-07-01',
			});
			onRefresh();
			Alert.alert('Success', 'Floating Rate Bond added successfully!');
		} catch (error) {
			console.error('Error adding floating rate bond:', error);
			Alert.alert('Error', 'Failed to add floating rate bond');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteBond = async (
		bondId: string,
		bondName: string
	): Promise<void> => {
		Alert.alert(
			'Delete Floating Rate Bond',
			`Are you sure you want to delete ${bondName}?`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: async () => {
						try {
							await assetService.deleteFRB(userId, bondId);
							onRefresh();
							Alert.alert(
								'Success',
								'Floating Rate Bond deleted successfully!'
							);
						} catch (error) {
							console.error('Error deleting floating rate bond:', error);
							Alert.alert('Error', 'Failed to delete floating rate bond');
						}
					},
				},
			]
		);
	};

	const totalCurrentValue = bonds.reduce(
		(sum, bond) => sum + bond.currentValue,
		0
	);
	const totalInvestment = bonds.reduce(
		(sum, bond) => sum + bond.investmentAmount,
		0
	);

	return (
		<View style={{ padding: 20 }}>
			{/* Summary Card */}
			<View style={[styles.card, { backgroundColor: colors.lightGray }]}>
				<View style={[styles.row, styles.spaceBetween]}>
					<View>
						<Text style={{ fontSize: 14, color: colors.gray }}>
							Floating Rate Bonds
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
					<Text style={{ fontSize: 24 }}>📄</Text>
				</View>
				<View style={[styles.row, { marginTop: 8 }]}>
					<Text style={{ fontSize: 12, color: colors.gray }}>
						Total Investment: {formatCurrency(totalInvestment)} • {bonds.length}{' '}
						bond{bonds.length !== 1 ? 's' : ''}
					</Text>
				</View>
			</View>

			{/* Floating Rate Bonds List */}
			<Text style={[styles.subHeading, { marginTop: 24, marginBottom: 16 }]}>
				Floating Rate Saving Bonds
			</Text>

			<ScrollView
				showsVerticalScrollIndicator={false}
				style={{ maxHeight: 400 }}
			>
				{bonds.map((bond) => {
					const daysToMaturity = calculateDaysToMaturity(bond.maturityDate);

					return (
						<TouchableOpacity
							key={bond.id}
							style={[
								styles.card,
								{
									marginBottom: 12,
									borderLeftWidth: 4,
									borderLeftColor: colors.secondary,
								},
							]}
							onLongPress={() => handleDeleteBond(bond.id, bond.bondName)}
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
										{bond.bondName}
									</Text>
									<Text
										style={{ color: colors.gray, fontSize: 12, marginTop: 2 }}
									>
										Certificate: {bond.certificateNumber}
									</Text>

									<View
										style={[
											styles.row,
											{ justifyContent: 'space-between', marginTop: 8 },
										]}
									>
										<View>
											<Text style={{ color: colors.gray, fontSize: 12 }}>
												Investment
											</Text>
											<Text
												style={{
													fontWeight: 'bold',
													color: colors.dark,
													fontSize: 14,
												}}
											>
												{formatCurrency(bond.investmentAmount)}
											</Text>
										</View>

										<View style={{ alignItems: 'flex-end' }}>
											<Text style={{ color: colors.gray, fontSize: 12 }}>
												Current Value
											</Text>
											<Text
												style={{
													fontWeight: 'bold',
													color: colors.dark,
													fontSize: 14,
												}}
											>
												{formatCurrency(bond.currentValue)}
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
											{bond.interestRate}% interest
										</Text>
										<Text style={{ color: colors.gray, fontSize: 12 }}>
											{daysToMaturity} days to maturity
										</Text>
									</View>

									<Text
										style={{ color: colors.gray, fontSize: 10, marginTop: 4 }}
									>
										Purchased:{' '}
										{new Date(bond.purchaseDate).toLocaleDateString()} •
										Matures: {new Date(bond.maturityDate).toLocaleDateString()}
									</Text>
								</View>
							</View>
						</TouchableOpacity>
					);
				})}
			</ScrollView>

			{/* Add New FRB Modal */}
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
							Add Floating Rate Bond
						</Text>

						<TextInput
							style={styles.input}
							placeholder='Bond Name (e.g., RBI Floating Rate Bond 2023)'
							value={newBond.bondName}
							onChangeText={(text) =>
								setNewBond({ ...newBond, bondName: text })
							}
							placeholderTextColor={colors.gray}
						/>

						<TextInput
							style={styles.input}
							placeholder='Certificate Number'
							value={newBond.certificateNumber}
							onChangeText={(text) =>
								setNewBond({ ...newBond, certificateNumber: text })
							}
							placeholderTextColor={colors.gray}
						/>

						<TextInput
							style={styles.input}
							placeholder='Investment Amount'
							value={newBond.investmentAmount.toString()}
							onChangeText={(text) =>
								setNewBond({
									...newBond,
									investmentAmount: parseFloat(text) || 0,
								})
							}
							placeholderTextColor={colors.gray}
							keyboardType='decimal-pad'
						/>

						<TextInput
							style={styles.input}
							placeholder='Interest Rate (%)'
							value={newBond.interestRate.toString()}
							onChangeText={(text) =>
								setNewBond({
									...newBond,
									interestRate: parseFloat(text) || 7.15,
								})
							}
							placeholderTextColor={colors.gray}
							keyboardType='decimal-pad'
						/>

						<TextInput
							style={styles.input}
							placeholder='Purchase Date (YYYY-MM-DD)'
							value={newBond.purchaseDate}
							onChangeText={(text) =>
								setNewBond({ ...newBond, purchaseDate: text })
							}
							placeholderTextColor={colors.gray}
						/>

						<TextInput
							style={styles.input}
							placeholder='Maturity Date (YYYY-MM-DD)'
							value={newBond.maturityDate}
							onChangeText={(text) =>
								setNewBond({ ...newBond, maturityDate: text })
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
								onPress={handleAddBond}
								disabled={isSubmitting}
							>
								<Text style={styles.buttonText}>
									{isSubmitting ? 'Adding...' : 'Add FRB'}
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			{/* Add New FRB Button */}
			<TouchableOpacity
				style={[styles.button, styles.buttonPrimary, { marginTop: 16 }]}
				onPress={() => setShowAddModal(true)}
			>
				<Text style={styles.buttonText}>+ Add Floating Rate Bond</Text>
			</TouchableOpacity>
		</View>
	);
};
