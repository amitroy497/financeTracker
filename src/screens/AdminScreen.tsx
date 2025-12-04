import { UserForm } from '@/components';
import { useAuth } from '@/hooks';
import { authService } from '@/services/authService';
import { colors, styles } from '@/styles';
import { FullUserInfo } from '@/types';
import { DataBackupService } from '@/utils/dataBackup';
import React, { useEffect, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	FlatList,
	Modal,
	ScrollView,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';

export const AdminScreen = () => {
	const { user, logout } = useAuth();
	const [users, setUsers] = useState<FullUserInfo[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedUser, setSelectedUser] = useState<FullUserInfo | null>(null);
	const [actionLoading, setActionLoading] = useState(false);
	const [showUserForm, setShowUserForm] = useState(false);
	const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
	const [showUserDetails, setShowUserDetails] = useState(false);

	const loadUsers = async (): Promise<void> => {
		if (!user?.isAdmin) return;

		setLoading(true);
		try {
			const allUsers = await authService.getAllUsers();

			// Get detailed info for each user
			const detailedUsers: FullUserInfo[] = await Promise.all(
				allUsers.map(async (userData) => {
					const dataInfo = await DataBackupService.getExportInfo(userData.id);
					return {
						...userData,
						dataInfo: {
							assetsCount: dataInfo.itemsCount,
							lastExport: dataInfo.lastExport,
						},
					};
				})
			);
			setUsers(detailedUsers);
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

	const handleCreateUser = async (userData: any): Promise<void> => {
		if (!user?.isAdmin) return;
		setActionLoading(true);
		try {
			await authService.createUser(user.id, userData);
			Alert.alert('Success', 'User created successfully');
			setShowUserForm(false);
			loadUsers(); // Refresh list
		} catch (error: any) {
			Alert.alert('Error', error.message || 'Failed to create user');
		} finally {
			setActionLoading(false);
		}
	};

	const handleUpdateUser = async (userData: any): Promise<void> => {
		if (!user?.isAdmin || !selectedUser) return;
		setActionLoading(true);
		try {
			await authService.updateUser(user.id, selectedUser.id, userData);
			Alert.alert('Success', 'User updated successfully');
			setShowUserForm(false);
			setSelectedUser(null);
			loadUsers();
		} catch (error: any) {
			Alert.alert('Error', error.message || 'Failed to update user');
		} finally {
			setActionLoading(false);
		}
	};

	const handleDeleteUser = async (
		userId: string,
		username: string
	): Promise<void> => {
		if (!user?.isAdmin) return;
		Alert.alert(
			'Delete User',
			`Are you sure you want to delete user "${username}"?\n\nThis will delete ALL their data permanently!`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: async () => {
						setActionLoading(true);
						try {
							await authService.deleteUser(user.id, userId);
							Alert.alert('Success', 'User deleted successfully');
							loadUsers(); // Refresh list
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

	const handleViewUserDetails = (userInfo: FullUserInfo): void => {
		setSelectedUser(userInfo);
		setShowUserDetails(true);
	};

	const filteredUsers = users.filter((user) =>
		user.username.toLowerCase().includes(searchQuery.toLowerCase())
	);

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
			<View style={{ padding: 20, backgroundColor: colors.white }}>
				<Text style={styles.header}>👨‍💼 Admin Dashboard</Text>
			</View>
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
							{
								backgroundColor: colors.success,
								flex: 1,
								paddingHorizontal: 12,
							},
						]}
						onPress={loadUsers}
						disabled={loading}
					>
						<Text style={styles.buttonText}>🔄 Refresh</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={[
							styles.button,
							{
								backgroundColor: colors.primary,
								flex: 1,
								paddingHorizontal: 12,
							},
						]}
						onPress={() => {
							setFormMode('create');
							setSelectedUser(null);
							setShowUserForm(true);
						}}
					>
						<Text style={styles.buttonText}>➕ Create User</Text>
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
						<TouchableOpacity onPress={() => handleViewUserDetails(item)}>
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
									{item.email && (
										<Text style={{ color: colors.gray, fontSize: 12 }}>
											📧 {item.email}
										</Text>
									)}
									<Text style={{ color: colors.gray, fontSize: 12 }}>
										Created: {new Date(item.createdAt).toLocaleDateString()}
									</Text>

									{/* Data Info */}
									<View style={[styles.row, { marginTop: 8, gap: 12 }]}>
										{item.dataInfo?.assetsCount !== undefined && (
											<Text style={{ color: colors.info, fontSize: 11 }}>
												📊 {item.dataInfo.assetsCount} items
											</Text>
										)}
										{item.dataInfo?.lastExport && (
											<Text style={{ color: colors.success, fontSize: 11 }}>
												📅 Last export: {item.dataInfo.lastExport}
											</Text>
										)}
									</View>
								</View>

								<View style={{ alignItems: 'center' }}>
									<Text style={{ color: colors.gray, fontSize: 12 }}>
										Tap for details
									</Text>
									<Text style={{ color: colors.primary, fontSize: 24 }}>→</Text>
								</View>
							</View>
						</TouchableOpacity>

						<View
							style={[
								styles.row,
								{
									justifyContent: 'space-between',
									gap: 20,
									marginTop: 8,
									flexWrap: 'wrap',
									flexDirection: 'row',
								},
							]}
						>
							<TouchableOpacity
								style={[
									styles.button,
									{
										backgroundColor: colors.primary,
										paddingHorizontal: 12,
										paddingVertical: 6,
										width: 80,
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
										width: 80,
									},
								]}
								onPress={() => handleImportForUser(item.id, item.username)}
								disabled={actionLoading}
							>
								<Text style={[styles.buttonText, { fontSize: 12 }]}>
									📥 Import
								</Text>
							</TouchableOpacity>
							{item.id !== user.id && (
								<>
									<TouchableOpacity
										style={[
											styles.button,
											{
												backgroundColor: colors.info,
												paddingHorizontal: 12,
												paddingVertical: 6,
												width: 80,
											},
										]}
										onPress={() => {
											setSelectedUser(item);
											setFormMode('edit');
											setShowUserForm(true);
										}}
										disabled={actionLoading}
									>
										<Text style={[styles.buttonText, { fontSize: 12 }]}>
											✏️ Edit
										</Text>
									</TouchableOpacity>
									<TouchableOpacity
										style={[
											styles.button,
											{
												backgroundColor: colors.danger,
												paddingHorizontal: 12,
												paddingVertical: 6,
												width: 80,
											},
										]}
										onPress={() => handleDeleteUser(item.id, item.username)}
										disabled={actionLoading}
									>
										<Text style={[styles.buttonText, { fontSize: 12 }]}>
											🗑️ Delete
										</Text>
									</TouchableOpacity>
								</>
							)}
						</View>
					</View>
				)}
				ListEmptyComponent={
					<View style={[styles.center, { padding: 40 }]}>
						<Text style={{ color: colors.gray }}>No users found</Text>
						<TouchableOpacity
							style={[styles.button, styles.buttonPrimary, { marginTop: 16 }]}
							onPress={() => {
								setFormMode('create');
								setShowUserForm(true);
							}}
						>
							<Text style={styles.buttonText}>Create First User</Text>
						</TouchableOpacity>
					</View>
				}
			/>

			{/* User Details Modal */}
			<Modal
				visible={showUserDetails}
				animationType='slide'
				transparent={true}
				onRequestClose={() => setShowUserDetails(false)}
			>
				<View
					style={{
						flex: 1,
						backgroundColor: 'rgba(0,0,0,0.5)',
						justifyContent: 'center',
					}}
				>
					<View style={[styles.card, { margin: 20, maxHeight: '80%' }]}>
						<ScrollView showsVerticalScrollIndicator={false}>
							<Text style={[styles.header, { marginBottom: 20 }]}>
								User Details
							</Text>

							{selectedUser && (
								<>
									<View style={{ marginBottom: 16 }}>
										<Text style={{ color: colors.gray, fontSize: 12 }}>
											Username
										</Text>
										<Text
											style={{
												color: colors.dark,
												fontSize: 18,
												fontWeight: 'bold',
											}}
										>
											{selectedUser.username}
										</Text>
									</View>

									{selectedUser.email && (
										<View style={{ marginBottom: 16 }}>
											<Text style={{ color: colors.gray, fontSize: 12 }}>
												Email
											</Text>
											<Text style={{ color: colors.dark, fontSize: 16 }}>
												{selectedUser.email}
											</Text>
										</View>
									)}

									<View style={{ marginBottom: 16 }}>
										<Text style={{ color: colors.gray, fontSize: 12 }}>
											User ID
										</Text>
										<Text
											style={{
												color: colors.dark,
												fontSize: 12,
												fontFamily: 'monospace',
											}}
										>
											{selectedUser.id}
										</Text>
									</View>

									<View style={{ marginBottom: 16 }}>
										<Text style={{ color: colors.gray, fontSize: 12 }}>
											Created
										</Text>
										<Text style={{ color: colors.dark, fontSize: 14 }}>
											{new Date(selectedUser.createdAt).toLocaleString()}
										</Text>
									</View>

									{selectedUser.lastLogin && (
										<View style={{ marginBottom: 16 }}>
											<Text style={{ color: colors.gray, fontSize: 12 }}>
												Last Login
											</Text>
											<Text style={{ color: colors.dark, fontSize: 14 }}>
												{new Date(selectedUser.lastLogin).toLocaleString()}
											</Text>
										</View>
									)}

									<View style={{ marginBottom: 16 }}>
										<Text style={{ color: colors.gray, fontSize: 12 }}>
											Permissions
										</Text>
										<View style={[styles.row, { marginTop: 4, gap: 8 }]}>
											<View
												style={{
													backgroundColor: selectedUser.isAdmin
														? colors.primary
														: colors.secondary,
													paddingHorizontal: 8,
													paddingVertical: 4,
													borderRadius: 4,
												}}
											>
												<Text
													style={{
														color: colors.white,
														fontSize: 12,
														fontWeight: 'bold',
													}}
												>
													{selectedUser.isAdmin
														? 'Administrator'
														: 'Regular User'}
												</Text>
											</View>
											<View
												style={{
													backgroundColor: selectedUser.biometricEnabled
														? colors.success
														: colors.gray,
													paddingHorizontal: 8,
													paddingVertical: 4,
													borderRadius: 4,
												}}
											>
												<Text
													style={{
														color: colors.white,
														fontSize: 12,
														fontWeight: 'bold',
													}}
												>
													{selectedUser.biometricEnabled
														? 'Biometric Enabled'
														: 'Biometric Disabled'}
												</Text>
											</View>
										</View>
									</View>

									{selectedUser.dataInfo && (
										<View style={{ marginBottom: 24 }}>
											<Text style={{ color: colors.gray, fontSize: 12 }}>
												Data Information
											</Text>
											<View style={[styles.card, { marginTop: 8 }]}>
												<View
													style={[
														styles.row,
														{
															justifyContent: 'space-between',
															marginBottom: 8,
														},
													]}
												>
													<Text style={{ color: colors.dark, fontSize: 12 }}>
														Total Items
													</Text>
													<Text
														style={{
															color: colors.primary,
															fontSize: 14,
															fontWeight: 'bold',
														}}
													>
														{selectedUser.dataInfo.assetsCount || 0}
													</Text>
												</View>
												{selectedUser.dataInfo.lastExport && (
													<View
														style={[
															styles.row,
															{ justifyContent: 'space-between' },
														]}
													>
														<Text style={{ color: colors.dark, fontSize: 12 }}>
															Last Export
														</Text>
														<Text style={{ color: colors.gray, fontSize: 12 }}>
															{selectedUser.dataInfo.lastExport}
														</Text>
													</View>
												)}
											</View>
										</View>
									)}

									<View style={[styles.row, { gap: 12, marginBottom: 12 }]}>
										<TouchableOpacity
											style={[styles.button, styles.buttonPrimary, { flex: 1 }]}
											onPress={() => {
												setShowUserDetails(false);
												setFormMode('edit');
												setShowUserForm(true);
											}}
											disabled={selectedUser.id === user.id}
										>
											<Text style={styles.buttonText}>Edit User</Text>
										</TouchableOpacity>

										<TouchableOpacity
											style={[styles.button, styles.buttonDanger, { flex: 1 }]}
											onPress={() => {
												setShowUserDetails(false);
												handleDeleteUser(
													selectedUser.id,
													selectedUser.username
												);
											}}
											disabled={selectedUser.id === user.id}
										>
											<Text style={styles.buttonText}>Delete User</Text>
										</TouchableOpacity>
									</View>
								</>
							)}

							<TouchableOpacity
								style={[styles.button, styles.buttonSecondary]}
								onPress={() => setShowUserDetails(false)}
							>
								<Text style={styles.buttonText}>Close</Text>
							</TouchableOpacity>
						</ScrollView>
					</View>
				</View>
			</Modal>

			{/* User Form Modal */}
			<UserForm
				visible={showUserForm}
				mode={formMode}
				user={selectedUser}
				onSubmit={formMode === 'create' ? handleCreateUser : handleUpdateUser}
				onCancel={() => {
					setShowUserForm(false);
					setSelectedUser(null);
				}}
				loading={actionLoading}
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
