import { AdminScreen, ProfileScreen } from '@/screens';
import { useTheme } from '@/theme'; // Add this import
import { Text } from 'react-native';
import { Tab } from './TabNavigator';

export const AdminTabNavigator: React.FC = () => {
	const { colors } = useTheme(); // Get colors from theme

	return (
		<Tab.Navigator
			screenOptions={({ route }) => ({
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
				name='Admin'
				component={AdminScreen}
				options={{
					title: 'Admin Dashboard',
					tabBarIcon: ({ color, size }) => (
						<Text style={{ color, fontSize: size }}>👨‍💼</Text>
					),
				}}
			/>

			<Tab.Screen
				name='Profile'
				component={ProfileScreen}
				options={{
					title: 'Admin Profile',
					tabBarIcon: ({ color, size }) => (
						<Text style={{ color, fontSize: size }}>👤</Text>
					),
				}}
			/>
		</Tab.Navigator>
	);
};
