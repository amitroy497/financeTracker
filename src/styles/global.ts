import { StyleSheet } from 'react-native';

// Define theme colors
export const lightColors = {
	primary: '#007AFF',
	secondary: '#6c757d',
	success: '#28a745',
	danger: '#dc3545',
	warning: '#ffc107',
	info: '#17a2b8',
	light: '#f8f9fa',
	dark: '#343a40',
	white: '#ffffff',
	gray: '#6c757d',
	lightGray: '#e9ecef',
	infoLight: '#dbeafe',
	background: '#ffffff',
	cardBackground: '#ffffff',
	text: '#343a40',
	textSecondary: '#6c757d',
	border: '#dee2e6',
	shadow: '#000000',
} as const;

export const darkColors = {
	primary: '#0a84ff',
	secondary: '#8e8e93',
	success: '#30d158',
	danger: '#ff453a',
	warning: '#ffd60a',
	error: '#ff0000',
	info: '#64d2ff',
	light: '#1c1c1e',
	dark: '#f5f5f7',
	white: '#000000',
	gray: '#8e8e93',
	lightGray: '#2c2c2e',
	infoLight: '#0d1b2a',
	background: '#000000',
	cardBackground: '#1c1c1e',
	text: '#f5f5f7',
	textSecondary: '#8e8e93',
	border: '#2c2c2e',
	shadow: '#000000',
} as const;

// Theme type
export type Theme = 'light' | 'dark';
export type ThemeColors = typeof lightColors | typeof darkColors;

// Theme context type
export interface ThemeContextType {
	theme: Theme;
	colors: typeof lightColors | typeof darkColors;
	autoTheme?: boolean;
	toggleTheme: () => void;
	setTheme: (theme: Theme) => void;
	toggleAutoTheme?: () => Promise<void>;
	setAutoTheme?: (enabled: boolean) => void;
}

// Create styles that adapt to theme
export const createStyles = (colors: ThemeColors) =>
	StyleSheet.create({
		safeArea: {
			flex: 1,
			backgroundColor: colors.background,
		},
		container: {
			flex: 1,
			padding: 20,
			backgroundColor: colors.background,
		},
		relative: {
			position: 'relative' as const,
			justifyContent: 'center',
		},
		header: {
			fontSize: 28,
			fontWeight: 'bold' as const,
			textAlign: 'center' as const,
			marginBottom: 20,
			color: colors.text,
		},
		headerContainer: {
			flexDirection: 'row' as const,
			justifyContent: 'center' as const,
			marginBottom: 10,
			alignItems: 'center' as const,
		},
		headerPower: {
			fontSize: 16,
			color: colors.text,
		},
		headerName: {
			fontSize: 18,
			fontWeight: 'bold' as const,
			color: colors.text,
		},
		subHeading: {
			fontSize: 18,
			fontWeight: 'bold' as const,
			color: colors.text,
		},
		card: {
			backgroundColor: colors.cardBackground,
			padding: 16,
			borderRadius: 12,
			marginBottom: 12,
			shadowColor: colors.shadow,
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.1,
			shadowRadius: 4,
			elevation: 3,
			borderWidth: 1,
			borderColor: colors.border,
		},
		subheader: {
			fontSize: 18,
			fontWeight: '600',
			color: colors.text,
			marginBottom: 8,
		},
		mandatoryAsterisk: {
			color: 'red',
		},
		inputContainer: {
			paddingTop: 8,
			borderTopWidth: 1,
			borderBottomWidth: 1,
			marginVertical: 12,
			borderColor: colors.border,
		},
		label: {
			fontSize: 16,
			fontWeight: '500',
			paddingHorizontal: 16,
			paddingBottom: 8,
		},
		input: {
			backgroundColor: colors.cardBackground,
			padding: 16,
			borderRadius: 12,
			marginBottom: 12,
			borderWidth: 1,
			borderColor: colors.border,
			fontSize: 16,
			color: colors.text,
			alignItems: 'center' as const,
		},
		placeholderWrapper: {
			position: 'absolute',
			left: 16,
			right: 16,
			top: 0,
			bottom: 0,
			justifyContent: 'center',
			height: 56,
		},
		placeholder: {
			color: colors.gray,
			fontSize: 16,
		},
		textArea: {
			height: 100,
			textAlignVertical: 'top' as const,
		},
		searchInput: {
			backgroundColor: colors.cardBackground,
			padding: 16,
			borderRadius: 12,
			marginBottom: 12,
			borderWidth: 1,
			borderColor: colors.border,
			fontSize: 16,
			color: colors.text,
		},
		button: {
			paddingVertical: 12,
			paddingHorizontal: 16,
			borderRadius: 12,
			alignItems: 'center' as const,
			justifyContent: 'center' as const,
			flexDirection: 'row' as const,
		},
		buttonPrimary: {
			backgroundColor: colors.primary,
		},
		buttonSecondary: {
			backgroundColor: colors.secondary,
		},
		buttonDanger: {
			backgroundColor: colors.danger,
		},
		buttonSuccess: {
			backgroundColor: colors.success,
		},
		buttonText: {
			color: colors.white,
			fontSize: 16,
			fontWeight: 'bold' as const,
		},
		actionButton: {
			paddingHorizontal: 12,
			paddingVertical: 6,
			borderRadius: 6,
		},
		editButton: {
			backgroundColor: colors.primary,
		},
		deleteButton: {
			backgroundColor: colors.danger,
		},
		actionButtonText: {
			color: colors.white,
			fontSize: 12,
			fontWeight: 'bold' as const,
		},
		row: {
			flexDirection: 'row' as const,
			alignItems: 'center' as const,
		},
		spaceBetween: {
			justifyContent: 'space-between' as const,
		},
		center: {
			alignItems: 'center' as const,
			justifyContent: 'center' as const,
		},
		emptyState: {
			padding: 40,
			alignItems: 'center' as const,
		},
		emptyStateText: {
			fontSize: 16,
			color: colors.textSecondary,
			textAlign: 'center' as const,
		},
		fileInfo: {
			backgroundColor: colors.lightGray,
			padding: 12,
			borderRadius: 8,
			marginBottom: 12,
			alignItems: 'center' as const,
		},
		fileInfoText: {
			fontSize: 12,
			color: colors.textSecondary,
			fontWeight: '500' as const,
		},
		itemContent: {
			flex: 1,
			marginRight: 12,
		},
		itemTitle: {
			fontSize: 16,
			fontWeight: 'bold' as const,
			marginBottom: 6,
			color: colors.text,
		},
		itemDescription: {
			fontSize: 14,
			color: colors.textSecondary,
			marginBottom: 8,
			lineHeight: 20,
		},
		itemDates: {
			flexDirection: 'row' as const,
			flexWrap: 'wrap' as const,
			gap: 8,
		},
		itemDate: {
			fontSize: 12,
			color: colors.textSecondary,
		},
		itemActions: {
			flexDirection: 'row' as const,
			gap: 8,
		},
		formActions: {
			flexDirection: 'row' as const,
			gap: 12,
			marginBottom: 20,
		},
		headerSection: {
			flexDirection: 'row' as const,
			justifyContent: 'space-between' as const,
			alignItems: 'center' as const,
			marginTop: 20,
			marginBottom: 10,
		},
	});

// For backward compatibility
export const colors = lightColors;
export const styles = createStyles(lightColors);
