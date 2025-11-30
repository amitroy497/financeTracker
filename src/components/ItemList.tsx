import { colors, styles } from '@/styles';
import { Item, ItemListProps } from '@/types';
import { formatDate } from '@/utils';
import React, { JSX } from 'react';
import {
	Alert,
	FlatList,
	RefreshControl,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';

export const ItemList: React.FC<ItemListProps> = ({
	items,
	onEdit,
	onDelete,
	refreshing = false,
	onRefresh,
	emptyMessage = 'No items found. Add your first item!',
}) => {
	const handleDelete = (item: Item): void => {
		Alert.alert(
			'Delete Item',
			`Are you sure you want to delete "${item.title}"?`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: () => onDelete(item.id),
				},
			]
		);
	};

	const renderItem = ({ item }: { item: Item }): JSX.Element => (
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
						Created: {formatDate(item.createdAt)}
					</Text>

					{item.updatedAt !== item.createdAt && (
						<Text style={{ fontSize: 12, color: colors.gray }}>
							Updated: {formatDate(item.updatedAt)}
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
						onPress={() => onEdit(item)}
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
						onPress={() => handleDelete(item)}
					>
						<Text style={[styles.buttonText, { fontSize: 12 }]}>Delete</Text>
					</TouchableOpacity>
				</View>
			</View>
		</View>
	);

	return (
		<FlatList
			data={items}
			renderItem={renderItem}
			keyExtractor={(item) => item.id}
			showsVerticalScrollIndicator={false}
			scrollEnabled={false} // Disable scrolling since parent ScrollView handles it
			refreshControl={
				<RefreshControl
					refreshing={refreshing}
					onRefresh={onRefresh}
					colors={[colors.primary]}
				/>
			}
			ListEmptyComponent={
				<View style={styles.emptyState}>
					<Text style={styles.emptyStateText}>{emptyMessage}</Text>
				</View>
			}
			contentContainerStyle={items.length === 0 ? { flexGrow: 1 } : {}}
		/>
	);
};
