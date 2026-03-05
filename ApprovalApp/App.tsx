import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import './global.css';
import RootNavigator from './src/navigation/RootNavigator';
import { store } from './src/redux/store';
import { useAppDispatch, useAppSelector } from './src/redux/hooks';
import { hydrateAuth } from './src/redux/slices/authSlice';

function AppContent() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, hydrated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(hydrateAuth());
  }, [dispatch]);

  if (!hydrated) {
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
          <RootNavigator isLoggedIn={isAuthenticated} />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}
