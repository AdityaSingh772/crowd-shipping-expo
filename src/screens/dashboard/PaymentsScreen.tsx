"use client"

import { useState } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, TextInput } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons"
import { useAuth } from "../../hooks/useAuth"
import { Card } from "../../components/Card"

type Transaction = {
  id: string
  type: "earning" | "withdrawal" | "payment"
  description: string
  amount: string
  date: string
  status: "completed" | "pending" | "failed"
  from?: string
  to?: string
}

const SAMPLE_TRANSACTIONS: Transaction[] = [
  {
    id: "1",
    type: "earning",
    description: "Order #1001 Completed - Paid",
    amount: "+$24.50",
    date: "Mar 15, 2023",
    status: "completed",
    from: "Denmark",
    to: "Germany",
  },
  {
    id: "2",
    type: "withdrawal",
    description: "Withdrawal to Bank",
    amount: "-$50.00",
    date: "Mar 12, 2023",
    status: "completed",
    from: "Account Balance",
    to: "Bank Account",
  },
  {
    id: "3",
    type: "earning",
    description: "Order #1002 Completed",
    amount: "+$18.75",
    date: "Mar 10, 2023",
    status: "completed",
    from: "Sweden",
    to: "Denmark",
  },
  {
    id: "4",
    type: "earning",
    description: "Order #1003 Completed",
    amount: "+$32.00",
    date: "Mar 5, 2023",
    status: "completed",
    from: "Norway",
    to: "Finland",
  },
  {
    id: "5",
    type: "payment",
    description: "Payment for Order #1004",
    amount: "-$15.25",
    date: "Feb 28, 2023",
    status: "completed",
    from: "Credit Card",
    to: "Vendor",
  },
  {
    id: "6",
    type: "withdrawal",
    description: "Withdrawal to Bank",
    amount: "-$70.00",
    date: "Feb 20, 2023",
    status: "completed",
    from: "Account Balance",
    to: "Bank Account",
  },
]

const TransactionItem = ({ transaction }: { transaction: Transaction }) => {
  let iconName: keyof typeof MaterialIcons.glyphMap = "payment"
  let iconColor = ""
  let amountColor = ""

  switch (transaction.type) {
    case "earning":
      iconName = "arrow-downward"
      iconColor = "#16a34a"
      amountColor = "#16a34a"
      break
    case "withdrawal":
      iconName = "arrow-upward"
      iconColor = "#ef4444"
      amountColor = "#ef4444"
      break
    case "payment":
      iconName = "payment"
      iconColor = "#ef4444"
      amountColor = "#ef4444"
      break
  }

  return (
    <View style={styles.transactionItem}>
      <View style={[styles.transactionIcon, { backgroundColor: `${iconColor}20` }]}>
        <MaterialIcons name={iconName} size={16} color={iconColor} />
      </View>
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionTitle}>{transaction.description}</Text>
        <Text style={styles.transactionDate}>{transaction.date}</Text>
        {(transaction.from || transaction.to) && (
          <View style={styles.routeContainer}>
            {transaction.from && <Text style={styles.routeText}>From: {transaction.from}</Text>}
            {transaction.to && <Text style={styles.routeText}>To: {transaction.to}</Text>}
          </View>
        )}
      </View>
      <Text style={[styles.transactionAmount, { color: amountColor }]}>{transaction.amount}</Text>
    </View>
  )
}

export default function PaymentsScreen() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("transactions")
  const isDeliveryPartner = user?.userType === "partner"
  const [fromLocation, setFromLocation] = useState("Denmark")
  const [toLocation, setToLocation] = useState("Germany")

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#2A5D3C" barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{isDeliveryPartner ? "Earnings & Payments" : "Payment History"}</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceTitle}>{isDeliveryPartner ? "Available Balance" : "Total Spent"}</Text>
          <Text style={styles.balanceAmount}>{isDeliveryPartner ? "$125.25" : "$90.50"}</Text>

          {isDeliveryPartner && (
            <TouchableOpacity style={styles.withdrawButton}>
              <Text style={styles.withdrawButtonText}>Withdraw Funds</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* From/To Location Section */}
        <Card style={styles.locationCard}>
          <Text style={styles.locationTitle}>Transfer Details</Text>

          <View style={styles.locationField}>
            <Text style={styles.locationLabel}>Sending from</Text>
            <View style={styles.locationInputContainer}>
              <TextInput
                style={styles.locationInput}
                value={fromLocation}
                onChangeText={setFromLocation}
                placeholder="Origin country"
              />
              <MaterialIcons name="arrow-drop-down" size={24} color="#2A5D3C" />
            </View>
          </View>

          <View style={styles.locationField}>
            <Text style={styles.locationLabel}>Sending to</Text>
            <View style={styles.locationInputContainer}>
              <TextInput
                style={styles.locationInput}
                value={toLocation}
                onChangeText={setToLocation}
                placeholder="Destination country"
              />
              <MaterialIcons name="arrow-drop-down" size={24} color="#2A5D3C" />
            </View>
          </View>
        </Card>

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "transactions" && styles.activeTab]}
            onPress={() => setActiveTab("transactions")}
          >
            <Text style={[styles.tabText, activeTab === "transactions" && styles.activeTabText]}>Transactions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "methods" && styles.activeTab]}
            onPress={() => setActiveTab("methods")}
          >
            <Text style={[styles.tabText, activeTab === "methods" && styles.activeTabText]}>Payment Methods</Text>
          </TouchableOpacity>
        </View>

        {activeTab === "transactions" ? (
          <Card style={styles.transactionsCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Transaction History</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {SAMPLE_TRANSACTIONS.map((transaction) => (
              <TransactionItem key={transaction.id} transaction={transaction} />
            ))}
          </Card>
        ) : (
          <Card style={styles.methodsCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Payment Methods</Text>
              <TouchableOpacity>
                <MaterialIcons name="add" size={20} color="#2A5D3C" />
              </TouchableOpacity>
            </View>

            <View style={styles.paymentMethod}>
              <View style={styles.paymentMethodIcon}>
                <FontAwesome5 name="cc-visa" size={20} color="#1a1f71" />
              </View>
              <View style={styles.paymentMethodDetails}>
                <Text style={styles.paymentMethodTitle}>Visa ending in 4242</Text>
                <Text style={styles.paymentMethodExpiry}>Expires 04/25</Text>
              </View>
              <TouchableOpacity style={styles.editButton}>
                <MaterialIcons name="more-vert" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.paymentMethod}>
              <View style={styles.paymentMethodIcon}>
                <FontAwesome5 name="cc-mastercard" size={20} color="#eb001b" />
              </View>
              <View style={styles.paymentMethodDetails}>
                <Text style={styles.paymentMethodTitle}>Mastercard ending in 5555</Text>
                <Text style={styles.paymentMethodExpiry}>Expires 08/24</Text>
              </View>
              <TouchableOpacity style={styles.editButton}>
                <MaterialIcons name="more-vert" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.addMethodButton}>
              <MaterialIcons name="add" size={20} color="#2A5D3C" />
              <Text style={styles.addMethodText}>Add Payment Method</Text>
            </TouchableOpacity>
          </Card>
        )}

        {isDeliveryPartner && (
          <Card style={styles.earningsSummaryCard}>
            <Text style={styles.cardTitle}>Earnings Summary</Text>

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
          </Card>
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
  content: {
    flex: 1,
    padding: 15,
  },
  balanceCard: {
    backgroundColor: "#2A5D3C",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  balanceTitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
  },
  withdrawButton: {
    backgroundColor: "#8CD867",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  withdrawButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  locationCard: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    backgroundColor: "#fff",
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2A5D3C",
    marginBottom: 15,
  },
  locationField: {
    marginBottom: 15,
  },
  locationLabel: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 5,
  },
  locationInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  locationInput: {
    flex: 1,
    height: 45,
    fontSize: 16,
    color: "#2A5D3C",
  },
  tabsContainer: {
    flexDirection: "row",
    marginBottom: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#E8F5E0",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748b",
  },
  activeTabText: {
    color: "#2A5D3C",
  },
  transactionsCard: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    backgroundColor: "#fff",
  },
  methodsCard: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    backgroundColor: "#fff",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2A5D3C",
  },
  viewAllText: {
    fontSize: 14,
    color: "#2A5D3C",
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  transactionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1e293b",
  },
  transactionDate: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  routeContainer: {
    marginTop: 4,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  routeText: {
    fontSize: 11,
    color: "#64748b",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: "600",
  },
  paymentMethod: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  paymentMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  paymentMethodDetails: {
    flex: 1,
  },
  paymentMethodTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1e293b",
  },
  paymentMethodExpiry: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  editButton: {
    padding: 5,
  },
  addMethodButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F5E0",
    borderRadius: 8,
    padding: 12,
    marginTop: 15,
  },
  addMethodText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2A5D3C",
    marginLeft: 8,
  },
  earningsSummaryCard: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    backgroundColor: "#fff",
  },
  earningsSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  earningsItem: {
    flex: 1,
    alignItems: "center",
  },
  earningsLabel: {
    fontSize: 14,
    color: "#64748b",
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
})

