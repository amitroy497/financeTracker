import {
	Dashboard,
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
			screenOptions={({ route }) => ({
				headerShown: false,
				tabBarStyle: {
					backgroundColor: colors.cardBackground,
					borderTopWidth: 1,
					borderTopColor: colors.border,
					elevation: 0,
					shadowOpacity: 0,
				},
				tabBarActiveTintColor: colors.primary,
				tabBarInactiveTintColor: colors.gray,
				tabBarActiveBackgroundColor: colors.lightGray,
				tabBarInactiveBackgroundColor: colors.cardBackground,
				headerStyle: {
					backgroundColor: colors.cardBackground,
					elevation: 0,
					shadowOpacity: 0,
				},
				headerTitleStyle: {
					fontWeight: '600',
					color: colors.text,
				},
				headerTintColor: colors.primary,
				tabBarLabelStyle: {
					fontSize: 12,
					fontWeight: '500',
				},
				tabBarIconStyle: {
					marginTop: 4, // Adjust icon position if needed
				},
			})}
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
