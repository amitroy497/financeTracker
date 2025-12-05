import { AdminScreen, ProfileScreen } from '@/screens';
import { Text } from 'react-native';
import { Tab } from './TabNavigator';

export const AdminTabNavigator: React.FC = () => {
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
			{/* Only show Admin tab for admin users */}
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

			{/* Show Profile tab for admin users */}
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
