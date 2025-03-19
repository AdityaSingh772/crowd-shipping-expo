import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Welcome: { onComplete: () => Promise<void> };
  Auth: undefined;
  Dashboard: undefined;
  DeliveryPartnerDashboard: undefined;
};

// Auth navigator param list
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

// Dashboard tab navigator param list
export type DashboardTabParamList = {
  Home: undefined;
  Map: undefined;
  Deliveries: undefined;
  Payments: undefined;
  OrderAssignment: undefined; 
};