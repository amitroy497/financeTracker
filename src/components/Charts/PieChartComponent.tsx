import { colors, styles } from '@/styles';
import { PieChartComponentProps } from '@/types';
import React from 'react';
import { Text, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';

export const PieChartComponent = ({
	data,
	totalAssets,
	height = 250,
}: PieChartComponentProps) => {
	const chartData = data.filter((item) => item.y > 0);

	const formatCurrency = (amount: number): string => {
		return new Intl.NumberFormat('en-IN', {
			style: 'currency',
			currency: 'INR',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(amount);
	};

	if (chartData.length === 0) {
		return (
			<View
				style={[
					styles.card,
					{ height, justifyContent: 'center', alignItems: 'center' },
				]}
			>
				<Text style={{ color: colors.gray }}>No data available</Text>
			</View>
		);
	}

	const pieConfig = chartData.map((item) => ({
		value: item.y,
		color: item.color,
		text: item.percentage,
	}));

	return (
		<View style={[styles.card, { padding: 0 }]}>
			<Text style={[styles.subHeading, { padding: 16, paddingBottom: 8 }]}>
				Asset Allocation
			</Text>

			<View style={{ flexDirection: 'row', height }}>
				{/* Pie Chart */}
				<View style={{ flex: 1, justifyContent: 'center' }}>
					<PieChart
						data={pieConfig}
						donut
						radius={100}
						innerRadius={50}
						centerLabelComponent={() => (
							<Text style={{ fontSize: 14, fontWeight: 'bold' }}>
								{formatCurrency(totalAssets)}
							</Text>
						)}
					/>
				</View>

				{/* Legend */}
				<View style={{ flex: 1, justifyContent: 'center', padding: 16 }}>
					{chartData.map((item) => (
						<View
							key={item.x}
							style={{
								flexDirection: 'row',
								alignItems: 'center',
								marginBottom: 12,
								padding: 8,
								backgroundColor: colors.lightGray,
								borderRadius: 8,
							}}
						>
							<View
								style={{
									width: 12,
									height: 12,
									backgroundColor: item.color,
									borderRadius: 6,
									marginRight: 8,
								}}
							/>
							<View style={{ flex: 1 }}>
								<Text style={{ fontWeight: 'bold' }}>{item.x}</Text>
								<Text style={{ color: colors.gray }}>
									{formatCurrency(item.y)} • {item.percentage}
								</Text>
							</View>
						</View>
					))}
				</View>
			</View>
		</View>
	);
};
