import React, { useState } from 'react';
import { View, StyleSheet, Alert, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import OrderAssignmentScreen from './order-assignment-screen';
import TrackingScreen from './tracking-screen';
import PaymentScreen from './payment-screen';
import DeliveryPartnerBottomNavigation from '../../components/DeliveryPartnerBottomNavigation';

// Create a simple dashboard screen for delivery partners
function PartnerDashboardHomeScreen() {
  const { user } = useAuth();
  
  return (
    <View style={styles.dashboardContainer}>
      <Text style={styles.welcomeText}>Welcome, {user?.firstName || 'Partner'}!</Text>
      <Text style={styles.subtitle}>Delivery Partner Dashboard</Text>
      
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>5</Text>
          <Text style={styles.statLabel}>Available Orders</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>3</Text>
          <Text style={styles.statLabel}>Completed Today</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>$120</Text>
          <Text style={styles.statLabel}>Today's Earnings</Text>
        </View>
      </View>
      
      <View style={styles.activityContainer}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {[1, 2, 3].map((item) => (
          <View key={item} style={styles.activityItem}>
            <MaterialIcons name="local-shipping" size={24} color="#4A80F0" />
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>
                Order #{1000 + item} {item === 1 ? 'Assigned' : item === 2 ? 'In Progress' : 'Completed'}
              </Text>
              <Text style={styles.activityTime}>
                {item === 1 ? '10 minutes ago' : item === 2 ? '2 hours ago' : '5 hours ago'}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function DeliveryPartnerDashboardScreen() {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          onPress: () => logout(),
          style: "destructive"
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTitle}>
            <MaterialIcons name="local-shipping" size={24} color="#4A80F0" />
            <View style={styles.headerTitleText}>
              <Text style={styles.headerTitleMain}>Delivery Partner</Text>
              <Text style={styles.headerTitleSub}>Dashboard</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialIcons name="logout" size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {activeTab === 'dashboard' && <PartnerDashboardHomeScreen />}
        {activeTab === 'orders' && <OrderAssignmentScreen />}
        {activeTab === 'tracking' && <TrackingScreen />}
        {activeTab === 'payments' && <PaymentScreen />}
      </View>

      <DeliveryPartnerBottomNavigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e7ff',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitleText: {
    marginLeft: 8,
  },
  headerTitleMain: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  headerTitleSub: {
    fontSize: 12,
    color: '#64748b',
  },
  logoutButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  // Dashboard home screen styles
  dashboardContainer: {
    flex: 1,
    padding: 16,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A80F0',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  activityContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  activityContent: {
    marginLeft: 12,
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  activityTime: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
});