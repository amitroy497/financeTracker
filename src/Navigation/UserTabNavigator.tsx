import {
	Dashboard,
	DividendsScreen,
	ExpensesScreen,
	ProfileScreen,
	SavingsScreen,
} from '@/screens';
import { useTheme } from '@/theme';
import { Text } from 'react-native';
import { Tab } from './TabNavigator';

export const UserTabNavigator: React.FC = () => {
	const { colors } = useTheme();

	return (
		<Tab.Navigator
			screenOptions={{
				headerShown: false,
				tabBarStyle: {
					backgroundColor: colors.cardBackground,
					borderTopColor: colors.border,
					borderTopWidth: 1,
					height: 70,
					paddingBottom: 5,
					paddingTop: 5,
				},
				tabBarActiveTintColor: colors.primary,
				tabBarInactiveTintColor: colors.gray,
				headerStyle: {
					backgroundColor: colors.background,
					elevation: 0,
					shadowOpacity: 0,
					borderBottomWidth: 1,
					borderBottomColor: colors.border,
				},
				headerTitleStyle: {
					color: colors.text,
					fontWeight: '600',
				},
				headerTintColor: colors.primary,
				tabBarLabelStyle: {
					fontSize: 12,
					fontWeight: '500',
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
						<Text style={{ color, fontSize: size }}>🐖</Text>
					),
				}}
			/>
			<Tab.Screen
				name='Dividends'
				component={DividendsScreen}
				options={{
					title: 'Dividends',
					tabBarIcon: ({ color, size }) => (
						<Text style={{ color, fontSize: size }}>📥</Text>
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
