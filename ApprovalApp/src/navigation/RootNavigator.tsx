import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../Screens/LoginScreen';
import AppDrawerNavigator from './AppDrawerNavigator';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

interface RootNavigatorProps {
  isLoggedIn: boolean;
  onLogin: (rememberMe: boolean) => Promise<void>;
  onLogout: () => Promise<void>;
}

export default function RootNavigator({ isLoggedIn, onLogin, onLogout }: RootNavigatorProps) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isLoggedIn ? (
        <Stack.Screen name="Login">
          {() => <LoginScreen onLogin={onLogin} />}
        </Stack.Screen>
      ) : (
        <Stack.Screen name="App">
          {() => <AppDrawerNavigator onLogout={onLogout} />}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
}
