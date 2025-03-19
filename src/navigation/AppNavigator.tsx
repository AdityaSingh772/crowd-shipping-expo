import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import AuthNavigator from './AuthNavigator';
import DashboardNavigator from './DashboardNavigator';
import DeliveryPartnerDashboardScreen from '../screens/delivery-partner/delivery-partner-dashboard-screen';
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import { useAuth } from '../hooks/useAuth';
import { RootStackParamList } from '../types/navigation';

// Create the stack navigator without type arguments
const Stack = createNativeStackNavigator();

// Loading screen component
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#4A80F0" />
    </View>
  );
}

export default function AppNavigator() {
  const { user, isLoading, userType } = useAuth();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Check if user has completed onboarding
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const value = await AsyncStorage.getItem('hasCompletedOnboarding');
        setHasCompletedOnboarding(value === 'true');
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    checkOnboardingStatus();
  }, []);

  // Handle onboarding completion
  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      setHasCompletedOnboarding(true);
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  // Show loading screen while initializing
  if (isInitializing || isLoading) {
    return <LoadingScreen />;
  }

  // For debugging
  console.log('Current user type:', userType);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!hasCompletedOnboarding ? (
          <Stack.Screen 
            name="Welcome" 
            component={WelcomeScreen} 
            initialParams={{ onComplete: handleOnboardingComplete }}
          />
        ) : user ? (
          userType === 'partner' ? (
            // Delivery partner sees their dedicated dashboard
            <Stack.Screen name="DeliveryPartnerDashboard" component={DeliveryPartnerDashboardScreen} />
          ) : (
            // Regular users see the user dashboard
            <Stack.Screen name="Dashboard" component={DashboardNavigator} />
          )
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
});