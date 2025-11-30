import {
	AssetData,
	BankAccount,
	CreateBankAccountData,
	CreateFixedDepositData,
	CreateMutualFundData,
	CreateRecurringDepositData,
	FixedDeposit,
	MutualFund,
	RecurringDeposit,
} from '@/types';
import { generateId } from '@/utils';
import * as FileSystem from 'expo-file-system/legacy';

const getAssetDataPath = (userId: string): string => {
	return `${FileSystem.documentDirectory}user_data/${userId}_assets.json`;
};

// Initialize asset data file
const initializeAssetData = async (userId: string): Promise<void> => {
	try {
		const assetDataPath = getAssetDataPath(userId);
		const fileInfo = await FileSystem.getInfoAsync(assetDataPath);

		if (!fileInfo.exists) {
			const initialData: AssetData = {
				summary: {
					totalAssets: 0,
					cash: 0,
					fixedDeposits: 0,
					recurringDeposits: 0,
					mutualFunds: 0,
					otherAssets: 0,
				},
				bankAccounts: [],
				fixedDeposits: [],
				recurringDeposits: [],
				mutualFunds: [],
				lastUpdated: new Date().toISOString(),
			};

			await FileSystem.writeAsStringAsync(
				assetDataPath,
				JSON.stringify(initialData, null, 2)
			);
		}
	} catch (error) {
		console.error('Error initializing asset data file:', error);
		throw error;
	}
};

// Calculate maturity date from start date and tenure
const calculateMaturityDate = (startDate: string, tenure: number): string => {
	const start = new Date(startDate);
	const maturity = new Date(start);
	maturity.setMonth(maturity.getMonth() + tenure);
	return maturity.toISOString().split('T')[0];
};

// Calculate current value for mutual funds
const calculateMutualFundCurrentValue = (
	units: number,
	nav: number
): number => {
	return units * nav;
};

// Calculate returns for mutual funds
const calculateMutualFundReturns = (
	currentValue: number,
	investedAmount: number
): number => {
	return ((currentValue - investedAmount) / investedAmount) * 100;
};

// Update summary when data changes
const updateSummary = (data: AssetData): AssetData => {
	const cash = data.bankAccounts.reduce(
		(sum, account) => sum + account.balance,
		0
	);
	const fixedDeposits = data.fixedDeposits
		.filter((fd) => fd.status === 'Active')
		.reduce((sum, fd) => sum + fd.amount, 0);
	const recurringDeposits = data.recurringDeposits.reduce(
		(sum, rd) => sum + rd.totalAmount,
		0
	);
	const mutualFunds = data.mutualFunds.reduce(
		(sum, mf) => sum + mf.currentValue,
		0
	);

	return {
		...data,
		summary: {
			totalAssets: cash + fixedDeposits + recurringDeposits + mutualFunds,
			cash,
			fixedDeposits,
			recurringDeposits,
			mutualFunds,
			otherAssets: 0,
		},
		lastUpdated: new Date().toISOString(),
	};
};

export const assetService = {
	// Get all asset data
	getAssetData: async (userId: string): Promise<AssetData> => {
		try {
			await initializeAssetData(userId);
			const assetDataPath = getAssetDataPath(userId);

			const fileContent = await FileSystem.readAsStringAsync(assetDataPath);
			const data: AssetData = JSON.parse(fileContent);

			return data;
		} catch (error) {
			console.error('Error getting asset data:', error);
			throw error;
		}
	},

	// Bank Account CRUD Operations
	createBankAccount: async (
		userId: string,
		accountData: CreateBankAccountData
	): Promise<BankAccount> => {
		try {
			await initializeAssetData(userId);
			const assetDataPath = getAssetDataPath(userId);

			const fileContent = await FileSystem.readAsStringAsync(assetDataPath);
			const data: AssetData = JSON.parse(fileContent);

			const newAccount: BankAccount = {
				id: generateId(),
				...accountData,
				lastUpdated: new Date().toISOString(),
			};

			data.bankAccounts.push(newAccount);
			const updatedData = updateSummary(data);

			await FileSystem.writeAsStringAsync(
				assetDataPath,
				JSON.stringify(updatedData, null, 2)
			);

			return newAccount;
		} catch (error) {
			console.error('Error creating bank account:', error);
			throw error;
		}
	},

	updateBankAccount: async (
		userId: string,
		accountId: string,
		updateData: Partial<CreateBankAccountData>
	): Promise<BankAccount> => {
		try {
			const assetDataPath = getAssetDataPath(userId);

			const fileContent = await FileSystem.readAsStringAsync(assetDataPath);
			const data: AssetData = JSON.parse(fileContent);

			const accountIndex = data.bankAccounts.findIndex(
				(account) => account.id === accountId
			);
			if (accountIndex === -1) {
				throw new Error('Bank account not found');
			}

			data.bankAccounts[accountIndex] = {
				...data.bankAccounts[accountIndex],
				...updateData,
				lastUpdated: new Date().toISOString(),
			};

			const updatedData = updateSummary(data);
			await FileSystem.writeAsStringAsync(
				assetDataPath,
				JSON.stringify(updatedData, null, 2)
			);

			return data.bankAccounts[accountIndex];
		} catch (error) {
			console.error('Error updating bank account:', error);
			throw error;
		}
	},

	deleteBankAccount: async (
		userId: string,
		accountId: string
	): Promise<boolean> => {
		try {
			const assetDataPath = getAssetDataPath(userId);

			const fileContent = await FileSystem.readAsStringAsync(assetDataPath);
			const data: AssetData = JSON.parse(fileContent);

			const initialLength = data.bankAccounts.length;
			data.bankAccounts = data.bankAccounts.filter(
				(account) => account.id !== accountId
			);

			if (data.bankAccounts.length === initialLength) {
				throw new Error('Bank account not found');
			}

			const updatedData = updateSummary(data);
			await FileSystem.writeAsStringAsync(
				assetDataPath,
				JSON.stringify(updatedData, null, 2)
			);

			return true;
		} catch (error) {
			console.error('Error deleting bank account:', error);
			throw error;
		}
	},

	// Fixed Deposit CRUD Operations
	createFixedDeposit: async (
		userId: string,
		fdData: CreateFixedDepositData
	): Promise<FixedDeposit> => {
		try {
			await initializeAssetData(userId);
			const assetDataPath = getAssetDataPath(userId);

			const fileContent = await FileSystem.readAsStringAsync(assetDataPath);
			const data: AssetData = JSON.parse(fileContent);

			const maturityDate = calculateMaturityDate(
				fdData.startDate,
				fdData.tenure
			);

			const newFD: FixedDeposit = {
				id: generateId(),
				...fdData,
				maturityDate,
				status: 'Active',
			};

			data.fixedDeposits.push(newFD);
			const updatedData = updateSummary(data);

			await FileSystem.writeAsStringAsync(
				assetDataPath,
				JSON.stringify(updatedData, null, 2)
			);

			return newFD;
		} catch (error) {
			console.error('Error creating fixed deposit:', error);
			throw error;
		}
	},

	updateFixedDeposit: async (
		userId: string,
		fdId: string,
		updateData: Partial<CreateFixedDepositData>
	): Promise<FixedDeposit> => {
		try {
			const assetDataPath = getAssetDataPath(userId);

			const fileContent = await FileSystem.readAsStringAsync(assetDataPath);
			const data: AssetData = JSON.parse(fileContent);

			const fdIndex = data.fixedDeposits.findIndex((fd) => fd.id === fdId);
			if (fdIndex === -1) {
				throw new Error('Fixed deposit not found');
			}

			const updatedFD = {
				...data.fixedDeposits[fdIndex],
				...updateData,
			};

			// Recalculate maturity date if tenure or start date changed
			if (updateData.startDate || updateData.tenure) {
				updatedFD.maturityDate = calculateMaturityDate(
					updateData.startDate || updatedFD.startDate,
					updateData.tenure || updatedFD.tenure
				);
			}

			data.fixedDeposits[fdIndex] = updatedFD;
			const updatedData = updateSummary(data);

			await FileSystem.writeAsStringAsync(
				assetDataPath,
				JSON.stringify(updatedData, null, 2)
			);

			return updatedFD;
		} catch (error) {
			console.error('Error updating fixed deposit:', error);
			throw error;
		}
	},

	deleteFixedDeposit: async (
		userId: string,
		fdId: string
	): Promise<boolean> => {
		try {
			const assetDataPath = getAssetDataPath(userId);

			const fileContent = await FileSystem.readAsStringAsync(assetDataPath);
			const data: AssetData = JSON.parse(fileContent);

			const initialLength = data.fixedDeposits.length;
			data.fixedDeposits = data.fixedDeposits.filter((fd) => fd.id !== fdId);

			if (data.fixedDeposits.length === initialLength) {
				throw new Error('Fixed deposit not found');
			}

			const updatedData = updateSummary(data);
			await FileSystem.writeAsStringAsync(
				assetDataPath,
				JSON.stringify(updatedData, null, 2)
			);

			return true;
		} catch (error) {
			console.error('Error deleting fixed deposit:', error);
			throw error;
		}
	},

	// Recurring Deposit CRUD Operations
	createRecurringDeposit: async (
		userId: string,
		rdData: CreateRecurringDepositData
	): Promise<RecurringDeposit> => {
		try {
			await initializeAssetData(userId);
			const assetDataPath = getAssetDataPath(userId);

			const fileContent = await FileSystem.readAsStringAsync(assetDataPath);
			const data: AssetData = JSON.parse(fileContent);

			const maturityDate = calculateMaturityDate(
				rdData.startDate,
				rdData.tenure
			);
			const totalAmount = rdData.monthlyAmount * rdData.tenure;

			const newRD: RecurringDeposit = {
				id: generateId(),
				...rdData,
				totalAmount,
				maturityDate,
				completedMonths: 0,
			};

			data.recurringDeposits.push(newRD);
			const updatedData = updateSummary(data);

			await FileSystem.writeAsStringAsync(
				assetDataPath,
				JSON.stringify(updatedData, null, 2)
			);

			return newRD;
		} catch (error) {
			console.error('Error creating recurring deposit:', error);
			throw error;
		}
	},

	updateRecurringDeposit: async (
		userId: string,
		rdId: string,
		updateData: Partial<CreateRecurringDepositData>
	): Promise<RecurringDeposit> => {
		try {
			const assetDataPath = getAssetDataPath(userId);

			const fileContent = await FileSystem.readAsStringAsync(assetDataPath);
			const data: AssetData = JSON.parse(fileContent);

			const rdIndex = data.recurringDeposits.findIndex((rd) => rd.id === rdId);
			if (rdIndex === -1) {
				throw new Error('Recurring deposit not found');
			}

			const updatedRD = {
				...data.recurringDeposits[rdIndex],
				...updateData,
			};

			// Recalculate total amount and maturity date if relevant fields change
			if (updateData.monthlyAmount || updateData.tenure) {
				updatedRD.totalAmount =
					(updateData.monthlyAmount || updatedRD.monthlyAmount) *
					(updateData.tenure || updatedRD.tenure);
				updatedRD.maturityDate = calculateMaturityDate(
					updateData.startDate || updatedRD.startDate,
					updateData.tenure || updatedRD.tenure
				);
			}

			data.recurringDeposits[rdIndex] = updatedRD;
			const updatedData = updateSummary(data);

			await FileSystem.writeAsStringAsync(
				assetDataPath,
				JSON.stringify(updatedData, null, 2)
			);

			return updatedRD;
		} catch (error) {
			console.error('Error updating recurring deposit:', error);
			throw error;
		}
	},

	deleteRecurringDeposit: async (
		userId: string,
		rdId: string
	): Promise<boolean> => {
		try {
			const assetDataPath = getAssetDataPath(userId);

			const fileContent = await FileSystem.readAsStringAsync(assetDataPath);
			const data: AssetData = JSON.parse(fileContent);

			const initialLength = data.recurringDeposits.length;
			data.recurringDeposits = data.recurringDeposits.filter(
				(rd) => rd.id !== rdId
			);

			if (data.recurringDeposits.length === initialLength) {
				throw new Error('Recurring deposit not found');
			}

			const updatedData = updateSummary(data);
			await FileSystem.writeAsStringAsync(
				assetDataPath,
				JSON.stringify(updatedData, null, 2)
			);

			return true;
		} catch (error) {
			console.error('Error deleting recurring deposit:', error);
			throw error;
		}
	},

	// Mutual Fund CRUD Operations
	createMutualFund: async (
		userId: string,
		mfData: CreateMutualFundData
	): Promise<MutualFund> => {
		try {
			await initializeAssetData(userId);
			const assetDataPath = getAssetDataPath(userId);

			const fileContent = await FileSystem.readAsStringAsync(assetDataPath);
			const data: AssetData = JSON.parse(fileContent);

			const currentValue = calculateMutualFundCurrentValue(
				mfData.units,
				mfData.nav
			);
			const returns = calculateMutualFundReturns(
				currentValue,
				mfData.investedAmount
			);

			const newMF: MutualFund = {
				id: generateId(),
				...mfData,
				currentValue,
				returns,
				lastUpdated: new Date().toISOString(),
			};

			data.mutualFunds.push(newMF);
			const updatedData = updateSummary(data);

			await FileSystem.writeAsStringAsync(
				assetDataPath,
				JSON.stringify(updatedData, null, 2)
			);

			return newMF;
		} catch (error) {
			console.error('Error creating mutual fund:', error);
			throw error;
		}
	},

	updateMutualFund: async (
		userId: string,
		mfId: string,
		updateData: Partial<CreateMutualFundData>
	): Promise<MutualFund> => {
		try {
			const assetDataPath = getAssetDataPath(userId);

			const fileContent = await FileSystem.readAsStringAsync(assetDataPath);
			const data: AssetData = JSON.parse(fileContent);

			const mfIndex = data.mutualFunds.findIndex((mf) => mf.id === mfId);
			if (mfIndex === -1) {
				throw new Error('Mutual fund not found');
			}

			const updatedMF = {
				...data.mutualFunds[mfIndex],
				...updateData,
				lastUpdated: new Date().toISOString(),
			};

			// Recalculate current value and returns if units or NAV change
			if (updateData.units || updateData.nav) {
				updatedMF.currentValue = calculateMutualFundCurrentValue(
					updateData.units || updatedMF.units,
					updateData.nav || updatedMF.nav
				);
				updatedMF.returns = calculateMutualFundReturns(
					updatedMF.currentValue,
					updateData.investedAmount || updatedMF.investedAmount
				);
			}

			data.mutualFunds[mfIndex] = updatedMF;
			const updatedData = updateSummary(data);

			await FileSystem.writeAsStringAsync(
				assetDataPath,
				JSON.stringify(updatedData, null, 2)
			);

			return updatedMF;
		} catch (error) {
			console.error('Error updating mutual fund:', error);
			throw error;
		}
	},

	deleteMutualFund: async (userId: string, mfId: string): Promise<boolean> => {
		try {
			const assetDataPath = getAssetDataPath(userId);

			const fileContent = await FileSystem.readAsStringAsync(assetDataPath);
			const data: AssetData = JSON.parse(fileContent);

			const initialLength = data.mutualFunds.length;
			data.mutualFunds = data.mutualFunds.filter((mf) => mf.id !== mfId);

			if (data.mutualFunds.length === initialLength) {
				throw new Error('Mutual fund not found');
			}

			const updatedData = updateSummary(data);
			await FileSystem.writeAsStringAsync(
				assetDataPath,
				JSON.stringify(updatedData, null, 2)
			);

			return true;
		} catch (error) {
			console.error('Error deleting mutual fund:', error);
			throw error;
		}
	},
};
