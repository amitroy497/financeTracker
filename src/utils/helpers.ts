import { Item, ItemFormData } from '@/types';

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

// Safe number conversion for file sizes
export const safeParseFloat = (value: string): number => {
	const parsed = parseFloat(value);
	return isNaN(parsed) ? 0 : parsed;
};
