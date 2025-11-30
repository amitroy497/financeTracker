import * as LocalAuthentication from 'expo-local-authentication';

export class BiometricAuth {
	// Check if biometric authentication is available
	static async isBiometricSupported(): Promise<boolean> {
		try {
			const compatible = await LocalAuthentication.hasHardwareAsync();
			const enrolled = await LocalAuthentication.isEnrolledAsync();
			return compatible && enrolled;
		} catch (error) {
			console.error('Error checking biometric support:', error);
			return false;
		}
	}

	// Get available authentication types
	static async getSupportedTypes(): Promise<
		LocalAuthentication.AuthenticationType[]
	> {
		try {
			return await LocalAuthentication.supportedAuthenticationTypesAsync();
		} catch (error) {
			console.error('Error getting supported auth types:', error);
			return [];
		}
	}

	// Authenticate with biometrics
	static async authenticate(
		promptMessage: string = 'Authenticate to access your data'
	): Promise<boolean> {
		try {
			const result = await LocalAuthentication.authenticateAsync({
				promptMessage,
				fallbackLabel: 'Use Passcode',
				disableDeviceFallback: false,
			});

			return result.success;
		} catch (error) {
			console.error('Biometric authentication error:', error);
			return false;
		}
	}

	// Get biometric type name
	static getBiometricTypeName(
		type: LocalAuthentication.AuthenticationType
	): string {
		switch (type) {
			case LocalAuthentication.AuthenticationType.FINGERPRINT:
				return 'Fingerprint';
			case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
				return 'Face ID';
			case LocalAuthentication.AuthenticationType.IRIS:
				return 'Iris Scan';
			default:
				return 'Biometric';
		}
	}
}
