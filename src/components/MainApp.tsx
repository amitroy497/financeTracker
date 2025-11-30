import { useAuth } from '@/hooks';
import {
	createItem,
	deleteAllItems,
	deleteItem,
	getStorageInfo,
	readAllItems,
	updateItem,
} from '@/services/crudOperations';
import { colors, styles } from '@/styles';
import { Item, ItemFormData, StorageInfo } from '@/types';
import { debounce } from '@/utils';
import React, { useCallback, useEffect, useState } from 'react';
import {
	Alert,
	FlatList,
	KeyboardAvoidingView,
	Platform,
	RefreshControl,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';

export const MainApp: React.FC = () => {
	const { user, logout } = useAuth();
	const [items, setItems] = useState<Item[]>([]);
	const [filteredItems, setFilteredItems] = useState<Item[]>([]);
	const [editingItem, setEditingItem] = useState<Item | null>(null);
	const [searchQuery, setSearchQuery] = useState<string>('');
	const [refreshing, setRefreshing] = useState<boolean>(false);
	const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);

	// Load items and storage info on component mount or when user changes
	useEffect(() => {
		if (user) {
			loadData();
		}
	}, [user]);

	// Filter items when search query changes
	useEffect(() => {
		filterItems();
	}, [searchQuery, items]);

	const loadData = async (): Promise<void> => {
		if (!user) return;

		try {
			const [itemsData, storageData] = await Promise.all([
				readAllItems(user.id),
				getStorageInfo(user.id),
			]);

			setItems(itemsData);
			setStorageInfo(storageData);
		} catch (error) {
			Alert.alert('Error', 'Failed to load data');
		}
	};

	const filterItems = useCallback((): void => {
		if (!searchQuery.trim()) {
			setFilteredItems(items);
			return;
		}

		const query = searchQuery.toLowerCase();
		const filtered = items.filter(
			(item) =>
				item.title.toLowerCase().includes(query) ||
				item.description?.toLowerCase().includes(query) ||
				item.category?.toLowerCase().includes(query)
		);

		setFilteredItems(filtered);
	}, [searchQuery, items]);

	const debouncedSearch = useCallback(
		debounce((query: string) => {
			setSearchQuery(query);
		}, 300),
		[]
	);

	const handleSearchChange = (query: string): void => {
		debouncedSearch(query);
	};

	const handleCreateItem = async (itemData: ItemFormData): Promise<void> => {
		if (!user) return;

		try {
			const newItem = await createItem(user.id, itemData);
			setItems((prev) => [...prev, newItem]);
			Alert.alert('Success', 'Item created successfully!');
		} catch (error) {
			Alert.alert('Error', 'Failed to create item');
		}
	};

	const handleUpdateItem = async (itemData: ItemFormData): Promise<void> => {
		if (!user || !editingItem) return;

		try {
			const updatedItem = await updateItem(user.id, editingItem.id, itemData);
			setItems((prev) =>
				prev.map((item) => (item.id === editingItem.id ? updatedItem : item))
			);
			setEditingItem(null);
			Alert.alert('Success', 'Item updated successfully!');
		} catch (error) {
			Alert.alert('Error', 'Failed to update item');
		}
	};

	const handleDeleteItem = async (id: string): Promise<void> => {
		if (!user) return;

		try {
			await deleteItem(user.id, id);
			setItems((prev) => prev.filter((item) => item.id !== id));
		} catch (error) {
			Alert.alert('Error', 'Failed to delete item');
		}
	};

	const handleEditItem = (item: Item): void => {
		setEditingItem(item);
	};

	const handleCancelEdit = (): void => {
		setEditingItem(null);
	};

	const handleRefresh = async (): Promise<void> => {
		setRefreshing(true);
		await loadData();
		setRefreshing(false);
	};

	const handleDeleteAll = (): void => {
		if (!user) return;

		Alert.alert(
			'Delete All Items',
			'Are you sure you want to delete ALL items? This action cannot be undone.',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete All',
					style: 'destructive',
					onPress: async () => {
						try {
							await deleteAllItems(user.id);
							setItems([]);
							setEditingItem(null);
							Alert.alert('Success', 'All items have been deleted');
						} catch (error) {
							Alert.alert('Error', 'Failed to delete all items');
						}
					},
				},
			]
		);
	};

	const handleLogout = (): void => {
		Alert.alert('Logout', 'Are you sure you want to logout?', [
			{ text: 'Cancel', style: 'cancel' },
			{
				text: 'Logout',
				style: 'destructive',
				onPress: () => {
					logout();
					Alert.alert('Success', 'Logged out successfully');
				},
			},
		]);
	};

	const handleSubmit = editingItem ? handleUpdateItem : handleCreateItem;

	// Render header component
	const renderHeader = () => (
		<View>
			<View style={[styles.row, styles.spaceBetween, { marginBottom: 10 }]}>
				<Text style={styles.header}>💰 Finance Tracker</Text>
				<TouchableOpacity
					style={[
						styles.button,
						{
							paddingVertical: 6,
							paddingHorizontal: 12,
							backgroundColor: colors.secondary,
						},
					]}
					onPress={handleLogout}
				>
					<Text style={[styles.buttonText, { fontSize: 12 }]}>Logout</Text>
				</TouchableOpacity>
			</View>

			<Text
				style={{
					textAlign: 'center',
					color: colors.gray,
					marginBottom: 20,
					fontSize: 14,
				}}
			>
				Welcome, {user?.username}!
			</Text>

			{/* Storage Info Card */}
			{storageInfo && (
				<View style={[styles.card, { backgroundColor: colors.lightGray }]}>
					<View style={[styles.row, styles.spaceBetween]}>
						<View>
							<Text
								style={{ fontSize: 12, color: colors.gray, fontWeight: '500' }}
							>
								Your Storage
							</Text>
							<Text style={{ fontSize: 11, color: colors.gray, marginTop: 4 }}>
								{storageInfo.itemsCount} items •{' '}
								{formatFileSize(storageInfo.fileSize)}
							</Text>
						</View>
						<Text style={{ fontSize: 20 }}>📊</Text>
					</View>
				</View>
			)}

			{/* Search Bar */}
			<View style={styles.card}>
				<TextInput
					style={styles.input}
					placeholder='Search items by title, description, or category...'
					value={searchQuery}
					onChangeText={handleSearchChange}
					placeholderTextColor={colors.gray}
					clearButtonMode='while-editing'
				/>
			</View>

			{/* Item Form */}
			<View style={styles.card}>
				<Text
					style={{
						fontSize: 18,
						fontWeight: 'bold',
						marginBottom: 16,
						color: colors.dark,
					}}
				>
					{editingItem ? 'Edit Item' : 'Add New Item'}
				</Text>

				<TextInput
					style={styles.input}
					placeholder='Title *'
					value={editingItem?.title || ''}
					onChangeText={(text) => {
						if (editingItem) {
							setEditingItem({ ...editingItem, title: text });
						}
					}}
					placeholderTextColor={colors.gray}
					maxLength={100}
				/>

				<TextInput
					style={[styles.input, styles.textArea]}
					placeholder='Description'
					value={editingItem?.description || ''}
					onChangeText={(text) => {
						if (editingItem) {
							setEditingItem({ ...editingItem, description: text });
						}
					}}
					placeholderTextColor={colors.gray}
					multiline
					numberOfLines={3}
					maxLength={500}
				/>

				<TextInput
					style={styles.input}
					placeholder='Amount'
					value={editingItem?.amount?.toString() || ''}
					onChangeText={(text) => {
						if (editingItem) {
							setEditingItem({ ...editingItem, amount: parseFloat(text) || 0 });
						}
					}}
					placeholderTextColor={colors.gray}
					keyboardType='decimal-pad'
				/>

				<TextInput
					style={styles.input}
					placeholder='Category'
					value={editingItem?.category || ''}
					onChangeText={(text) => {
						if (editingItem) {
							setEditingItem({ ...editingItem, category: text });
						}
					}}
					placeholderTextColor={colors.gray}
				/>

				<View style={[styles.row, { gap: 12, marginTop: 16 }]}>
					{editingItem ? (
						<>
							<TouchableOpacity
								style={[styles.button, styles.buttonPrimary, { flex: 1 }]}
								onPress={() =>
									handleSubmit({
										title: editingItem.title,
										description: editingItem.description,
										amount: editingItem.amount,
										category: editingItem.category,
									})
								}
							>
								<Text style={styles.buttonText}>Update Item</Text>
							</TouchableOpacity>

							<TouchableOpacity
								style={[styles.button, styles.buttonSecondary, { flex: 1 }]}
								onPress={handleCancelEdit}
							>
								<Text style={styles.buttonText}>Cancel</Text>
							</TouchableOpacity>
						</>
					) : (
						<TouchableOpacity
							style={[styles.button, styles.buttonPrimary, { flex: 1 }]}
							onPress={() => {
								// For new items, we'll use a simple form submission
								Alert.prompt('Add New Item', 'Enter item title:', [
									{ text: 'Cancel', style: 'cancel' },
									{
										text: 'Add',
										onPress: (title: any) => {
											if (title && title.trim()) {
												handleCreateItem({ title: title.trim() });
											}
										},
									},
								]);
							}}
						>
							<Text style={styles.buttonText}>Add New Item</Text>
						</TouchableOpacity>
					)}
				</View>
			</View>

			{/* Items Header */}
			<View style={[styles.row, styles.spaceBetween, { marginVertical: 16 }]}>
				<Text style={styles.subHeading}>
					Your Items ({filteredItems.length})
				</Text>

				{items.length > 0 && (
					<TouchableOpacity
						style={[styles.button, styles.buttonDanger]}
						onPress={handleDeleteAll}
					>
						<Text style={styles.buttonText}>Clear All</Text>
					</TouchableOpacity>
				)}
			</View>
		</View>
	);

	// Render individual item
	const renderItem = ({ item }: { item: Item }) => (
		<View style={styles.card}>
			<View style={[styles.row, styles.spaceBetween]}>
				<View style={{ flex: 1 }}>
					<Text
						style={{ fontSize: 16, fontWeight: 'bold', color: colors.dark }}
					>
						{item.title}
					</Text>

					{item.description && (
						<Text
							style={{
								fontSize: 14,
								color: colors.gray,
								marginTop: 4,
								lineHeight: 20,
							}}
						>
							{item.description}
						</Text>
					)}

					<View
						style={[styles.row, { marginTop: 8, flexWrap: 'wrap', gap: 8 }]}
					>
						{item.amount && (
							<Text
								style={{
									fontSize: 14,
									fontWeight: '600',
									color: colors.primary,
								}}
							>
								${parseFloat(item.amount.toString()).toFixed(2)}
							</Text>
						)}

						{item.category && (
							<Text
								style={{
									fontSize: 12,
									color: colors.white,
									backgroundColor: colors.secondary,
									paddingHorizontal: 8,
									paddingVertical: 2,
									borderRadius: 12,
								}}
							>
								{item.category}
							</Text>
						)}
					</View>

					<Text style={{ fontSize: 12, color: colors.gray, marginTop: 8 }}>
						Created: {new Date(item.createdAt).toLocaleDateString()}
					</Text>

					{item.updatedAt !== item.createdAt && (
						<Text style={{ fontSize: 12, color: colors.gray }}>
							Updated: {new Date(item.updatedAt).toLocaleDateString()}
						</Text>
					)}
				</View>

				<View style={{ marginLeft: 12, gap: 8 }}>
					<TouchableOpacity
						style={[
							styles.button,
							{
								paddingVertical: 6,
								paddingHorizontal: 12,
								backgroundColor: colors.primary,
							},
						]}
						onPress={() => handleEditItem(item)}
					>
						<Text style={[styles.buttonText, { fontSize: 12 }]}>Edit</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={[
							styles.button,
							{
								paddingVertical: 6,
								paddingHorizontal: 12,
								backgroundColor: colors.danger,
							},
						]}
						onPress={() => {
							Alert.alert(
								'Delete Item',
								`Are you sure you want to delete "${item.title}"?`,
								[
									{ text: 'Cancel', style: 'cancel' },
									{
										text: 'Delete',
										style: 'destructive',
										onPress: () => handleDeleteItem(item.id),
									},
								]
							);
						}}
					>
						<Text style={[styles.buttonText, { fontSize: 12 }]}>Delete</Text>
					</TouchableOpacity>
				</View>
			</View>
		</View>
	);

	// Format file size utility function
	const formatFileSize = (bytes: number): string => {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	};

	if (!user) {
		return (
			<View style={[styles.container, styles.center]}>
				<Text style={styles.header}>Please log in</Text>
				<Text style={{ color: colors.gray, marginTop: 10 }}>
					You need to be logged in to access your data.
				</Text>
			</View>
		);
	}

	return (
		<KeyboardAvoidingView
			style={styles.container}
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
		>
			<FlatList
				data={filteredItems}
				renderItem={renderItem}
				keyExtractor={(item) => item.id}
				ListHeaderComponent={renderHeader}
				ListEmptyComponent={
					<View style={styles.emptyState}>
						<Text style={styles.emptyStateText}>
							{searchQuery
								? 'No items match your search. Try different keywords.'
								: 'No items yet. Add your first item above!'}
						</Text>
					</View>
				}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={handleRefresh}
						colors={[colors.primary]}
					/>
				}
				contentContainerStyle={{ paddingBottom: 50 }}
				showsVerticalScrollIndicator={true}
			/>
		</KeyboardAvoidingView>
	);
};
