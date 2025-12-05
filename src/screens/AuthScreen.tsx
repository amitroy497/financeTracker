import { useAuth } from '@/hooks';
import { createStyles } from '@/styles';
import { useTheme } from '@/theme';
import { AuthMode } from '@/types';
import React, { useState } from 'react';
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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export const AuthScreen = () => {
	const { colors } = useTheme();
	const styles = createStyles(colors);
	const { login, register, enableBiometric, biometricSupported, isLoading } =
		useAuth();

	const [mode, setMode] = useState<AuthMode>('login');
	const [username, setUsername] = useState('');
	const [email, setEmail] = useState(''); // Add email state
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [pin, setPin] = useState('');
	const [confirmPin, setConfirmPin] = useState('');
	const [useBiometric, setUseBiometric] = useState(false);
	const [enableBio, setEnableBio] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showAdminLogin, setShowAdminLogin] = useState(false);
	const [adminUsername, setAdminUsername] = useState('admin');
	const [adminPassword, setAdminPassword] = useState('');

	// Add state for password visibility
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [showAdminPassword, setShowAdminPassword] = useState(false);

	const handleLogin = async (): Promise<void> => {
		if (!username.trim()) {
			Alert.alert('Error', 'Please enter username');
			return;
		}

		if (useBiometric) {
			// Biometric login
			const success = await login({ username, useBiometric: true });
			if (!success) {
				Alert.alert('Error', 'Biometric authentication failed');
			}
		} else if (pin) {
			// PIN login
			if (!pin.trim()) {
				Alert.alert('Error', 'Please enter PIN');
				return;
			}
			if (pin.length !== 4) {
				Alert.alert('Error', 'PIN must be 4 digits');
				return;
			}
			const success = await login({ username, pin });
			if (!success) {
				Alert.alert('Error', 'Invalid PIN');
			}
		} else {
			// Password login
			if (!password.trim()) {
				Alert.alert('Error', 'Please enter password');
				return;
			}
			const success = await login({ username, password });
			if (!success) {
				Alert.alert('Error', 'Invalid credentials');
			}
		}
	};

	const handleRegister = async (): Promise<void> => {
		if (!username.trim() || !password.trim()) {
			Alert.alert('Error', 'Please fill in all required fields');
			return;
		}

		if (password !== confirmPassword) {
			Alert.alert('Error', 'Passwords do not match');
			return;
		}

		if (pin && pin !== confirmPin) {
			Alert.alert('Error', 'PINs do not match');
			return;
		}

		if (pin && pin.length !== 4) {
			Alert.alert('Error', 'PIN must be 4 digits');
			return;
		}

		// Email validation (optional but recommended)
		if (email && !isValidEmail(email)) {
			Alert.alert('Error', 'Please enter a valid email address');
			return;
		}

		setIsSubmitting(true);
		try {
			const success = await register({
				username,
				email: email || undefined, // Pass email to register function
				password,
				pin: pin || undefined,
				biometricEnabled: enableBio,
			});

			if (success) {
				Alert.alert('Success', 'Account created successfully!');
				resetForm();
			} else {
				Alert.alert('Error', 'Registration failed');
			}
		} catch (error: any) {
			Alert.alert('Error', error.message || 'Registration failed');
		} finally {
			setIsSubmitting(false);
		}
	};

	// Email validation function
	const isValidEmail = (email: string): boolean => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	};

	const handleAdminLogin = async (): Promise<void> => {
		if (!adminUsername.trim() || !adminPassword.trim()) {
			Alert.alert('Error', 'Please enter admin credentials');
			return;
		}

		setIsSubmitting(true);
		try {
			const success = await login({
				username: adminUsername,
				password: adminPassword,
			});

			if (!success) {
				Alert.alert('Error', 'Invalid admin credentials');
			}
		} catch (error: any) {
			Alert.alert('Error', error.message || 'Admin login failed');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleBiometricLogin = async (): Promise<void> => {
		if (!username.trim()) {
			Alert.alert('Error', 'Please enter username first');
			return;
		}

		const success = await login({ username, useBiometric: true });
		if (!success) {
			Alert.alert('Error', 'Biometric authentication failed');
		}
	};

	const resetForm = (): void => {
		setUsername('');
		setEmail(''); // Reset email
		setPassword('');
		setConfirmPassword('');
		setPin('');
		setConfirmPin('');
		setUseBiometric(false);
		setEnableBio(false);
		setAdminUsername('admin');
		setAdminPassword('');
		setShowAdminLogin(false);
		// Reset visibility states
		setShowPassword(false);
		setShowConfirmPassword(false);
		setShowAdminPassword(false);
	};

	const handleModeChange = (newMode: AuthMode): void => {
		setMode(newMode);
		resetForm();
	};

	if (isLoading) {
		return (
			<View style={[styles.container, styles.center]}>
				<ActivityIndicator size='large' color={colors.primary} />
				<Text style={{ marginTop: 16, color: colors.gray }}>Loading...</Text>
			</View>
		);
	}

	// Admin Login View - SIMPLIFIED VERSION
	if (showAdminLogin) {
		return (
			<ScrollView
				style={styles.container}
				contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
			>
				<View style={{ padding: 20 }}>
					{/* Simplified Header - Removed Back Button */}
					<View style={{ marginBottom: 40 }}>
						<Text style={[styles.header, { textAlign: 'center' }]}>
							🔐 ADMINISTRATOR LOGIN
						</Text>
						<Text
							style={{
								color: colors.danger,
								fontSize: 14,
								textAlign: 'center',
								marginTop: 12,
								fontWeight: '600',
							}}
						>
							RESTRICTED ACCESS
						</Text>
						<Text
							style={{
								color: colors.gray,
								fontSize: 12,
								textAlign: 'center',
								marginTop: 4,
							}}
						>
							Administrative users only
						</Text>
					</View>

					{/* Admin Login Form */}
					<View style={[styles.card, { marginBottom: 24 }]}>
						<TextInput
							style={[
								styles.input,
								{ textAlign: 'center', fontWeight: 'bold' },
							]}
							placeholder='ADMIN USERNAME'
							value={adminUsername}
							onChangeText={setAdminUsername}
							placeholderTextColor={colors.gray}
							autoCapitalize='none'
							editable={false}
							selectTextOnFocus={false}
						/>

						{/* Admin Password with Eye Icon */}
						<View style={{ position: 'relative', marginBottom: 20 }}>
							<TextInput
								style={[styles.input, { textAlign: 'center' }]}
								placeholder='ADMIN PASSWORD'
								value={adminPassword}
								onChangeText={setAdminPassword}
								placeholderTextColor={colors.gray}
								secureTextEntry={!showAdminPassword}
							/>
							<TouchableOpacity
								style={{
									position: 'absolute',
									right: 12,
									top: '50%',
									transform: [{ translateY: -12 }],
								}}
								onPress={() => setShowAdminPassword(!showAdminPassword)}
							>
								<Icon
									name={showAdminPassword ? 'eye-off' : 'eye'}
									size={24}
									color={colors.gray}
								/>
							</TouchableOpacity>
						</View>

						<TouchableOpacity
							style={[
								styles.button,
								{
									backgroundColor: colors.dark,
									marginBottom: 16,
									paddingVertical: 16,
								},
							]}
							onPress={handleAdminLogin}
							disabled={isSubmitting}
						>
							{isSubmitting ? (
								<ActivityIndicator color={colors.white} />
							) : (
								<Text style={[styles.buttonText, { fontSize: 18 }]}>
									LOGIN AS ADMINISTRATOR
								</Text>
							)}
						</TouchableOpacity>

						{/* Minimal Back Option */}
						<TouchableOpacity
							style={{ alignSelf: 'center', padding: 12 }}
							onPress={() => {
								setShowAdminLogin(false);
								resetForm();
							}}
						>
							<Text style={{ color: colors.gray, fontSize: 14 }}>
								← Return to User Login
							</Text>
						</TouchableOpacity>
					</View>

					{/* Admin Information Card - Removed features list */}
					<View style={[styles.card, { backgroundColor: colors.lightGray }]}>
						<Text
							style={{
								color: colors.dark,
								fontWeight: '600',
								marginBottom: 12,
								textAlign: 'center',
								fontSize: 16,
							}}
						>
							SYSTEM ADMINISTRATION
						</Text>
						<Text
							style={{ color: colors.gray, fontSize: 12, textAlign: 'center' }}
						>
							Full system access for user management and data administration
						</Text>
					</View>
				</View>
			</ScrollView>
		);
	}

	// Main Auth View (Login/Register) - NO ADMIN OPTION IN MAIN VIEW
	return (
		<ScrollView
			style={styles.container}
			contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
		>
			<View style={{ padding: 20 }}>
				<Text style={styles.header}>🔐 Finance Tracker</Text>
				<View style={styles.headerContainer}>
					<Text style={styles.headerPower}>Created by </Text>
					<Text style={styles.headerName}>Amit Roy</Text>
				</View>
				<Text
					style={{ color: colors.gray, textAlign: 'center', marginBottom: 30 }}
				>
					Track your expenses, savings, and investments
				</Text>

				{/* Mode Toggle */}
				<View
					style={[styles.row, { marginBottom: 30, justifyContent: 'center' }]}
				>
					<TouchableOpacity
						style={[
							styles.button,
							mode === 'login' ? styles.buttonPrimary : styles.buttonSecondary,
							{ marginHorizontal: 8 },
						]}
						onPress={() => handleModeChange('login')}
					>
						<Text style={styles.buttonText}>Login</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={[
							styles.button,
							mode === 'register'
								? styles.buttonPrimary
								: styles.buttonSecondary,
							{ marginHorizontal: 8 },
						]}
						onPress={() => handleModeChange('register')}
					>
						<Text style={styles.buttonText}>Register</Text>
					</TouchableOpacity>
				</View>

				{/* Username */}
				<TextInput
					style={styles.input}
					placeholder='Username'
					value={username}
					onChangeText={setUsername}
					placeholderTextColor={colors.gray}
					autoCapitalize='none'
				/>

				{mode === 'login' ? (
					/* LOGIN FORM */
					<>
						{/* Password Login */}
						{!useBiometric && !pin && (
							<>
								{/* Password with Eye Icon */}
								<View style={{ position: 'relative', marginBottom: 16 }}>
									<TextInput
										style={styles.input}
										placeholder='Password'
										value={password}
										onChangeText={setPassword}
										placeholderTextColor={colors.gray}
										secureTextEntry={!showPassword}
									/>
									<TouchableOpacity
										style={{
											position: 'absolute',
											right: 12,
											top: '50%',
											transform: [{ translateY: -12 }],
										}}
										onPress={() => setShowPassword(!showPassword)}
									>
										<Icon
											name={showPassword ? 'eye-off' : 'eye'}
											size={24}
											color={colors.gray}
										/>
									</TouchableOpacity>
								</View>

								<TouchableOpacity
									style={{ alignSelf: 'flex-end', marginBottom: 16 }}
									onPress={() => {
										setPin(''); // Clear PIN field
										setPassword(''); // Clear password field
										setPin('0000'); // Set placeholder PIN
									}}
								>
									<Text style={{ color: colors.primary, fontSize: 14 }}>
										Use PIN instead
									</Text>
								</TouchableOpacity>
							</>
						)}

						{/* PIN Login */}
						{pin !== '' && (
							<>
								<TextInput
									style={styles.input}
									placeholder='PIN (4 digits)'
									value={pin}
									onChangeText={setPin}
									placeholderTextColor={colors.gray}
									keyboardType='number-pad'
									secureTextEntry
									maxLength={4}
								/>

								<TouchableOpacity
									style={{ alignSelf: 'flex-end', marginBottom: 16 }}
									onPress={() => {
										setPin('');
										setPassword('');
									}}
								>
									<Text style={{ color: colors.primary, fontSize: 14 }}>
										Use Password instead
									</Text>
								</TouchableOpacity>
							</>
						)}

						{/* Biometric Option */}
						{biometricSupported && (
							<View
								style={[
									styles.row,
									{ marginBottom: 20, justifyContent: 'space-between' },
								]}
							>
								<Text style={{ color: colors.dark, fontSize: 16 }}>
									Use Biometric
								</Text>
								<Switch
									value={useBiometric}
									onValueChange={(value) => {
										setUseBiometric(value);
										if (value) {
											setPin('');
											setPassword('');
										}
									}}
									trackColor={{ false: colors.lightGray, true: colors.primary }}
								/>
							</View>
						)}

						<TouchableOpacity
							style={[
								styles.button,
								styles.buttonPrimary,
								{ marginBottom: 16 },
							]}
							onPress={handleLogin}
							disabled={isSubmitting}
						>
							{isSubmitting ? (
								<ActivityIndicator color={colors.white} />
							) : (
								<Text style={styles.buttonText}>Login</Text>
							)}
						</TouchableOpacity>

						{/* Quick Biometric Login */}
						{biometricSupported && username && (
							<TouchableOpacity
								style={[
									styles.button,
									{ backgroundColor: colors.info, marginBottom: 12 },
								]}
								onPress={handleBiometricLogin}
								disabled={isSubmitting}
							>
								<Text style={styles.buttonText}>🔐 Login with Biometric</Text>
							</TouchableOpacity>
						)}

						{/* REMOVED ADMIN LOGIN OPTION FROM MAIN VIEW */}

						{/* Forgot Password */}
						<TouchableOpacity
							style={{ alignSelf: 'center', marginBottom: 24 }}
							onPress={() => {
								Alert.alert(
									'Forgot Password',
									'Please contact support or use PIN/biometric login.',
									[{ text: 'OK', style: 'default' }]
								);
							}}
						>
							<Text style={{ color: colors.primary, fontSize: 14 }}>
								Forgot Password?
							</Text>
						</TouchableOpacity>

						{/* Separator and Admin Access Link */}
						<View style={{ alignItems: 'center', marginTop: 20 }}>
							<View
								style={{
									height: 1,
									backgroundColor: colors.lightGray,
									width: '100%',
									marginBottom: 16,
								}}
							/>
							<TouchableOpacity onPress={() => setShowAdminLogin(true)}>
								<Text
									style={{
										color: colors.dark,
										fontSize: 12,
										fontWeight: '600',
									}}
								>
									🔐 ADMINISTRATOR ACCESS
								</Text>
							</TouchableOpacity>
							<Text
								style={{
									color: colors.gray,
									fontSize: 10,
									marginTop: 4,
									textAlign: 'center',
								}}
							>
								Restricted access for system administrators only
							</Text>
						</View>
					</>
				) : (
					/* REGISTER FORM */
					<>
						{/* Email Field (Optional) */}
						<TextInput
							style={styles.input}
							placeholder='Email (Optional)'
							value={email}
							onChangeText={setEmail}
							placeholderTextColor={colors.gray}
							autoCapitalize='none'
							keyboardType='email-address'
						/>

						{/* Password with Eye Icon */}
						<View style={{ position: 'relative', marginBottom: 16 }}>
							<TextInput
								style={styles.input}
								placeholder='Password'
								value={password}
								onChangeText={setPassword}
								placeholderTextColor={colors.gray}
								secureTextEntry={!showPassword}
							/>
							<TouchableOpacity
								style={{
									position: 'absolute',
									right: 12,
									top: '50%',
									transform: [{ translateY: -12 }],
								}}
								onPress={() => setShowPassword(!showPassword)}
							>
								<Icon
									name={showPassword ? 'eye-off' : 'eye'}
									size={24}
									color={colors.gray}
								/>
							</TouchableOpacity>
						</View>

						{/* Confirm Password with Eye Icon */}
						<View style={{ position: 'relative', marginBottom: 16 }}>
							<TextInput
								style={styles.input}
								placeholder='Confirm Password'
								value={confirmPassword}
								onChangeText={setConfirmPassword}
								placeholderTextColor={colors.gray}
								secureTextEntry={!showConfirmPassword}
							/>
							<TouchableOpacity
								style={{
									position: 'absolute',
									right: 12,
									top: '50%',
									transform: [{ translateY: -12 }],
								}}
								onPress={() => setShowConfirmPassword(!showConfirmPassword)}
							>
								<Icon
									name={showConfirmPassword ? 'eye-off' : 'eye'}
									size={24}
									color={colors.gray}
								/>
							</TouchableOpacity>
						</View>

						<TextInput
							style={styles.input}
							placeholder='PIN (Optional, 4 digits)'
							value={pin}
							onChangeText={setPin}
							placeholderTextColor={colors.gray}
							keyboardType='number-pad'
							secureTextEntry
							maxLength={4}
						/>

						{pin && (
							<TextInput
								style={styles.input}
								placeholder='Confirm PIN'
								value={confirmPin}
								onChangeText={setConfirmPin}
								placeholderTextColor={colors.gray}
								keyboardType='number-pad'
								secureTextEntry
								maxLength={4}
							/>
						)}

						{biometricSupported && (
							<View
								style={[
									styles.row,
									{ marginBottom: 20, justifyContent: 'space-between' },
								]}
							>
								<Text style={{ color: colors.dark, fontSize: 16 }}>
									Enable Biometric
								</Text>
								<Switch
									value={enableBio}
									onValueChange={setEnableBio}
									trackColor={{ false: colors.lightGray, true: colors.primary }}
								/>
							</View>
						)}

						<TouchableOpacity
							style={[
								styles.button,
								styles.buttonSuccess,
								{ marginBottom: 16 },
							]}
							onPress={handleRegister}
							disabled={isSubmitting}
						>
							{isSubmitting ? (
								<ActivityIndicator color={colors.white} />
							) : (
								<Text style={styles.buttonText}>Create Account</Text>
							)}
						</TouchableOpacity>

						{/* Registration Info */}
						<View
							style={[
								styles.card,
								{ backgroundColor: colors.lightGray, marginTop: 12 },
							]}
						>
							<Text
								style={{ color: colors.gray, fontSize: 12, marginBottom: 4 }}
							>
								• Password must be at least 6 characters
							</Text>
							<Text
								style={{ color: colors.gray, fontSize: 12, marginBottom: 4 }}
							>
								• Email is optional but recommended for account recovery
							</Text>
							<Text
								style={{ color: colors.gray, fontSize: 12, marginBottom: 4 }}
							>
								• PIN is optional but recommended for quick login
							</Text>
							<Text style={{ color: colors.gray, fontSize: 12 }}>
								• Biometric login can be enabled later in settings
							</Text>
						</View>

						{/* Separator and Admin Access Link for Register View */}
						<View style={{ alignItems: 'center', marginTop: 20 }}>
							<View
								style={{
									height: 1,
									backgroundColor: colors.lightGray,
									width: '100%',
									marginBottom: 16,
								}}
							/>
							<TouchableOpacity onPress={() => setShowAdminLogin(true)}>
								<Text
									style={{
										color: colors.dark,
										fontSize: 12,
										fontWeight: '600',
									}}
								>
									🔐 ADMINISTRATOR ACCESS
								</Text>
							</TouchableOpacity>
							<Text
								style={{
									color: colors.gray,
									fontSize: 10,
									marginTop: 4,
									textAlign: 'center',
								}}
							>
								System administrators click here for restricted access
							</Text>
						</View>
					</>
				)}

				{/* Demo Credentials Info (for testing) - Only show for regular users */}
				{mode === 'login' && !showAdminLogin && (
					<TouchableOpacity
						style={{ alignSelf: 'center', marginTop: 20 }}
						onPress={() => {
							Alert.alert(
								'Demo Information',
								'For testing purposes:\n\n' +
									'Username: demo\n' +
									'Password: demo123\n\n' +
									'Create your own account for real usage.',
								[{ text: 'OK', style: 'default' }]
							);
						}}
					>
						<Text
							style={{ color: colors.gray, fontSize: 12, textAlign: 'center' }}
						>
							👉 Need test credentials?
						</Text>
					</TouchableOpacity>
				)}
			</View>
		</ScrollView>
	);
};
