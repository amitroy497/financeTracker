import { useAuth } from '@/hooks';
import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { AdminTabNavigator } from './AdminTabNavigator';
import { UserTabNavigator } from './UserTabNavigator';

export const BottomTabNavigator: React.FC = () => {
	const { user } = useAuth();

	return (
		<NavigationContainer>
			{user?.isAdmin ? <AdminTabNavigator /> : <UserTabNavigator />}
		</NavigationContainer>
	);
};
