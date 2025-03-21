"use client"

import { useState } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, StatusBar } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons"
import { useAuth } from "../../hooks/useAuth"
import { Card } from "../../components/Card"

type Delivery = {
  id: string
  date: string
  from: string
  to: string
  status: "pending" | "in_transit" | "completed" | "cancelled"
  amount: string
  items: number
}

const SAMPLE_DELIVERIES: Delivery[] = [
  {
    id: "1001",
    date: "Mar 15, 2023",
    from: "123 Main St, San Francisco",
    to: "456 Oak Ave, San Francisco",
    status: "completed",
    amount: "$24.50",
    items: 2,
  },
  {
    id: "1002",
    date: "Mar 10, 2023",
    from: "789 Pine Rd, San Francisco",
    to: "321 Elm St, San Francisco",
    status: "in_transit",
    amount: "$18.75",
    items: 1,
  },
  {
    id: "1003",
    date: "Mar 5, 2023",
    from: "555 Cedar Ln, San Francisco",
    to: "777 Maple Dr, San Francisco",
    status: "completed",
    amount: "$32.00",
    items: 3,
  },
  {
    id: "1004",
    date: "Feb 28, 2023",
    from: "888 Birch Ave, San Francisco",
    to: "999 Walnut St, San Francisco",
    status: "completed",
    amount: "$15.25",
    items: 1,
  },
  {
    id: "1005",
    date: "Feb 20, 2023",
    from: "444 Spruce Rd, San Francisco",
    to: "222 Cherry Ln, San Francisco",
    status: "cancelled",
    amount: "$27.50",
    items: 2,
  },
]

const DeliveryStatusBadge = ({ status }: { status: Delivery["status"] }) => {
  let backgroundColor = ""
  let textColor = ""
  let statusText = ""
  let icon = null

  switch (status) {
    case "pending":
      backgroundColor = "#fef9c3"
      textColor = "#854d0e"
      statusText = "Pending"
      icon = <MaterialIcons name="pending-actions" size={12} color="#854d0e" />
      break
    case "in_transit":
      backgroundColor = "#dbeafe"
      textColor = "#1e40af"
      statusText = "In Transit"
      icon = <FontAwesome5 name="truck" size={12} color="#1e40af" />
      break
    case "completed":
      backgroundColor = "#dcfce7"
      textColor = "#166534"
      statusText = "Completed"
      icon = <MaterialIcons name="check-circle" size={12} color="#166534" />
      break
    case "cancelled":
      backgroundColor = "#fee2e2"
      textColor = "#b91c1c"
      statusText = "Cancelled"
      icon = <MaterialIcons name="cancel" size={12} color="#b91c1c" />
      break
  }

  return (
    <View style={[styles.statusBadge, { backgroundColor }]}>
      {icon}
      <Text style={[styles.statusText, { color: textColor }]}>{statusText}</Text>
    </View>
  )
}

export default function DeliveriesScreen() {
  const { user } = useAuth()
  const [filter, setFilter] = useState<Delivery["status"] | "all">("all")
  const isDeliveryPartner = user?.role === "partner"

  const filteredDeliveries =
    filter === "all" ? SAMPLE_DELIVERIES : SAMPLE_DELIVERIES.filter((delivery) => delivery.status === filter)

  const renderDeliveryItem = ({ item }: { item: Delivery }) => (
    <Card style={styles.deliveryCard}>
      <View style={styles.deliveryHeader}>
        <View>
          <Text style={styles.deliveryId}>Order #{item.id}</Text>
          <Text style={styles.deliveryDate}>{item.date}</Text>
        </View>
        <DeliveryStatusBadge status={item.status} />
      </View>

      <View style={styles.deliveryDetails}>
        <View style={styles.locationContainer}>
          <View style={styles.locationIcon}>
            <MaterialIcons name="location-on" size={16} color="#2A5D3C" />
          </View>
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>From:</Text>
            <Text style={styles.locationText}>{item.from}</Text>
          </View>
        </View>

        <View style={styles.locationContainer}>
          <View style={styles.locationIcon}>
            <MaterialIcons name="flag" size={16} color="#2A5D3C" />
          </View>
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>To:</Text>
            <Text style={styles.locationText}>{item.to}</Text>
          </View>
        </View>
      </View>

      <View style={styles.deliveryFooter}>
        <View style={styles.deliveryInfo}>
          <Text style={styles.deliveryAmount}>{item.amount}</Text>
          <Text style={styles.deliveryItems}>
            {item.items} item{item.items !== 1 ? "s" : ""}
          </Text>
        </View>

        <TouchableOpacity style={styles.detailsButton}>
          <Text style={styles.detailsButtonText}>View Details</Text>
          <MaterialIcons name="arrow-forward-ios" size={12} color="#2A5D3C" />
        </TouchableOpacity>
      </View>
    </Card>
  )

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#2A5D3C" barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{isDeliveryPartner ? "Delivery History" : "My Deliveries"}</Text>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterButton, filter === "all" && styles.activeFilter]}
            onPress={() => setFilter("all")}
          >
            <Text style={[styles.filterText, filter === "all" && styles.activeFilterText]}>All</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filter === "pending" && styles.activeFilter]}
            onPress={() => setFilter("pending")}
          >
            <Text style={[styles.filterText, filter === "pending" && styles.activeFilterText]}>Pending</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filter === "in_transit" && styles.activeFilter]}
            onPress={() => setFilter("in_transit")}
          >
            <Text style={[styles.filterText, filter === "in_transit" && styles.activeFilterText]}>In Transit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filter === "completed" && styles.activeFilter]}
            onPress={() => setFilter("completed")}
          >
            <Text style={[styles.filterText, filter === "completed" && styles.activeFilterText]}>Completed</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filter === "cancelled" && styles.activeFilter]}
            onPress={() => setFilter("cancelled")}
          >
            <Text style={[styles.filterText, filter === "cancelled" && styles.activeFilterText]}>Cancelled</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <FlatList
        data={filteredDeliveries}
        renderItem={renderDeliveryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="box-open" size={50} color="#cbd5e1" />
            <Text style={styles.emptyText}>No deliveries found</Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2A5D3C",
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 15,
    backgroundColor: "#8CD867",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  filterContainer: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e7ff",
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: "#f1f5f9",
  },
  filterText: {
    fontSize: 14,
    color: "#64748b",
  },
  activeFilter: {
    backgroundColor: "#E8F5E0",
  },
  activeFilterText: {
    color: "#2A5D3C",
    fontWeight: "500",
  },
  listContainer: {
    padding: 15,
  },
  deliveryCard: {
    marginBottom: 15,
    borderRadius: 12,
    padding: 15,
    backgroundColor: "#fff",
  },
  deliveryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  deliveryId: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2A5D3C",
    marginBottom: 4,
  },
  deliveryDate: {
    fontSize: 12,
    color: "#64748b",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  deliveryDetails: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  locationContainer: {
    flexDirection: "row",
    marginBottom: 8,
  },
  locationIcon: {
    width: 24,
    alignItems: "center",
    marginRight: 8,
  },
  locationInfo: {
    flex: 1,
    flexDirection: "row",
  },
  locationLabel: {
    width: 40,
    fontSize: 14,
    color: "#64748b",
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: "#1e293b",
  },
  deliveryFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  deliveryInfo: {
    flexDirection: "column",
  },
  deliveryAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2A5D3C",
  },
  deliveryItems: {
    fontSize: 12,
    color: "#64748b",
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  detailsButtonText: {
    fontSize: 12,
    color: "#2A5D3C",
    fontWeight: "500",
    marginRight: 4,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 50,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
  },
})

