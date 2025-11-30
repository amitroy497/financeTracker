import { colors, styles } from '@/styles';
import { FileInfoProps } from '@/types';
import { formatDate, formatFileSize } from '@/utils';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export const FileInfo: React.FC<FileInfoProps> = ({
	storageInfo,
	onRefresh,
}) => {
	if (!storageInfo) return null;

	return (
		<TouchableOpacity style={styles.card} onPress={onRefresh}>
			<View style={[styles.row, styles.spaceBetween]}>
				<View>
					<Text style={{ fontSize: 12, color: colors.gray, fontWeight: '500' }}>
						Storage Information
					</Text>
					<Text style={{ fontSize: 11, color: colors.gray, marginTop: 4 }}>
						{storageInfo.itemsCount} items •{' '}
						{formatFileSize(storageInfo.fileSize)}
					</Text>
					{storageInfo.lastModified && (
						<Text style={{ fontSize: 10, color: colors.gray, marginTop: 2 }}>
							Updated:{' '}
							{formatDate(new Date(storageInfo.lastModified).toISOString())}
						</Text>
					)}
				</View>
				<Text style={{ fontSize: 20 }}>📊</Text>
			</View>
		</TouchableOpacity>
	);
};
