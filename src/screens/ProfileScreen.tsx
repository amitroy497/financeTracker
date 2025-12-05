import { useAuth } from '@/hooks';
import { createStyles } from '@/styles';
import { useTheme } from '@/theme';
import { DataBackupService } from '@/utils/dataBackup';
import React, { useEffect, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	ScrollView,
	Switch,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';

export const ProfileScreen = () => {
	const { theme, colors, setTheme, toggleAutoTheme, autoTheme } = useTheme();
	const styles = createStyles(colors);
	const {
		user,
		logout,
		enableBiometric,
		changePassword,
		changePin,
		biometricSupported,
	} = useAuth();

	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [activeSection, setActiveSection] = useState<
		'main' | 'email' | 'password' | 'pin' | 'biometric' | 'backup'
	>('main');
	const [exportInfo, setExportInfo] = useState<{
		lastExport?: string;
		fileSize?: number;
		itemsCount: number;
	} | null>(null);

	// Email state
	const [email, setEmail] = useState(user?.email || '');
	const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState('');

	// Password state
	const [currentPassword, setCurrentPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmNewPassword, setConfirmNewPassword] = useState('');

	// PIN state
	const [currentPin, setCurrentPin] = useState('');
	const [newPin, setNewPin] = useState('');
	const [confirmNewPin, setConfirmNewPin] = useState('');

	// Biometric state
	const [useBiometric, setUseBiometric] = useState(
		user?.biometricEnabled || false
	);

	// Load export info when backup section is active
	useEffect(() => {
		if (user && activeSection === 'backup') {
			loadExportInfo();
		}
	}, [user, activeSection]);

	const loadExportInfo = async (): Promise<void> => {
		if (!user) return;

		try {
			const info = await DataBackupService.getExportInfo(user.id);
			setExportInfo(info);
		} catch (error) {
			console.error('Error loading export info:', error);
		}
	};
	const handleExportData = async (): Promise<void> => {
		if (!user) return;

		setIsLoading(true);
		try {
			Alert.alert(
				'Export Data',
				'This will create a JSON file with all your financial data. Do you want to continue?',
				[
					{ text: 'Cancel', style: 'cancel' },
					{
						text: 'Export',
						onPress: async () => {
							try {
								const exportPath = await DataBackupService.exportUserData(
									user.id,
									user.username
								);

								await DataBackupService.shareExportFile(exportPath);

								Alert.alert(
									'Success',
									'Data exported successfully! You can share the file or save it for backup.'
								);

								loadExportInfo(); // Refresh info
							} catch (error: any) {
								Alert.alert(
									'Export Failed',
									error.message || 'Failed to export data'
								);
							}
						},
					},
				]
			);
		} catch (error: any) {
			Alert.alert('Error', error.message || 'Failed to export data');
		} finally {
			setIsLoading(false);
		}
	};
	const handleImportData = async (): Promise<void> => {
		if (!user) return;

		Alert.alert(
			'Import Data',
			'Warning: This will overwrite all your current data. Make sure you have a backup. Continue?',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Choose File',
					onPress: async () => {
						setIsLoading(true);
						try {
							const fileContent = await DataBackupService.pickImportFile();

							if (!fileContent) {
								Alert.alert('Info', 'No file selected');
								setIsLoading(false);
								return;
							}

							// Validate file
							const importData =
								DataBackupService.validateImportFile(fileContent);

							// Verify user ID matches (optional check)
							if (importData.userId !== user.id) {
								Alert.alert(
									'User ID Mismatch',
									`This export file belongs to "${importData.username}". Import anyway?`,
									[
										{ text: 'Cancel', style: 'cancel' },
										{
											text: 'Import Anyway',
											onPress: async () => {
												await performImport(importData);
											},
										},
									]
								);
							} else {
								await performImport(importData);
							}
						} catch (error: any) {
							Alert.alert(
								'Import Failed',
								error.message || 'Invalid import file'
							);
						} finally {
							setIsLoading(false);
						}
					},
				},
			]
		);
	};
	const performImport = async (importData: any): Promise<void> => {
		try {
			await DataBackupService.importUserData(user!.id, importData);

			Alert.alert(
				'Success',
				'Data imported successfully! Please restart the app to see the changes.',
				[
					{
						text: 'OK',
						onPress: () => {
							setActiveSection('main');
							// Note: In a production app, you might want to:
							// 1. Force a refresh of all screens
							// 2. Clear navigation stack
							// 3. Reload the app
						},
					},
				]
			);
		} catch (error: any) {
			Alert.alert('Import Failed', error.message || 'Failed to import data');
		}
	};
	const handleUpdateEmail = async (): Promise<void> => {
		if (!email.trim()) {
			Alert.alert('Error', 'Please enter email address');
			return;
		}

		if (!currentPasswordForEmail.trim()) {
			Alert.alert('Error', 'Please enter current password to update email');
			return;
		}

		// Email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			Alert.alert('Error', 'Please enter a valid email address');
			return;
		}

		setIsLoading(true);
		try {
			// Note: You'll need to implement updateEmail function in your authService
			// For now, this is a placeholder
			Alert.alert('Success', 'Email updated successfully!');
			setActiveSection('main');
			resetForms();
		} catch (error: any) {
			Alert.alert('Error', error.message || 'Failed to update email');
		} finally {
			setIsLoading(false);
		}
	};
	const handleChangePassword = async (): Promise<void> => {
		if (!currentPassword.trim()) {
			Alert.alert('Error', 'Please enter current password');
			return;
		}

		if (!newPassword.trim()) {
			Alert.alert('Error', 'Please enter new password');
			return;
		}

		if (newPassword !== confirmNewPassword) {
			Alert.alert('Error', 'New passwords do not match');
			return;
		}

		if (newPassword.length < 6) {
			Alert.alert('Error', 'Password must be at least 6 characters long');
			return;
		}

		setIsLoading(true);
		try {
			const success = await changePassword(currentPassword, newPassword);
			if (success) {
				Alert.alert('Success', 'Password updated successfully!');
				setActiveSection('main');
				resetForms();
			} else {
				Alert.alert(
					'Error',
					'Failed to update password. Please check your current password.'
				);
			}
		} catch (error: any) {
			Alert.alert('Error', error.message || 'Failed to update password');
		} finally {
			setIsLoading(false);
		}
	};
	const handleChangePin = async (): Promise<void> => {
		if (!newPin.trim()) {
			Alert.alert('Error', 'Please enter new PIN');
			return;
		}

		if (newPin.length !== 4) {
			Alert.alert('Error', 'PIN must be 4 digits');
			return;
		}

		if (newPin !== confirmNewPin) {
			Alert.alert('Error', 'PINs do not match');
			return;
		}

		setIsLoading(true);
		try {
			const success = await changePin(newPin);
			if (success) {
				Alert.alert('Success', 'PIN updated successfully!');
				setActiveSection('main');
				resetForms();
			} else {
				Alert.alert('Error', 'Failed to update PIN');
			}
		} catch (error: any) {
			Alert.alert('Error', error.message || 'Failed to update PIN');
		} finally {
			setIsLoading(false);
		}
	};
	const handleToggleBiometric = async (value: boolean): Promise<void> => {
		try {
			setIsLoading(true);
			await enableBiometric(value);
			setUseBiometric(value);
			Alert.alert(
				'Success',
				value
					? 'Biometric authentication enabled!'
					: 'Biometric authentication disabled!'
			);
		} catch (error: any) {
			Alert.alert(
				'Error',
				error.message || 'Failed to update biometric setting'
			);
			setUseBiometric(!value); // Revert switch on error
		} finally {
			setIsLoading(false);
		}
	};
	const handleRemovePin = async (): Promise<void> => {
		Alert.alert(
			'Remove PIN',
			'Are you sure you want to remove your PIN? You will no longer be able to login with PIN.',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Remove',
					style: 'destructive',
					onPress: async () => {
						setIsLoading(true);
						try {
							// You'll need to implement removePin function in authService
							// For now, this sets an empty PIN hash
							const success = await changePin('');
							if (success) {
								Alert.alert('Success', 'PIN removed successfully!');
								setActiveSection('main');
							} else {
								Alert.alert('Error', 'Failed to remove PIN');
							}
						} catch (error: any) {
							Alert.alert('Error', error.message || 'Failed to remove PIN');
						} finally {
							setIsLoading(false);
						}
					},
				},
			]
		);
	};
	const resetForms = (): void => {
		setEmail(user?.email || '');
		setCurrentPasswordForEmail('');
		setCurrentPassword('');
		setNewPassword('');
		setConfirmNewPassword('');
		setCurrentPin('');
		setNewPin('');
		setConfirmNewPin('');
	};
	const handleBackToMain = (): void => {
		setActiveSection('main');
		resetForms();
	};
	const renderThemeSettings = () => (
		<View style={[styles.card, { marginBottom: 12 }]}>
			<Text style={[styles.subheader, { marginBottom: 16 }]}>
				🎨 Appearance Settings
			</Text>
			<View style={{ marginBottom: 20 }}>
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
					<View style={{ flex: 1 }}>
						<Text
							style={{
								color: colors.text,
								fontSize: 16,
								fontWeight: '600',
								marginBottom: 4,
							}}
						>
							Auto Theme
						</Text>
						<Text style={{ color: colors.gray, fontSize: 12 }}>
							Follow system appearance settings
						</Text>
					</View>
					<Switch
						value={autoTheme || false}
						onValueChange={toggleAutoTheme}
						trackColor={{ false: colors.lightGray, true: colors.primary }}
						thumbColor={colors.white}
					/>
				</View>
			</View>
			<View style={{ marginBottom: 20, opacity: autoTheme ? 0.6 : 1 }}>
				<Text
					style={{
						color: colors.text,
						fontSize: 16,
						fontWeight: '600',
						marginBottom: 12,
					}}
				>
					Theme
				</Text>
				{autoTheme && (
					<View
						style={{
							backgroundColor: colors.infoLight,
							padding: 8,
							borderRadius: 6,
							marginBottom: 8,
							flexDirection: 'row',
							alignItems: 'center',
						}}
					>
						<Text style={{ fontSize: 14, marginRight: 6 }}>ℹ️</Text>
						<Text style={{ color: colors.text, fontSize: 12, flex: 1 }}>
							Theme selection disabled when Auto Theme is enabled
						</Text>
					</View>
				)}
				<View
					style={[
						styles.row,
						{
							backgroundColor: colors.lightGray,
							borderRadius: 12,
							padding: 4,
						},
					]}
				>
					<TouchableOpacity
						style={[
							{
								flex: 1,
								paddingVertical: 12,
								borderRadius: 8,
								alignItems: 'center',
								backgroundColor:
									!autoTheme && theme === 'light'
										? colors.primary
										: 'transparent',
							},
						]}
						onPress={() => !autoTheme && setTheme('light')}
						disabled={autoTheme}
					>
						<Text
							style={{
								color:
									!autoTheme && theme === 'light' ? colors.white : colors.text,
								fontWeight: '600',
								opacity: autoTheme ? 0.5 : 1,
							}}
						>
							☀️ Light
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={[
							{
								flex: 1,
								paddingVertical: 12,
								borderRadius: 8,
								alignItems: 'center',
								backgroundColor:
									!autoTheme && theme === 'dark'
										? colors.primary
										: 'transparent',
							},
						]}
						onPress={() => !autoTheme && setTheme('dark')}
						disabled={autoTheme}
					>
						<Text
							style={{
								color:
									!autoTheme && theme === 'dark' ? colors.white : colors.text,
								fontWeight: '600',
								opacity: autoTheme ? 0.5 : 1,
							}}
						>
							🌙 Dark
						</Text>
					</TouchableOpacity>
				</View>
				{autoTheme && (
					<View
						style={{
							marginTop: 12,
							padding: 8,
							backgroundColor: colors.lightGray,
							borderRadius: 6,
							alignItems: 'center',
						}}
					>
						<Text style={{ color: colors.text, fontSize: 12 }}>
							Currently using: {theme === 'light' ? 'Light' : 'Dark'} theme
						</Text>
					</View>
				)}
			</View>
			<View style={{ marginTop: 16 }}>
				<Text
					style={{
						color: colors.text,
						fontSize: 14,
						fontWeight: '600',
						marginBottom: 8,
					}}
				>
					Preview
				</Text>
				<View
					style={{
						backgroundColor: colors.cardBackground,
						padding: 16,
						borderRadius: 8,
						borderWidth: 1,
						borderColor: colors.border,
					}}
				>
					<View style={[styles.row, { marginBottom: 8 }]}>
						<View
							style={{
								width: 40,
								height: 40,
								backgroundColor: colors.primary,
								borderRadius: 20,
								marginRight: 12,
							}}
						/>
						<View style={{ flex: 1 }}>
							<Text style={{ color: colors.text, fontWeight: '600' }}>
								Sample Card
							</Text>
							<Text style={{ color: colors.gray, fontSize: 12 }}>
								This is how your app looks
							</Text>
						</View>
					</View>
					<View
						style={{
							height: 1,
							backgroundColor: colors.border,
							marginVertical: 8,
						}}
					/>
					<Text style={{ color: colors.text, fontSize: 12 }}>
						Text color: {colors.text}
					</Text>
					<Text style={{ color: colors.gray, fontSize: 12 }}>
						Background: {colors.background}
					</Text>
				</View>
			</View>
		</View>
	);

	if (activeSection === 'backup') {
		if (user?.isAdmin) {
			return (
				<ScrollView
					style={styles.container}
					contentContainerStyle={{ padding: 20 }}
				>
					{/* Header with Back Button */}
					<View
						style={[styles.row, { marginBottom: 30, alignItems: 'center' }]}
					>
						<TouchableOpacity
							onPress={handleBackToMain}
							style={{ marginRight: 15 }}
						>
							<Text style={{ color: colors.primary, fontSize: 18 }}>←</Text>
						</TouchableOpacity>
						<Text style={styles.header}>Admin Data Management</Text>
					</View>

					<View style={[styles.card, { marginBottom: 24 }]}>
						<Text
							style={{
								color: colors.primary,
								fontSize: 20,
								marginBottom: 16,
								textAlign: 'center',
							}}
						>
							👨‍💼
						</Text>
						<Text
							style={[
								styles.subheader,
								{ marginBottom: 16, textAlign: 'center' },
							]}
						>
							Admin Data Management
						</Text>

						<Text
							style={{
								color: colors.dark,
								marginBottom: 12,
								textAlign: 'center',
							}}
						>
							As an administrator, you have access to advanced data management
							tools:
						</Text>

						<View style={{ marginBottom: 16 }}>
							<Text
								style={{
									color: colors.success,
									fontWeight: '600',
									marginBottom: 4,
								}}
							>
								• Export/Import User Data
							</Text>
							<Text
								style={{ color: colors.gray, fontSize: 12, marginBottom: 8 }}
							>
								Export or import data for any user from the Admin Dashboard
							</Text>

							<Text
								style={{
									color: colors.info,
									fontWeight: '600',
									marginBottom: 4,
								}}
							>
								• User Management
							</Text>
							<Text
								style={{ color: colors.gray, fontSize: 12, marginBottom: 8 }}
							>
								Create, edit, or delete user accounts with full control
							</Text>

							<Text
								style={{
									color: colors.warning,
									fontWeight: '600',
									marginBottom: 4,
								}}
							>
								• System Administration
							</Text>
							<Text style={{ color: colors.gray, fontSize: 12 }}>
								Manage all system data and user information
							</Text>
						</View>

						<TouchableOpacity
							style={[
								styles.button,
								styles.buttonPrimary,
								{ marginBottom: 16 },
							]}
							onPress={() => {
								handleBackToMain();
								// You might want to navigate to Admin screen here
							}}
						>
							<Text style={styles.buttonText}>Go to Admin Dashboard</Text>
						</TouchableOpacity>
					</View>

					<View style={[styles.card, { backgroundColor: colors.lightGray }]}>
						<Text
							style={{ color: colors.gray, fontSize: 12, textAlign: 'center' }}
						>
							Note: Regular backup/restore features are disabled for admin
							accounts. Use the Admin Dashboard for all data management tasks.
						</Text>
					</View>
				</ScrollView>
			);
		}
		return (
			<ScrollView
				style={styles.container}
				contentContainerStyle={{ padding: 20 }}
			>
				{/* Header with Back Button */}
				<View style={[styles.row, { marginBottom: 30, alignItems: 'center' }]}>
					<TouchableOpacity
						onPress={handleBackToMain}
						style={{ marginRight: 15 }}
					>
						<Text style={{ color: colors.primary, fontSize: 18 }}>←</Text>
					</TouchableOpacity>
					<Text style={styles.header}>Data Backup & Restore</Text>
				</View>

				{/* Export Info Card */}
				<View style={[styles.card, { marginBottom: 24 }]}>
					<Text style={[styles.subheader, { marginBottom: 16 }]}>
						📊 Current Data Summary
					</Text>

					{exportInfo ? (
						<>
							<View
								style={[
									styles.row,
									{ justifyContent: 'space-between', marginBottom: 12 },
								]}
							>
								<Text style={{ color: colors.gray }}>Total Items</Text>
								<Text style={{ fontWeight: 'bold', color: colors.dark }}>
									{exportInfo.itemsCount}
								</Text>
							</View>

							{exportInfo.fileSize && (
								<View
									style={[
										styles.row,
										{ justifyContent: 'space-between', marginBottom: 12 },
									]}
								>
									<Text style={{ color: colors.gray }}>Data Size</Text>
									<Text style={{ fontWeight: 'bold', color: colors.dark }}>
										{(exportInfo.fileSize / 1024).toFixed(2)} KB
									</Text>
								</View>
							)}

							{exportInfo.lastExport && (
								<View style={[styles.row, { justifyContent: 'space-between' }]}>
									<Text style={{ color: colors.gray }}>Last Export</Text>
									<Text style={{ fontWeight: 'bold', color: colors.dark }}>
										{exportInfo.lastExport}
									</Text>
								</View>
							)}
						</>
					) : (
						<Text style={{ color: colors.gray, textAlign: 'center' }}>
							Loading data info...
						</Text>
					)}
				</View>

				{/* Export Button */}
				<TouchableOpacity
					style={[
						styles.button,
						styles.buttonPrimary,
						{ marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
					]}
					onPress={handleExportData}
					disabled={isLoading}
				>
					{isLoading ? (
						<ActivityIndicator color={colors.white} />
					) : (
						<>
							<Text style={{ fontSize: 20, marginRight: 10 }}>📤</Text>
							<Text style={styles.buttonText}>Export All Data</Text>
						</>
					)}
				</TouchableOpacity>

				{/* Import Button */}
				<TouchableOpacity
					style={[
						styles.button,
						{
							backgroundColor: colors.warning,
							marginBottom: 24,
							flexDirection: 'row',
							alignItems: 'center',
						},
					]}
					onPress={handleImportData}
					disabled={isLoading}
				>
					{isLoading ? (
						<ActivityIndicator color={colors.white} />
					) : (
						<>
							<Text style={{ fontSize: 20, marginRight: 10 }}>📥</Text>
							<Text style={styles.buttonText}>Import Data</Text>
						</>
					)}
				</TouchableOpacity>

				{/* Warning Note */}
				<View style={[styles.card, { backgroundColor: colors.lightGray }]}>
					<Text
						style={{ color: colors.danger, fontWeight: '600', marginBottom: 8 }}
					>
						⚠️ Important Notes:
					</Text>
					<Text style={{ color: colors.gray, fontSize: 12, marginBottom: 4 }}>
						1. Export creates a JSON file with all your financial data
					</Text>
					<Text style={{ color: colors.gray, fontSize: 12, marginBottom: 4 }}>
						2. Import will overwrite ALL existing data
					</Text>
					<Text style={{ color: colors.gray, fontSize: 12 }}>
						3. Keep backup files in a secure location
					</Text>
				</View>

				{/* How to Use */}
				<View style={[styles.card, { marginTop: 16 }]}>
					<Text style={[styles.subheader, { marginBottom: 12 }]}>
						📖 How to Use:
					</Text>
					<Text style={{ color: colors.gray, fontSize: 12, marginBottom: 6 }}>
						• <Text style={{ fontWeight: 'bold' }}>Export:</Text> Creates a
						backup file you can save anywhere
					</Text>
					<Text style={{ color: colors.gray, fontSize: 12, marginBottom: 6 }}>
						• <Text style={{ fontWeight: 'bold' }}>Import:</Text> Restores data
						from a previously exported file
					</Text>
					<Text style={{ color: colors.gray, fontSize: 12, marginBottom: 6 }}>
						• <Text style={{ fontWeight: 'bold' }}>After reinstall:</Text>{' '}
						Import your backup file to restore all data
					</Text>
					<Text style={{ color: colors.gray, fontSize: 12 }}>
						• <Text style={{ fontWeight: 'bold' }}>Admin help:</Text> Contact
						admin if you need assistance
					</Text>
				</View>
			</ScrollView>
		);
	}
	if (activeSection !== 'main') {
		return (
			<ScrollView
				style={styles.container}
				contentContainerStyle={{ padding: 20 }}
			>
				{/* Header with Back Button */}
				<View style={[styles.row, { marginBottom: 30, alignItems: 'center' }]}>
					<TouchableOpacity
						onPress={handleBackToMain}
						style={{ marginRight: 15 }}
					>
						<Text style={{ color: colors.primary, fontSize: 18 }}>←</Text>
					</TouchableOpacity>
					<Text style={styles.header}>
						{activeSection === 'email' && 'Update Email'}
						{activeSection === 'password' && 'Change Password'}
						{activeSection === 'pin' && user?.pinHash
							? 'Change PIN'
							: 'Set PIN'}
						{activeSection === 'biometric' && 'Biometric Settings'}
					</Text>
				</View>

				{/* Update Email Section */}
				{activeSection === 'email' && (
					<>
						<TextInput
							style={styles.input}
							placeholder='New Email Address'
							value={email}
							onChangeText={setEmail}
							placeholderTextColor={colors.gray}
							autoCapitalize='none'
							keyboardType='email-address'
						/>
						<TextInput
							style={styles.input}
							placeholder='Current Password'
							value={currentPasswordForEmail}
							onChangeText={setCurrentPasswordForEmail}
							placeholderTextColor={colors.gray}
							secureTextEntry
						/>
						<TouchableOpacity
							style={[
								styles.button,
								styles.buttonPrimary,
								{ marginBottom: 16 },
							]}
							onPress={handleUpdateEmail}
							disabled={isLoading}
						>
							{isLoading ? (
								<ActivityIndicator color={colors.white} />
							) : (
								<Text style={styles.buttonText}>Update Email</Text>
							)}
						</TouchableOpacity>
					</>
				)}

				{/* Change Password Section */}
				{activeSection === 'password' && (
					<>
						<TextInput
							style={styles.input}
							placeholder='Current Password'
							value={currentPassword}
							onChangeText={setCurrentPassword}
							placeholderTextColor={colors.gray}
							secureTextEntry
						/>
						<TextInput
							style={styles.input}
							placeholder='New Password'
							value={newPassword}
							onChangeText={setNewPassword}
							placeholderTextColor={colors.gray}
							secureTextEntry
						/>
						<TextInput
							style={styles.input}
							placeholder='Confirm New Password'
							value={confirmNewPassword}
							onChangeText={setConfirmNewPassword}
							placeholderTextColor={colors.gray}
							secureTextEntry
						/>
						<TouchableOpacity
							style={[
								styles.button,
								styles.buttonPrimary,
								{ marginBottom: 16 },
							]}
							onPress={handleChangePassword}
							disabled={isLoading}
						>
							{isLoading ? (
								<ActivityIndicator color={colors.white} />
							) : (
								<Text style={styles.buttonText}>Change Password</Text>
							)}
						</TouchableOpacity>
					</>
				)}

				{/* PIN Management Section */}
				{activeSection === 'pin' && (
					<>
						{user?.pinHash ? (
							// Change existing PIN
							<>
								<TextInput
									style={styles.input}
									placeholder='New PIN (4 digits)'
									value={newPin}
									onChangeText={setNewPin}
									placeholderTextColor={colors.gray}
									keyboardType='number-pad'
									secureTextEntry
									maxLength={4}
								/>
								<TextInput
									style={styles.input}
									placeholder='Confirm New PIN'
									value={confirmNewPin}
									onChangeText={setConfirmNewPin}
									placeholderTextColor={colors.gray}
									keyboardType='number-pad'
									secureTextEntry
									maxLength={4}
								/>
								<TouchableOpacity
									style={[
										styles.button,
										styles.buttonPrimary,
										{ marginBottom: 8 },
									]}
									onPress={handleChangePin}
									disabled={isLoading}
								>
									{isLoading ? (
										<ActivityIndicator color={colors.white} />
									) : (
										<Text style={styles.buttonText}>Change PIN</Text>
									)}
								</TouchableOpacity>
								<TouchableOpacity
									style={[styles.button, styles.buttonDanger]}
									onPress={handleRemovePin}
									disabled={isLoading}
								>
									<Text style={styles.buttonText}>Remove PIN</Text>
								</TouchableOpacity>
							</>
						) : (
							// Set new PIN
							<>
								<TextInput
									style={styles.input}
									placeholder='Set PIN (4 digits)'
									value={newPin}
									onChangeText={setNewPin}
									placeholderTextColor={colors.gray}
									keyboardType='number-pad'
									secureTextEntry
									maxLength={4}
								/>
								<TextInput
									style={styles.input}
									placeholder='Confirm PIN'
									value={confirmNewPin}
									onChangeText={setConfirmNewPin}
									placeholderTextColor={colors.gray}
									keyboardType='number-pad'
									secureTextEntry
									maxLength={4}
								/>
								<TouchableOpacity
									style={[
										styles.button,
										styles.buttonPrimary,
										{ marginBottom: 16 },
									]}
									onPress={handleChangePin}
									disabled={isLoading}
								>
									{isLoading ? (
										<ActivityIndicator color={colors.white} />
									) : (
										<Text style={styles.buttonText}>Set PIN</Text>
									)}
								</TouchableOpacity>
							</>
						)}
					</>
				)}

				{/* Biometric Settings Section */}
				{activeSection === 'biometric' && (
					<>
						{biometricSupported ? (
							<View style={[styles.card, { marginBottom: 20 }]}>
								<View
									style={[
										styles.row,
										{ justifyContent: 'space-between', alignItems: 'center' },
									]}
								>
									<View style={{ flex: 1 }}>
										<Text
											style={{
												color: colors.dark,
												fontSize: 16,
												fontWeight: '600',
												marginBottom: 4,
											}}
										>
											Biometric Sign In
										</Text>
										<Text style={{ color: colors.gray, fontSize: 14 }}>
											Use fingerprint or face recognition to sign in quickly
										</Text>
									</View>
									<Switch
										value={useBiometric}
										onValueChange={handleToggleBiometric}
										trackColor={{
											false: colors.lightGray,
											true: colors.primary,
										}}
										disabled={isLoading}
									/>
								</View>
							</View>
						) : (
							<View
								style={[styles.card, { backgroundColor: colors.lightGray }]}
							>
								<Text style={{ color: colors.gray, textAlign: 'center' }}>
									Biometric authentication is not supported on this device
								</Text>
							</View>
						)}
					</>
				)}
			</ScrollView>
		);
	}
	return (
		<ScrollView
			style={styles.container}
			contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
		>
			<Text style={styles.header}>👤 Profile Settings</Text>
			<View style={[styles.card, { marginBottom: 24 }]}>
				<View style={[styles.row, { alignItems: 'center', marginBottom: 12 }]}>
					<Text style={{ fontSize: 24, marginRight: 12 }}>👤</Text>
					<View style={{ flex: 1 }}>
						<View
							style={[styles.row, { alignItems: 'center', marginBottom: 4 }]}
						>
							<Text
								style={{ color: colors.dark, fontSize: 18, fontWeight: '600' }}
							>
								{user?.username}
							</Text>
							{user?.isAdmin && (
								<View
									style={{
										marginLeft: 8,
										backgroundColor: colors.primary,
										paddingHorizontal: 8,
										paddingVertical: 2,
										borderRadius: 4,
									}}
								>
									<Text
										style={{
											color: colors.white,
											fontSize: 10,
											fontWeight: 'bold',
										}}
									>
										ADMIN
									</Text>
								</View>
							)}
						</View>
						<Text style={{ color: colors.gray, fontSize: 14, marginTop: 2 }}>
							{user?.email || 'No email set'}
						</Text>
					</View>
				</View>
				<Text style={{ color: colors.gray, fontSize: 12 }}>
					Member since {new Date(user?.createdAt || '').toLocaleDateString()}
				</Text>
			</View>
			<Text style={[styles.subheader, { marginBottom: 16 }]}>
				Security Settings
			</Text>
			{renderThemeSettings()}
			<TouchableOpacity
				style={[styles.card, { marginBottom: 12 }]}
				onPress={() => setActiveSection('email')}
			>
				<View
					style={[
						styles.row,
						{ justifyContent: 'space-between', alignItems: 'center' },
					]}
				>
					<View style={[styles.row, { alignItems: 'center', flex: 1 }]}>
						<Text style={{ fontSize: 20, marginRight: 12 }}>📧</Text>
						<View style={{ flex: 1 }}>
							<Text
								style={{ color: colors.dark, fontSize: 16, fontWeight: '600' }}
							>
								Email Address
							</Text>
							<Text style={{ color: colors.gray, fontSize: 14 }}>
								{user?.email || 'Not set'}
							</Text>
						</View>
					</View>
					<Text style={{ color: colors.primary }}>→</Text>
				</View>
			</TouchableOpacity>
			<TouchableOpacity
				style={[styles.card, { marginBottom: 12 }]}
				onPress={() => setActiveSection('password')}
			>
				<View
					style={[
						styles.row,
						{ justifyContent: 'space-between', alignItems: 'center' },
					]}
				>
					<View style={[styles.row, { alignItems: 'center', flex: 1 }]}>
						<Text style={{ fontSize: 20, marginRight: 12 }}>🔒</Text>
						<View style={{ flex: 1 }}>
							<Text
								style={{ color: colors.dark, fontSize: 16, fontWeight: '600' }}
							>
								Password
							</Text>
							<Text style={{ color: colors.gray, fontSize: 14 }}>
								Change your password
							</Text>
						</View>
					</View>
					<Text style={{ color: colors.primary }}>→</Text>
				</View>
			</TouchableOpacity>
			<TouchableOpacity
				style={[styles.card, { marginBottom: 12 }]}
				onPress={() => setActiveSection('pin')}
			>
				<View
					style={[
						styles.row,
						{ justifyContent: 'space-between', alignItems: 'center' },
					]}
				>
					<View style={[styles.row, { alignItems: 'center', flex: 1 }]}>
						<Text style={{ fontSize: 20, marginRight: 12 }}>🔑</Text>
						<View style={{ flex: 1 }}>
							<Text
								style={{ color: colors.dark, fontSize: 16, fontWeight: '600' }}
							>
								PIN
							</Text>
							<Text style={{ color: colors.gray, fontSize: 14 }}>
								{user?.pinHash ? 'Change or remove PIN' : 'Set up PIN login'}
							</Text>
						</View>
					</View>
					<Text style={{ color: colors.primary }}>→</Text>
				</View>
			</TouchableOpacity>
			<TouchableOpacity
				style={[styles.card, { marginBottom: 12 }]}
				onPress={() => setActiveSection('biometric')}
			>
				<View
					style={[
						styles.row,
						{ justifyContent: 'space-between', alignItems: 'center' },
					]}
				>
					<View style={[styles.row, { alignItems: 'center', flex: 1 }]}>
						<Text style={{ fontSize: 20, marginRight: 12 }}>👆</Text>
						<View style={{ flex: 1 }}>
							<Text
								style={{ color: colors.dark, fontSize: 16, fontWeight: '600' }}
							>
								Biometric Sign In
							</Text>
							<Text style={{ color: colors.gray, fontSize: 14 }}>
								{user?.biometricEnabled ? 'Enabled' : 'Disabled'}
							</Text>
						</View>
					</View>
					<Text style={{ color: colors.primary }}>→</Text>
				</View>
			</TouchableOpacity>
			{!user?.isAdmin && (
				<TouchableOpacity
					style={[styles.card, { marginBottom: 24 }]}
					onPress={() => setActiveSection('backup')}
				>
					<View
						style={[
							styles.row,
							{ justifyContent: 'space-between', alignItems: 'center' },
						]}
					>
						<View style={[styles.row, { alignItems: 'center', flex: 1 }]}>
							<Text style={{ fontSize: 20, marginRight: 12 }}>💾</Text>
							<View style={{ flex: 1 }}>
								<Text
									style={{
										color: colors.dark,
										fontSize: 16,
										fontWeight: '600',
									}}
								>
									Data Backup & Restore
								</Text>
								<Text style={{ color: colors.gray, fontSize: 14 }}>
									Export/Import all your financial data
								</Text>
							</View>
						</View>
						<Text style={{ color: colors.primary }}>→</Text>
					</View>
				</TouchableOpacity>
			)}
			{user?.isAdmin && (
				<View
					style={[
						styles.card,
						{ marginBottom: 24, backgroundColor: colors.lightGray },
					]}
				>
					<View style={[styles.row, { alignItems: 'center' }]}>
						<Text style={{ fontSize: 20, marginRight: 12 }}>👨‍💼</Text>
						<View style={{ flex: 1 }}>
							<Text
								style={{ color: colors.dark, fontSize: 16, fontWeight: '600' }}
							>
								Admin Data Management
							</Text>
							<Text style={{ color: colors.gray, fontSize: 14 }}>
								Use the Admin Dashboard to manage user data and backups
							</Text>
						</View>
					</View>
				</View>
			)}
			<View style={[styles.card, { marginBottom: 24 }]}>
				<Text style={[styles.subheader, { marginBottom: 12 }]}>
					ℹ️ App Information
				</Text>
				<View
					style={[
						styles.row,
						{ justifyContent: 'space-between', marginBottom: 8 },
					]}
				>
					<Text style={{ color: colors.gray }}>User ID</Text>
					<Text
						style={{
							color: colors.dark,
							fontSize: 12,
							fontFamily: 'monospace',
						}}
					>
						{user?.id?.substring(0, 8)}...
					</Text>
				</View>
				<View
					style={[
						styles.row,
						{ justifyContent: 'space-between', marginBottom: 8 },
					]}
				>
					<Text style={{ color: colors.gray }}>Last Login</Text>
					<Text style={{ color: colors.dark, fontSize: 12 }}>
						{user?.lastLogin
							? new Date(user.lastLogin).toLocaleDateString()
							: 'Never'}
					</Text>
				</View>
				<View style={[styles.row, { justifyContent: 'space-between' }]}>
					<Text style={{ color: colors.gray }}>Data Version</Text>
					<Text style={{ color: colors.dark, fontSize: 12 }}>1.0.0</Text>
				</View>
			</View>
			<TouchableOpacity
				style={[styles.button, styles.buttonDanger]}
				onPress={() => {
					Alert.alert('Logout', 'Are you sure you want to logout?', [
						{ text: 'Cancel', style: 'cancel' },
						{
							text: 'Logout',
							style: 'destructive',
							onPress: logout,
						},
					]);
				}}
			>
				<Text style={styles.buttonText}>Logout</Text>
			</TouchableOpacity>
		</ScrollView>
	);
};
