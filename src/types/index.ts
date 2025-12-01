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

// File system types
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
}

export interface AuthCredentials {
	username: string;
	password: string;
	pin?: string;
	biometricEnabled?: boolean;
}

export interface LoginCredentials {
	username: string;
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
}

// Add these new types for assets and dashboard

export interface AssetSummary {
	totalAssets: number;
	cash: number;
	fixedDeposits: number;
	recurringDeposits: number;
	mutualFunds: number;
	otherAssets: number;
}

export interface BankAccount {
	id: string;
	bankName: string;
	accountNumber: string;
	accountType: 'Savings' | 'Current' | 'Salary';
	balance: number;
	currency: string;
	lastUpdated: string;
}

export interface FixedDeposit {
	id: string;
	bankName: string;
	depositNumber: string;
	amount: number;
	interestRate: number;
	startDate: string;
	maturityDate: string;
	tenure: number; // in months
	status: 'Active' | 'Matured';
}

export interface RecurringDeposit {
	id: string;
	bankName: string;
	accountNumber: string;
	monthlyAmount: number;
	totalAmount: number;
	interestRate: number;
	startDate: string;
	maturityDate: string;
	tenure: number; // in months
	completedMonths: number;
}

export interface MutualFund {
	id: string;
	fundName: string;
	fundHouse: string;
	folioNumber: string;
	investmentType: 'Equity' | 'Debt' | 'Hybrid' | 'ELSS';
	currentValue: number;
	investedAmount: number;
	units: number;
	nav: number;
	returns: number;
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

// Navigation types
export type AppTabParamList = {
	Dashboard: undefined;
	Expenses: undefined;
	Savings: undefined;
	Assets: undefined;
	Profile: undefined;
};

// Add these new types for asset data storage

export interface AssetData {
	summary: AssetSummary;
	bankAccounts: BankAccount[];
	fixedDeposits: FixedDeposit[];
	recurringDeposits: RecurringDeposit[];
	mutualFunds: MutualFund[];
	lastUpdated: string;
}

export interface CreateBankAccountData {
	bankName: string;
	accountNumber: string;
	accountType: 'Savings' | 'Current' | 'Salary';
	balance: number;
	currency: string;
}

export interface CreateFixedDepositData {
	bankName: string;
	depositNumber: string;
	amount: number;
	interestRate: number;
	startDate: string;
	tenure: number;
}

export interface CreateRecurringDepositData {
	bankName: string;
	accountNumber: string;
	monthlyAmount: number;
	interestRate: number;
	startDate: string;
	tenure: number;
}

export interface CreateMutualFundData {
	fundName: string;
	fundHouse: string;
	folioNumber: string;
	investmentType: 'Equity' | 'Debt' | 'Hybrid' | 'ELSS';
	investedAmount: number;
	units: number;
	nav: number;
}

// Add new asset types

export interface GoldETF {
	id: string;
	etfName: string;
	symbol: string;
	units: number;
	currentPrice: number;
	investedAmount: number;
	currentValue: number;
	returns: number;
	lastUpdated: string;
}

export interface Stock {
	id: string;
	companyName: string;
	symbol: string;
	exchange: 'NSE' | 'BSE';
	quantity: number;
	averagePrice: number;
	currentPrice: number;
	investedAmount: number;
	currentValue: number;
	returns: number;
	lastUpdated: string;
}

export interface EquityETF {
	id: string;
	etfName: string;
	symbol: string;
	units: number;
	currentNav: number;
	investedAmount: number;
	currentValue: number;
	returns: number;
	lastUpdated: string;
}

export interface PublicProvidentFund {
	id: string;
	accountNumber: string;
	financialYear: string;
	totalDeposits: number;
	currentBalance: number;
	interestRate: number;
	maturityDate: string;
	lastUpdated: string;
}

export interface FloatingRateBond {
	id: string;
	bondName: string;
	certificateNumber: string;
	investmentAmount: number;
	currentValue: number;
	interestRate: number;
	purchaseDate: string;
	maturityDate: string;
	lastUpdated: string;
}

export interface NationalPensionScheme {
	id: string;
	pranNumber: string;
	totalContribution: number;
	currentValue: number;
	returns: number;
	lastContributionDate: string;
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
	symbol: string;
	units: number;
	currentPrice: number;
	investedAmount: number;
}

export interface CreateStockData {
	companyName: string;
	symbol: string;
	exchange: 'NSE' | 'BSE';
	quantity: number;
	averagePrice: number;
	currentPrice: number;
}

export interface CreateEquityETFData {
	etfName: string;
	symbol: string;
	units: number;
	currentNav: number;
	investedAmount: number;
}

export interface CreatePPFData {
	accountNumber: string;
	financialYear: string;
	totalDeposits: number;
	interestRate: number;
	maturityDate: string;
}

export interface CreateFRBData {
	bondName: string;
	certificateNumber: string;
	investmentAmount: number;
	interestRate: number;
	purchaseDate: string;
	maturityDate: string;
}

export interface CreateNPSData {
	pranNumber: string;
	totalContribution: number;
	currentValue: number;
	lastContributionDate: string;
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
