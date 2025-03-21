"use client"


import React, { useState } from "react"
import {
 View,
 Text,
 StyleSheet,
 TextInput,
 TouchableOpacity,
 ScrollView,
 ActivityIndicator,
 FlatList,
 Modal,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { MaterialIcons } from "@expo/vector-icons"
import { COLORS, SIZES } from "../../config/constant"
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps"


// Mock data for parcels
const MOCK_PARCELS = [
 {
   id: "p1",
   sender: "John Smith",
   pickupLocation: {
     address: "123 Main St, New York, NY",
     latitude: 40.7128,
     longitude: -74.006,
   },
   deliveryLocation: {
     address: "456 Park Ave, New York, NY",
     latitude: 40.758,
     longitude: -73.9855,
   },
   packageDetails: {
     weight: "2.5 kg",
     dimensions: "30 x 20 x 15 cm",
     description: "Electronics - Handle with care",
   },
   compensation: 15.5,
   distance: 3.2,
   estimatedTime: 15,
 },
 {
   id: "p2",
   sender: "Sarah Johnson",
   pickupLocation: {
     address: "789 Broadway, New York, NY",
     latitude: 40.7338,
     longitude: -73.9956,
   },
   deliveryLocation: {
     address: "101 5th Ave, New York, NY",
     latitude: 40.7448,
     longitude: -73.9867,
   },
   packageDetails: {
     weight: "1.2 kg",
     dimensions: "20 x 15 x 10 cm",
     description: "Books",
   },
   compensation: 12.75,
   distance: 2.1,
   estimatedTime: 10,
 },
 {
   id: "p3",
   sender: "Michael Brown",
   pickupLocation: {
     address: "222 E 44th St, New York, NY",
     latitude: 40.7513,
     longitude: -73.9722,
   },
   deliveryLocation: {
     address: "350 5th Ave, New York, NY",
     latitude: 40.7484,
     longitude: -73.9857,
   },
   packageDetails: {
     weight: "3.7 kg",
     dimensions: "40 x 30 x 25 cm",
     description: "Clothing items",
   },
   compensation: 18.25,
   distance: 2.8,
   estimatedTime: 12,
 },
 {
   id: "p4",
   sender: "Emily Davis",
   pickupLocation: {
     address: "175 5th Ave, New York, NY",
     latitude: 40.741,
     longitude: -73.9896,
   },
   deliveryLocation: {
     address: "30 Rockefeller Plaza, New York, NY",
     latitude: 40.7587,
     longitude: -73.9787,
   },
   packageDetails: {
     weight: "1.8 kg",
     dimensions: "25 x 20 x 15 cm",
     description: "Gift package - Fragile",
   },
   compensation: 14.5,
   distance: 2.5,
   estimatedTime: 14,
 },
 {
   id: "p5",
   sender: "Robert Wilson",
   pickupLocation: {
     address: "11 Madison Ave, New York, NY",
     latitude: 40.7415,
     longitude: -73.9872,
   },
   deliveryLocation: {
     address: "1 World Trade Center, New York, NY",
     latitude: 40.7127,
     longitude: -74.0134,
   },
   packageDetails: {
     weight: "4.2 kg",
     dimensions: "45 x 35 x 25 cm",
     description: "Office supplies",
   },
   compensation: 22.0,
   distance: 4.5,
   estimatedTime: 20,
 },
]


// Carrier's current location (mock)
const CARRIER_LOCATION = {
 latitude: 40.758,
 longitude: -73.97,
 address: "Current Location",
}


// Carrier's destination (will be filled by user)
const DEFAULT_DESTINATION = {
 latitude: 40.7127,
 longitude: -74.0134,
 address: "Destination",
}


const CarrierMatchScreen = () => {
 const [step, setStep] = useState(1) // 1: Form, 2: Matches, 3: Map
 const [loading, setLoading] = useState(false)
 const [fromLocation, setFromLocation] = useState(CARRIER_LOCATION.address)
 const [toLocation, setToLocation] = useState("")
 const [matchedParcels, setMatchedParcels] = useState<typeof MOCK_PARCELS>([])
 const [selectedParcels, setSelectedParcels] = useState<string[]>([])
 const [destination, setDestination] = useState(DEFAULT_DESTINATION)
 const [useCurrentLocation, setUseCurrentLocation] = useState(true)
 const [mapVisible, setMapVisible] = useState(false)
 const [routeCoordinates, setRouteCoordinates] = useState<{latitude: number, longitude: number}[]>([])


 // Handle form submission
 const handleFindMatches = () => {
   if (!toLocation) {
     alert("Please enter your destination")
     return
   }


   setLoading(true)


   // Simulate API call delay
   setTimeout(() => {
     // Filter parcels that are along the route (in a real app, this would be done by the backend)
     setMatchedParcels(MOCK_PARCELS)
     setStep(2)
     setLoading(false)
   }, 1500)
 }


 // Toggle parcel selection
 const toggleParcelSelection = (parcelId : any) => {
   if (selectedParcels.includes(parcelId)) {
     setSelectedParcels(selectedParcels.filter((id) => id !== parcelId))
   } else {
     setSelectedParcels([...selectedParcels, parcelId])
   }
 }


 // Handle navigation button click
 const handleNavigate = () => {
   if (selectedParcels.length === 0) {
     alert("Please select at least one parcel")
     return
   }


   // Get selected parcels data
   const parcelsToDeliver = MOCK_PARCELS.filter((parcel) => selectedParcels.includes(parcel.id))


   // Create a route (in a real app, this would use a routing algorithm)
   // For now, we'll create a simple route from carrier to each pickup, then to each delivery, then to destination
   const route = [
     CARRIER_LOCATION,
     ...parcelsToDeliver.map((p) => p.pickupLocation),
     ...parcelsToDeliver.map((p) => p.deliveryLocation),
     { latitude: destination.latitude, longitude: destination.longitude },
   ]


   setRouteCoordinates(route)
   setMapVisible(true)
 }


 // Render the initial form
 const renderForm = () => (
   <View style={styles.formContainer}>
     <Text style={styles.sectionTitle}>Find Parcels Along Your Route</Text>


     <View style={styles.inputContainer}>
       <Text style={styles.inputLabel}>From Location</Text>
       <View style={styles.locationInputContainer}>
         <View style={styles.inputWrapper}>
           <MaterialIcons name="my-location" size={20} color="#64748b" style={styles.inputIcon} />
           <TextInput
             style={[styles.input, useCurrentLocation && styles.disabledInput]}
             placeholder="Your current location"
             value={fromLocation}
             onChangeText={setFromLocation}
             editable={!useCurrentLocation}
           />
         </View>
         <TouchableOpacity
           style={styles.useLocationButton}
           onPress={() => {
             setUseCurrentLocation(!useCurrentLocation)
             if (!useCurrentLocation) {
               setFromLocation(CARRIER_LOCATION.address)
             }
           }}
         >
           <MaterialIcons
             name={useCurrentLocation ? "check-box" : "check-box-outline-blank"}
             size={24}
             color={COLORS.PRIMARY}
           />
           <Text style={styles.useLocationText}>Use current</Text>
         </TouchableOpacity>
       </View>
     </View>


     <View style={styles.inputContainer}>
       <Text style={styles.inputLabel}>To Location</Text>
       <View style={styles.inputWrapper}>
         <MaterialIcons name="location-on" size={20} color="#64748b" style={styles.inputIcon} />
         <TextInput
           style={styles.input}
           placeholder="Enter your destination"
           value={toLocation}
           onChangeText={setToLocation}
         />
       </View>
     </View>


     <TouchableOpacity
       style={[styles.matchButton, !toLocation && styles.disabledButton]}
       onPress={handleFindMatches}
       disabled={loading || !toLocation}
     >
       {loading ? (
         <ActivityIndicator color="#ffffff" size="small" />
       ) : (
         <>
           <MaterialIcons name="search" size={20} color="#ffffff" style={styles.buttonIcon} />
           <Text style={styles.matchButtonText}>Find Matching Parcels</Text>
         </>
       )}
     </TouchableOpacity>
   </View>
 )


 // Render the matched parcels list
 const renderMatchedParcels = () => (
   <View style={styles.matchesContainer}>
     <View style={styles.matchesHeader}>
       <Text style={styles.sectionTitle}>Matched Parcels</Text>
       <Text style={styles.matchesSubtitle}>Select parcels to deliver along your route</Text>
     </View>


     {matchedParcels.length === 0 ? (
       <View style={styles.noMatchesContainer}>
         <MaterialIcons name="inbox" size={48} color={COLORS.SECONDARY} />
         <Text style={styles.noMatchesText}>No matching parcels found</Text>
       </View>
     ) : (
       <>
         <FlatList
           data={matchedParcels}
           keyExtractor={(item) => item.id}
           renderItem={({ item }) => (
             <TouchableOpacity
               style={[styles.parcelCard, selectedParcels.includes(item.id) && styles.selectedParcelCard]}
               onPress={() => toggleParcelSelection(item.id)}
             >
               <View style={styles.parcelHeader}>
                 <View style={styles.parcelSenderContainer}>
                   <MaterialIcons
                     name={selectedParcels.includes(item.id) ? "check-circle" : "radio-button-unchecked"}
                     size={24}
                     color={selectedParcels.includes(item.id) ? COLORS.PRIMARY : COLORS.SECONDARY}
                     style={styles.checkIcon}
                   />
                   <Text style={styles.parcelSender}>{item.sender}</Text>
                 </View>
                 <Text style={styles.parcelCompensation}>${item.compensation.toFixed(2)}</Text>
               </View>


               <View style={styles.parcelDetails}>
                 <View style={styles.locationDetail}>
                   <MaterialIcons name="location-on" size={20} color={COLORS.PRIMARY} />
                   <View style={styles.locationTextContainer}>
                     <Text style={styles.locationLabel}>Pickup</Text>
                     <Text style={styles.locationAddress} numberOfLines={1}>
                       {item.pickupLocation.address}
                     </Text>
                   </View>
                 </View>


                 <View style={styles.locationDetail}>
                   <MaterialIcons name="flag" size={20} color={COLORS.ERROR} />
                   <View style={styles.locationTextContainer}>
                     <Text style={styles.locationLabel}>Delivery</Text>
                     <Text style={styles.locationAddress} numberOfLines={1}>
                       {item.deliveryLocation.address}
                     </Text>
                   </View>
                 </View>
               </View>


               <View style={styles.parcelFooter}>
                 <View style={styles.parcelStat}>
                   <MaterialIcons name="straighten" size={16} color={COLORS.SECONDARY} />
                   <Text style={styles.parcelStatText}>{item.packageDetails.dimensions}</Text>
                 </View>


                 <View style={styles.parcelStat}>
                   <MaterialIcons name="fitness-center" size={16} color={COLORS.SECONDARY} />
                   <Text style={styles.parcelStatText}>{item.packageDetails.weight}</Text>
                 </View>


                 <View style={styles.parcelStat}>
                   <MaterialIcons name="directions-car" size={16} color={COLORS.SECONDARY} />
                   <Text style={styles.parcelStatText}>{item.distance} km</Text>
                 </View>


                 <View style={styles.parcelStat}>
                   <MaterialIcons name="access-time" size={16} color={COLORS.SECONDARY} />
                   <Text style={styles.parcelStatText}>{item.estimatedTime} min</Text>
                 </View>
               </View>
             </TouchableOpacity>
           )}
           contentContainerStyle={styles.parcelsList}
         />


         <View style={styles.navigateButtonContainer}>
           <TouchableOpacity
             style={[styles.navigateButton, selectedParcels.length === 0 && styles.disabledButton]}
             onPress={handleNavigate}
             disabled={selectedParcels.length === 0}
           >
             <MaterialIcons name="navigation" size={20} color="#ffffff" style={styles.buttonIcon} />
             <Text style={styles.navigateButtonText}>
               Navigate with {selectedParcels.length} Parcel{selectedParcels.length !== 1 ? "s" : ""}
             </Text>
           </TouchableOpacity>


           <TouchableOpacity
             style={styles.backButton}
             onPress={() => {
               setStep(1)
               setSelectedParcels([])
             }}
           >
             <Text style={styles.backButtonText}>Back to Search</Text>
           </TouchableOpacity>
         </View>
       </>
     )}
   </View>
 )


 // Render the map modal
 const renderMapModal = () => (
   <Modal visible={mapVisible} animationType="slide" onRequestClose={() => setMapVisible(false)}>
     <SafeAreaView style={styles.mapContainer}>
       <View style={styles.mapHeader}>
         <TouchableOpacity style={styles.closeMapButton} onPress={() => setMapVisible(false)}>
           <MaterialIcons name="arrow-back" size={24} color={COLORS.BLACK} />
         </TouchableOpacity>
         <Text style={styles.mapTitle}>Delivery Route</Text>
         <View style={{ width: 24 }} />
       </View>


       <MapView
         provider={PROVIDER_GOOGLE}
         style={styles.map}
         initialRegion={{
           latitude: CARRIER_LOCATION.latitude,
           longitude: CARRIER_LOCATION.longitude,
           latitudeDelta: 0.05,
           longitudeDelta: 0.05,
         }}
       >
         {/* Carrier's current location */}
         <Marker
           coordinate={{
             latitude: CARRIER_LOCATION.latitude,
             longitude: CARRIER_LOCATION.longitude,
           }}
           title="Your Location"
           description="Current location"
         >
           <View style={styles.carrierMarker}>
             <MaterialIcons name="person-pin-circle" size={36} color={COLORS.PRIMARY} />
           </View>
         </Marker>


         {/* Destination marker */}
         <Marker
           coordinate={{
             latitude: DEFAULT_DESTINATION.latitude,
             longitude: DEFAULT_DESTINATION.longitude,
           }}
           title="Destination"
           description={toLocation}
         >
           <View style={styles.destinationMarker}>
             <MaterialIcons name="flag" size={36} color={COLORS.ERROR} />
           </View>
         </Marker>


         {/* Pickup location markers */}
         {MOCK_PARCELS.filter((parcel) => selectedParcels.includes(parcel.id)).map((parcel) => (
           <React.Fragment key={`pickup-${parcel.id}`}>
             <Marker
               coordinate={{
                 latitude: parcel.pickupLocation.latitude,
                 longitude: parcel.pickupLocation.longitude,
               }}
               title={`Pickup: ${parcel.sender}`}
               description={parcel.pickupLocation.address}
             >
               <View style={styles.pickupMarker}>
                 <MaterialIcons name="local-shipping" size={24} color={COLORS.WHITE} />
               </View>
             </Marker>


             <Marker
               coordinate={{
                 latitude: parcel.deliveryLocation.latitude,
                 longitude: parcel.deliveryLocation.longitude,
               }}
               title={`Delivery: ${parcel.sender}`}
               description={parcel.deliveryLocation.address}
             >
               <View style={styles.deliveryMarker}>
                 <MaterialIcons name="location-on" size={24} color={COLORS.WHITE} />
               </View>
             </Marker>
           </React.Fragment>
         ))}


         {/* Route polyline */}
         {routeCoordinates.length > 0 && (
           <Polyline coordinates={routeCoordinates} strokeWidth={4} strokeColor={COLORS.PRIMARY} />
         )}
       </MapView>


       <View style={styles.mapFooter}>
         <View style={styles.mapStats}>
           <View style={styles.mapStat}>
             <Text style={styles.mapStatLabel}>Distance</Text>
             <Text style={styles.mapStatValue}>12.5 km</Text>
           </View>


           <View style={styles.mapStat}>
             <Text style={styles.mapStatLabel}>Est. Time</Text>
             <Text style={styles.mapStatValue}>45 min</Text>
           </View>


           <View style={styles.mapStat}>
             <Text style={styles.mapStatLabel}>Earnings</Text>
             <Text style={styles.mapStatValue}>
               $
               {selectedParcels
                 .reduce((sum, id) => {
                   const parcel = MOCK_PARCELS.find((p) => p.id === id)
                   return sum + (parcel ? parcel.compensation : 0)
                 }, 0)
                 .toFixed(2)}
             </Text>
           </View>
         </View>


         <TouchableOpacity style={styles.startNavigationButton}>
           <Text style={styles.startNavigationText}>Start Navigation</Text>
         </TouchableOpacity>
       </View>
     </SafeAreaView>
   </Modal>
 )


 return (
   <SafeAreaView style={styles.container}>
     <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
       {step === 1 && renderForm()}
       {step === 2 && renderMatchedParcels()}
       {renderMapModal()}
     </ScrollView>
   </SafeAreaView>
 )
}


const styles = StyleSheet.create({
 container: {
   flex: 1,
   backgroundColor: COLORS.BACKGROUND,
 },
 scrollView: {
   flex: 1,
 },
 formContainer: {
   padding: 16,
 },
 sectionTitle: {
   fontSize: 22,
   fontWeight: "bold",
   color: COLORS.BLACK,
   marginBottom: 16,
 },
 inputContainer: {
   marginBottom: 16,
 },
 inputLabel: {
   fontSize: 14,
   fontWeight: "500",
   color: COLORS.BLACK,
   marginBottom: 8,
 },
 locationInputContainer: {
   flexDirection: "row",
   alignItems: "center",
 },
 inputWrapper: {
   flex: 1,
   flexDirection: "row",
   alignItems: "center",
   backgroundColor: COLORS.WHITE,
   borderWidth: 1,
   borderColor: COLORS.BORDER,
   borderRadius: SIZES.RADIUS,
   paddingHorizontal: 12,
 },
 inputIcon: {
   marginRight: 8,
 },
 input: {
   flex: 1,
   paddingVertical: 12,
   fontSize: 16,
   color: COLORS.BLACK,
 },
 disabledInput: {
   color: COLORS.SECONDARY,
 },
 useLocationButton: {
   flexDirection: "row",
   alignItems: "center",
   marginLeft: 8,
   padding: 4,
 },
 useLocationText: {
   fontSize: 12,
   color: COLORS.PRIMARY,
   marginLeft: 4,
 },
 matchButton: {
   flexDirection: "row",
   backgroundColor: COLORS.PRIMARY,
   borderRadius: SIZES.RADIUS,
   paddingVertical: 14,
   paddingHorizontal: 20,
   alignItems: "center",
   justifyContent: "center",
   marginTop: 16,
 },
 buttonIcon: {
   marginRight: 8,
 },
 matchButtonText: {
   color: COLORS.WHITE,
   fontSize: 16,
   fontWeight: "600",
 },
 disabledButton: {
   opacity: 0.6,
 },
 matchesContainer: {
   flex: 1,
   padding: 16,
 },
 matchesHeader: {
   marginBottom: 16,
 },
 matchesSubtitle: {
   fontSize: 14,
   color: COLORS.SECONDARY,
   marginTop: 4,
 },
 noMatchesContainer: {
   alignItems: "center",
   justifyContent: "center",
   padding: 32,
 },
 noMatchesText: {
   marginTop: 16,
   fontSize: 16,
   color: COLORS.SECONDARY,
 },
 parcelsList: {
   paddingBottom: 100,
 },
 parcelCard: {
   backgroundColor: COLORS.WHITE,
   borderRadius: SIZES.RADIUS,
   padding: 16,
   marginBottom: 12,
   borderWidth: 1,
   borderColor: COLORS.BORDER,
 },
 selectedParcelCard: {
   borderColor: COLORS.PRIMARY,
   backgroundColor: "#f0f9ff",
 },
 parcelHeader: {
   flexDirection: "row",
   justifyContent: "space-between",
   alignItems: "center",
   marginBottom: 12,
 },
 parcelSenderContainer: {
   flexDirection: "row",
   alignItems: "center",
 },
 checkIcon: {
   marginRight: 8,
 },
 parcelSender: {
   fontSize: 16,
   fontWeight: "600",
   color: COLORS.BLACK,
 },
 parcelCompensation: {
   fontSize: 18,
   fontWeight: "bold",
   color: COLORS.SUCCESS,
 },
 parcelDetails: {
   marginBottom: 12,
 },
 locationDetail: {
   flexDirection: "row",
   alignItems: "flex-start",
   marginBottom: 8,
 },
 locationTextContainer: {
   marginLeft: 8,
   flex: 1,
 },
 locationLabel: {
   fontSize: 12,
   color: COLORS.SECONDARY,
 },
 locationAddress: {
   fontSize: 14,
   color: COLORS.BLACK,
 },
 parcelFooter: {
   flexDirection: "row",
   justifyContent: "space-between",
   borderTopWidth: 1,
   borderTopColor: "#f1f5f9",
   paddingTop: 12,
 },
 parcelStat: {
   flexDirection: "row",
   alignItems: "center",
 },
 parcelStatText: {
   fontSize: 12,
   color: COLORS.SECONDARY,
   marginLeft: 4,
 },
 navigateButtonContainer: {
   position: "absolute",
   bottom: 0,
   left: 0,
   right: 0,
   backgroundColor: COLORS.WHITE,
   padding: 16,
   borderTopWidth: 1,
   borderTopColor: COLORS.BORDER,
 },
 navigateButton: {
   flexDirection: "row",
   backgroundColor: COLORS.PRIMARY,
   borderRadius: SIZES.RADIUS,
   paddingVertical: 14,
   alignItems: "center",
   justifyContent: "center",
   marginBottom: 8,
 },
 navigateButtonText: {
   color: COLORS.WHITE,
   fontSize: 16,
   fontWeight: "600",
 },
 backButton: {
   alignItems: "center",
   paddingVertical: 8,
 },
 backButtonText: {
   color: COLORS.PRIMARY,
   fontSize: 14,
   fontWeight: "500",
 },
 mapContainer: {
   flex: 1,
   backgroundColor: COLORS.BACKGROUND,
 },
 mapHeader: {
   flexDirection: "row",
   alignItems: "center",
   justifyContent: "space-between",
   padding: 16,
   backgroundColor: COLORS.WHITE,
   borderBottomWidth: 1,
   borderBottomColor: COLORS.BORDER,
 },
 closeMapButton: {
   padding: 4,
 },
 mapTitle: {
   fontSize: 18,
   fontWeight: "600",
   color: COLORS.BLACK,
 },
 map: {
   flex: 1,
 },
 carrierMarker: {
   alignItems: "center",
   justifyContent: "center",
 },
 destinationMarker: {
   alignItems: "center",
   justifyContent: "center",
 },
 pickupMarker: {
   backgroundColor: COLORS.PRIMARY,
   borderRadius: 20,
   padding: 8,
 },
 deliveryMarker: {
   backgroundColor: COLORS.ERROR,
   borderRadius: 20,
   padding: 8,
 },
 mapFooter: {
   backgroundColor: COLORS.WHITE,
   padding: 16,
   borderTopWidth: 1,
   borderTopColor: COLORS.BORDER,
 },
 mapStats: {
   flexDirection: "row",
   justifyContent: "space-between",
   marginBottom: 16,
 },
 mapStat: {
   alignItems: "center",
 },
 mapStatLabel: {
   fontSize: 12,
   color: COLORS.SECONDARY,
   marginBottom: 4,
 },
 mapStatValue: {
   fontSize: 16,
   fontWeight: "600",
   color: COLORS.BLACK,
 },
 startNavigationButton: {
   backgroundColor: COLORS.PRIMARY,
   borderRadius: SIZES.RADIUS,
   paddingVertical: 14,
   alignItems: "center",
   justifyContent: "center",
 },
 startNavigationText: {
   color: COLORS.WHITE,
   fontSize: 16,
   fontWeight: "600",
 },
})


export default CarrierMatchScreen





