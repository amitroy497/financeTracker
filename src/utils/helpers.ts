import { Item, ItemFormData } from '@/types';
import _ from 'lodash';

// Format date to readable string
export const formatDate = (dateString: string): string => {
	const date = new Date(dateString);
	return date.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
};

// Generate unique ID
export const generateId = (): string => {
	return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

// Validate item data
export const validateItem = (item: Partial<ItemFormData>): string[] => {
	const errors: string[] = [];

	if (!item.title || item.title.trim().length === 0) {
		errors.push('Title is required');
	}

	if (item.title && item.title.trim().length > 100) {
		errors.push('Title must be less than 100 characters');
	}

	if (item.description && item.description.length > 500) {
		errors.push('Description must be less than 500 characters');
	}

	if (item.amount && (isNaN(item.amount) || item.amount < 0)) {
		errors.push('Amount must be a positive number');
	}

	return errors;
};

// Format file size
export const formatFileSize = (bytes: number): string => {
	if (bytes === 0) return '0 Bytes';

	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Debounce function for search
export const debounce = <T extends (...args: any[]) => void>(
	func: T,
	wait: number
): ((...args: Parameters<T>) => void) => {
	let timeout: NodeJS.Timeout;
	return (...args: Parameters<T>) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => func(...args), wait);
	};
};

// Sort items by date
export const sortItemsByDate = (
	items: Item[],
	ascending: boolean = false
): Item[] => {
	return [...items].sort((a, b) => {
		const dateA = new Date(a.createdAt).getTime();
		const dateB = new Date(b.createdAt).getTime();
		return ascending ? dateA - dateB : dateB - dateA;
	});
};

// Filter items by category
export const filterItemsByCategory = (
	items: Item[],
	category: string
): Item[] => {
	if (!category) return items;
	return items.filter((item) => item.category === category);
};

export const safeParseFloat = (value: string): number => {
	const parsed = parseFloat(value);
	return isNaN(parsed) ? 0 : parsed;
};

export const isDeepEmpty = (value: any): boolean => {
	if (_.isNil(value) || value === '' || value === 0) return true;
	if (_.isArray(value) && value.length === 0) return true;
	if (_.isObject(value)) {
		return _.every(_.values(value), isDeepEmpty);
	}
	return false;
};

// Universal function that handles both arrays and single objects
export const isDataEmpty = (data: any | any[] | null | undefined): boolean => {
	if (_.isNil(data)) return true;
	if (Array.isArray(data)) {
		return _.every(data, (item) => isDeepEmpty(item));
	}
	return isDeepEmpty(data);
};

export const maskAccountNumber = (accountNumber: string): string => {
	if (accountNumber.length <= 4) {
		return accountNumber;
	}
	const lastFour = accountNumber.slice(-4);
	const maskedPart = '•'.repeat(Math.max(accountNumber.length - 4, 0));
	return maskedPart + lastFour;
};
