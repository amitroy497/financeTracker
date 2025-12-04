import {
	Dashboard,
	ExpensesScreen,
	ProfileScreen,
	SavingsScreen,
} from '@/screens';
import { Text } from 'react-native';
import { Tab } from './TabNavigator';

export const UserTabNavigator: React.FC = () => {
	return (
		<Tab.Navigator
			screenOptions={{
				tabBarStyle: {
					backgroundColor: '#ffffff',
					borderTopWidth: 1,
					borderTopColor: '#e5e5e5',
				},
				tabBarActiveTintColor: '#007AFF',
				tabBarInactiveTintColor: '#8e8e93',
				headerStyle: {
					backgroundColor: '#ffffff',
				},
				headerTitleStyle: {
					fontWeight: '600',
				},
			}}
		>
			<Tab.Screen
				name='Dashboard'
				component={Dashboard}
				options={{
					title: 'Assets',
					tabBarIcon: ({ color, size }) => (
						<Text style={{ color, fontSize: size }}>🏦</Text>
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
				name='Savings'
				component={SavingsScreen}
				options={{
					title: 'Savings',
					tabBarIcon: ({ color, size }) => (
						<Text style={{ color, fontSize: size }}>💰</Text>
					),
				}}
			/>
			<Tab.Screen
				name='Profile'
				component={ProfileScreen}
				options={{
					title: 'Profile',
					tabBarIcon: ({ color, size }) => (
						<Text style={{ color, fontSize: size }}>👤</Text>
					),
				}}
			/>
		</Tab.Navigator>
	);
};
