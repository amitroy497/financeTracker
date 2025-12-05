import { AdminScreen, ProfileScreen } from '@/screens';
import { useTheme } from '@/theme'; // Add this import
import { Text } from 'react-native';
import { Tab } from './TabNavigator';

export const AdminTabNavigator: React.FC = () => {
	const { colors } = useTheme(); // Get colors from theme

	return (
		<Tab.Navigator
			screenOptions={{
				headerShown: false,
				tabBarStyle: {
					backgroundColor: colors.cardBackground,
					borderTopColor: colors.border,
					borderTopWidth: 1,
					height: 60,
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
