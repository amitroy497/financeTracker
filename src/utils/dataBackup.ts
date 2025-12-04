import { UserDataExport } from '@/types';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export class DataBackupService {
	private static readonly EXPORT_VERSION = '1.0.0';

	// Get all file paths for a user
	private static async getUserDataFilePaths(userId: string): Promise<{
		assetsPath: string;
		expensesPath: string;
		savingsPath: string;
		yearlyExpensesPath: string;
		yearlyFinancialPath: string;
	}> {
		const baseDir = FileSystem.documentDirectory;
		return {
			assetsPath: `${baseDir}user_data/${userId}_assets.json`,
			expensesPath: `${baseDir}expenses_${userId}.json`,
			savingsPath: `${baseDir}savings_${userId}.json`,
			yearlyExpensesPath: `${baseDir}yearly_expenses_${userId}.json`,
			yearlyFinancialPath: `${baseDir}yearly_financial_${userId}.json`,
		};
	}

	// Export all user data
	static async exportUserData(
		userId: string,
		username: string
	): Promise<string> {
		try {
			const filePaths = await this.getUserDataFilePaths(userId);

			// Read all data files
			const [
				assetsData,
				expensesData,
				savingsData,
				yearlyExpensesData,
				yearlyFinancialData,
			] = await Promise.all([
				this.readJsonFile(filePaths.assetsPath),
				this.readJsonFile(filePaths.expensesPath),
				this.readJsonFile(filePaths.savingsPath),
				this.readJsonFile(filePaths.yearlyExpensesPath),
				this.readJsonFile(filePaths.yearlyFinancialPath),
			]);

			// Create export object
			const exportData: UserDataExport = {
				version: this.EXPORT_VERSION,
				exportDate: new Date().toISOString(),
				userId,
				username,
				assets: assetsData || {
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
				},
				expenses: expensesData?.expenses || [],
				savings: savingsData?.savings || [],
				userSettings: {
					biometricEnabled: false,
				},
			};

			// Create export file
			const exportDir = `${FileSystem.cacheDirectory}exports/`;
			await FileSystem.makeDirectoryAsync(exportDir, { intermediates: true });

			const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
			const exportFileName = `financetracker_backup_${username}_${timestamp}.json`;
			const exportFilePath = exportDir + exportFileName;

			await FileSystem.writeAsStringAsync(
				exportFilePath,
				JSON.stringify(exportData, null, 2)
			);

			return exportFilePath;
		} catch (error) {
			console.error('Export error:', error);
			throw new Error('Failed to export data');
		}
	}

	// Import user data
	static async importUserData(
		userId: string,
		importData: UserDataExport
	): Promise<boolean> {
		try {
			const filePaths = await this.getUserDataFilePaths(userId);

			// Validate export version
			if (importData.version !== this.EXPORT_VERSION) {
				throw new Error(
					`Invalid export file version. Expected ${this.EXPORT_VERSION}, got ${importData.version}`
				);
			}

			// Create user_data directory if it doesn't exist
			const userDataDir = `${FileSystem.documentDirectory}user_data/`;
			const dirInfo = await FileSystem.getInfoAsync(userDataDir);
			if (!dirInfo.exists) {
				await FileSystem.makeDirectoryAsync(userDataDir, {
					intermediates: true,
				});
			}

			// Write all data files
			await Promise.all([
				// Assets data
				FileSystem.writeAsStringAsync(
					filePaths.assetsPath,
					JSON.stringify(importData.assets, null, 2)
				),

				// Expenses data
				FileSystem.writeAsStringAsync(
					filePaths.expensesPath,
					JSON.stringify({ expenses: importData.expenses }, null, 2)
				),

				// Savings data
				FileSystem.writeAsStringAsync(
					filePaths.savingsPath,
					JSON.stringify({ savings: importData.savings }, null, 2)
				),

				// Initialize yearly data files
				this.initializeYearlyFiles(userId),
			]);

			return true;
		} catch (error) {
			console.error('Import error:', error);
			throw error;
		}
	}

	// Share exported file
	static async shareExportFile(filePath: string): Promise<void> {
		try {
			const isAvailable = await Sharing.isAvailableAsync();
			if (!isAvailable) {
				throw new Error('Sharing is not available on this device');
			}

			await Sharing.shareAsync(filePath, {
				mimeType: 'application/json',
				dialogTitle: 'Finance Tracker Backup',
				UTI: 'public.json',
			});
		} catch (error) {
			console.error('Share error:', error);
			throw error;
		}
	}

	// Pick import file - UPDATED API
	static async pickImportFile(): Promise<string | null> {
		try {
			// Use the new DocumentPicker API
			const result = await DocumentPicker.getDocumentAsync({
				type: ['application/json', 'text/json', '*.json'],
				copyToCacheDirectory: true,
				multiple: false,
			});

			// Check if operation was cancelled
			if (result.canceled) {
				return null;
			}

			// Check if we have a result
			if (result.assets && result.assets.length > 0) {
				const asset = result.assets[0];
				if (asset.uri) {
					// Read the file content
					const fileContent = await FileSystem.readAsStringAsync(asset.uri);
					return fileContent;
				}
			}

			return null;
		} catch (error) {
			console.error('File pick error:', error);
			throw error;
		}
	}

	// Validate import file
	static validateImportFile(content: string): UserDataExport {
		try {
			const data = JSON.parse(content) as UserDataExport;

			// Basic validation
			if (!data.version || !data.exportDate || !data.userId || !data.username) {
				throw new Error('Invalid export file format');
			}

			// Check required data structures
			if (!data.assets || !data.expenses || !data.savings) {
				throw new Error('Missing data sections in export file');
			}

			return data;
		} catch (error) {
			throw new Error('Invalid JSON file or file format');
		}
	}

	// Private helper methods
	private static async readJsonFile(filePath: string): Promise<any> {
		try {
			const fileInfo = await FileSystem.getInfoAsync(filePath);
			if (!fileInfo.exists) {
				return null;
			}

			const content = await FileSystem.readAsStringAsync(filePath);
			return JSON.parse(content);
		} catch (error) {
			console.warn(`Error reading file ${filePath}:`, error);
			return null;
		}
	}

	private static async initializeYearlyFiles(userId: string): Promise<void> {
		try {
			const filePaths = await this.getUserDataFilePaths(userId);
			const currentYear = new Date().getFullYear();
			const month = new Date().getMonth() + 1;
			const financialYear =
				month >= 4
					? `${currentYear}-${currentYear + 1}`
					: `${currentYear - 1}-${currentYear}`;

			const yearlyExpensesData = {
				year: financialYear,
				totalExpenses: 0,
				categoryTotals: {},
				monthlyTotals: {},
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};

			const yearlyFinancialData = {
				year: financialYear,
				totalValue: 0,
				categoryTotals: {},
				monthlyTotals: {},
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};

			await Promise.all([
				FileSystem.writeAsStringAsync(
					filePaths.yearlyExpensesPath,
					JSON.stringify(yearlyExpensesData, null, 2)
				),
				FileSystem.writeAsStringAsync(
					filePaths.yearlyFinancialPath,
					JSON.stringify(yearlyFinancialData, null, 2)
				),
			]);
		} catch (error) {
			console.error('Error initializing yearly files:', error);
		}
	}

	// src/utils/dataBackup.ts
	// Update the getExportInfo method to exclude admin data:

	static async getExportInfo(userId: string): Promise<{
		lastExport?: string;
		fileSize?: number;
		itemsCount: number;
	}> {
		try {
			// Check if this is an admin user
			const authService = require('@/services/authService').authService;
			const user = await authService.getUserById(userId);

			// For admin users, return minimal info or empty
			if (user?.isAdmin) {
				return {
					itemsCount: 0,
				};
			}

			const filePaths = await this.getUserDataFilePaths(userId);
			const filesInfo = await Promise.all([
				FileSystem.getInfoAsync(filePaths.assetsPath),
				FileSystem.getInfoAsync(filePaths.expensesPath),
				FileSystem.getInfoAsync(filePaths.savingsPath),
			]);

			let totalSize = 0;
			let lastModified = 0;

			filesInfo.forEach((info) => {
				if (info.exists && info.modificationTime) {
					totalSize += info.size || 0;
					if (info.modificationTime > lastModified) {
						lastModified = info.modificationTime;
					}
				}
			});

			// Count items
			const assetsData = await this.readJsonFile(filePaths.assetsPath);
			const expensesData = await this.readJsonFile(filePaths.expensesPath);
			const savingsData = await this.readJsonFile(filePaths.savingsPath);

			const itemsCount =
				(assetsData?.bankAccounts?.length || 0) +
				(assetsData?.fixedDeposits?.length || 0) +
				(assetsData?.recurringDeposits?.length || 0) +
				(assetsData?.mutualFunds?.length || 0) +
				(assetsData?.goldETFs?.length || 0) +
				(assetsData?.stocks?.length || 0) +
				(assetsData?.equityETFs?.length || 0) +
				(assetsData?.ppfAccounts?.length || 0) +
				(assetsData?.frbBonds?.length || 0) +
				(assetsData?.npsAccounts?.length || 0) +
				(expensesData?.expenses?.length || 0) +
				(savingsData?.savings?.length || 0);

			return {
				lastExport: lastModified
					? new Date(lastModified).toLocaleString()
					: undefined,
				fileSize: totalSize,
				itemsCount,
			};
		} catch (error) {
			console.error('Get export info error:', error);
			return { itemsCount: 0 };
		}
	}

	// Check if user has any data
	static async hasUserData(userId: string): Promise<boolean> {
		try {
			const info = await this.getExportInfo(userId);
			return info.itemsCount > 0;
		} catch (error) {
			return false;
		}
	}

	// Get backup file info (size, creation date)
	static async getBackupFileInfo(filePath: string): Promise<{
		size: number;
		created: string;
		fileName: string;
	}> {
		try {
			const fileInfo = await FileSystem.getInfoAsync(filePath);
			if (!fileInfo.exists) {
				throw new Error('File not found');
			}

			const fileName = filePath.split('/').pop() || 'backup.json';

			return {
				size: fileInfo.size || 0,
				created: fileInfo.modificationTime
					? new Date(fileInfo.modificationTime).toLocaleString()
					: 'Unknown',
				fileName,
			};
		} catch (error) {
			console.error('Get backup file info error:', error);
			throw error;
		}
	}
}
