import { KeyboardType } from 'react-native';

// Item types
export interface Item {
	id: string;
	title: string;
	description?: string;
	amount?: number;
	category?: string;
	createdAt: string;
	updatedAt: string;
}

export interface ItemFormData {
	title: string;
	description?: string;
	amount?: number;
	category?: string;
}

export interface StorageInfo {
	fileSize: number;
	itemsCount: number;
	filePath: string;
	lastModified: number | null;
}

export interface FileSystemData {
	items: Item[];
	createdAt: string;
	updatedAt: string;
}

// Enhanced FileInfo type that handles both exists and doesn't exist cases
export interface FileSystemFileInfo {
	exists: true;
	uri: string;
	size: number;
	isDirectory: boolean;
	modificationTime: number;
	md5?: string;
}

export interface FileSystemNoFileInfo {
	exists: false;
	uri: string;
	isDirectory: false;
}

export type FileSystemInfo = FileSystemFileInfo | FileSystemNoFileInfo;

// Component prop types
export interface ItemFormProps {
	onSubmit: (item: ItemFormData) => Promise<void>;
	editingItem?: Item | null;
	onCancel?: () => void;
	categories?: string[];
}

export interface ItemListProps {
	items: Item[];
	onEdit: (item: Item) => void;
	onDelete: (id: string) => void;
	refreshing?: boolean;
	onRefresh?: () => void;
	emptyMessage?: string;
}

export interface SearchBarProps {
	searchQuery: string;
	onSearchChange: (query: string) => void;
	placeholder?: string;
}

export interface FileInfoProps {
	storageInfo: StorageInfo | null;
	onRefresh: () => void;
}

// Add these new types for authentication
export interface User {
	id: string;
	username: string;
	email?: string;
	passwordHash: string;
	pinHash?: string;
	biometricEnabled: boolean;
	createdAt: string;
	lastLogin?: string;
	isAdmin?: boolean;
}

export interface AuthCredentials {
	username: string;
	email?: string;
	password: string;
	pin?: string;
	biometricEnabled?: boolean;
	isAdmin?: boolean;
}

export interface LoginCredentials {
	username: string;
	email?: string;
	password?: string;
	pin?: string;
	useBiometric?: boolean;
}

export interface AuthState {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	biometricSupported: boolean;
}

export interface AuthContextType extends AuthState {
	login: (credentials: LoginCredentials) => Promise<boolean>;
	register: (credentials: AuthCredentials) => Promise<boolean>;
	logout: () => void;
	enableBiometric: (enable: boolean) => Promise<void>;
	changePassword: (
		oldPassword: string,
		newPassword: string
	) => Promise<boolean>;
	changePin: (newPin: string) => Promise<boolean>;
	updateEmail: (newEmail: string) => Promise<boolean>;
}

// Add these new types for assets and dashboard

export interface AssetSummary {
	totalAssets: number;
	cash: number;
	fixedDeposits: number;
	recurringDeposits: number;
	mutualFunds: number;
	goldETFs: number;
	stocks: number;
	equityETFs: number;
	ppf: number;
	frb: number;
	nps: number;
	otherAssets: number;
}

export interface BankAccount {
	id: string;
	accountName: string;
	bankName: string;
	accountNumber?: string;
	accountType: 'Savings' | 'Current' | 'Salary';
	balance: number;
	currency?: string;
	interestRate?: number;
	notes?: string;
	lastUpdated: string;
	createdAt?: string;
}

export interface FixedDeposit {
	id: string;
	bankName: string;
	depositNumber?: string;
	amount: number;
	interestRate: number;
	startDate: string;
	maturityDate: string;
	tenure: number; // in months
	status: 'Active' | 'Matured';
	description?: string;
}

export interface RecurringDeposit {
	id: string;
	bankName: string;
	accountNumber?: string;
	monthlyAmount: number;
	totalAmount: number;
	interestRate: number;
	startDate: string;
	maturityDate: string;
	tenure: number; // in months
	completedMonths: number;
	description?: string;
}

export interface MutualFund {
	id: string;
	schemeName: string;
	fundHouse: string;
	folioNumber?: string;
	fundType: 'Equity' | 'Debt' | 'Hybrid' | 'ELSS' | string;
	investedAmount: number;
	units: number;
	nav: number;
	currentValue: number;
	returns: number;
	notes?: string;
	lastUpdated: string;
}

export interface DashboardData {
	summary: AssetSummary;
	bankAccounts: BankAccount[];
	fixedDeposits: FixedDeposit[];
	recurringDeposits: RecurringDeposit[];
	mutualFunds: MutualFund[];
	lastUpdated: string;
	goldETFs: GoldETF[];
	stocks: Stock[];
	equityETFs: EquityETF[];
	ppfAccounts: PublicProvidentFund[];
	frbBonds: FloatingRateBond[];
	npsAccounts: NationalPensionScheme[];
}

export type AppTabParamList = {
	Dashboard: undefined;
	Expenses: undefined;
	Savings: undefined;
	Dividends: undefined;
	Profile: undefined;
	Admin?: undefined;
};

export interface AssetData {
	summary: AssetSummary;
	bankAccounts: BankAccount[];
	fixedDeposits: FixedDeposit[];
	recurringDeposits: RecurringDeposit[];
	mutualFunds: MutualFund[];
	lastUpdated: string;
}

export interface CreateBankAccountData {
	accountName?: string;
	bankName: string;
	accountNumber?: string;
	accountType: 'Savings' | 'Current' | 'Salary';
	balance: number;
	currency?: string;
	interestRate?: number;
	notes?: string;
}

export interface CreateFixedDepositData {
	bankName: string;
	depositNumber?: string;
	amount: number;
	interestRate: number;
	startDate: string;
	tenure: number;
	description?: string;
}

export interface CreateRecurringDepositData {
	bankName: string;
	accountNumber?: string;
	monthlyAmount: number;
	interestRate: number;
	startDate: string;
	tenure: number;
	description?: string;
}

export interface CreateMutualFundData {
	schemeName: string;
	fundHouse: string;
	folioNumber?: string;
	fundType: 'Equity' | 'Debt' | 'Hybrid' | 'ELSS' | string;
	investedAmount: number;
	units: number;
	nav: number;
	notes?: string;
}

// Add new asset types

export interface GoldETF {
	id: string;
	etfName: string;
	symbol?: string;
	units: number;
	currentPrice: number;
	investedAmount: number;
	currentValue: number;
	returns: number;
	notes?: string;
	lastUpdated: string;
}

export interface Stock {
	id: string;
	companyName: string;
	symbol?: string;
	exchange?: 'NSE' | 'BSE';
	quantity: number;
	averagePrice: number;
	currentPrice: number;
	investedAmount: number;
	currentValue: number;
	returns: number;
	notes?: string;
	lastUpdated: string;
}

export interface EquityETF {
	id: string;
	etfName: string;
	symbol?: string;
	units: number;
	currentNav: number;
	investedAmount: number;
	currentValue: number;
	returns: number;
	notes?: string;
	lastUpdated: string;
}

export interface PublicProvidentFund {
	id: string;
	accountNumber?: string;
	financialYear?: string;
	totalDeposits: number;
	currentBalance: number;
	interestRate: number;
	maturityDate: string;
	notes?: string;
	lastUpdated: string;
}

export interface FloatingRateBond {
	id: string;
	bondName: string;
	certificateNumber?: string;
	investmentAmount: number;
	currentValue: number;
	interestRate: number;
	purchaseDate?: string;
	maturityDate: string;
	notes?: string;
	lastUpdated: string;
}

export interface NationalPensionScheme {
	id: string;
	pranNumber?: string;
	totalContribution: number;
	currentValue: number;
	returns: number;
	lastContributionDate?: string;
	notes?: string;
	lastUpdated: string;
}

// Update AssetData interface to include new asset types
export interface AssetData {
	summary: AssetSummary;
	bankAccounts: BankAccount[];
	fixedDeposits: FixedDeposit[];
	recurringDeposits: RecurringDeposit[];
	mutualFunds: MutualFund[];
	goldETFs: GoldETF[];
	stocks: Stock[];
	equityETFs: EquityETF[];
	ppfAccounts: PublicProvidentFund[];
	frbBonds: FloatingRateBond[];
	npsAccounts: NationalPensionScheme[];
	lastUpdated: string;
}

// Update AssetSummary interface
export interface AssetSummary {
	totalAssets: number;
	cash: number;
	fixedDeposits: number;
	recurringDeposits: number;
	mutualFunds: number;
	goldETFs: number;
	stocks: number;
	equityETFs: number;
	ppf: number;
	frb: number;
	nps: number;
	otherAssets: number;
}

// Create interfaces for new asset types
export interface CreateGoldETFData {
	etfName: string;
	symbol?: string;
	units: number;
	currentPrice: number;
	investedAmount: number;
	notes?: string;
}

export interface CreateStockData {
	companyName: string;
	symbol?: string;
	exchange?: 'NSE' | 'BSE';
	quantity: number;
	averagePrice: number;
	currentPrice: number;
	notes?: string;
}

export interface CreateEquityETFData {
	etfName: string;
	symbol?: string;
	units: number;
	currentNav: number;
	investedAmount: number;
	notes?: string;
}

export interface CreatePPFData {
	accountNumber?: string;
	financialYear?: string;
	totalDeposits: number;
	interestRate: number;
	maturityDate: string;
	notes?: string;
}

export interface CreateFRBData {
	bondName: string;
	certificateNumber?: string;
	investmentAmount: number;
	interestRate: number;
	purchaseDate?: string;
	maturityDate: string;
	notes?: string;
}

export interface CreateNPSData {
	pranNumber?: string;
	totalContribution: number;
	currentValue: number;
	lastContributionDate?: string;
	notes?: string;
}

export const SAVINGS_TYPES = [
	{
		key: 'monthly',
		name: 'Monthly Savings',
		emoji: '📅',
		description: 'Regular monthly contributions',
	},
	{
		key: 'daily',
		name: 'Daily Savings',
		emoji: '📊',
		description: 'Daily savings or contributions',
	},
	{
		key: 'lumpsum',
		name: 'Lumpsum Investment',
		emoji: '💰',
		description: 'One-time investment',
	},
];

export interface YearlyFinancialData {
	year: string; // Format: "2024-2025" for financial year
	totalValue?: number;
	totalExpenses?: number;
	totalIncome?: number;
	categoryTotals: { [category: string]: number };
	monthlyTotals: { [month: string]: number }; // Format: "YYYY-MM"
	companyTotals?: { [company: string]: number };
	createdAt: string;
	updatedAt: string;
}

// Add these new types to your existing types file

export interface UserDataExport {
	version: string;
	exportDate: string;
	userId: string;
	username: string;
	assets: AssetData;
	expenses: any[];
	savings: any[];
	dividends: any[];
	userSettings: {
		email?: string;
		biometricEnabled: boolean;
		preferences?: any;
	};
}

export interface AdminUser {
	id: string;
	username: string;
	isAdmin: boolean;
	createdAt: string;
}

export interface AdminCredentials {
	username: string;
	password: string;
}

// Add to AuthCredentials
export interface AuthCredentials {
	username: string;
	password: string;
	pin?: string;
	biometricEnabled?: boolean;
	isAdmin?: boolean; // Add this
}

export type BarChartComponentProps = {
	data: Array<{
		x: string;
		y: number;
		color: string;
		percentage: string;
	}>;
	height?: number;
	showValues?: boolean;
};

export type PieChartData = {
	x: string;
	y: number;
	color: string;
	percentage: string;
};

export type PieChartComponentProps = {
	data: PieChartData[];
	totalAssets: number;
	height?: number;
};

export type AssetCardsProps = {
	summary: AssetSummary;
};

// Updated component prop types with onEdit and onDelete
export type BankAccountsProps = {
	accounts: BankAccount[];
	onEdit?: (assetType: string, assetId: string) => void;
	onDelete?: (assetType: string, assetId: string) => void;
	onRefresh: () => void;
	userId: string;
};

export type EquityETFsProps = {
	etfs: EquityETF[];
	onEdit?: (assetType: string, assetId: string) => void;
	onDelete?: (assetType: string, assetId: string) => void;
	onRefresh: () => void;
	userId: string;
};

export type FixedDepositsProps = {
	deposits: FixedDeposit[];
	onEdit?: (assetType: string, assetId: string) => void;
	onDelete?: (assetType: string, assetId: string) => void;
	onRefresh: () => void;
	userId: string;
};

export type FloatingRateBondsProps = {
	bonds: FloatingRateBond[];
	onEdit?: (assetType: string, assetId: string) => void;
	onDelete?: (assetType: string, assetId: string) => void;
	onRefresh: () => void;
	userId: string;
};

export type GoldETFsProps = {
	etfs: GoldETF[];
	onEdit?: (assetType: string, assetId: string) => void;
	onDelete?: (assetType: string, assetId: string) => void;
	onRefresh: () => void;
	userId: string;
};

export type MutualFundsProps = {
	funds: MutualFund[];
	onEdit?: (assetType: string, assetId: string) => void;
	onDelete?: (assetType: string, assetId: string) => void;
	onRefresh: () => void;
	userId: string;
};

export type NPSAccountsProps = {
	accounts: NationalPensionScheme[];
	onEdit?: (assetType: string, assetId: string) => void;
	onDelete?: (assetType: string, assetId: string) => void;
	onRefresh: () => void;
	userId: string;
};

export type PPFAccountsProps = {
	accounts: PublicProvidentFund[];
	onEdit?: (assetType: string, assetId: string) => void;
	onDelete?: (assetType: string, assetId: string) => void;
	onRefresh: () => void;
	userId: string;
};

export type RecurringDepositsProps = {
	deposits: RecurringDeposit[];
	onEdit?: (assetType: string, assetId: string) => void;
	onDelete?: (assetType: string, assetId: string) => void;
	onRefresh: () => void;
	userId: string;
};

export type StocksProps = {
	stocks: Stock[];
	onEdit?: (assetType: string, assetId: string) => void;
	onDelete?: (assetType: string, assetId: string) => void;
	onRefresh: () => void;
	userId: string;
};

export type UserInfo = {
	id: string;
	username: string;
	createdAt: string;
	isAdmin?: boolean;
	dataSize?: number;
	itemsCount?: number;
};

export type AuthMode = 'login' | 'register' | 'biometric' | 'admin';

export type Expense = {
	id: string;
	amount: number;
	description: string;
	category: string;
	date: string;
	createdAt: string;
	notes?: string;
};

export type ExpenseFormData = {
	id?: string;
	amount: string;
	description: string;
	category: string;
	date: string;
	notes: string;
};

export type Saving = {
	id: string;
	amount: number;
	description: string;
	category: string;
	date: string;
	createdAt: string;
	notes?: string;
	expectedReturn?: number;
	maturityDate?: string;
};

export type SavingFormData = {
	id?: string;
	amount: string;
	description: string;
	category: string;
	date: string;
	notes: string;
	expectedReturn: string;
	maturityDate: string;
};

export interface CreateUserData {
	username: string;
	email?: string;
	password: string;
	isAdmin?: boolean;
	biometricEnabled?: boolean;
}

export interface UpdateUserData {
	username?: string;
	email?: string;
	isAdmin?: boolean;
	biometricEnabled?: boolean;
	resetPassword?: boolean;
	newPassword?: string;
}

export interface FullUserInfo extends User {
	dataInfo?: {
		assetsCount?: number;
		expensesCount?: number;
		savingsCount?: number;
		lastExport?: string;
	};
}

export type UserFormProps = {
	visible: boolean;
	mode: 'create' | 'edit';
	user?: any;
	onSubmit: (data: CreateUserData | UpdateUserData) => Promise<void>;
	onCancel: () => void;
	loading?: boolean;
};

export type AdminTabParamList = {
	Admin: undefined;
	Profile: undefined;
};

export type UserTabParamList = {
	Dashboard: undefined;
	Expenses: undefined;
	Savings: undefined;
	Assets: undefined;
	Profile: undefined;
};

export interface Dividend {
	id: string;
	amount: number;
	company: string;
	stockSymbol?: string;
	category: string;
	date: string;
	createdAt: string;
	notes?: string;
	quantity?: number;
	dividendPerShare?: number;
}

export interface DividendFormData {
	id?: string;
	amount: string;
	company: string;
	stockSymbol: string;
	category: string;
	date: string;
	notes: string;
	quantity: string;
	dividendPerShare: string;
}

// Asset component types with edit/delete support
export type AssetComponentProps = {
	onEdit?: (assetType: string, assetId: string) => void;
	onDelete?: (assetType: string, assetId: string) => void;
	onRefresh: () => void;
	userId: string;
};

// Type for the asset form modal in Dashboard
export interface AssetFormData {
	id?: string;
	amount: string;
	description: string;
	category: string;
	accountNumber?: string;
	interestRate?: string;
	startDate?: string;
	tenure?: string;
	maturityDate?: string;
	units?: string;
	nav?: string;
	currentPrice?: string;
	quantity?: string;
	averagePrice?: string;
	currentNav?: string;
	totalDeposits?: string;
	totalContribution?: string;
	investmentAmount?: string;
	notes?: string;
}

export type InputComponentProps = {
	label: string;
	value?: string;
	placeholder?: string;
	onChangeText?: (text: string) => void;
	isEllipsis?: boolean;
	keyboardType?: KeyboardType;
	multiline?: boolean;
	numberOfLines?: number;
	isMandatory?: boolean;
	maxLength?: number;
	isSelectDropDown?: boolean;
	showDropDown?: boolean;
	setShowDropDown?: (show: boolean) => void;
	dropDownName?: string;
	dropDownAlternativeName?: string;
	dropdownOptions?: string[];
	dropdownSearchValue?: string;
	setDropDownSearchValue?: (text: string) => void;
	handleDropDownSelectOption?: (option: string) => void;
	dropDownNotFoundText?: string;
};

export enum InputMode {
	SELECT_DROPDOWN = 'SELECT_DROPDOWN',
	ELLIPSIS = 'ELLIPSIS',
	DEFAULT = 'DEFAULT',
}

export type FormField = {
	id: string;
	label: string;
	placeholder: string;
	value: string;
	onChangeText: (text: string) => void;
	keyboardType?: KeyboardType;
	multiline?: boolean;
	numberOfLines?: number;
	isEllipsis?: boolean;
	isMandatory: boolean;
};

export type EditDeleteButtonsProps = {
	onPressEdit: () => void;
	onPressDelete: () => void;
};
