"use client"

import React, { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  StatusBar,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons"
import { useAuth } from "../../hooks/useAuth"
import { Card } from "../../components/Card"

type StatisticProps = {
  title: string
  value: string
  icon: React.ReactNode
  change?: string
}

const Statistic = ({ title, value, icon, change }: StatisticProps) => (
  <Card style={styles.statCard}>
    <View style={styles.statHeader}>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
    <View style={styles.statContent}>
      <Text style={styles.statValue}>{value}</Text>
      <View style={styles.statIconContainer}>{icon}</View>
    </View>
    {change && (
      <Text style={styles.statChange}>
        <MaterialIcons name="trending-up" size={14} color="#16a34a" /> {change}
      </Text>
    )}
  </Card>
)

type ActivityItemProps = {
  title: string
  time: string
  status: "completed" | "in-progress" | "pending"
  icon: React.ReactNode
}

const ActivityItem = ({ title, time, status, icon }: ActivityItemProps) => (
  <View style={styles.activityItem}>
    <View style={styles.activityIconContainer}>{icon}</View>
    <View style={styles.activityContent}>
      <Text style={styles.activityTitle}>{title}</Text>
      <Text style={styles.activityTime}>{time}</Text>
    </View>
    <View
      style={[
        styles.activityStatus,
        status === "completed"
          ? styles.statusCompleted
          : status === "in-progress"
            ? styles.statusInProgress
            : styles.statusPending,
      ]}
    >
      <Text
        style={[
          styles.activityStatusText,
          status === "completed"
            ? styles.statusCompletedText
            : status === "in-progress"
              ? styles.statusInProgressText
              : styles.statusPendingText,
        ]}
      >
        {status === "completed" ? "Completed" : status === "in-progress" ? "In Progress" : "Pending"}
      </Text>
    </View>
  </View>
)

export default function DashboardScreen() {
  const { user, logout } = useAuth()
  const [refreshing, setRefreshing] = useState(false)
  const [trackingNumber, setTrackingNumber] = useState("")
  const [stats, setStats] = useState({
    deliveries: "24",
    active: "3",
    earnings: "$342",
  })

  const isDeliveryPartner = user?.userType === "partner"

  const onRefresh = React.useCallback(() => {
    setRefreshing(true)
    // Simulate fetching data
    setTimeout(() => {
      setRefreshing(false)
    }, 1000)
  }, [])

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        onPress: () => logout(),
        style: "destructive",
      },
    ])
  }

  const handleSearch = () => {
    if (trackingNumber.trim()) {
      // Handle tracking search
      Alert.alert("Tracking", `Searching for package: ${trackingNumber}`)
    } else {
      Alert.alert("Error", "Please enter a tracking number")
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#2A5D3C" barStyle="light-content" />

      {/* Top bar with logout */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name || "Paul Smithers"}</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialIcons name="logout" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileButton}>
            <MaterialIcons name="account-circle" size={40} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#8CD867"]} />}
      >
        {/* Tracking Card */}
        <Card style={styles.trackingCard}>
          <Text style={styles.trackingTitle}>Track your package</Text>
          <Text style={styles.trackingSubtitle}>Enter your package tracking number</Text>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Enter tracking number"
              value={trackingNumber}
              onChangeText={setTrackingNumber}
              placeholderTextColor="#a3a3a3"
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
              <MaterialIcons name="search" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <Statistic
            title="Total Deliveries"
            value={stats.deliveries}
            icon={<FontAwesome5 name="box" size={20} color="#2A5D3C" />}
            change="12% from last month"
          />
          <Statistic
            title={isDeliveryPartner ? "Active Orders" : "Active Shipments"}
            value={stats.active}
            icon={<FontAwesome5 name="shipping-fast" size={20} color="#2A5D3C" />}
          />
          <Statistic
            title={isDeliveryPartner ? "Total Earnings" : "Total Spent"}
            value={stats.earnings}
            icon={<MaterialIcons name="attach-money" size={24} color="#2A5D3C" />}
            change="8% from last month"
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsGrid}>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionIconContainer}>
                <FontAwesome5 name="truck" size={24} color="#2A5D3C" />
              </View>
              <Text style={styles.actionText}>Send package</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionIconContainer}>
                <FontAwesome5 name="box" size={24} color="#2A5D3C" />
              </View>
              <Text style={styles.actionText}>My packages</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionIconContainer}>
                <MaterialIcons name="location-on" size={24} color="#2A5D3C" />
              </View>
              <Text style={styles.actionText}>Live tracking</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionIconContainer}>
                <MaterialIcons name="receipt" size={24} color="#2A5D3C" />
              </View>
              <Text style={styles.actionText}>Billing</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.recentActivityContainer}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <Card style={styles.activityCard}>
            <ActivityItem
              title="Order #1001 Delivered"
              time="2 hours ago"
              status="completed"
              icon={<FontAwesome5 name="box" size={16} color="#2A5D3C" />}
            />
            <ActivityItem
              title="Order #1002 In Transit"
              time="Yesterday"
              status="in-progress"
              icon={<FontAwesome5 name="truck" size={16} color="#2A5D3C" />}
            />
            <ActivityItem
              title="Order #1003 Accepted"
              time="2 days ago"
              status="pending"
              icon={<MaterialIcons name="pending-actions" size={16} color="#2A5D3C" />}
            />
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All Activity</Text>
              <MaterialIcons name="arrow-forward" size={16} color="#2A5D3C" />
            </TouchableOpacity>
          </Card>
        </View>

        {/* Earnings Overview (for delivery partners) */}
        {isDeliveryPartner && (
          <View style={styles.earningsContainer}>
            <Text style={styles.sectionTitle}>Earnings Overview</Text>
            <Card style={styles.earningsCard}>
              <View style={styles.earningsSummary}>
                <View style={styles.earningsItem}>
                  <Text style={styles.earningsLabel}>Today</Text>
                  <Text style={styles.earningsValue}>$42</Text>
                </View>
                <View style={styles.earningsDivider} />
                <View style={styles.earningsItem}>
                  <Text style={styles.earningsLabel}>This Week</Text>
                  <Text style={styles.earningsValue}>$185</Text>
                </View>
                <View style={styles.earningsDivider} />
                <View style={styles.earningsItem}>
                  <Text style={styles.earningsLabel}>This Month</Text>
                  <Text style={styles.earningsValue}>$342</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.withdrawButton}>
                <Text style={styles.withdrawButtonText}>Withdraw Earnings</Text>
              </TouchableOpacity>
            </Card>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2A5D3C",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#2A5D3C",
  },
  greeting: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.8,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileButton: {
    padding: 5,
  },
  logoutButton: {
    padding: 8,
    marginRight: 10,
  },
  scrollView: {
    flex: 1,
    padding: 15,
  },
  trackingCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  trackingTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2A5D3C",
    marginBottom: 5,
  },
  trackingSubtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    backgroundColor: "#f0f0f0",
    borderRadius: 25,
    paddingHorizontal: 20,
    marginRight: 10,
    fontSize: 16,
  },
  searchButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#8CD867",
    justifyContent: "center",
    alignItems: "center",
  },
  statsContainer: {
    marginBottom: 20,
  },
  statCard: {
    marginBottom: 15,
    padding: 15,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  statHeader: {
    marginBottom: 10,
  },
  statTitle: {
    fontSize: 14,
    color: "#666",
  },
  statContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2A5D3C",
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E8F5E0",
    justifyContent: "center",
    alignItems: "center",
  },
  statChange: {
    marginTop: 8,
    fontSize: 12,
    color: "#16a34a",
  },
  actionsGrid: {
    marginBottom: 20,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  actionButton: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    height: 120,
  },
  actionIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#E8F5E0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  actionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2A5D3C",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#fff",
  },
  recentActivityContainer: {
    marginBottom: 20,
  },
  activityCard: {
    padding: 0,
    borderRadius: 12,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  activityIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E8F5E0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2A5D3C",
  },
  activityTime: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  activityStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusCompleted: {
    backgroundColor: "#dcfce7",
  },
  statusInProgress: {
    backgroundColor: "#dbeafe",
  },
  statusPending: {
    backgroundColor: "#fef9c3",
  },
  activityStatusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  statusCompletedText: {
    color: "#166534",
  },
  statusInProgressText: {
    color: "#1e40af",
  },
  statusPendingText: {
    color: "#854d0e",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2A5D3C",
    marginRight: 5,
  },
  earningsContainer: {
    marginBottom: 30,
  },
  earningsCard: {
    padding: 15,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  earningsSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  earningsItem: {
    flex: 1,
    alignItems: "center",
  },
  earningsLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  earningsValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2A5D3C",
  },
  earningsDivider: {
    width: 1,
    backgroundColor: "#e2e8f0",
  },
  withdrawButton: {
    backgroundColor: "#8CD867",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  withdrawButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
})

