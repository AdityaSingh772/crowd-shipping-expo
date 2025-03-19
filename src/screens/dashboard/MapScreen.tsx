"use client"

import { useState, useEffect, useRef } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert, StatusBar } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, type Region } from "react-native-maps"
import * as Location from "expo-location"
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons"
import { useAuth } from "../../hooks/useAuth"
import { Card } from "../../components/Card"

type DeliveryLocation = {
  id: number
  latitude: number
  longitude: number
  size: "Small" | "Medium" | "Large"
  address: string
}

type RoutePoint = {
  latitude: number
  longitude: number
}

export default function MapScreen() {
  const { user } = useAuth()
  const [location, setLocation] = useState<Location.LocationObject | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [selectedDeliveries, setSelectedDeliveries] = useState<number[]>([])
  const [route, setRoute] = useState<RoutePoint[]>([])
  const [deliveryLocations, setDeliveryLocations] = useState<DeliveryLocation[]>([
    { id: 1, latitude: 37.78825, longitude: -122.4324, size: "Small", address: "123 Main St, San Francisco" },
    { id: 2, latitude: 37.79125, longitude: -122.4354, size: "Medium", address: "456 Market St, San Francisco" },
    { id: 3, latitude: 37.78525, longitude: -122.4274, size: "Large", address: "789 Mission St, San Francisco" },
    { id: 4, latitude: 37.78925, longitude: -122.4224, size: "Small", address: "101 Howard St, San Francisco" },
  ])
  const mapRef = useRef<MapView>(null)
  const isDeliveryPartner = user?.userType === "partner"

  useEffect(() => {
    ;(async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied")
        return
      }

      const location = await Location.getCurrentPositionAsync({})
      setLocation(location)
    })()
  }, [])

  const toggleDeliverySelection = (id: number) => {
    if (selectedDeliveries.includes(id)) {
      setSelectedDeliveries(selectedDeliveries.filter((deliveryId) => deliveryId !== id))
    } else {
      setSelectedDeliveries([...selectedDeliveries, id])
    }
  }

  const calculateRoute = () => {
    if (!location) return
    const selectedLocations = deliveryLocations.filter((delivery) => selectedDeliveries.includes(delivery.id))

    if (selectedLocations.length === 0) return
    const routePoints = [
      {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      },
      ...selectedLocations.map((delivery) => ({
        latitude: delivery.latitude,
        longitude: delivery.longitude,
      })),
    ]

    setRoute(routePoints)

    // Fit map to show the entire route
    if (mapRef.current) {
      mapRef.current.fitToCoordinates(routePoints, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      })
    }
  }

  const addDeliveryLocation = (event: any) => {
    if (isDeliveryPartner) {
      const { coordinate } = event.nativeEvent

      const newId = Math.max(...deliveryLocations.map((d) => d.id), 0) + 1
      const newDelivery: DeliveryLocation = {
        id: newId,
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        size: "Medium", // Default size
        address: `New Location #${newId}`, // In a real app, you would use reverse geocoding
      }

      setDeliveryLocations([...deliveryLocations, newDelivery])
      Alert.alert("Success", "Delivery location added!")
    }
  }

  const initialRegion: Region | undefined = location
    ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }
    : undefined

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#2A5D3C" barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{isDeliveryPartner ? "Mark Delivery Locations" : "Find Deliveries"}</Text>
      </View>

      {errorMsg ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      ) : !location ? (
        <View style={styles.center}>
          <Text style={styles.loadingText}>Loading location...</Text>
        </View>
      ) : (
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={initialRegion}
            onLongPress={isDeliveryPartner ? addDeliveryLocation : undefined}
            customMapStyle={[
              {
                elementType: "geometry",
                stylers: [
                  {
                    color: "#f5f5f5",
                  },
                ],
              },
              {
                elementType: "labels.icon",
                stylers: [
                  {
                    visibility: "off",
                  },
                ],
              },
              {
                elementType: "labels.text.fill",
                stylers: [
                  {
                    color: "#616161",
                  },
                ],
              },
              {
                featureType: "administrative.land_parcel",
                elementType: "labels.text.fill",
                stylers: [
                  {
                    color: "#bdbdbd",
                  },
                ],
              },
              {
                featureType: "poi",
                elementType: "geometry",
                stylers: [
                  {
                    color: "#eeeeee",
                  },
                ],
              },
              {
                featureType: "poi",
                elementType: "labels.text.fill",
                stylers: [
                  {
                    color: "#757575",
                  },
                ],
              },
              {
                featureType: "poi.park",
                elementType: "geometry",
                stylers: [
                  {
                    color: "#e5e5e5",
                  },
                ],
              },
              {
                featureType: "poi.park",
                elementType: "labels.text.fill",
                stylers: [
                  {
                    color: "#9e9e9e",
                  },
                ],
              },
              {
                featureType: "road",
                elementType: "geometry",
                stylers: [
                  {
                    color: "#ffffff",
                  },
                ],
              },
              {
                featureType: "road.arterial",
                elementType: "labels.text.fill",
                stylers: [
                  {
                    color: "#757575",
                  },
                ],
              },
              {
                featureType: "road.highway",
                elementType: "geometry",
                stylers: [
                  {
                    color: "#dadada",
                  },
                ],
              },
              {
                featureType: "road.highway",
                elementType: "labels.text.fill",
                stylers: [
                  {
                    color: "#616161",
                  },
                ],
              },
              {
                featureType: "road.local",
                elementType: "labels.text.fill",
                stylers: [
                  {
                    color: "#9e9e9e",
                  },
                ],
              },
              {
                featureType: "transit.line",
                elementType: "geometry",
                stylers: [
                  {
                    color: "#e5e5e5",
                  },
                ],
              },
              {
                featureType: "transit.station",
                elementType: "geometry",
                stylers: [
                  {
                    color: "#eeeeee",
                  },
                ],
              },
              {
                featureType: "water",
                elementType: "geometry",
                stylers: [
                  {
                    color: "#c9c9c9",
                  },
                ],
              },
              {
                featureType: "water",
                elementType: "labels.text.fill",
                stylers: [
                  {
                    color: "#9e9e9e",
                  },
                ],
              },
            ]}
          >
            {/* Current location marker */}
            <Marker
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              title="You are here"
              pinColor="#2A5D3C"
            >
              <View style={styles.currentLocationMarker}>
                <MaterialIcons name="my-location" size={16} color="#fff" />
              </View>
            </Marker>

            {/* Delivery locations */}
            {deliveryLocations.map((delivery) => (
              <Marker
                key={delivery.id}
                coordinate={{
                  latitude: delivery.latitude,
                  longitude: delivery.longitude,
                }}
                title={`Delivery #${delivery.id}`}
                description={`Size: ${delivery.size}`}
                pinColor={selectedDeliveries.includes(delivery.id) ? "#8CD867" : "#ef4444"}
                onPress={() => !isDeliveryPartner && toggleDeliverySelection(delivery.id)}
              >
                <View
                  style={[styles.deliveryMarker, selectedDeliveries.includes(delivery.id) ? styles.selectedMarker : {}]}
                >
                  <FontAwesome5 name="box" size={12} color="#fff" />
                </View>
              </Marker>
            ))}

            {/* Route line */}
            {route.length > 0 && <Polyline coordinates={route} strokeWidth={4} strokeColor="#8CD867" />}
          </MapView>

          {isDeliveryPartner ? (
            <View style={styles.instructionPanel}>
              <Text style={styles.instructionText}>Long press on the map to mark delivery locations</Text>
            </View>
          ) : (
            <View style={styles.actionPanel}>
              <Text style={styles.actionTitle}>Selected Deliveries: {selectedDeliveries.length}</Text>
              <TouchableOpacity
                style={[styles.actionButton, selectedDeliveries.length === 0 && styles.disabledButton]}
                onPress={calculateRoute}
                disabled={selectedDeliveries.length === 0}
              >
                <Text style={styles.actionButtonText}>Calculate Route</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.deliveriesList}>
            <Text style={styles.deliveriesTitle}>
              {isDeliveryPartner ? "Your Marked Locations" : "Available Deliveries"}
            </Text>

            {deliveryLocations.map((delivery) => (
              <Card key={delivery.id} style={styles.deliveryCard}>
                <View style={styles.deliveryCardContent}>
                  <View style={styles.deliveryInfo}>
                    <Text style={styles.deliveryId}>Delivery #{delivery.id}</Text>
                    <Text style={styles.deliveryAddress}>{delivery.address}</Text>
                    <Text style={styles.deliverySize}>Size: {delivery.size}</Text>
                  </View>

                  {!isDeliveryPartner && (
                    <TouchableOpacity
                      style={[styles.selectButton, selectedDeliveries.includes(delivery.id) && styles.selectedButton]}
                      onPress={() => toggleDeliverySelection(delivery.id)}
                    >
                      <Text
                        style={[
                          styles.selectButtonText,
                          selectedDeliveries.includes(delivery.id) && styles.selectedButtonText,
                        ]}
                      >
                        {selectedDeliveries.includes(delivery.id) ? "Selected" : "Select"}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {isDeliveryPartner && (
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => Alert.alert("Edit", `Edit delivery #${delivery.id}`)}
                    >
                      <MaterialIcons name="edit" size={16} color="#2A5D3C" />
                    </TouchableOpacity>
                  )}
                </View>
              </Card>
            ))}
          </View>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2A5D36",
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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2A5D3C",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 16,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
  },
  mapContainer: {
    flex: 1,
    backgroundColor: "#2A5D3C",
  },
  map: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height * 0.5,
  },
  currentLocationMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2A5D3C",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  deliveryMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  selectedMarker: {
    backgroundColor: "#8CD867",
  },
  actionPanel: {
    position: "absolute",
    top: Dimensions.get("window").height * 0.5 - 70,
    left: 20,
    right: 20,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#2A5D3C",
  },
  actionButton: {
    backgroundColor: "#8CD867",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  disabledButton: {
    backgroundColor: "#94a3b8",
  },
  instructionPanel: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  instructionText: {
    textAlign: "center",
    fontSize: 14,
    color: "#2A5D3C",
  },
  deliveriesList: {
    flex: 1,
    padding: 15,
    marginTop: Dimensions.get("window").height * 0.5,
  },
  deliveriesTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#fff",
  },
  deliveryCard: {
    marginBottom: 10,
    borderRadius: 12,
    padding: 0,
    backgroundColor: "#fff",
  },
  deliveryCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
  },
  deliveryInfo: {
    flex: 1,
  },
  deliveryId: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2A5D3C",
    marginBottom: 4,
  },
  deliveryAddress: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 4,
  },
  deliverySize: {
    fontSize: 12,
    color: "#94a3b8",
  },
  selectButton: {
    backgroundColor: "#E8F5E0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  selectButtonText: {
    color: "#2A5D3C",
    fontWeight: "500",
    fontSize: 12,
  },
  selectedButton: {
    backgroundColor: "#8CD867",
  },
  selectedButtonText: {
    color: "#fff",
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E8F5E0",
    justifyContent: "center",
    alignItems: "center",
  },
})

