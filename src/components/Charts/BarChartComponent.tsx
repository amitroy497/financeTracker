import { colors, styles } from '@/styles';
import { BarChartComponentProps } from '@/types';
import React from 'react';
import { Dimensions, ScrollView, Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

export const BarChartComponent = ({
	data,
	height = 320,
	showValues = true,
}: BarChartComponentProps) => {
	const screenWidth = Dimensions.get('window').width;

	// Transform data for gifted-charts
	const barData = data.map((item, index) => ({
		value: item.y,
		label: item.x,
		frontColor: item.color,
		topLabelComponent: () => (
			<Text
				style={{
					color: colors.dark,
					fontSize: 10,
					fontWeight: 'bold',
					marginBottom: 4,
				}}
			>
				{item.percentage}
			</Text>
		),
	}));

	const maxValue = Math.max(...data.map((item) => item.y), 0);

	return (
		<View style={[styles.card, { padding: 0 }]}>
			<Text style={[styles.subHeading, { padding: 16, paddingBottom: 8 }]}>
				Asset Allocation
			</Text>
			<ScrollView
				horizontal={true}
				showsHorizontalScrollIndicator={false}
				style={{
					marginRight: 16,
				}}
			>
				{data.length > 0 ? (
					<BarChart
						data={barData}
						barWidth={40}
						spacing={20}
						roundedTop
						roundedBottom
						hideRules
						xAxisThickness={1}
						yAxisThickness={1}
						xAxisColor={colors.lightGray}
						yAxisColor={colors.lightGray}
						yAxisTextStyle={{ color: colors.gray, fontSize: 10 }}
						xAxisLabelTextStyle={{
							color: colors.gray,
							fontSize: 10,
							textAlign: 'center',
							transform: [{ rotate: '-45deg' }],
							marginTop: 20,
						}}
						noOfSections={4}
						maxValue={maxValue * 1.1} // Add 10% padding
						yAxisLabelPrefix='₹'
						yAxisLabelWidth={60}
						width={screenWidth - 72}
						height={height - 80}
						showVerticalLines={false}
						showFractionalValues={false}
						formatYLabel={(value) => {
							if (Number(value) >= 100000)
								return `${(Number(value) / 100000).toFixed(0)}L`;
							if (Number(value) >= 1000)
								return `${(Number(value) / 1000).toFixed(0)}K`;
							return value.toString();
						}}
						// Custom tooltip
						renderTooltip={(item: any, index: number) => (
							<View
								style={{
									backgroundColor: colors.dark,
									borderRadius: 4,
									padding: 6,
									position: 'absolute',
									bottom: 30,
									left: -20,
								}}
							>
								<Text
									style={{
										color: colors.white,
										fontSize: 10,
										fontWeight: 'bold',
									}}
								>
									{item.label}
								</Text>
								<Text style={{ color: colors.white, fontSize: 10 }}>
									{new Intl.NumberFormat('en-IN', {
										style: 'currency',
										currency: 'INR',
										minimumFractionDigits: 0,
										maximumFractionDigits: 0,
									}).format(item.value)}
								</Text>
								<Text style={{ color: colors.white, fontSize: 10 }}>
									{data[index]?.percentage}
								</Text>
							</View>
						)}
					/>
				) : (
					<View
						style={{
							flex: 1,
							justifyContent: 'center',
							alignItems: 'center',
						}}
					>
						<Text style={{ color: colors.gray, textAlign: 'center' }}>
							No data available for chart
						</Text>
					</View>
				)}
			</ScrollView>
		</View>
	);
};
