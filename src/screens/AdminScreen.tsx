import { useAuth } from '@/hooks';
import { authService } from '@/services/authService';
import { colors, styles } from '@/styles';
import { DataBackupService } from '@/utils/dataBackup';
import React, { useEffect, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	FlatList,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';

interface UserInfo {
	id: string;
	username: string;
	createdAt: string;
	isAdmin?: boolean;
	dataSize?: number;
	itemsCount?: number;
}

export const AdminScreen: React.FC = () => {
	const { user, logout } = useAuth();
	const [users, setUsers] = useState<UserInfo[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
	const [actionLoading, setActionLoading] = useState(false);

	// Load all users (including regular users)
	const loadUsers = async (): Promise<void> => {
		setLoading(true);
		try {
			const allUsers = await authService.getAllUsers();

			// Format user data and get additional info
			const formattedUsers: UserInfo[] = await Promise.all(
				allUsers.map(async (userData) => {
					const exportInfo = await DataBackupService.getExportInfo(userData.id);
					return {
						id: userData.id,
						username: userData.username,
						createdAt: userData.createdAt,
						isAdmin: userData.isAdmin || false,
						dataSize: exportInfo.fileSize,
						itemsCount: exportInfo.itemsCount,
					};
				})
			);

			setUsers(formattedUsers);
		} catch (error) {
			console.error('Error loading users:', error);
			Alert.alert('Error', 'Failed to load users');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (user?.isAdmin) {
			loadUsers();
		}
	}, [user]);

	const handleExportUserData = async (
		userId: string,
		username: string
	): Promise<void> => {
		setActionLoading(true);
		try {
			// Use the admin export function
			const exportPath = await authService.exportUserDataAsAdmin(userId);
			await DataBackupService.shareExportFile(exportPath);
			Alert.alert('Success', `Data exported for ${username}`);
		} catch (error: any) {
			Alert.alert('Error', error.message || 'Export failed');
		} finally {
			setActionLoading(false);
		}
	};

	const handleImportForUser = async (
		userId: string,
		username: string
	): Promise<void> => {
		Alert.alert(`Import for ${username}`, 'Select a JSON file to import', [
			{ text: 'Cancel', style: 'cancel' },
			{
				text: 'Choose File',
				onPress: async () => {
					setActionLoading(true);
					try {
						const fileContent = await DataBackupService.pickImportFile();
						if (!fileContent) {
							Alert.alert('No file selected');
							return;
						}

						const importData =
							DataBackupService.validateImportFile(fileContent);

						await authService.importUserDataAsAdmin(userId, importData);

						Alert.alert('Success', `Data imported for ${username}`);
						loadUsers(); // Refresh user list
					} catch (error: any) {
						Alert.alert('Error', error.message || 'Import failed');
					} finally {
						setActionLoading(false);
					}
				},
			},
		]);
	};

	const handleDeleteUser = async (
		userId: string,
		username: string
	): Promise<void> => {
		Alert.alert(
			'Delete User',
			`Are you sure you want to delete user "${username}"? This action cannot be undone.`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: async () => {
						setActionLoading(true);
						try {
							// Note: In a real app, you'd implement deleteUser function
							// For now, we'll just show a message
							Alert.alert('Info', 'User deletion would be implemented here');
						} catch (error: any) {
							Alert.alert('Error', error.message || 'Failed to delete user');
						} finally {
							setActionLoading(false);
						}
					},
				},
			]
		);
	};

	const filteredUsers = users.filter((user) =>
		user.username.toLowerCase().includes(searchQuery.toLowerCase())
	);

	// Check if user is admin
	if (!user?.isAdmin) {
		return (
			<View style={[styles.container, styles.center]}>
				<Text style={styles.header}>🔒 Admin Access Required</Text>
				<Text
					style={{
						color: colors.gray,
						marginTop: 10,
						textAlign: 'center',
						paddingHorizontal: 20,
					}}
				>
					You need administrator privileges to access this page.
				</Text>
				<TouchableOpacity
					style={[styles.button, styles.buttonPrimary, { marginTop: 20 }]}
					onPress={() => logout()}
				>
					<Text style={styles.buttonText}>Return to Login</Text>
				</TouchableOpacity>
			</View>
		);
	}

	if (loading) {
		return (
			<View style={[styles.container, styles.center]}>
				<ActivityIndicator size='large' color={colors.primary} />
				<Text style={{ marginTop: 16, color: colors.gray }}>
					Loading users...
				</Text>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			{/* Header */}
			<View style={{ padding: 20, backgroundColor: colors.white }}>
				<Text style={styles.header}>👨‍💼 Admin Dashboard</Text>
				<Text style={{ color: colors.gray, marginTop: 4 }}>
					Manage user data and backups
				</Text>
			</View>

			{/* Search and Actions */}
			<View style={{ padding: 20 }}>
				<TextInput
					style={styles.input}
					placeholder='Search users...'
					value={searchQuery}
					onChangeText={setSearchQuery}
					placeholderTextColor={colors.gray}
				/>

				<View style={[styles.row, { marginTop: 12, gap: 8 }]}>
					<TouchableOpacity
						style={[
							styles.button,
							{ backgroundColor: colors.success, flex: 1 },
						]}
						onPress={loadUsers}
						disabled={loading}
					>
						<Text style={styles.buttonText}>🔄 Refresh</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={[styles.button, { backgroundColor: colors.info, flex: 1 }]}
						onPress={() => {
							Alert.alert('Create Admin', 'Create a new admin user?', [
								{ text: 'Cancel', style: 'cancel' },
								{
									text: 'Create',
									onPress: async () => {
										try {
											await authService.createAdminUser();
											Alert.alert('Success', 'Admin user created');
											loadUsers();
										} catch (error: any) {
											Alert.alert('Error', error.message);
										}
									},
								},
							]);
						}}
					>
						<Text style={styles.buttonText}>➕ Add Admin</Text>
					</TouchableOpacity>
				</View>
			</View>

			{/* Users List */}
			<FlatList
				data={filteredUsers}
				keyExtractor={(item) => item.id}
				contentContainerStyle={{ padding: 20 }}
				renderItem={({ item }) => (
					<View style={[styles.card, { marginBottom: 12 }]}>
						<View
							style={[
								styles.row,
								{
									justifyContent: 'space-between',
									alignItems: 'center',
									marginBottom: 8,
								},
							]}
						>
							<View style={{ flex: 1 }}>
								<View style={[styles.row, { alignItems: 'center' }]}>
									<Text
										style={{
											color: colors.dark,
											fontWeight: '600',
											fontSize: 16,
										}}
									>
										{item.username}
									</Text>
									{item.isAdmin && (
										<View
											style={{
												marginLeft: 8,
												backgroundColor: colors.primary,
												paddingHorizontal: 6,
												paddingVertical: 2,
												borderRadius: 4,
											}}
										>
											<Text
												style={{
													color: colors.white,
													fontSize: 10,
													fontWeight: 'bold',
												}}
											>
												ADMIN
											</Text>
										</View>
									)}
								</View>
								<Text
									style={{ color: colors.gray, fontSize: 12, marginTop: 2 }}
								>
									ID: {item.id.substring(0, 12)}...
								</Text>
								<Text style={{ color: colors.gray, fontSize: 12 }}>
									Created: {new Date(item.createdAt).toLocaleDateString()}
								</Text>

								{/* Data Info */}
								<View style={[styles.row, { marginTop: 8, gap: 12 }]}>
									{item.itemsCount !== undefined && (
										<Text style={{ color: colors.info, fontSize: 11 }}>
											📊 {item.itemsCount} items
										</Text>
									)}
									{item.dataSize !== undefined && (
										<Text style={{ color: colors.success, fontSize: 11 }}>
											💾 {(item.dataSize / 1024).toFixed(1)} KB
										</Text>
									)}
								</View>
							</View>
						</View>

						{/* Action Buttons */}
						<View
							style={[
								styles.row,
								{ justifyContent: 'flex-end', gap: 8, marginTop: 8 },
							]}
						>
							<TouchableOpacity
								style={[
									styles.button,
									{
										backgroundColor: colors.primary,
										paddingHorizontal: 12,
										paddingVertical: 6,
									},
								]}
								onPress={() => handleExportUserData(item.id, item.username)}
								disabled={actionLoading}
							>
								<Text style={[styles.buttonText, { fontSize: 12 }]}>
									📤 Export
								</Text>
							</TouchableOpacity>

							<TouchableOpacity
								style={[
									styles.button,
									{
										backgroundColor: colors.warning,
										paddingHorizontal: 12,
										paddingVertical: 6,
									},
								]}
								onPress={() => handleImportForUser(item.id, item.username)}
								disabled={actionLoading}
							>
								<Text style={[styles.buttonText, { fontSize: 12 }]}>
									📥 Import
								</Text>
							</TouchableOpacity>

							{!item.isAdmin && (
								<TouchableOpacity
									style={[
										styles.button,
										{
											backgroundColor: colors.danger,
											paddingHorizontal: 12,
											paddingVertical: 6,
										},
									]}
									onPress={() => handleDeleteUser(item.id, item.username)}
									disabled={actionLoading}
								>
									<Text style={[styles.buttonText, { fontSize: 12 }]}>
										🗑️ Delete
									</Text>
								</TouchableOpacity>
							)}
						</View>
					</View>
				)}
				ListEmptyComponent={
					<View style={[styles.center, { padding: 40 }]}>
						<Text style={{ color: colors.gray }}>No users found</Text>
					</View>
				}
			/>

			{/* Action Loading Overlay */}
			{actionLoading && (
				<View
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: 'rgba(0,0,0,0.3)',
						justifyContent: 'center',
						alignItems: 'center',
					}}
				>
					<ActivityIndicator size='large' color={colors.primary} />
					<Text style={{ color: colors.white, marginTop: 16 }}>
						Processing...
					</Text>
				</View>
			)}
		</View>
	);
};
