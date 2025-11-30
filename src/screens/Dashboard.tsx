import {
	AssetCards,
	BankAccounts,
	FixedDeposits,
	MutualFunds,
	RecurringDeposits,
} from '@/components';
import { useAuth } from '@/hooks';
import { assetService } from '@/services/assetService';
import { colors, styles } from '@/styles';
import { DashboardData } from '@/types';
import React, { useEffect, useState } from 'react';
import {
	Alert,
	RefreshControl,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';

export const Dashboard: React.FC = () => {
	const { user } = useAuth();
	const [dashboardData, setDashboardData] = useState<DashboardData | null>(
		null
	);
	const [refreshing, setRefreshing] = useState(false);
	const [activeSection, setActiveSection] = useState<
		'overview' | 'cash' | 'fd' | 'rd' | 'mf'
	>('overview');

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
			{/* Asset Summary Cards */}
			{dashboardData && <AssetCards summary={dashboardData.summary} />}

			{/* Quick Stats */}
			<View style={styles.card}>
				<Text style={[styles.subHeading, { marginBottom: 16 }]}>
					Quick Stats
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

				<View style={[styles.row, { justifyContent: 'space-between' }]}>
					<Text style={{ color: colors.gray }}>Mutual Fund Schemes</Text>
					<Text style={{ fontWeight: 'bold', color: colors.dark }}>
						{dashboardData?.mutualFunds.length || 0}
					</Text>
				</View>
			</View>

			{/* Recent Updates */}
			<View style={styles.card}>
				<Text style={[styles.subHeading, { marginBottom: 16 }]}>
					Recent Activity
				</Text>

				{dashboardData && dashboardData?.lastUpdated && (
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
								{new Date(dashboardData?.lastUpdated).toLocaleString()}
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
			<View style={[styles.card, { backgroundColor: colors.primary }]}>
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
				style={{ marginVertical: 16 }}
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
