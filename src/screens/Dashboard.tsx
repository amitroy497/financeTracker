import {
	AssetCards,
	BankAccounts,
	BarChartComponent,
	EquityETFs,
	FixedDeposits,
	FloatingRateBonds,
	GoldETFs,
	MutualFunds,
	NPSAccounts,
	PieChartComponent,
	PPFAccounts,
	RecurringDeposits,
	Stocks,
} from '@/components';
import { useAuth } from '@/hooks';
import { assetService } from '@/services/assetService';
import { createStyles } from '@/styles';
import { useTheme } from '@/theme';
import { DashboardData } from '@/types';
import { isDataEmpty } from '@/utils';
import React, { useEffect, useMemo, useState } from 'react';
import {
	Alert,
	RefreshControl,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';

export const Dashboard = () => {
	const { colors } = useTheme();
	const styles = createStyles(colors);
	const { user } = useAuth();
	const [dashboardData, setDashboardData] = useState<DashboardData | null>(
		null
	);
	const [refreshing, setRefreshing] = useState(false);
	const [activeSection, setActiveSection] = useState<
		| 'overview'
		| 'cash'
		| 'fd'
		| 'rd'
		| 'mf'
		| 'gold'
		| 'stocks'
		| 'equity'
		| 'ppf'
		| 'frb'
		| 'nps'
	>('overview');
	const [chartType, setChartType] = useState<'pie' | 'cards' | 'bar'>('pie');

	useEffect(() => {
		if (user) {
			loadDashboardData();
		}
	}, [user]);

	const loadDashboardData = async (): Promise<void> => {
		if (!user) return;

		setRefreshing(true);
		try {
			const assetData = await assetService.getAssetData(user.id);
			setDashboardData(assetData);
		} catch (error) {
			console.error('Error loading dashboard data:', error);
			Alert.alert('Error', 'Failed to load dashboard data');
		} finally {
			setRefreshing(false);
		}
	};

	// Prepare data for pie chart
	const pieChartData = useMemo(() => {
		if (!dashboardData) return [];

		const { summary } = dashboardData;
		const total = summary.totalAssets;

		if (total === 0) return [];

		const data = [
			{
				x: 'Cash',
				y: summary.cash,
				color: colors.success,
				percentage:
					total > 0 ? ((summary.cash / total) * 100).toFixed(1) + '%' : '0%',
			},
			{
				x: 'Fixed Deposits',
				y: summary.fixedDeposits,
				color: colors.primary,
				percentage:
					total > 0
						? ((summary.fixedDeposits / total) * 100).toFixed(1) + '%'
						: '0%',
			},
			{
				x: 'Recurring Deposits',
				y: summary.recurringDeposits,
				color: colors.info,
				percentage:
					total > 0
						? ((summary.recurringDeposits / total) * 100).toFixed(1) + '%'
						: '0%',
			},
			{
				x: 'Mutual Funds',
				y: summary.mutualFunds,
				color: colors.warning,
				percentage:
					total > 0
						? ((summary.mutualFunds / total) * 100).toFixed(1) + '%'
						: '0%',
			},
			{
				x: 'Gold ETFs',
				y: summary.goldETFs,
				color: '#FFD700',
				percentage:
					total > 0
						? ((summary.goldETFs / total) * 100).toFixed(1) + '%'
						: '0%',
			},
			{
				x: 'Stocks',
				y: summary.stocks,
				color: colors.success,
				percentage:
					total > 0 ? ((summary.stocks / total) * 100).toFixed(1) + '%' : '0%',
			},
			{
				x: 'Equity ETFs',
				y: summary.equityETFs,
				color: colors.info,
				percentage:
					total > 0
						? ((summary.equityETFs / total) * 100).toFixed(1) + '%'
						: '0%',
			},
			{
				x: 'PPF',
				y: summary.ppf,
				color: colors.primary,
				percentage:
					total > 0 ? ((summary.ppf / total) * 100).toFixed(1) + '%' : '0%',
			},
			{
				x: 'Floating Bonds',
				y: summary.frb,
				color: colors.secondary,
				percentage:
					total > 0 ? ((summary.frb / total) * 100).toFixed(1) + '%' : '0%',
			},
			{
				x: 'NPS',
				y: summary.nps,
				color: colors.dark,
				percentage:
					total > 0 ? ((summary.nps / total) * 100).toFixed(1) + '%' : '0%',
			},
		];

		// Filter out assets with zero value
		return data.filter((item) => item.y > 0);
	}, [dashboardData]);

	const formatCurrency = (amount: number): string => {
		return new Intl.NumberFormat('en-IN', {
			style: 'currency',
			currency: 'INR',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(amount);
	};

	const renderOverview = () => (
		<ScrollView showsVerticalScrollIndicator={false}>
			{!isDataEmpty(dashboardData) && (
				<>
					<View
						style={[
							styles.card,
							{
								flexDirection: 'row',
								justifyContent: 'center',
								gap: 8,
								paddingVertical: 12,
								marginHorizontal: 6,
							},
						]}
					>
						<TouchableOpacity
							style={[
								styles.button,
								chartType === 'pie'
									? styles.buttonPrimary
									: { backgroundColor: colors.lightGray },
								{ flex: 1, paddingVertical: 8 },
							]}
							onPress={() => setChartType('pie')}
						>
							<Text
								style={[
									styles.buttonText,
									chartType === 'pie' ? {} : { color: colors.dark },
									{ fontSize: 12 },
								]}
							>
								📊 Pie
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[
								styles.button,
								chartType === 'bar'
									? styles.buttonPrimary
									: { backgroundColor: colors.lightGray },
								{ flex: 1, paddingVertical: 8 },
							]}
							onPress={() => setChartType('bar')}
						>
							<Text
								style={[
									styles.buttonText,
									chartType === 'bar' ? {} : { color: colors.dark },
									{ fontSize: 12 },
								]}
							>
								📈 Bar
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[
								styles.button,
								chartType === 'cards'
									? styles.buttonPrimary
									: { backgroundColor: colors.lightGray },
								{ flex: 1, paddingVertical: 8 },
							]}
							onPress={() => setChartType('cards')}
						>
							<Text
								style={[
									styles.buttonText,
									chartType === 'cards' ? {} : { color: colors.dark },
									{ fontSize: 12 },
								]}
							>
								💳 Cards
							</Text>
						</TouchableOpacity>
					</View>
					{chartType === 'pie' && dashboardData && (
						<PieChartComponent
							data={pieChartData}
							totalAssets={dashboardData.summary.totalAssets}
							height={320}
						/>
					)}
					{chartType === 'bar' && dashboardData && (
						<BarChartComponent
							data={pieChartData}
							height={320}
							showValues={true}
						/>
					)}
					{chartType === 'cards' && dashboardData && (
						<AssetCards summary={dashboardData.summary} />
					)}
				</>
			)}

			<View style={styles.card}>
				<Text style={[styles.subHeading, { marginBottom: 16 }]}>
					Portfolio Summary
				</Text>

				<View
					style={[
						styles.row,
						{ justifyContent: 'space-between', marginBottom: 12 },
					]}
				>
					<Text style={{ color: colors.gray }}>Total Bank Accounts</Text>
					<Text style={{ fontWeight: 'bold', color: colors.dark }}>
						{dashboardData?.bankAccounts.length || 0}
					</Text>
				</View>

				<View
					style={[
						styles.row,
						{ justifyContent: 'space-between', marginBottom: 12 },
					]}
				>
					<Text style={{ color: colors.gray }}>Active Fixed Deposits</Text>
					<Text style={{ fontWeight: 'bold', color: colors.dark }}>
						{dashboardData?.fixedDeposits.filter((fd) => fd.status === 'Active')
							.length || 0}
					</Text>
				</View>

				<View
					style={[
						styles.row,
						{ justifyContent: 'space-between', marginBottom: 12 },
					]}
				>
					<Text style={{ color: colors.gray }}>Recurring Deposits</Text>
					<Text style={{ fontWeight: 'bold', color: colors.dark }}>
						{dashboardData?.recurringDeposits.length || 0}
					</Text>
				</View>

				<View
					style={[
						styles.row,
						{ justifyContent: 'space-between', marginBottom: 12 },
					]}
				>
					<Text style={{ color: colors.gray }}>Mutual Fund Schemes</Text>
					<Text style={{ fontWeight: 'bold', color: colors.dark }}>
						{dashboardData?.mutualFunds.length || 0}
					</Text>
				</View>

				<View
					style={[
						styles.row,
						{ justifyContent: 'space-between', marginBottom: 12 },
					]}
				>
					<Text style={{ color: colors.gray }}>Stocks</Text>
					<Text style={{ fontWeight: 'bold', color: colors.dark }}>
						{dashboardData?.stocks.length || 0}
					</Text>
				</View>

				<View style={[styles.row, { justifyContent: 'space-between' }]}>
					<Text style={{ color: colors.gray }}>Gold ETFs</Text>
					<Text style={{ fontWeight: 'bold', color: colors.dark }}>
						{dashboardData?.goldETFs.length || 0}
					</Text>
				</View>
			</View>

			{/* Recent Updates */}
			<View style={styles.card}>
				<Text style={[styles.subHeading, { marginBottom: 16 }]}>
					Recent Activity
				</Text>

				{dashboardData && dashboardData.lastUpdated && (
					<View style={[styles.row, { marginBottom: 12 }]}>
						<View
							style={{
								width: 4,
								height: 40,
								backgroundColor: colors.primary,
								marginRight: 12,
								borderRadius: 2,
							}}
						/>
						<View style={{ flex: 1 }}>
							<Text style={{ fontWeight: 'bold', color: colors.dark }}>
								Last Updated
							</Text>
							<Text style={{ color: colors.gray, fontSize: 12 }}>
								{new Date(dashboardData.lastUpdated).toLocaleString()}
							</Text>
						</View>
					</View>
				)}

				{dashboardData && dashboardData.bankAccounts.length === 0 && (
					<View style={[styles.row, { marginBottom: 12 }]}>
						<View
							style={{
								width: 4,
								height: 40,
								backgroundColor: colors.warning,
								marginRight: 12,
								borderRadius: 2,
							}}
						/>
						<View style={{ flex: 1 }}>
							<Text style={{ fontWeight: 'bold', color: colors.dark }}>
								No Bank Accounts
							</Text>
							<Text style={{ color: colors.gray, fontSize: 12 }}>
								Add your first bank account to get started
							</Text>
						</View>
					</View>
				)}

				{dashboardData && dashboardData.fixedDeposits.length === 0 && (
					<View style={[styles.row]}>
						<View
							style={{
								width: 4,
								height: 40,
								backgroundColor: colors.info,
								marginRight: 12,
								borderRadius: 2,
							}}
						/>
						<View style={{ flex: 1 }}>
							<Text style={{ fontWeight: 'bold', color: colors.dark }}>
								No Fixed Deposits
							</Text>
							<Text style={{ color: colors.gray, fontSize: 12 }}>
								Track your fixed deposits for better financial planning
							</Text>
						</View>
					</View>
				)}
			</View>
		</ScrollView>
	);

	const renderSection = () => {
		switch (activeSection) {
			case 'cash':
				return (
					<BankAccounts
						accounts={dashboardData?.bankAccounts || []}
						onRefresh={loadDashboardData}
						userId={user?.id || ''}
					/>
				);
			case 'fd':
				return (
					<FixedDeposits
						deposits={dashboardData?.fixedDeposits || []}
						onRefresh={loadDashboardData}
						userId={user?.id || ''}
					/>
				);
			case 'rd':
				return (
					<RecurringDeposits
						deposits={dashboardData?.recurringDeposits || []}
						onRefresh={loadDashboardData}
						userId={user?.id || ''}
					/>
				);
			case 'mf':
				return (
					<MutualFunds
						funds={dashboardData?.mutualFunds || []}
						onRefresh={loadDashboardData}
						userId={user?.id || ''}
					/>
				);
			case 'gold':
				return (
					<GoldETFs
						etfs={dashboardData?.goldETFs || []}
						onRefresh={loadDashboardData}
						userId={user?.id || ''}
					/>
				);
			case 'stocks':
				return (
					<Stocks
						stocks={dashboardData?.stocks || []}
						onRefresh={loadDashboardData}
						userId={user?.id || ''}
					/>
				);
			case 'equity':
				return (
					<EquityETFs
						etfs={dashboardData?.equityETFs || []}
						onRefresh={loadDashboardData}
						userId={user?.id || ''}
					/>
				);
			case 'ppf':
				return (
					<PPFAccounts
						accounts={dashboardData?.ppfAccounts || []}
						onRefresh={loadDashboardData}
						userId={user?.id || ''}
					/>
				);
			case 'frb':
				return (
					<FloatingRateBonds
						bonds={dashboardData?.frbBonds || []}
						onRefresh={loadDashboardData}
						userId={user?.id || ''}
					/>
				);
			case 'nps':
				return (
					<NPSAccounts
						accounts={dashboardData?.npsAccounts || []}
						onRefresh={loadDashboardData}
						userId={user?.id || ''}
					/>
				);
			default:
				return renderOverview();
		}
	};

	if (!user) {
		return (
			<View style={[styles.container, styles.center]}>
				<Text style={styles.header}>Please log in</Text>
				<Text style={{ color: colors.gray, marginTop: 10 }}>
					You need to be logged in to access your dashboard.
				</Text>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			{/* Header */}
			<View
				style={[
					styles.card,
					{ backgroundColor: colors.primary, marginTop: 20 },
				]}
			>
				<Text
					style={[styles.header, { color: colors.white, textAlign: 'left' }]}
				>
					Financial Dashboard
				</Text>
				<Text style={{ color: colors.white, opacity: 0.9, marginTop: 4 }}>
					Welcome back, {user.username}!
				</Text>
				{dashboardData && (
					<Text
						style={{
							color: colors.white,
							fontSize: 24,
							fontWeight: 'bold',
							marginTop: 8,
						}}
					>
						{formatCurrency(dashboardData.summary.totalAssets)}
					</Text>
				)}
			</View>

			{/* Navigation Tabs */}
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				style={{ marginVertical: 16, maxHeight: 60 }}
				contentContainerStyle={{ paddingHorizontal: 20 }}
			>
				<TouchableOpacity
					style={[
						styles.button,
						activeSection === 'overview'
							? styles.buttonPrimary
							: { backgroundColor: colors.lightGray },
						{ marginRight: 8 },
					]}
					onPress={() => setActiveSection('overview')}
				>
					<Text
						style={[
							styles.buttonText,
							activeSection === 'overview' ? {} : { color: colors.dark },
						]}
					>
						📊 Overview
					</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={[
						styles.button,
						activeSection === 'cash'
							? styles.buttonPrimary
							: { backgroundColor: colors.lightGray },
						{ marginRight: 8 },
					]}
					onPress={() => setActiveSection('cash')}
				>
					<Text
						style={[
							styles.buttonText,
							activeSection === 'cash' ? {} : { color: colors.dark },
						]}
					>
						💰 Cash
					</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={[
						styles.button,
						activeSection === 'fd'
							? styles.buttonPrimary
							: { backgroundColor: colors.lightGray },
						{ marginRight: 8 },
					]}
					onPress={() => setActiveSection('fd')}
				>
					<Text
						style={[
							styles.buttonText,
							activeSection === 'fd' ? {} : { color: colors.dark },
						]}
					>
						🏦 Fixed Deposits
					</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={[
						styles.button,
						activeSection === 'rd'
							? styles.buttonPrimary
							: { backgroundColor: colors.lightGray },
						{ marginRight: 8 },
					]}
					onPress={() => setActiveSection('rd')}
				>
					<Text
						style={[
							styles.buttonText,
							activeSection === 'rd' ? {} : { color: colors.dark },
						]}
					>
						📈 Recurring Deposits
					</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={[
						styles.button,
						activeSection === 'mf'
							? styles.buttonPrimary
							: { backgroundColor: colors.lightGray },
						{ marginRight: 8 },
					]}
					onPress={() => setActiveSection('mf')}
				>
					<Text
						style={[
							styles.buttonText,
							activeSection === 'mf' ? {} : { color: colors.dark },
						]}
					>
						📊 Mutual Funds
					</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={[
						styles.button,
						activeSection === 'gold'
							? styles.buttonPrimary
							: { backgroundColor: colors.lightGray },
						{ marginRight: 8 },
					]}
					onPress={() => setActiveSection('gold')}
				>
					<Text
						style={[
							styles.buttonText,
							activeSection === 'gold' ? {} : { color: colors.dark },
						]}
					>
						🥇 Gold ETFs
					</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={[
						styles.button,
						activeSection === 'stocks'
							? styles.buttonPrimary
							: { backgroundColor: colors.lightGray },
						{ marginRight: 8 },
					]}
					onPress={() => setActiveSection('stocks')}
				>
					<Text
						style={[
							styles.buttonText,
							activeSection === 'stocks' ? {} : { color: colors.dark },
						]}
					>
						📈 Stocks
					</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={[
						styles.button,
						activeSection === 'equity'
							? styles.buttonPrimary
							: { backgroundColor: colors.lightGray },
						{ marginRight: 8 },
					]}
					onPress={() => setActiveSection('equity')}
				>
					<Text
						style={[
							styles.buttonText,
							activeSection === 'equity' ? {} : { color: colors.dark },
						]}
					>
						📊 Equity ETFs
					</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={[
						styles.button,
						activeSection === 'ppf'
							? styles.buttonPrimary
							: { backgroundColor: colors.lightGray },
						{ marginRight: 8 },
					]}
					onPress={() => setActiveSection('ppf')}
				>
					<Text
						style={[
							styles.buttonText,
							activeSection === 'ppf' ? {} : { color: colors.dark },
						]}
					>
						🏛️ PPF
					</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={[
						styles.button,
						activeSection === 'frb'
							? styles.buttonPrimary
							: { backgroundColor: colors.lightGray },
						{ marginRight: 8 },
					]}
					onPress={() => setActiveSection('frb')}
				>
					<Text
						style={[
							styles.buttonText,
							activeSection === 'frb' ? {} : { color: colors.dark },
						]}
					>
						📄 FRB
					</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={[
						styles.button,
						activeSection === 'nps'
							? styles.buttonPrimary
							: { backgroundColor: colors.lightGray },
					]}
					onPress={() => setActiveSection('nps')}
				>
					<Text
						style={[
							styles.buttonText,
							activeSection === 'nps' ? {} : { color: colors.dark },
						]}
					>
						👵 NPS
					</Text>
				</TouchableOpacity>
			</ScrollView>

			{/* Content Section */}
			<View style={{ flex: 1 }}>
				<ScrollView
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={loadDashboardData}
							colors={[colors.primary]}
						/>
					}
					showsVerticalScrollIndicator={false}
				>
					{dashboardData ? (
						renderSection()
					) : (
						<View style={[styles.card, styles.center, { minHeight: 200 }]}>
							<Text style={{ color: colors.gray }}>
								Loading dashboard data...
							</Text>
						</View>
					)}
				</ScrollView>
			</View>
		</View>
	);
};
