import { colors, styles } from '@/styles';
import { ItemFormData, ItemFormProps } from '@/types';
import { validateItem } from '@/utils';
import React, { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';

export const ItemForm: React.FC<ItemFormProps> = ({
	onSubmit,
	editingItem,
	onCancel,
	categories = [
		'Food',
		'Transport',
		'Entertainment',
		'Bills',
		'Shopping',
		'Other',
	],
}) => {
	const [title, setTitle] = useState(editingItem?.title || '');
	const [description, setDescription] = useState(
		editingItem?.description || ''
	);
	const [amount, setAmount] = useState(editingItem?.amount?.toString() || '');
	const [category, setCategory] = useState(editingItem?.category || '');
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (): Promise<void> => {
		const itemData: Partial<ItemFormData> = {
			title,
			description,
			...(amount && { amount: parseFloat(amount) }),
			...(category && { category }),
		};

		const errors = validateItem(itemData);

		if (errors.length > 0) {
			Alert.alert('Validation Error', errors.join('\n'));
			return;
		}

		if (!itemData.title) {
			Alert.alert('Validation Error', 'Title is required');
			return;
		}

		setIsSubmitting(true);

		try {
			await onSubmit(itemData as ItemFormData);

			// Reset form
			if (!editingItem) {
				setTitle('');
				setDescription('');
				setAmount('');
				setCategory('');
			}
		} catch (error) {
			Alert.alert('Error', 'Failed to save item');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleCancel = (): void => {
		setTitle('');
		setDescription('');
		setAmount('');
		setCategory('');
		onCancel?.();
	};

	return (
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
				value={title}
				onChangeText={setTitle}
				placeholderTextColor={colors.gray}
				maxLength={100}
			/>

			<TextInput
				style={[styles.input, styles.textArea]}
				placeholder='Description'
				value={description}
				onChangeText={setDescription}
				placeholderTextColor={colors.gray}
				multiline
				numberOfLines={3}
				maxLength={500}
			/>

			<TextInput
				style={styles.input}
				placeholder='Amount'
				value={amount}
				onChangeText={setAmount}
				placeholderTextColor={colors.gray}
				keyboardType='decimal-pad'
			/>

			<TextInput
				style={styles.input}
				placeholder='Category'
				value={category}
				onChangeText={setCategory}
				placeholderTextColor={colors.gray}
			/>

			<View style={[styles.row, { gap: 8, marginTop: 8, flexWrap: 'wrap' }]}>
				{categories.map((cat) => (
					<TouchableOpacity
						key={cat}
						style={[
							{
								paddingVertical: 6,
								paddingHorizontal: 12,
								backgroundColor:
									category === cat ? colors.primary : colors.lightGray,
								borderRadius: 12,
								marginBottom: 4,
							},
						]}
						onPress={() => setCategory(cat)}
					>
						<Text
							style={[
								{
									color: category === cat ? colors.white : colors.dark,
									fontSize: 12,
									fontWeight: '500',
								},
							]}
						>
							{cat}
						</Text>
					</TouchableOpacity>
				))}
			</View>

			<View style={[styles.row, { gap: 12, marginTop: 16 }]}>
				{editingItem ? (
					<>
						<TouchableOpacity
							style={[styles.button, styles.buttonPrimary, { flex: 1 }]}
							onPress={handleSubmit}
							disabled={isSubmitting}
						>
							<Text style={styles.buttonText}>
								{isSubmitting ? 'Updating...' : 'Update Item'}
							</Text>
						</TouchableOpacity>

						<TouchableOpacity
							style={[styles.button, styles.buttonSecondary, { flex: 1 }]}
							onPress={handleCancel}
							disabled={isSubmitting}
						>
							<Text style={styles.buttonText}>Cancel</Text>
						</TouchableOpacity>
					</>
				) : (
					<TouchableOpacity
						style={[styles.button, styles.buttonPrimary, { flex: 1 }]}
						onPress={handleSubmit}
						disabled={isSubmitting}
					>
						<Text style={styles.buttonText}>
							{isSubmitting ? 'Adding...' : 'Add Item'}
						</Text>
					</TouchableOpacity>
				)}
			</View>
		</View>
	);
};
