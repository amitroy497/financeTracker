import { Dashboard, ExpensesScreen, ProfileScreen } from '@/screens';
import { AppTabParamList } from '@/types';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { Text, View } from 'react-native';

const Tab = createBottomTabNavigator<AppTabParamList>();

const TransactionsScreen = () => (
	<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
		<Text>Transactions Screen - Coming Soon</Text>
	</View>
);

const AssetsScreen = () => (
	<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
		<Text>Assets Screen - Coming Soon</Text>
	</View>
);

export const BottomTabNavigator: React.FC = () => {
	return (
		<NavigationContainer>
			<Tab.Navigator
				screenOptions={{
					tabBarStyle: {
						backgroundColor: '#ffffff',
						borderTopWidth: 1,
						borderTopColor: '#e5e5e5',
					},
					tabBarActiveTintColor: '#007AFF',
					tabBarInactiveTintColor: '#8e8e93',
				}}
			>
				<Tab.Screen
					name='Dashboard'
					component={Dashboard}
					options={{
						tabBarIcon: ({ color, size }) => (
							<Text style={{ color, fontSize: size }}>📊</Text>
						),
					}}
				/>
				<Tab.Screen
					name='Expenses'
					component={ExpensesScreen}
					options={{
						title: 'Expenses',
						tabBarIcon: ({ color, size }) => (
							<Text style={{ color, fontSize: size }}>💸</Text>
						),
					}}
				/>
				<Tab.Screen
					name='Assets'
					component={AssetsScreen}
					options={{
						tabBarIcon: ({ color, size }) => (
							<Text style={{ color, fontSize: size }}>💰</Text>
						),
					}}
				/>
				<Tab.Screen
					name='Profile'
					component={ProfileScreen}
					options={{
						tabBarIcon: ({ color, size }) => (
							<Text style={{ color, fontSize: size }}>👤</Text>
						),
					}}
				/>
			</Tab.Navigator>
		</NavigationContainer>
	);
};
