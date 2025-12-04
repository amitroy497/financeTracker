import { colors, styles } from '@/styles';
import { CreateUserData, UpdateUserData, UserFormProps } from '@/types';
import React, { useState } from 'react';
import {
	Alert,
	Modal,
	ScrollView,
	Switch,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';

export const UserForm = ({
	visible,
	mode,
	user,
	onSubmit,
	onCancel,
	loading = false,
}: UserFormProps) => {
	const [formData, setFormData] = useState<CreateUserData | UpdateUserData>({
		username: user?.username || '',
		email: user?.email || '',
		password: '',
		isAdmin: user?.isAdmin || false,
		biometricEnabled: user?.biometricEnabled || false,
		...(mode === 'edit' && { resetPassword: false }),
	});

	const [confirmPassword, setConfirmPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const handleSubmit = async () => {
		if (mode === 'create') {
			const createData = formData as CreateUserData;
			if (!createData.username || !createData.password) {
				Alert.alert('Error', 'Username and password are required');
				return;
			}

			if (createData.password !== confirmPassword) {
				Alert.alert('Error', 'Passwords do not match');
				return;
			}

			if (createData.password.length < 6) {
				Alert.alert('Error', 'Password must be at least 6 characters');
				return;
			}
		} else {
			const updateData = formData as UpdateUserData;
			if (updateData.resetPassword && !updateData.newPassword) {
				Alert.alert(
					'Error',
					'New password is required when resetting password'
				);
				return;
			}

			if (
				updateData.resetPassword &&
				updateData.newPassword?.length &&
				updateData.newPassword.length < 6
			) {
				Alert.alert('Error', 'Password must be at least 6 characters');
				return;
			}

			if (
				updateData.resetPassword &&
				updateData.newPassword !== confirmPassword
			) {
				Alert.alert('Error', 'Passwords do not match');
				return;
			}
		}

		await onSubmit(formData);
	};

	const resetForm = () => {
		setFormData({
			username: user?.username || '',
			email: user?.email || '',
			password: '',
			isAdmin: user?.isAdmin || false,
			biometricEnabled: user?.biometricEnabled || false,
			...(mode === 'edit' && { resetPassword: false }),
		});
		setConfirmPassword('');
		setShowPassword(false);
		setShowConfirmPassword(false);
	};

	return (
		<Modal
			visible={visible}
			animationType='slide'
			transparent={true}
			onRequestClose={() => {
				resetForm();
				onCancel();
			}}
		>
			<View
				style={{
					flex: 1,
					backgroundColor: 'rgba(0,0,0,0.5)',
					justifyContent: 'center',
				}}
			>
				<View style={[styles.card, { margin: 20, maxHeight: '80%' }]}>
					<ScrollView showsVerticalScrollIndicator={false}>
						<Text style={[styles.header, { marginBottom: 20 }]}>
							{mode === 'create' ? 'Create New User' : 'Edit User'}
						</Text>

						<TextInput
							style={styles.input}
							placeholder='Username'
							value={formData.username || ''}
							onChangeText={(text) =>
								setFormData({ ...formData, username: text })
							}
							placeholderTextColor={colors.gray}
							editable={mode === 'create' || !user?.isAdmin}
						/>

						<TextInput
							style={styles.input}
							placeholder='Email (Optional)'
							value={formData.email || ''}
							onChangeText={(text) => setFormData({ ...formData, email: text })}
							placeholderTextColor={colors.gray}
							keyboardType='email-address'
							autoCapitalize='none'
						/>

						{mode === 'edit' && (
							<View style={{ marginBottom: 16 }}>
								<TouchableOpacity
									style={[
										styles.button,
										{
											backgroundColor: (formData as UpdateUserData)
												.resetPassword
												? colors.danger
												: colors.lightGray,
										},
									]}
									onPress={() =>
										setFormData({
											...formData,
											resetPassword: !(formData as UpdateUserData)
												.resetPassword,
										})
									}
								>
									<Text
										style={{
											color: (formData as UpdateUserData).resetPassword
												? colors.white
												: colors.dark,
										}}
									>
										{(formData as UpdateUserData).resetPassword
											? '✓ Reset Password Enabled'
											: 'Reset Password'}
									</Text>
								</TouchableOpacity>
							</View>
						)}

						{(mode === 'create' ||
							(formData as UpdateUserData).resetPassword) && (
							<>
								<TextInput
									style={styles.input}
									placeholder={mode === 'create' ? 'Password' : 'New Password'}
									value={
										mode === 'create'
											? (formData as CreateUserData).password || ''
											: (formData as UpdateUserData).newPassword || ''
									}
									onChangeText={(text) =>
										setFormData(
											mode === 'create'
												? { ...formData, password: text }
												: { ...formData, newPassword: text }
										)
									}
									placeholderTextColor={colors.gray}
									secureTextEntry={!showPassword}
								/>

								<TextInput
									style={styles.input}
									placeholder='Confirm Password'
									value={confirmPassword}
									onChangeText={setConfirmPassword}
									placeholderTextColor={colors.gray}
									secureTextEntry={!showConfirmPassword}
								/>
							</>
						)}

						<View style={[styles.card, { marginBottom: 16 }]}>
							<View
								style={[
									styles.row,
									{
										justifyContent: 'space-between',
										alignItems: 'center',
										marginBottom: 12,
									},
								]}
							>
								<Text style={{ color: colors.dark, fontSize: 16 }}>
									Administrator
								</Text>
								<Switch
									value={formData.isAdmin || false}
									onValueChange={(value) =>
										setFormData({ ...formData, isAdmin: value })
									}
									trackColor={{ false: colors.lightGray, true: colors.primary }}
								/>
							</View>

							<View
								style={[
									styles.row,
									{ justifyContent: 'space-between', alignItems: 'center' },
								]}
							>
								<Text style={{ color: colors.dark, fontSize: 16 }}>
									Biometric Login
								</Text>
								<Switch
									value={formData.biometricEnabled || false}
									onValueChange={(value) =>
										setFormData({ ...formData, biometricEnabled: value })
									}
									trackColor={{ false: colors.lightGray, true: colors.primary }}
								/>
							</View>
						</View>

						<View style={[styles.row, { gap: 12, marginTop: 20 }]}>
							<TouchableOpacity
								style={[styles.button, styles.buttonSecondary, { flex: 1 }]}
								onPress={() => {
									resetForm();
									onCancel();
								}}
								disabled={loading}
							>
								<Text style={styles.buttonText}>Cancel</Text>
							</TouchableOpacity>

							<TouchableOpacity
								style={[styles.button, styles.buttonPrimary, { flex: 1 }]}
								onPress={handleSubmit}
								disabled={loading}
							>
								<Text style={styles.buttonText}>
									{loading
										? 'Processing...'
										: mode === 'create'
										? 'Create User'
										: 'Update User'}
								</Text>
							</TouchableOpacity>
						</View>
					</ScrollView>
				</View>
			</View>
		</Modal>
	);
};
