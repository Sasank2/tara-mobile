import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import SplashScreen from '../screens/SplashScreen';
import HomeScreen from '../screens/HomeScreen';
import AskTaraScreen from '../screens/AskTaraScreen';
import ChartScreen from '../screens/ChartScreen';
import JournalScreen from '../screens/JournalScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoginScreen from '../screens/LoginScreen';
import OnboardingScreen from '../screens/OnboardingScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const [appState, setAppState] = React.useState<string>('splash');

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const hasProfile = await AsyncStorage.getItem('hasProfile');
      if (!token) {
        setAppState('auth');
      } else if (!hasProfile) {
        setAppState('onboarding');
      } else {
        setAppState('main');
      }
    } catch {
      setAppState('auth');
    }
  };

  if (appState === 'splash') {
    return <SplashScreen onFinish={checkAuth} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {appState === 'auth' && (
          <Stack.Screen name="Login">
            {() => <LoginScreen onLogin={checkAuth} />}
          </Stack.Screen>
        )}
        {appState === 'onboarding' && (
          <Stack.Screen name="Onboarding">
            {() => <OnboardingScreen onComplete={checkAuth} />}
          </Stack.Screen>
        )}
        {appState === 'main' && (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Chart" component={ChartScreen} />
            <Stack.Screen name="Ask Tara" component={AskTaraScreen} />
            <Stack.Screen name="Journal" component={JournalScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}