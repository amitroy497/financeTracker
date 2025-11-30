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

// CRUD operations types
export interface CRUDOperations {
	createItem: (item: ItemFormData) => Promise<Item>;
	readAllItems: () => Promise<Item[]>;
	readItem: (id: string) => Promise<Item | null>;
	updateItem: (id: string, item: Partial<ItemFormData>) => Promise<Item>;
	deleteItem: (id: string) => Promise<boolean>;
	deleteAllItems: () => Promise<boolean>;
	getStorageInfo: () => Promise<StorageInfo | null>;
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
