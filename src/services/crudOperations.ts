import { authService } from '@/services/authService';
import {
	FileSystemData,
	FileSystemFileInfo,
	Item,
	ItemFormData,
	StorageInfo,
} from '@/types';
import { generateId } from '@/utils';
import * as FileSystem from 'expo-file-system/legacy';

// File path for storing JSON data - now user-specific
const getDataFilePath = (userId: string): string => {
	return authService.getUserDataPath(userId);
};

// Initialize with empty array if file doesn't exist
const initializeDataFile = async (userId: string): Promise<void> => {
	try {
		const dataFilePath = getDataFilePath(userId);
		const fileInfo = await FileSystem.getInfoAsync(dataFilePath);

		if (!fileInfo.exists) {
			const initialData: FileSystemData = {
				items: [],
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};
			await FileSystem.writeAsStringAsync(
				dataFilePath,
				JSON.stringify(initialData, null, 2)
			);
		}
	} catch (error) {
		console.error('Error initializing data file:', error);
		throw error;
	}
};

// CREATE - Add new item
export const createItem = async (
	userId: string,
	newItem: ItemFormData
): Promise<Item> => {
	try {
		await initializeDataFile(userId);
		const dataFilePath = getDataFilePath(userId);

		const fileContent = await FileSystem.readAsStringAsync(dataFilePath);
		const data: FileSystemData = JSON.parse(fileContent);

		const itemWithId: Item = {
			...newItem,
			id: generateId(),
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		data.items.push(itemWithId);
		data.updatedAt = new Date().toISOString();

		await FileSystem.writeAsStringAsync(
			dataFilePath,
			JSON.stringify(data, null, 2)
		);

		return itemWithId;
	} catch (error) {
		console.error('Error creating item:', error);
		throw error;
	}
};

// READ - Get all items
export const readAllItems = async (userId: string): Promise<Item[]> => {
	try {
		await initializeDataFile(userId);
		const dataFilePath = getDataFilePath(userId);

		const fileContent = await FileSystem.readAsStringAsync(dataFilePath);
		const data: FileSystemData = JSON.parse(fileContent);

		return data.items || [];
	} catch (error) {
		console.error('Error reading items:', error);
		return [];
	}
};

// READ - Get single item by ID
export const readItem = async (
	userId: string,
	id: string
): Promise<Item | null> => {
	try {
		const items = await readAllItems(userId);
		return items.find((item) => item.id === id) || null;
	} catch (error) {
		console.error('Error reading item:', error);
		return null;
	}
};

// UPDATE - Update item by ID
export const updateItem = async (
	userId: string,
	id: string,
	updatedData: Partial<ItemFormData>
): Promise<Item> => {
	try {
		await initializeDataFile(userId);
		const dataFilePath = getDataFilePath(userId);

		const fileContent = await FileSystem.readAsStringAsync(dataFilePath);
		const data: FileSystemData = JSON.parse(fileContent);

		const itemIndex = data.items.findIndex((item) => item.id === id);

		if (itemIndex === -1) {
			throw new Error('Item not found');
		}

		data.items[itemIndex] = {
			...data.items[itemIndex],
			...updatedData,
			updatedAt: new Date().toISOString(),
		};

		data.updatedAt = new Date().toISOString();

		await FileSystem.writeAsStringAsync(
			dataFilePath,
			JSON.stringify(data, null, 2)
		);

		return data.items[itemIndex];
	} catch (error) {
		console.error('Error updating item:', error);
		throw error;
	}
};

// DELETE - Delete item by ID
export const deleteItem = async (
	userId: string,
	id: string
): Promise<boolean> => {
	try {
		await initializeDataFile(userId);
		const dataFilePath = getDataFilePath(userId);

		const fileContent = await FileSystem.readAsStringAsync(dataFilePath);
		const data: FileSystemData = JSON.parse(fileContent);

		const initialLength = data.items.length;
		data.items = data.items.filter((item) => item.id !== id);

		if (data.items.length === initialLength) {
			throw new Error('Item not found');
		}

		data.updatedAt = new Date().toISOString();

		await FileSystem.writeAsStringAsync(
			dataFilePath,
			JSON.stringify(data, null, 2)
		);

		return true;
	} catch (error) {
		console.error('Error deleting item:', error);
		throw error;
	}
};

// DELETE ALL - Clear all data
export const deleteAllItems = async (userId: string): Promise<boolean> => {
	try {
		const dataFilePath = getDataFilePath(userId);
		const emptyData: FileSystemData = {
			items: [],
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		await FileSystem.writeAsStringAsync(
			dataFilePath,
			JSON.stringify(emptyData, null, 2)
		);
		return true;
	} catch (error) {
		console.error('Error deleting all items:', error);
		throw error;
	}
};

// Get file info for debugging
export const getFileInfo = async (
	userId: string
): Promise<FileSystemFileInfo | null> => {
	try {
		const dataFilePath = getDataFilePath(userId);
		const fileInfo = await FileSystem.getInfoAsync(dataFilePath);

		// Check if file exists and has the size property
		if (fileInfo.exists && 'size' in fileInfo) {
			return fileInfo as FileSystemFileInfo;
		}

		return null;
	} catch (error) {
		console.error('Error getting file info:', error);
		return null;
	}
};

// Get app storage info with proper type checking
export const getStorageInfo = async (
	userId: string
): Promise<StorageInfo | null> => {
	try {
		const fileInfo = await getFileInfo(userId);
		const items = await readAllItems(userId);

		return {
			fileSize: fileInfo?.size || 0,
			itemsCount: items.length,
			filePath: getDataFilePath(userId),
			lastModified: fileInfo?.modificationTime || null,
		};
	} catch (error) {
		console.error('Error getting storage info:', error);
		return null;
	}
};

// Export all CRUD operations
export const crudOperations = {
	createItem,
	readAllItems,
	readItem,
	updateItem,
	deleteItem,
	deleteAllItems,
	getStorageInfo,
};

export type { Item, ItemFormData, StorageInfo };
