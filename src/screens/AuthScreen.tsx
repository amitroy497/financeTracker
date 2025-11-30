import { useAuth } from '@/hooks';
import { colors, styles } from '@/styles';
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

type AuthMode = 'login' | 'register' | 'biometric';

export const AuthScreen: React.FC = () => {
	const { login, register, enableBiometric, biometricSupported, isLoading } =
		useAuth();

	const [mode, setMode] = useState<AuthMode>('login');
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [pin, setPin] = useState('');
	const [confirmPin, setConfirmPin] = useState('');
	const [useBiometric, setUseBiometric] = useState(false);
	const [enableBio, setEnableBio] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

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

		setIsSubmitting(true);
		try {
			const success = await register({
				username,
				password,
				pin: pin || undefined,
				biometricEnabled: enableBio,
			});

			if (success) {
				Alert.alert('Success', 'Account created successfully!');
			} else {
				Alert.alert('Error', 'Registration failed');
			}
		} catch (error: any) {
			Alert.alert('Error', error.message || 'Registration failed');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleBiometricLogin = async (): Promise<void> => {
		const success = await login({ username, useBiometric: true });
		if (!success) {
			Alert.alert('Error', 'Biometric authentication failed');
		}
	};

	const resetForm = (): void => {
		setUsername('');
		setPassword('');
		setConfirmPassword('');
		setPin('');
		setConfirmPin('');
		setUseBiometric(false);
		setEnableBio(false);
	};

	if (isLoading) {
		return (
			<View style={[styles.container, styles.center]}>
				<ActivityIndicator size='large' color={colors.primary} />
				<Text style={{ marginTop: 16, color: colors.gray }}>Loading...</Text>
			</View>
		);
	}

	return (
		<ScrollView
			style={styles.container}
			contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
		>
			<View style={{ padding: 20 }}>
				<Text style={styles.header}>🔐 Finance Tracker</Text>

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
						onPress={() => {
							setMode('login');
							resetForm();
						}}
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
						onPress={() => {
							setMode('register');
							resetForm();
						}}
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
								<TextInput
									style={styles.input}
									placeholder='Password'
									value={password}
									onChangeText={setPassword}
									placeholderTextColor={colors.gray}
									secureTextEntry
								/>

								<TouchableOpacity
									style={{ alignSelf: 'flex-end', marginBottom: 16 }}
									onPress={() => setPin('0000')} // Simple way to switch to PIN
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
									placeholder='PIN'
									value={pin}
									onChangeText={setPin}
									placeholderTextColor={colors.gray}
									keyboardType='number-pad'
									secureTextEntry
									maxLength={4}
								/>

								<TouchableOpacity
									style={{ alignSelf: 'flex-end', marginBottom: 16 }}
									onPress={() => setPin('')}
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
									onValueChange={setUseBiometric}
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
					</>
				) : (
					/* REGISTER FORM */
					<>
						<TextInput
							style={styles.input}
							placeholder='Password'
							value={password}
							onChangeText={setPassword}
							placeholderTextColor={colors.gray}
							secureTextEntry
						/>

						<TextInput
							style={styles.input}
							placeholder='Confirm Password'
							value={confirmPassword}
							onChangeText={setConfirmPassword}
							placeholderTextColor={colors.gray}
							secureTextEntry
						/>

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
					</>
				)}

				{/* Quick Biometric Login Demo */}
				{mode === 'login' && biometricSupported && username && (
					<TouchableOpacity
						style={[
							styles.button,
							{ backgroundColor: colors.info, marginBottom: 16 },
						]}
						onPress={handleBiometricLogin}
					>
						<Text style={styles.buttonText}>🔐 Login with Biometric</Text>
					</TouchableOpacity>
				)}
			</View>
		</ScrollView>
	);
};
