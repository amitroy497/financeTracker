import { colors, styles } from '@/styles';
import { AssetSummary } from '@/types';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface AssetCardsProps {
	summary: AssetSummary;
}

export const AssetCards: React.FC<AssetCardsProps> = ({ summary }) => {
	const formatCurrency = (amount: number): string => {
		return new Intl.NumberFormat('en-IN', {
			style: 'currency',
			currency: 'INR',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(amount);
	};

	const getPercentage = (amount: number, total: number): string => {
		return total > 0 ? ((amount / total) * 100).toFixed(1) + '%' : '0%';
	};

	const assetTypes = [
		{
			title: 'Cash',
			amount: summary.cash,
			percentage: getPercentage(summary.cash, summary.totalAssets),
			color: colors.success,
			icon: '💰',
		},
		{
			title: 'Fixed Deposits',
			amount: summary.fixedDeposits,
			percentage: getPercentage(summary.fixedDeposits, summary.totalAssets),
			color: colors.primary,
			icon: '🏦',
		},
		{
			title: 'Recurring Deposits',
			amount: summary.recurringDeposits,
			percentage: getPercentage(summary.recurringDeposits, summary.totalAssets),
			color: colors.info,
			icon: '📈',
		},
		{
			title: 'Mutual Funds',
			amount: summary.mutualFunds,
			percentage: getPercentage(summary.mutualFunds, summary.totalAssets),
			color: colors.warning,
			icon: '📊',
		},
		{
			title: 'Gold ETFs',
			amount: summary.goldETFs,
			percentage: getPercentage(summary.goldETFs, summary.totalAssets),
			color: '#FFD700',
			icon: '🥇',
		},
		{
			title: 'Stocks',
			amount: summary.stocks,
			percentage: getPercentage(summary.stocks, summary.totalAssets),
			color: colors.success,
			icon: '📈',
		},
		{
			title: 'Equity ETFs',
			amount: summary.equityETFs,
			percentage: getPercentage(summary.equityETFs, summary.totalAssets),
			color: colors.info,
			icon: '📊',
		},
		{
			title: 'PPF',
			amount: summary.ppf,
			percentage: getPercentage(summary.ppf, summary.totalAssets),
			color: colors.primary,
			icon: '🏛️',
		},
		{
			title: 'Floating Rate Bonds',
			amount: summary.frb,
			percentage: getPercentage(summary.frb, summary.totalAssets),
			color: colors.secondary,
			icon: '📄',
		},
		{
			title: 'NPS',
			amount: summary.nps,
			percentage: getPercentage(summary.nps, summary.totalAssets),
			color: colors.dark,
			icon: '👵',
		},
	];

	return (
		<View style={{ marginBottom: 16 }}>
			<Text
				style={[styles.subHeading, { marginBottom: 12, paddingHorizontal: 20 }]}
			>
				Asset Allocation
			</Text>

			{assetTypes.map((asset) => (
				<TouchableOpacity
					key={asset.title}
					style={[
						styles.card,
						{
							marginHorizontal: 20,
							marginBottom: 12,
							borderLeftWidth: 4,
							borderLeftColor: asset.color,
						},
					]}
				>
					<View style={[styles.row, styles.spaceBetween]}>
						<View style={[styles.row, { alignItems: 'center' }]}>
							<Text style={{ fontSize: 20, marginRight: 12 }}>
								{asset.icon}
							</Text>
							<View>
								<Text
									style={{
										fontWeight: 'bold',
										color: colors.dark,
										fontSize: 16,
									}}
								>
									{asset.title}
								</Text>
								<Text style={{ color: colors.gray, fontSize: 12 }}>
									{asset.percentage} of portfolio
								</Text>
							</View>
						</View>

						<View style={{ alignItems: 'flex-end' }}>
							<Text
								style={{ fontWeight: 'bold', color: colors.dark, fontSize: 16 }}
							>
								{formatCurrency(asset.amount)}
							</Text>
							<Text style={{ color: colors.gray, fontSize: 12 }}>
								{asset.percentage}
							</Text>
						</View>
					</View>
				</TouchableOpacity>
			))}
		</View>
	);
};
