import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import './global.css';
import RootNavigator from './src/navigation/RootNavigator';

const ACCESS_TOKEN_KEY = 'tbgs_access_token';
const USER_DATA_KEY = 'tbgs_user';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
        setIsLoggedIn(Boolean(token));
      } catch (e) {
        console.error('Failed to load session', e);
      } finally {
        setIsBooting(false);
      }
    };
    bootstrapAuth();
  }, []);

  const handleLogin = async (rememberMe: boolean) => {
    // Mock token generation
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, `mock_tbgs_access_token_${Date.now()}`);
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    await Promise.all([
      AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
      AsyncStorage.removeItem(USER_DATA_KEY),
      AsyncStorage.removeItem('tbgs_remember_me'),
    ]);
    setIsLoggedIn(false);
  };

  if (isBooting) {
    return (
      <SafeAreaProvider>
        <View className="flex-1 items-center justify-center bg-slate-50">
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text className="mt-3 text-sm font-semibold text-slate-500">Initializing App...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <RootNavigator
            isLoggedIn={isLoggedIn}
            onLogin={handleLogin}
            onLogout={handleLogout}
          />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
