import {
	AssetData,
	BankAccount,
	CreateBankAccountData,
	CreateEquityETFData,
	CreateFixedDepositData,
	CreateFRBData,
	CreateGoldETFData,
	CreateMutualFundData,
	CreateNPSData,
	CreatePPFData,
	CreateRecurringDepositData,
	CreateStockData,
	EquityETF,
	FixedDeposit,
	FloatingRateBond,
	GoldETF,
	MutualFund,
	NationalPensionScheme,
	PublicProvidentFund,
	RecurringDeposit,
	Stock,
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
					goldETFs: 0,
					stocks: 0,
					equityETFs: 0,
					ppf: 0,
					frb: 0,
					nps: 0,
					otherAssets: 0,
				},
				bankAccounts: [],
				fixedDeposits: [],
				recurringDeposits: [],
				mutualFunds: [],
				goldETFs: [],
				stocks: [],
				equityETFs: [],
				ppfAccounts: [],
				frbBonds: [],
				npsAccounts: [],
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

// Calculate current value for funds
const calculateFundCurrentValue = (units: number, nav: number): number => {
	return units * nav;
};

// Calculate returns for investments
const calculateReturns = (
	currentValue: number,
	investedAmount: number
): number => {
	return ((currentValue - investedAmount) / investedAmount) * 100;
};

// Calculate years to maturity
const calculateYearsToMaturity = (maturityDate: string): number => {
	const today = new Date();
	const maturity = new Date(maturityDate);
	const diffTime = maturity.getTime() - today.getTime();
	return Math.max(0, diffTime / (1000 * 60 * 60 * 24 * 365.25));
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
	const goldETFs = data.goldETFs.reduce(
		(sum, etf) => sum + etf.currentValue,
		0
	);
	const stocks = data.stocks.reduce(
		(sum, stock) => sum + stock.currentValue,
		0
	);
	const equityETFs = data.equityETFs.reduce(
		(sum, etf) => sum + etf.currentValue,
		0
	);
	const ppf = data.ppfAccounts.reduce(
		(sum, ppf) => sum + ppf.currentBalance,
		0
	);
	const frb = data.frbBonds.reduce((sum, bond) => sum + bond.currentValue, 0);
	const nps = data.npsAccounts.reduce((sum, nps) => sum + nps.currentValue, 0);

	return {
		...data,
		summary: {
			totalAssets:
				cash +
				fixedDeposits +
				recurringDeposits +
				mutualFunds +
				goldETFs +
				stocks +
				equityETFs +
				ppf +
				frb +
				nps,
			cash,
			fixedDeposits,
			recurringDeposits,
			mutualFunds,
			goldETFs,
			stocks,
			equityETFs,
			ppf,
			frb,
			nps,
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

			const currentValue = calculateFundCurrentValue(mfData.units, mfData.nav);
			const returns = calculateReturns(currentValue, mfData.investedAmount);

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
				updatedMF.currentValue = calculateFundCurrentValue(
					updateData.units || updatedMF.units,
					updateData.nav || updatedMF.nav
				);
				updatedMF.returns = calculateReturns(
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

	// Gold ETF CRUD Operations
	createGoldETF: async (
		userId: string,
		etfData: CreateGoldETFData
	): Promise<GoldETF> => {
		try {
			await initializeAssetData(userId);
			const assetDataPath = getAssetDataPath(userId);

			const fileContent = await FileSystem.readAsStringAsync(assetDataPath);
			const data: AssetData = JSON.parse(fileContent);

			const currentValue = etfData.units * etfData.currentPrice;
			const returns = calculateReturns(currentValue, etfData.investedAmount);

			const newETF: GoldETF = {
				id: generateId(),
				...etfData,
				currentValue,
				returns,
				lastUpdated: new Date().toISOString(),
			};

			data.goldETFs.push(newETF);
			const updatedData = updateSummary(data);

			await FileSystem.writeAsStringAsync(
				assetDataPath,
				JSON.stringify(updatedData, null, 2)
			);

			return newETF;
		} catch (error) {
			console.error('Error creating gold ETF:', error);
			throw error;
		}
	},

	updateGoldETF: async (
		userId: string,
		etfId: string,
		updateData: Partial<CreateGoldETFData>
	): Promise<GoldETF> => {
		try {
			const assetDataPath = getAssetDataPath(userId);

			const fileContent = await FileSystem.readAsStringAsync(assetDataPath);
			const data: AssetData = JSON.parse(fileContent);

			const etfIndex = data.goldETFs.findIndex((etf) => etf.id === etfId);
			if (etfIndex === -1) {
				throw new Error('Gold ETF not found');
			}

			const updatedETF = {
				...data.goldETFs[etfIndex],
				...updateData,
				lastUpdated: new Date().toISOString(),
			};

			// Recalculate current value and returns
			if (updateData.units || updateData.currentPrice) {
				updatedETF.currentValue =
					(updateData.units || updatedETF.units) *
					(updateData.currentPrice || updatedETF.currentPrice);
				updatedETF.returns = calculateReturns(
					updatedETF.currentValue,
					updateData.investedAmount || updatedETF.investedAmount
				);
			}

			data.goldETFs[etfIndex] = updatedETF;
			const updatedData = updateSummary(data);

			await FileSystem.writeAsStringAsync(
				assetDataPath,
				JSON.stringify(updatedData, null, 2)
			);

			return updatedETF;
		} catch (error) {
			console.error('Error updating gold ETF:', error);
			throw error;
		}
	},

	deleteGoldETF: async (userId: string, etfId: string): Promise<boolean> => {
		try {
			const assetDataPath = getAssetDataPath(userId);

			const fileContent = await FileSystem.readAsStringAsync(assetDataPath);
			const data: AssetData = JSON.parse(fileContent);

			const initialLength = data.goldETFs.length;
			data.goldETFs = data.goldETFs.filter((etf) => etf.id !== etfId);

			if (data.goldETFs.length === initialLength) {
				throw new Error('Gold ETF not found');
			}

			const updatedData = updateSummary(data);
			await FileSystem.writeAsStringAsync(
				assetDataPath,
				JSON.stringify(updatedData, null, 2)
			);

			return true;
		} catch (error) {
			console.error('Error deleting gold ETF:', error);
			throw error;
		}
	},

	// Stock CRUD Operations
	createStock: async (
		userId: string,
		stockData: CreateStockData
	): Promise<Stock> => {
		try {
			await initializeAssetData(userId);
			const assetDataPath = getAssetDataPath(userId);

			const fileContent = await FileSystem.readAsStringAsync(assetDataPath);
			const data: AssetData = JSON.parse(fileContent);

			const investedAmount = stockData.quantity * stockData.averagePrice;
			const currentValue = stockData.quantity * stockData.currentPrice;
			const returns = calculateReturns(currentValue, investedAmount);

			const newStock: Stock = {
				id: generateId(),
				...stockData,
				investedAmount,
				currentValue,
				returns,
				lastUpdated: new Date().toISOString(),
			};

			data.stocks.push(newStock);
			const updatedData = updateSummary(data);

			await FileSystem.writeAsStringAsync(
				assetDataPath,
				JSON.stringify(updatedData, null, 2)
			);

			return newStock;
		} catch (error) {
			console.error('Error creating stock:', error);
			throw error;
		}
	},

	updateStock: async (
		userId: string,
		stockId: string,
		updateData: Partial<CreateStockData>
	): Promise<Stock> => {
		try {
			const assetDataPath = getAssetDataPath(userId);

			const fileContent = await FileSystem.readAsStringAsync(assetDataPath);
			const data: AssetData = JSON.parse(fileContent);

			const stockIndex = data.stocks.findIndex((stock) => stock.id === stockId);
			if (stockIndex === -1) {
				throw new Error('Stock not found');
			}

			const updatedStock = {
				...data.stocks[stockIndex],
				...updateData,
				lastUpdated: new Date().toISOString(),
			};

			// Recalculate invested amount, current value and returns
			if (
				updateData.quantity ||
				updateData.averagePrice ||
				updateData.currentPrice
			) {
				updatedStock.investedAmount =
					(updateData.quantity || updatedStock.quantity) *
					(updateData.averagePrice || updatedStock.averagePrice);
				updatedStock.currentValue =
					(updateData.quantity || updatedStock.quantity) *
					(updateData.currentPrice || updatedStock.currentPrice);
				updatedStock.returns = calculateReturns(
					updatedStock.currentValue,
					updatedStock.investedAmount
				);
			}

			data.stocks[stockIndex] = updatedStock;
			const updatedData = updateSummary(data);

			await FileSystem.writeAsStringAsync(
				assetDataPath,
				JSON.stringify(updatedData, null, 2)
			);

			return updatedStock;
		} catch (error) {
			console.error('Error updating stock:', error);
			throw error;
		}
	},

	deleteStock: async (userId: string, stockId: string): Promise<boolean> => {
		try {
			const assetDataPath = getAssetDataPath(userId);

			const fileContent = await FileSystem.readAsStringAsync(assetDataPath);
			const data: AssetData = JSON.parse(fileContent);

			const initialLength = data.stocks.length;
			data.stocks = data.stocks.filter((stock) => stock.id !== stockId);

			if (data.stocks.length === initialLength) {
				throw new Error('Stock not found');
			}

			const updatedData = updateSummary(data);
			await FileSystem.writeAsStringAsync(
				assetDataPath,
				JSON.stringify(updatedData, null, 2)
			);

			return true;
		} catch (error) {
			console.error('Error deleting stock:', error);
			throw error;
		}
	},

	// Equity ETF CRUD Operations
	createEquityETF: async (
		userId: string,
		etfData: CreateEquityETFData
	): Promise<EquityETF> => {
		try {
			await initializeAssetData(userId);
			const assetDataPath = getAssetDataPath(userId);

			const fileContent = await FileSystem.readAsStringAsync(assetDataPath);
			const data: AssetData = JSON.parse(fileContent);

			const currentValue = calculateFundCurrentValue(
				etfData.units,
				etfData.currentNav
			);
			const returns = calculateReturns(currentValue, etfData.investedAmount);

			const newETF: EquityETF = {
				id: generateId(),
				...etfData,
				currentValue,
				returns,
				lastUpdated: new Date().toISOString(),
			};

			data.equityETFs.push(newETF);
			const updatedData = updateSummary(data);

			await FileSystem.writeAsStringAsync(
				assetDataPath,
				JSON.stringify(updatedData, null, 2)
			);

			return newETF;
		} catch (error) {
			console.error('Error creating equity ETF:', error);
			throw error;
		}
	},

	updateEquityETF: async (
		userId: string,
		etfId: string,
		updateData: Partial<CreateEquityETFData>
	): Promise<EquityETF> => {
		try {
			const assetDataPath = getAssetDataPath(userId);

			const fileContent = await FileSystem.readAsStringAsync(assetDataPath);
			const data: AssetData = JSON.parse(fileContent);

			const etfIndex = data.equityETFs.findIndex((etf) => etf.id === etfId);
			if (etfIndex === -1) {
				throw new Error('Equity ETF not found');
			}

			const updatedETF = {
				...data.equityETFs[etfIndex],
				...updateData,
				lastUpdated: new Date().toISOString(),
			};

			// Recalculate current value and returns if units or NAV change
			if (updateData.units || updateData.currentNav) {
				updatedETF.currentValue = calculateFundCurrentValue(
					updateData.units || updatedETF.units,
					updateData.currentNav || updatedETF.currentNav
				);
				updatedETF.returns = calculateReturns(
					updatedETF.currentValue,
					updateData.investedAmount || updatedETF.investedAmount
				);
			}

			data.equityETFs[etfIndex] = updatedETF;
			const updatedData = updateSummary(data);

			await FileSystem.writeAsStringAsync(
				assetDataPath,
				JSON.stringify(updatedData, null, 2)
			);

			return updatedETF;
		} catch (error) {
			console.error('Error updating equity ETF:', error);
			throw error;
		}
	},

	deleteEquityETF: async (userId: string, etfId: string): Promise<boolean> => {
		try {
			const assetDataPath = getAssetDataPath(userId);

			const fileContent = await FileSystem.readAsStringAsync(assetDataPath);
			const data: AssetData = JSON.parse(fileContent);

			const initialLength = data.equityETFs.length;
			data.equityETFs = data.equityETFs.filter((etf) => etf.id !== etfId);

			if (data.equityETFs.length === initialLength) {
				throw new Error('Equity ETF not found');
			}

			const updatedData = updateSummary(data);
			await FileSystem.writeAsStringAsync(
				assetDataPath,
				JSON.stringify(updatedData, null, 2)
			);

			return true;
		} catch (error) {
			console.error('Error deleting equity ETF:', error);
			throw error;
		}
	},

	// Public Provident Fund CRUD Operations
	createPPF: async (
		userId: string,
		ppfData: CreatePPFData
	): Promise<PublicProvidentFund> => {
		try {
			await initializeAssetData(userId);
			const assetDataPath = getAssetDataPath(userId);

			const fileContent = await FileSystem.readAsStringAsync(assetDataPath);
			const data: AssetData = JSON.parse(fileContent);

			// Calculate current balance with compound interest (simplified)
			const years = calculateYearsToMaturity(ppfData.maturityDate);
			const currentBalance =
				ppfData.totalDeposits * Math.pow(1 + ppfData.interestRate / 100, years);

			const newPPF: PublicProvidentFund = {
				id: generateId(),
				...ppfData,
				currentBalance,
				lastUpdated: new Date().toISOString(),
			};

			data.ppfAccounts.push(newPPF);
			const updatedData = updateSummary(data);

			await FileSystem.writeAsStringAsync(
				assetDataPath,
				JSON.stringify(updatedData, null, 2)
			);

			return newPPF;
		} catch (error) {
			console.error('Error creating PPF account:', error);
			throw error;
		}
	},

	updatePPF: async (
		userId: string,
		ppfId: string,
		updateData: Partial<CreatePPFData>
	): Promise<PublicProvidentFund> => {
		try {
			const assetDataPath = getAssetDataPath(userId);

			const fileContent = await FileSystem.readAsStringAsync(assetDataPath);
			const data: AssetData = JSON.parse(fileContent);

			const ppfIndex = data.ppfAccounts.findIndex((ppf) => ppf.id === ppfId);
			if (ppfIndex === -1) {
				throw new Error('PPF account not found');
			}

			const updatedPPF = {
				...data.ppfAccounts[ppfIndex],
				...updateData,
				lastUpdated: new Date().toISOString(),
			};

			// Recalculate current balance if relevant fields change
			if (
				updateData.totalDeposits ||
				updateData.interestRate ||
				updateData.maturityDate
			) {
				const years = calculateYearsToMaturity(
					updateData.maturityDate || updatedPPF.maturityDate
				);
				updatedPPF.currentBalance =
					(updateData.totalDeposits || updatedPPF.totalDeposits) *
					Math.pow(
						1 + (updateData.interestRate || updatedPPF.interestRate) / 100,
						years
					);
			}

			data.ppfAccounts[ppfIndex] = updatedPPF;
			const updatedData = updateSummary(data);

			await FileSystem.writeAsStringAsync(
				assetDataPath,
				JSON.stringify(updatedData, null, 2)
			);

			return updatedPPF;
		} catch (error) {
			console.error('Error updating PPF account:', error);
			throw error;
		}
	},

	deletePPF: async (userId: string, ppfId: string): Promise<boolean> => {
		try {
			const assetDataPath = getAssetDataPath(userId);

			const fileContent = await FileSystem.readAsStringAsync(assetDataPath);
			const data: AssetData = JSON.parse(fileContent);

			const initialLength = data.ppfAccounts.length;
			data.ppfAccounts = data.ppfAccounts.filter((ppf) => ppf.id !== ppfId);

			if (data.ppfAccounts.length === initialLength) {
				throw new Error('PPF account not found');
			}

			const updatedData = updateSummary(data);
			await FileSystem.writeAsStringAsync(
				assetDataPath,
				JSON.stringify(updatedData, null, 2)
			);

			return true;
		} catch (error) {
			console.error('Error deleting PPF account:', error);
			throw error;
		}
	},

	// Floating Rate Bonds CRUD Operations
	createFRB: async (
		userId: string,
		frbData: CreateFRBData
	): Promise<FloatingRateBond> => {
		try {
			await initializeAssetData(userId);
			const assetDataPath = getAssetDataPath(userId);

			const fileContent = await FileSystem.readAsStringAsync(assetDataPath);
			const data: AssetData = JSON.parse(fileContent);

			// Calculate current value with interest
			const years = calculateYearsToMaturity(frbData.maturityDate);
			const currentValue =
				frbData.investmentAmount *
				Math.pow(1 + frbData.interestRate / 100, years);

			const newFRB: FloatingRateBond = {
				id: generateId(),
				...frbData,
				currentValue,
				lastUpdated: new Date().toISOString(),
			};

			data.frbBonds.push(newFRB);
			const updatedData = updateSummary(data);

			await FileSystem.writeAsStringAsync(
				assetDataPath,
				JSON.stringify(updatedData, null, 2)
			);

			return newFRB;
		} catch (error) {
			console.error('Error creating floating rate bond:', error);
			throw error;
		}
	},

	updateFRB: async (
		userId: string,
		frbId: string,
		updateData: Partial<CreateFRBData>
	): Promise<FloatingRateBond> => {
		try {
			const assetDataPath = getAssetDataPath(userId);

			const fileContent = await FileSystem.readAsStringAsync(assetDataPath);
			const data: AssetData = JSON.parse(fileContent);

			const frbIndex = data.frbBonds.findIndex((frb) => frb.id === frbId);
			if (frbIndex === -1) {
				throw new Error('Floating rate bond not found');
			}

			const updatedFRB = {
				...data.frbBonds[frbIndex],
				...updateData,
				lastUpdated: new Date().toISOString(),
			};

			// Recalculate current value if relevant fields change
			if (
				updateData.investmentAmount ||
				updateData.interestRate ||
				updateData.maturityDate
			) {
				const years = calculateYearsToMaturity(
					updateData.maturityDate || updatedFRB.maturityDate
				);
				updatedFRB.currentValue =
					(updateData.investmentAmount || updatedFRB.investmentAmount) *
					Math.pow(
						1 + (updateData.interestRate || updatedFRB.interestRate) / 100,
						years
					);
			}

			data.frbBonds[frbIndex] = updatedFRB;
			const updatedData = updateSummary(data);

			await FileSystem.writeAsStringAsync(
				assetDataPath,
				JSON.stringify(updatedData, null, 2)
			);

			return updatedFRB;
		} catch (error) {
			console.error('Error updating floating rate bond:', error);
			throw error;
		}
	},

	deleteFRB: async (userId: string, frbId: string): Promise<boolean> => {
		try {
			const assetDataPath = getAssetDataPath(userId);

			const fileContent = await FileSystem.readAsStringAsync(assetDataPath);
			const data: AssetData = JSON.parse(fileContent);

			const initialLength = data.frbBonds.length;
			data.frbBonds = data.frbBonds.filter((frb) => frb.id !== frbId);

			if (data.frbBonds.length === initialLength) {
				throw new Error('Floating rate bond not found');
			}

			const updatedData = updateSummary(data);
			await FileSystem.writeAsStringAsync(
				assetDataPath,
				JSON.stringify(updatedData, null, 2)
			);

			return true;
		} catch (error) {
			console.error('Error deleting floating rate bond:', error);
			throw error;
		}
	},

	// National Pension Scheme CRUD Operations
	createNPS: async (
		userId: string,
		npsData: CreateNPSData
	): Promise<NationalPensionScheme> => {
		try {
			await initializeAssetData(userId);
			const assetDataPath = getAssetDataPath(userId);

			const fileContent = await FileSystem.readAsStringAsync(assetDataPath);
			const data: AssetData = JSON.parse(fileContent);

			const returns = calculateReturns(
				npsData.currentValue,
				npsData.totalContribution
			);

			const newNPS: NationalPensionScheme = {
				id: generateId(),
				...npsData,
				returns,
				lastUpdated: new Date().toISOString(),
			};

			data.npsAccounts.push(newNPS);
			const updatedData = updateSummary(data);

			await FileSystem.writeAsStringAsync(
				assetDataPath,
				JSON.stringify(updatedData, null, 2)
			);

			return newNPS;
		} catch (error) {
			console.error('Error creating NPS account:', error);
			throw error;
		}
	},

	updateNPS: async (
		userId: string,
		npsId: string,
		updateData: Partial<CreateNPSData>
	): Promise<NationalPensionScheme> => {
		try {
			const assetDataPath = getAssetDataPath(userId);

			const fileContent = await FileSystem.readAsStringAsync(assetDataPath);
			const data: AssetData = JSON.parse(fileContent);

			const npsIndex = data.npsAccounts.findIndex((nps) => nps.id === npsId);
			if (npsIndex === -1) {
				throw new Error('NPS account not found');
			}

			const updatedNPS = {
				...data.npsAccounts[npsIndex],
				...updateData,
				lastUpdated: new Date().toISOString(),
			};

			// Recalculate returns if current value or total contribution changes
			if (updateData.currentValue || updateData.totalContribution) {
				updatedNPS.returns = calculateReturns(
					updateData.currentValue || updatedNPS.currentValue,
					updateData.totalContribution || updatedNPS.totalContribution
				);
			}

			data.npsAccounts[npsIndex] = updatedNPS;
			const updatedData = updateSummary(data);

			await FileSystem.writeAsStringAsync(
				assetDataPath,
				JSON.stringify(updatedData, null, 2)
			);

			return updatedNPS;
		} catch (error) {
			console.error('Error updating NPS account:', error);
			throw error;
		}
	},

	deleteNPS: async (userId: string, npsId: string): Promise<boolean> => {
		try {
			const assetDataPath = getAssetDataPath(userId);

			const fileContent = await FileSystem.readAsStringAsync(assetDataPath);
			const data: AssetData = JSON.parse(fileContent);

			const initialLength = data.npsAccounts.length;
			data.npsAccounts = data.npsAccounts.filter((nps) => nps.id !== npsId);

			if (data.npsAccounts.length === initialLength) {
				throw new Error('NPS account not found');
			}

			const updatedData = updateSummary(data);
			await FileSystem.writeAsStringAsync(
				assetDataPath,
				JSON.stringify(updatedData, null, 2)
			);

			return true;
		} catch (error) {
			console.error('Error deleting NPS account:', error);
			throw error;
		}
	},
};
