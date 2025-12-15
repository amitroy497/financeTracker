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
		// Create directory if it doesn't exist
		const directory = `${FileSystem.documentDirectory}user_data`;
		const dirInfo = await FileSystem.getInfoAsync(directory);
		if (!dirInfo.exists) {
			await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
		}

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
	return parseFloat((units * nav).toFixed(2));
};

// Calculate returns for investments
const calculateReturns = (
	currentValue: number,
	investedAmount: number
): number => {
	if (investedAmount === 0) return 0;
	return parseFloat(
		(((currentValue - investedAmount) / investedAmount) * 100).toFixed(2)
	);
};

// Calculate years to maturity
const calculateYearsToMaturity = (maturityDate: string): number => {
	const today = new Date();
	const maturity = new Date(maturityDate);
	const diffTime = maturity.getTime() - today.getTime();
	const years = Math.max(0, diffTime / (1000 * 60 * 60 * 24 * 365.25));
	return parseFloat(years.toFixed(2));
};

const safeParseFloat = (
	value: string | number | undefined,
	defaultValue: number = 0
): number => {
	if (value === undefined || value === null || value === '')
		return defaultValue;

	const strValue = typeof value === 'string' ? value : value.toString();

	const cleanValue = strValue.replace(/[^0-9.]/g, '');
	const decimalCount = (cleanValue.match(/\./g) || []).length;

	if (decimalCount > 1) {
		const firstDecimalIndex = cleanValue.indexOf('.');
		const beforeDecimal = cleanValue.substring(0, firstDecimalIndex + 1);
		const afterDecimal = cleanValue
			.substring(firstDecimalIndex + 1)
			.replace(/\./g, '');
		const finalValue = beforeDecimal + afterDecimal;
		const num = parseFloat(finalValue);
		return isNaN(num) ? defaultValue : parseFloat(num.toFixed(2));
	}

	const num = parseFloat(cleanValue);
	return isNaN(num) ? defaultValue : parseFloat(num.toFixed(2));
};

// Safe parse int
const safeParseInt = (
	value: string | number | undefined,
	defaultValue: number = 0
): number => {
	if (value === undefined || value === null || value === '')
		return defaultValue;

	const num =
		typeof value === 'string' ? parseInt(value, 10) : Math.round(value);
	return isNaN(num) ? defaultValue : num;
};

// Update summary when data changes
const updateSummary = (data: AssetData): AssetData => {
	const cash = parseFloat(
		data.bankAccounts
			.reduce((sum, account) => sum + (account.balance || 0), 0)
			.toFixed(2)
	);

	const fixedDeposits = parseFloat(
		data.fixedDeposits
			.filter((fd) => fd.status === 'Active')
			.reduce((sum, fd) => sum + (fd.amount || 0), 0)
			.toFixed(2)
	);

	const recurringDeposits = parseFloat(
		data.recurringDeposits
			.reduce((sum, rd) => sum + (rd.totalAmount || 0), 0)
			.toFixed(2)
	);

	const mutualFunds = parseFloat(
		data.mutualFunds
			.reduce((sum, mf) => sum + (mf.currentValue || 0), 0)
			.toFixed(2)
	);

	const goldETFs = parseFloat(
		data.goldETFs
			.reduce((sum, etf) => sum + (etf.currentValue || 0), 0)
			.toFixed(2)
	);

	const stocks = parseFloat(
		data.stocks
			.reduce((sum, stock) => sum + (stock.currentValue || 0), 0)
			.toFixed(2)
	);

	const equityETFs = parseFloat(
		data.equityETFs
			.reduce((sum, etf) => sum + (etf.currentValue || 0), 0)
			.toFixed(2)
	);

	const ppf = parseFloat(
		data.ppfAccounts
			.reduce((sum, ppf) => sum + (ppf.currentBalance || 0), 0)
			.toFixed(2)
	);

	const frb = parseFloat(
		data.frbBonds
			.reduce((sum, bond) => sum + (bond.currentValue || 0), 0)
			.toFixed(2)
	);

	const nps = parseFloat(
		data.npsAccounts
			.reduce((sum, nps) => sum + (nps.currentValue || 0), 0)
			.toFixed(2)
	);

	const totalAssets = parseFloat(
		(
			cash +
			fixedDeposits +
			recurringDeposits +
			mutualFunds +
			goldETFs +
			stocks +
			equityETFs +
			ppf +
			frb +
			nps
		).toFixed(2)
	);

	return {
		...data,
		summary: {
			totalAssets,
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

// Read asset data file
const readAssetData = async (userId: string): Promise<AssetData> => {
	try {
		await initializeAssetData(userId);
		const assetDataPath = getAssetDataPath(userId);

		const fileContent = await FileSystem.readAsStringAsync(assetDataPath);
		return JSON.parse(fileContent);
	} catch (error) {
		console.error('Error reading asset data:', error);
		throw error;
	}
};

// Write asset data file
const writeAssetData = async (
	userId: string,
	data: AssetData
): Promise<void> => {
	try {
		const assetDataPath = getAssetDataPath(userId);
		const updatedData = updateSummary(data);

		await FileSystem.writeAsStringAsync(
			assetDataPath,
			JSON.stringify(updatedData, null, 2)
		);
	} catch (error) {
		console.error('Error writing asset data:', error);
		throw error;
	}
};

export const assetService = {
	// Get all asset data
	getAssetData: async (userId: string): Promise<AssetData> => {
		return readAssetData(userId);
	},

	// Bank Account CRUD Operations
	createBankAccount: async (
		userId: string,
		accountData: CreateBankAccountData
	): Promise<BankAccount> => {
		try {
			const data = await readAssetData(userId);

			const balance = safeParseFloat(accountData.balance, 0);
			const interestRate = accountData.interestRate
				? safeParseFloat(accountData.interestRate)
				: undefined;

			const newAccount: BankAccount = {
				id: generateId(),
				accountName: accountData.accountName || 'Bank Account',
				bankName: accountData.bankName || 'Bank',
				balance,
				accountNumber: accountData.accountNumber,
				accountType: accountData.accountType || 'Savings',
				interestRate,
				notes: accountData.notes,
				lastUpdated: new Date().toISOString(),
			};

			data.bankAccounts.push(newAccount);
			await writeAssetData(userId, data);

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
			const data = await readAssetData(userId);

			const accountIndex = data.bankAccounts.findIndex(
				(account) => account.id === accountId
			);
			if (accountIndex === -1) {
				throw new Error('Bank account not found');
			}

			const updatedAccount = {
				...data.bankAccounts[accountIndex],
				...updateData,
				lastUpdated: new Date().toISOString(),
			};

			// Handle decimal parsing for numeric fields
			if (updateData.balance !== undefined) {
				updatedAccount.balance = safeParseFloat(updateData.balance);
			}
			if (updateData.interestRate !== undefined) {
				updatedAccount.interestRate = updateData.interestRate
					? safeParseFloat(updateData.interestRate)
					: undefined;
			}

			data.bankAccounts[accountIndex] = updatedAccount;
			await writeAssetData(userId, data);

			return updatedAccount;
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
			const data = await readAssetData(userId);

			const initialLength = data.bankAccounts.length;
			data.bankAccounts = data.bankAccounts.filter(
				(account) => account.id !== accountId
			);

			if (data.bankAccounts.length === initialLength) {
				throw new Error('Bank account not found');
			}

			await writeAssetData(userId, data);
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
			const data = await readAssetData(userId);

			const amount = safeParseFloat(fdData.amount, 0);
			const interestRate = safeParseFloat(fdData.interestRate, 0);
			const tenure = safeParseInt(fdData.tenure, 12);
			const startDate =
				fdData.startDate || new Date().toISOString().split('T')[0];

			const maturityDate = calculateMaturityDate(startDate, tenure);

			const newFD: FixedDeposit = {
				id: generateId(),
				bankName: fdData.bankName || 'Bank',
				amount,
				interestRate,
				startDate,
				tenure,
				maturityDate,
				status: 'Active',
				description: fdData.description,
			};

			data.fixedDeposits.push(newFD);
			await writeAssetData(userId, data);

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
			const data = await readAssetData(userId);

			const fdIndex = data.fixedDeposits.findIndex((fd) => fd.id === fdId);
			if (fdIndex === -1) {
				throw new Error('Fixed deposit not found');
			}

			const currentFD = data.fixedDeposits[fdIndex];
			const updatedFD = {
				...currentFD,
				...updateData,
			};

			// Handle decimal parsing for numeric fields
			if (updateData.amount !== undefined) {
				updatedFD.amount = safeParseFloat(updateData.amount);
			}
			if (updateData.interestRate !== undefined) {
				updatedFD.interestRate = safeParseFloat(updateData.interestRate);
			}
			if (updateData.tenure !== undefined) {
				updatedFD.tenure = safeParseInt(updateData.tenure);
			}

			// Recalculate maturity date if tenure or start date changed
			if (updateData.startDate || updateData.tenure !== undefined) {
				const startDate = updateData.startDate || updatedFD.startDate;
				const tenure =
					updateData.tenure !== undefined
						? safeParseInt(updateData.tenure)
						: updatedFD.tenure;
				updatedFD.maturityDate = calculateMaturityDate(startDate, tenure);
			}

			data.fixedDeposits[fdIndex] = updatedFD;
			await writeAssetData(userId, data);

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
			const data = await readAssetData(userId);

			const initialLength = data.fixedDeposits.length;
			data.fixedDeposits = data.fixedDeposits.filter((fd) => fd.id !== fdId);

			if (data.fixedDeposits.length === initialLength) {
				throw new Error('Fixed deposit not found');
			}

			await writeAssetData(userId, data);
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
			const data = await readAssetData(userId);

			const monthlyAmount = safeParseFloat(rdData.monthlyAmount, 0);
			const interestRate = safeParseFloat(rdData.interestRate, 0);
			const tenure = safeParseInt(rdData.tenure, 12);
			const startDate =
				rdData.startDate || new Date().toISOString().split('T')[0];

			const maturityDate = calculateMaturityDate(startDate, tenure);
			const totalAmount = parseFloat((monthlyAmount * tenure).toFixed(2));

			const newRD: RecurringDeposit = {
				id: generateId(),
				bankName: rdData.bankName || 'Bank',
				monthlyAmount,
				interestRate,
				startDate,
				tenure,
				totalAmount,
				maturityDate,
				completedMonths: 0,
				description: rdData.description,
			};

			data.recurringDeposits.push(newRD);
			await writeAssetData(userId, data);

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
			const data = await readAssetData(userId);

			const rdIndex = data.recurringDeposits.findIndex((rd) => rd.id === rdId);
			if (rdIndex === -1) {
				throw new Error('Recurring deposit not found');
			}

			const currentRD = data.recurringDeposits[rdIndex];
			const updatedRD = {
				...currentRD,
				...updateData,
			};

			// Handle decimal parsing for numeric fields
			if (updateData.monthlyAmount !== undefined) {
				updatedRD.monthlyAmount = safeParseFloat(updateData.monthlyAmount);
			}
			if (updateData.interestRate !== undefined) {
				updatedRD.interestRate = safeParseFloat(updateData.interestRate);
			}
			if (updateData.tenure !== undefined) {
				updatedRD.tenure = safeParseInt(updateData.tenure);
			}

			// Recalculate total amount and maturity date if relevant fields change
			if (
				updateData.monthlyAmount !== undefined ||
				updateData.tenure !== undefined
			) {
				const monthlyAmount =
					updateData.monthlyAmount !== undefined
						? safeParseFloat(updateData.monthlyAmount)
						: updatedRD.monthlyAmount;
				const tenure =
					updateData.tenure !== undefined
						? safeParseInt(updateData.tenure)
						: updatedRD.tenure;

				updatedRD.totalAmount = parseFloat((monthlyAmount * tenure).toFixed(2));
				updatedRD.maturityDate = calculateMaturityDate(
					updateData.startDate || updatedRD.startDate,
					tenure
				);
			}

			data.recurringDeposits[rdIndex] = updatedRD;
			await writeAssetData(userId, data);

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
			const data = await readAssetData(userId);

			const initialLength = data.recurringDeposits.length;
			data.recurringDeposits = data.recurringDeposits.filter(
				(rd) => rd.id !== rdId
			);

			if (data.recurringDeposits.length === initialLength) {
				throw new Error('Recurring deposit not found');
			}

			await writeAssetData(userId, data);
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
			const data = await readAssetData(userId);

			const investedAmount = safeParseFloat(mfData.investedAmount, 0);
			const units = safeParseFloat(mfData.units, 0);
			const nav = safeParseFloat(mfData.nav, 0);

			const currentValue = calculateFundCurrentValue(units, nav);
			const returns = calculateReturns(currentValue, investedAmount);

			const newMF: MutualFund = {
				id: generateId(),
				schemeName: mfData.schemeName || 'Mutual Fund',
				investedAmount,
				units,
				nav,
				currentValue,
				returns,
				fundHouse: mfData.fundHouse || '',
				fundType: mfData.fundType || 'Equity',
				notes: mfData.notes,
				lastUpdated: new Date().toISOString(),
			};

			data.mutualFunds.push(newMF);
			await writeAssetData(userId, data);

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
			const data = await readAssetData(userId);

			const mfIndex = data.mutualFunds.findIndex((mf) => mf.id === mfId);
			if (mfIndex === -1) {
				throw new Error('Mutual fund not found');
			}

			const currentMF = data.mutualFunds[mfIndex];
			const updatedMF = {
				...currentMF,
				...updateData,
				lastUpdated: new Date().toISOString(),
			};

			// Handle decimal parsing for numeric fields
			if (updateData.investedAmount !== undefined) {
				updatedMF.investedAmount = safeParseFloat(updateData.investedAmount);
			}
			if (updateData.units !== undefined) {
				updatedMF.units = safeParseFloat(updateData.units);
			}
			if (updateData.nav !== undefined) {
				updatedMF.nav = safeParseFloat(updateData.nav);
			}

			// Recalculate current value and returns if units or NAV change
			if (updateData.units !== undefined || updateData.nav !== undefined) {
				const units =
					updateData.units !== undefined
						? safeParseFloat(updateData.units)
						: updatedMF.units;
				const nav =
					updateData.nav !== undefined
						? safeParseFloat(updateData.nav)
						: updatedMF.nav;

				updatedMF.currentValue = calculateFundCurrentValue(units, nav);
				updatedMF.returns = calculateReturns(
					updatedMF.currentValue,
					updateData.investedAmount !== undefined
						? safeParseFloat(updateData.investedAmount)
						: updatedMF.investedAmount
				);
			}

			data.mutualFunds[mfIndex] = updatedMF;
			await writeAssetData(userId, data);

			return updatedMF;
		} catch (error) {
			console.error('Error updating mutual fund:', error);
			throw error;
		}
	},

	deleteMutualFund: async (userId: string, mfId: string): Promise<boolean> => {
		try {
			const data = await readAssetData(userId);

			const initialLength = data.mutualFunds.length;
			data.mutualFunds = data.mutualFunds.filter((mf) => mf.id !== mfId);

			if (data.mutualFunds.length === initialLength) {
				throw new Error('Mutual fund not found');
			}

			await writeAssetData(userId, data);
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
			const data = await readAssetData(userId);

			const investedAmount = safeParseFloat(etfData.investedAmount, 0);
			const units = safeParseFloat(etfData.units, 0);
			const currentPrice = safeParseFloat(etfData.currentPrice, 0);

			const currentValue = parseFloat((units * currentPrice).toFixed(2));
			const returns = calculateReturns(currentValue, investedAmount);

			const newETF: GoldETF = {
				id: generateId(),
				etfName: etfData.etfName || 'Gold ETF',
				investedAmount,
				units,
				currentPrice,
				currentValue,
				returns,
				notes: etfData.notes,
				lastUpdated: new Date().toISOString(),
			};

			data.goldETFs.push(newETF);
			await writeAssetData(userId, data);

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
			const data = await readAssetData(userId);

			const etfIndex = data.goldETFs.findIndex((etf) => etf.id === etfId);
			if (etfIndex === -1) {
				throw new Error('Gold ETF not found');
			}

			const currentETF = data.goldETFs[etfIndex];
			const updatedETF = {
				...currentETF,
				...updateData,
				lastUpdated: new Date().toISOString(),
			};

			// Handle decimal parsing for numeric fields
			if (updateData.investedAmount !== undefined) {
				updatedETF.investedAmount = safeParseFloat(updateData.investedAmount);
			}
			if (updateData.units !== undefined) {
				updatedETF.units = safeParseFloat(updateData.units);
			}
			if (updateData.currentPrice !== undefined) {
				updatedETF.currentPrice = safeParseFloat(updateData.currentPrice);
			}

			// Recalculate current value and returns
			if (
				updateData.units !== undefined ||
				updateData.currentPrice !== undefined
			) {
				const units =
					updateData.units !== undefined
						? safeParseFloat(updateData.units)
						: updatedETF.units;
				const currentPrice =
					updateData.currentPrice !== undefined
						? safeParseFloat(updateData.currentPrice)
						: updatedETF.currentPrice;

				updatedETF.currentValue = parseFloat((units * currentPrice).toFixed(2));
				updatedETF.returns = calculateReturns(
					updatedETF.currentValue,
					updateData.investedAmount !== undefined
						? safeParseFloat(updateData.investedAmount)
						: updatedETF.investedAmount
				);
			}

			data.goldETFs[etfIndex] = updatedETF;
			await writeAssetData(userId, data);

			return updatedETF;
		} catch (error) {
			console.error('Error updating gold ETF:', error);
			throw error;
		}
	},

	deleteGoldETF: async (userId: string, etfId: string): Promise<boolean> => {
		try {
			const data = await readAssetData(userId);

			const initialLength = data.goldETFs.length;
			data.goldETFs = data.goldETFs.filter((etf) => etf.id !== etfId);

			if (data.goldETFs.length === initialLength) {
				throw new Error('Gold ETF not found');
			}

			await writeAssetData(userId, data);
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
			const data = await readAssetData(userId);

			const quantity = safeParseInt(stockData.quantity, 0);
			const averagePrice = safeParseFloat(stockData.averagePrice, 0);
			const currentPrice = safeParseFloat(stockData.currentPrice, 0);

			const investedAmount = parseFloat((quantity * averagePrice).toFixed(2));
			const currentValue = parseFloat((quantity * currentPrice).toFixed(2));
			const returns = calculateReturns(currentValue, investedAmount);

			const newStock: Stock = {
				id: generateId(),
				companyName: stockData.companyName || 'Stock',
				quantity,
				averagePrice,
				currentPrice,
				investedAmount,
				currentValue,
				returns,
				notes: stockData.notes,
				lastUpdated: new Date().toISOString(),
			};

			data.stocks.push(newStock);
			await writeAssetData(userId, data);

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
			const data = await readAssetData(userId);

			const stockIndex = data.stocks.findIndex((stock) => stock.id === stockId);
			if (stockIndex === -1) {
				throw new Error('Stock not found');
			}

			const currentStock = data.stocks[stockIndex];
			const updatedStock = {
				...currentStock,
				...updateData,
				lastUpdated: new Date().toISOString(),
			};

			// Handle decimal parsing for numeric fields
			if (updateData.quantity !== undefined) {
				updatedStock.quantity = safeParseInt(updateData.quantity);
			}
			if (updateData.averagePrice !== undefined) {
				updatedStock.averagePrice = safeParseFloat(updateData.averagePrice);
			}
			if (updateData.currentPrice !== undefined) {
				updatedStock.currentPrice = safeParseFloat(updateData.currentPrice);
			}

			// Recalculate invested amount, current value and returns
			if (
				updateData.quantity !== undefined ||
				updateData.averagePrice !== undefined ||
				updateData.currentPrice !== undefined
			) {
				const quantity =
					updateData.quantity !== undefined
						? safeParseInt(updateData.quantity)
						: updatedStock.quantity;
				const averagePrice =
					updateData.averagePrice !== undefined
						? safeParseFloat(updateData.averagePrice)
						: updatedStock.averagePrice;
				const currentPrice =
					updateData.currentPrice !== undefined
						? safeParseFloat(updateData.currentPrice)
						: updatedStock.currentPrice;

				updatedStock.investedAmount = parseFloat(
					(quantity * averagePrice).toFixed(2)
				);
				updatedStock.currentValue = parseFloat(
					(quantity * currentPrice).toFixed(2)
				);
				updatedStock.returns = calculateReturns(
					updatedStock.currentValue,
					updatedStock.investedAmount
				);
			}

			data.stocks[stockIndex] = updatedStock;
			await writeAssetData(userId, data);

			return updatedStock;
		} catch (error) {
			console.error('Error updating stock:', error);
			throw error;
		}
	},

	deleteStock: async (userId: string, stockId: string): Promise<boolean> => {
		try {
			const data = await readAssetData(userId);

			const initialLength = data.stocks.length;
			data.stocks = data.stocks.filter((stock) => stock.id !== stockId);

			if (data.stocks.length === initialLength) {
				throw new Error('Stock not found');
			}

			await writeAssetData(userId, data);
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
			const data = await readAssetData(userId);

			const investedAmount = safeParseFloat(etfData.investedAmount, 0);
			const units = safeParseFloat(etfData.units, 0);
			const currentNav = safeParseFloat(etfData.currentNav, 0);

			const currentValue = calculateFundCurrentValue(units, currentNav);
			const returns = calculateReturns(currentValue, investedAmount);

			const newETF: EquityETF = {
				id: generateId(),
				etfName: etfData.etfName || 'Equity ETF',
				investedAmount,
				units,
				currentNav,
				currentValue,
				returns,
				notes: etfData.notes,
				lastUpdated: new Date().toISOString(),
			};

			data.equityETFs.push(newETF);
			await writeAssetData(userId, data);

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
			const data = await readAssetData(userId);

			const etfIndex = data.equityETFs.findIndex((etf) => etf.id === etfId);
			if (etfIndex === -1) {
				throw new Error('Equity ETF not found');
			}

			const currentETF = data.equityETFs[etfIndex];
			const updatedETF = {
				...currentETF,
				...updateData,
				lastUpdated: new Date().toISOString(),
			};

			// Handle decimal parsing for numeric fields
			if (updateData.investedAmount !== undefined) {
				updatedETF.investedAmount = safeParseFloat(updateData.investedAmount);
			}
			if (updateData.units !== undefined) {
				updatedETF.units = safeParseFloat(updateData.units);
			}
			if (updateData.currentNav !== undefined) {
				updatedETF.currentNav = safeParseFloat(updateData.currentNav);
			}

			// Recalculate current value and returns if units or NAV change
			if (
				updateData.units !== undefined ||
				updateData.currentNav !== undefined
			) {
				const units =
					updateData.units !== undefined
						? safeParseFloat(updateData.units)
						: updatedETF.units;
				const currentNav =
					updateData.currentNav !== undefined
						? safeParseFloat(updateData.currentNav)
						: updatedETF.currentNav;

				updatedETF.currentValue = calculateFundCurrentValue(units, currentNav);
				updatedETF.returns = calculateReturns(
					updatedETF.currentValue,
					updateData.investedAmount !== undefined
						? safeParseFloat(updateData.investedAmount)
						: updatedETF.investedAmount
				);
			}

			data.equityETFs[etfIndex] = updatedETF;
			await writeAssetData(userId, data);

			return updatedETF;
		} catch (error) {
			console.error('Error updating equity ETF:', error);
			throw error;
		}
	},

	deleteEquityETF: async (userId: string, etfId: string): Promise<boolean> => {
		try {
			const data = await readAssetData(userId);

			const initialLength = data.equityETFs.length;
			data.equityETFs = data.equityETFs.filter((etf) => etf.id !== etfId);

			if (data.equityETFs.length === initialLength) {
				throw new Error('Equity ETF not found');
			}

			await writeAssetData(userId, data);
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
			const data = await readAssetData(userId);

			const totalDeposits = safeParseFloat(ppfData.totalDeposits, 0);
			const interestRate = safeParseFloat(ppfData.interestRate, 0);
			const maturityDate =
				ppfData.maturityDate ||
				new Date(new Date().setFullYear(new Date().getFullYear() + 15))
					.toISOString()
					.split('T')[0];

			// Calculate current balance with compound interest (simplified)
			const years = calculateYearsToMaturity(maturityDate);
			const currentBalance = parseFloat(
				(totalDeposits * Math.pow(1 + interestRate / 100, years)).toFixed(2)
			);

			const newPPF: PublicProvidentFund = {
				id: generateId(),
				accountNumber: ppfData.accountNumber || '',
				totalDeposits,
				interestRate,
				maturityDate,
				currentBalance,
				notes: ppfData.notes,
				lastUpdated: new Date().toISOString(),
			};

			data.ppfAccounts.push(newPPF);
			await writeAssetData(userId, data);

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
			const data = await readAssetData(userId);

			const ppfIndex = data.ppfAccounts.findIndex((ppf) => ppf.id === ppfId);
			if (ppfIndex === -1) {
				throw new Error('PPF account not found');
			}

			const currentPPF = data.ppfAccounts[ppfIndex];
			const updatedPPF = {
				...currentPPF,
				...updateData,
				lastUpdated: new Date().toISOString(),
			};

			// Handle decimal parsing for numeric fields
			if (updateData.totalDeposits !== undefined) {
				updatedPPF.totalDeposits = safeParseFloat(updateData.totalDeposits);
			}
			if (updateData.interestRate !== undefined) {
				updatedPPF.interestRate = safeParseFloat(updateData.interestRate);
			}

			// Recalculate current balance if relevant fields change
			if (
				updateData.totalDeposits !== undefined ||
				updateData.interestRate !== undefined ||
				updateData.maturityDate
			) {
				const totalDeposits =
					updateData.totalDeposits !== undefined
						? safeParseFloat(updateData.totalDeposits)
						: updatedPPF.totalDeposits;
				const interestRate =
					updateData.interestRate !== undefined
						? safeParseFloat(updateData.interestRate)
						: updatedPPF.interestRate;
				const maturityDate = updateData.maturityDate || updatedPPF.maturityDate;

				const years = calculateYearsToMaturity(maturityDate);
				updatedPPF.currentBalance = parseFloat(
					(totalDeposits * Math.pow(1 + interestRate / 100, years)).toFixed(2)
				);
			}

			data.ppfAccounts[ppfIndex] = updatedPPF;
			await writeAssetData(userId, data);

			return updatedPPF;
		} catch (error) {
			console.error('Error updating PPF account:', error);
			throw error;
		}
	},

	deletePPF: async (userId: string, ppfId: string): Promise<boolean> => {
		try {
			const data = await readAssetData(userId);

			const initialLength = data.ppfAccounts.length;
			data.ppfAccounts = data.ppfAccounts.filter((ppf) => ppf.id !== ppfId);

			if (data.ppfAccounts.length === initialLength) {
				throw new Error('PPF account not found');
			}

			await writeAssetData(userId, data);
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
			const data = await readAssetData(userId);

			const investmentAmount = safeParseFloat(frbData.investmentAmount, 0);
			const interestRate = safeParseFloat(frbData.interestRate, 0);
			const maturityDate =
				frbData.maturityDate ||
				new Date(new Date().setFullYear(new Date().getFullYear() + 5))
					.toISOString()
					.split('T')[0];

			// Calculate current value with interest
			const years = calculateYearsToMaturity(maturityDate);
			const currentValue = parseFloat(
				(investmentAmount * Math.pow(1 + interestRate / 100, years)).toFixed(2)
			);

			const newFRB: FloatingRateBond = {
				id: generateId(),
				bondName: frbData.bondName || 'Floating Rate Bond',
				investmentAmount,
				interestRate,
				maturityDate,
				currentValue,
				notes: frbData.notes,
				lastUpdated: new Date().toISOString(),
			};

			data.frbBonds.push(newFRB);
			await writeAssetData(userId, data);

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
			const data = await readAssetData(userId);

			const frbIndex = data.frbBonds.findIndex((frb) => frb.id === frbId);
			if (frbIndex === -1) {
				throw new Error('Floating rate bond not found');
			}

			const currentFRB = data.frbBonds[frbIndex];
			const updatedFRB = {
				...currentFRB,
				...updateData,
				lastUpdated: new Date().toISOString(),
			};

			if (updateData.investmentAmount !== undefined) {
				updatedFRB.investmentAmount = safeParseFloat(
					updateData.investmentAmount
				);
			}
			if (updateData.interestRate !== undefined) {
				updatedFRB.interestRate = safeParseFloat(updateData.interestRate);
			}

			if (
				updateData.investmentAmount !== undefined ||
				updateData.interestRate !== undefined ||
				updateData.maturityDate
			) {
				const investmentAmount =
					updateData.investmentAmount !== undefined
						? safeParseFloat(updateData.investmentAmount)
						: updatedFRB.investmentAmount;
				const interestRate =
					updateData.interestRate !== undefined
						? safeParseFloat(updateData.interestRate)
						: updatedFRB.interestRate;
				const maturityDate = updateData.maturityDate || updatedFRB.maturityDate;

				const years = calculateYearsToMaturity(maturityDate);
				updatedFRB.currentValue = parseFloat(
					(investmentAmount * Math.pow(1 + interestRate / 100, years)).toFixed(
						2
					)
				);
			}

			data.frbBonds[frbIndex] = updatedFRB;
			await writeAssetData(userId, data);

			return updatedFRB;
		} catch (error) {
			console.error('Error updating floating rate bond:', error);
			throw error;
		}
	},

	deleteFRB: async (userId: string, frbId: string): Promise<boolean> => {
		try {
			const data = await readAssetData(userId);

			const initialLength = data.frbBonds.length;
			data.frbBonds = data.frbBonds.filter((frb) => frb.id !== frbId);

			if (data.frbBonds.length === initialLength) {
				throw new Error('Floating rate bond not found');
			}

			await writeAssetData(userId, data);
			return true;
		} catch (error) {
			console.error('Error deleting floating rate bond:', error);
			throw error;
		}
	},

	createNPS: async (
		userId: string,
		npsData: CreateNPSData
	): Promise<NationalPensionScheme> => {
		try {
			const data = await readAssetData(userId);

			const totalContribution = safeParseFloat(npsData.totalContribution, 0);
			const currentValue = safeParseFloat(
				npsData.currentValue,
				totalContribution
			);

			const returns = calculateReturns(currentValue, totalContribution);

			const newNPS: NationalPensionScheme = {
				id: generateId(),
				pranNumber: npsData.pranNumber || '',
				totalContribution,
				currentValue,
				returns,
				notes: npsData.notes,
				lastUpdated: new Date().toISOString(),
			};

			data.npsAccounts.push(newNPS);
			await writeAssetData(userId, data);

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
			const data = await readAssetData(userId);

			const npsIndex = data.npsAccounts.findIndex((nps) => nps.id === npsId);
			if (npsIndex === -1) {
				throw new Error('NPS account not found');
			}

			const currentNPS = data.npsAccounts[npsIndex];
			const updatedNPS = {
				...currentNPS,
				...updateData,
				lastUpdated: new Date().toISOString(),
			};

			// Handle decimal parsing for numeric fields
			if (updateData.totalContribution !== undefined) {
				updatedNPS.totalContribution = safeParseFloat(
					updateData.totalContribution
				);
			}
			if (updateData.currentValue !== undefined) {
				updatedNPS.currentValue = safeParseFloat(updateData.currentValue);
			}

			// Recalculate returns if current value or total contribution changes
			if (
				updateData.currentValue !== undefined ||
				updateData.totalContribution !== undefined
			) {
				const currentValue =
					updateData.currentValue !== undefined
						? safeParseFloat(updateData.currentValue)
						: updatedNPS.currentValue;
				const totalContribution =
					updateData.totalContribution !== undefined
						? safeParseFloat(updateData.totalContribution)
						: updatedNPS.totalContribution;

				updatedNPS.returns = calculateReturns(currentValue, totalContribution);
			}

			data.npsAccounts[npsIndex] = updatedNPS;
			await writeAssetData(userId, data);

			return updatedNPS;
		} catch (error) {
			console.error('Error updating NPS account:', error);
			throw error;
		}
	},

	deleteNPS: async (userId: string, npsId: string): Promise<boolean> => {
		try {
			const data = await readAssetData(userId);

			const initialLength = data.npsAccounts.length;
			data.npsAccounts = data.npsAccounts.filter((nps) => nps.id !== npsId);

			if (data.npsAccounts.length === initialLength) {
				throw new Error('NPS account not found');
			}

			await writeAssetData(userId, data);
			return true;
		} catch (error) {
			console.error('Error deleting NPS account:', error);
			throw error;
		}
	},
};
