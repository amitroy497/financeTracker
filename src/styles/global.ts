import { Dimensions, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');

export const colors = {
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
} as const;

export const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: colors.light,
	},
	container: {
		flex: 1,
		padding: 20,
		backgroundColor: colors.light,
	},
	header: {
		fontSize: 28,
		fontWeight: 'bold' as const,
		textAlign: 'center' as const,
		marginBottom: 20,
		color: colors.dark,
	},
	subHeading: {
		fontSize: 18,
		fontWeight: 'bold' as const,
		color: colors.dark,
	},
	card: {
		backgroundColor: colors.white,
		padding: 16,
		borderRadius: 12,
		marginBottom: 12,
		shadowColor: colors.dark,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	subheader: {
		fontSize: 18,
		fontWeight: '600',
		color: colors.dark,
		marginBottom: 8,
	},
	input: {
		backgroundColor: colors.white,
		padding: 16,
		borderRadius: 12,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: colors.lightGray,
		fontSize: 16,
		color: colors.dark,
	},
	textArea: {
		height: 100,
		textAlignVertical: 'top' as const,
	},
	searchInput: {
		backgroundColor: colors.white,
		padding: 16,
		borderRadius: 12,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: colors.lightGray,
		fontSize: 16,
		color: colors.dark,
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
		color: colors.gray,
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
		color: colors.gray,
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
		color: colors.dark,
	},
	itemDescription: {
		fontSize: 14,
		color: colors.gray,
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
		color: colors.gray,
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
