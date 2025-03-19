"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Picker } from "@react-native-picker/picker"
import { MaterialIcons, FontAwesome5, Ionicons } from "@expo/vector-icons"
import { COLORS, SIZES, API_URL, ENDPOINTS } from "../../config/constant"
import DatePicker from 'react-native-modern-datepicker' // Using modern-datepicker instead
import apiClient from "../../api/apiClient" // Import apiClient instead of using axios directly
import AsyncStorage from '@react-native-async-storage/async-storage' // For token storage

export const MatchScreen = () => {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [matches, setMatches] = useState([])
  const [error, setError] = useState(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [packageId, setPackageId] = useState(null)
  const [datePickerMode, setDatePickerMode] = useState<'calendar' | 'datepicker' | 'monthYear' | 'time'>('calendar')
  const [authToken, setAuthToken] = useState<string | null>(null)

  // Get auth token on component mount
  useEffect(() => {
    const getToken = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken')
        
        // If token exists, set it to the apiClient default headers
        if (token) {
          console.log('Setting auth token to headers')
          setAuthToken(token)
          // Ensure token is properly formatted with Bearer prefix
          apiClient.defaults.headers.common['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`
          // Set Content-Type header
          apiClient.defaults.headers.common['Content-Type'] = 'application/json'
        } else {
          console.warn('No auth token found in storage')
          // Clear auth header if no token exists
          delete apiClient.defaults.headers.common['Authorization']
          // Could potentially redirect to login here
        }
      } catch (err) {
        console.error('Error retrieving auth token:', err)
      }
    }

    getToken()
    
    // Set up an interval to refresh the token if needed (every 10 minutes)
    const refreshInterval = setInterval(() => {
      getToken()
    }, 10 * 60 * 1000)
    
    return () => {
      clearInterval(refreshInterval)
    }
  }, [])

  // Journey form data
  const [journey, setJourney] = useState({
    startLocation: "",
    endLocation: "",
    date: new Date(),
    packageDetails: {
      weight: "",
      dimensions: {
        length: "",
        width: "",
        height: "",
      },
      description: "",
    },
    vehicleType: "car",
    radius: "10",
    maxCarriers: "5",
  })

  // Define types for journey fields
  type JourneyKey = keyof typeof journey;
  type PackageDetailsKey = keyof typeof journey.packageDetails;
  type DimensionsKey = keyof typeof journey.packageDetails.dimensions;

  // Handle text input changes
  const handleTextChange = (name: string, value: string) => {
    if (name.includes(".")) {
      if (name.includes("dimensions.")) {
        // Handle packageDetails.dimensions
        const dimension = name.split(".")[1] as DimensionsKey;
        setJourney({
          ...journey,
          packageDetails: {
            ...journey.packageDetails,
            dimensions: {
              ...journey.packageDetails.dimensions,
              [dimension]: value,
            },
          },
        });
      } else {
        // Handle nested objects (e.g., packageDetails.weight)
        const [parent, child] = name.split(".") as [JourneyKey, PackageDetailsKey];
        if (parent === "packageDetails") {
          setJourney({
            ...journey,
            packageDetails: {
              ...journey.packageDetails,
              [child]: value,
            },
          });
        }
      }
    } else {
      // Handle top-level fields
      const journeyKey = name as JourneyKey;
      setJourney({ ...journey, [journeyKey]: value });
    }
  }

  // Handle date change
  const handleDateChange = (selectedDate: string) => {
    setShowDatePicker(false)
    if (selectedDate) {
      // Convert string date to Date object
      // Format from modern-datepicker is typically 'YYYY/MM/DD'
      const [year, month, day] = selectedDate.split('/')
      const newDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      setJourney({ ...journey, date: newDate })
    }
  }

  // Create package in the backend
  const createPackage = async () => {
    try {
      // Refresh token before making the API call
      const freshToken = await AsyncStorage.getItem('authToken');
      if (freshToken) {
        // Update the token in the API client
        apiClient.defaults.headers.common['Authorization'] = freshToken.startsWith('Bearer ') 
          ? freshToken 
          : `Bearer ${freshToken}`;
      } else {
        throw new Error('Authentication token not found. Please log in again.');
      }

      const packageData = {
        title: `Package from ${journey.startLocation} to ${journey.endLocation}`,
        description: journey.packageDetails.description,
        size: determineSizeFromDimensions(
          parseFloat(journey.packageDetails.dimensions.length),
          parseFloat(journey.packageDetails.dimensions.width),
          parseFloat(journey.packageDetails.dimensions.height)
        ),
        weight: parseFloat(journey.packageDetails.weight),
        isFragile: false,
        requireSignature: false,
        pickupAddress: journey.startLocation,
        pickupLatitude: 0, // Would need to be fetched from a geocoding service
        pickupLongitude: 0, // Would need to be fetched from a geocoding service
        pickupContactName: "", // Would need to be added to the form or pulled from user profile
        pickupContactPhone: "", // Would need to be added to the form or pulled from user profile
        pickupTimeWindow: JSON.stringify({
          start: journey.date.toISOString(),
          end: new Date(journey.date.getTime() + 3600000).toISOString(), // 1 hour window by default
        }),
        deliveryAddress: journey.endLocation,
        deliveryLatitude: 0, // Would need to be fetched from a geocoding service
        deliveryLongitude: 0, // Would need to be fetched from a geocoding service
        deliveryContactName: "", // Would need to be added to the form or pulled from user profile
        deliveryContactPhone: "", // Would need to be added to the form or pulled from user profile
        deliveryTimeWindow: JSON.stringify({
          start: journey.date.toISOString(),
          end: new Date(journey.date.getTime() + 86400000).toISOString(), // 24 hour window by default
        }),
        isInsured: false
      };

      console.log('Creating package with data:', packageData);
      
      // Explicitly add authorization header to this specific request
      const response = await apiClient.post(ENDPOINTS.CREATE_PACKAGE || "/packages", packageData, {
        headers: {
          'Authorization': apiClient.defaults.headers.common['Authorization'],
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Create package response:', response.data);
      
      if (response.data && response.data.success) {
        return response.data.data.id || response.data.data.packageId;
      } else {
        throw new Error(response.data?.message || 'Failed to create package. No package ID returned.');
      }
    } catch (err: any) {
      console.error('Error creating package:', err);
      // Check for different types of auth errors
      if (err.response?.status === 401 || err.response?.status === 403) {
       // setError('Authentication failed. Please log in again.');
        
        // Clear invalid token
        await AsyncStorage.removeItem('authToken');
        setAuthToken(null);
        
        // Redirect to login screen
        // navigation.navigate('Login');
      }
      throw err;
    }
  }

  // Helper function to determine package size based on dimensions
  const determineSizeFromDimensions = (length: number, width: number, height: number) => {
    const volume = length * width * height;
    
    // These thresholds are arbitrary and should be adjusted based on business rules
    if (volume < 1000) return 'small';
    if (volume < 8000) return 'medium';
    if (volume < 27000) return 'large';
    return 'extra_large';
  }

  // Find carriers for the package
  const findCarriersForPackage = async (pkgId: string) => {
    try {
      // Refresh token before making the API call
      const freshToken = await AsyncStorage.getItem('authToken');
      if (freshToken) {
        // Update the token in the API client
        apiClient.defaults.headers.common['Authorization'] = freshToken.startsWith('Bearer ') 
          ? freshToken 
          : `Bearer ${freshToken}`;
      } else {
        throw new Error('Authentication token not found. Please log in again.');
      }

      const matchParams = {
        packageId: pkgId,
        vehicleType: journey.vehicleType,
        radius: parseFloat(journey.radius),
        maxCarriers: parseInt(journey.maxCarriers),
      }

      console.log('Finding carriers with params:', matchParams);
      
      // Explicitly add authorization header to this specific request
      const response = await apiClient.post(
        "/matches/find-carriers",
        matchParams,
        {
          headers: {
            'Authorization': apiClient.defaults.headers.common['Authorization'],
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Find carriers response:', response.data);
      
      if (response.data && response.data.success) {
        return response.data.data || [];
      } else {
        throw new Error(response.data?.message || 'Failed to find carriers');
      }
    } catch (err: any) {
      console.error('Error finding carriers:', err);
      // Check for different types of auth errors
      if (err.response?.status === 401 || err.response?.status === 403) {
        //setError('Authentication failed. Please log in again.');
        
        // Clear invalid token
        await AsyncStorage.removeItem('authToken');
        setAuthToken(null);
        
        // Redirect to login screen
        // navigation.navigate('Login');
      }
      throw err;
    }
  }

  // Submit journey details and find carriers
  const findCarriers = async () => {
    setLoading(true)
    setError(null)

    try {
      // Step 1: Create the package
      const pkgId = await createPackage()
      setPackageId(pkgId)
      console.log('Package created with ID:', pkgId);
      
      // Step 2: Find carriers for the package
      const carrierMatches = await findCarriersForPackage(pkgId)
      console.log('Found carriers:', carrierMatches.length);
      
      setMatches(carrierMatches)
      setStep(3) // Move to the results step
    } catch (err: any) {
      // Handle specific authentication errors
      if (err.response?.status === 401) {
        //setError('Your session has expired. Please log in again.');
      } else {
        setError(err.response?.data?.message || err.message || "Failed to find carriers. Please try again.")
      }
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Handle form submission
  const handleSubmit = () => {
    if (step === 1) {
      // Validate route details
      if (!journey.startLocation || !journey.endLocation) {
        Alert.alert("Error", "Please fill in all required fields")
        return
      }
      setStep(2) // Move to package details
    } else if (step === 2) {
      // Validate package details
      if (
        !journey.packageDetails.weight ||
        !journey.packageDetails.dimensions.length ||
        !journey.packageDetails.dimensions.width ||
        !journey.packageDetails.dimensions.height ||
        !journey.packageDetails.description
      ) {
        Alert.alert("Error", "Please fill in all required fields")
        return
      }

      findCarriers() // Submit and find carriers
    }
  }

  // Go back to previous step
  const handleBack = () => {
    setStep(step - 1)
  }

  // Accept a match
  const acceptMatch = async (carrierId: string) => {
    try {
      if (!packageId) {
        throw new Error('Package ID is missing');
      }

      setLoading(true);
      
      // Refresh token before making the API call
      const freshToken = await AsyncStorage.getItem('authToken');
      if (freshToken) {
        // Update the token in the API client
        apiClient.defaults.headers.common['Authorization'] = freshToken.startsWith('Bearer ') 
          ? freshToken 
          : `Bearer ${freshToken}`;
      } else {
        throw new Error('Authentication token not found. Please log in again.');
      }
      
      const acceptData = {
        packageId: packageId,
        carrierId: carrierId
      };
      
      console.log('Accepting match with data:', acceptData);
      
      // Explicitly add authorization header to this specific request
      const response = await apiClient.post(
        "/matches/accept",
        acceptData,
        {
          headers: {
            'Authorization': apiClient.defaults.headers.common['Authorization'],
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Accept match response:', response.data);
      
      if (response.data && response.data.success) {
        Alert.alert("Success", `Carrier selected! Your package will be picked up soon.`);
        // Navigate to order details or tracking screen
        // navigation.navigate('ROUTES.TRACK_PACKAGE', { packageId });
      } else {
        throw new Error(response.data?.message || 'Failed to accept carrier');
      }
    } catch (err: any) {
      // Handle specific errors
      if (err.response?.status === 401 || err.response?.status === 403) {
        Alert.alert("Authentication Error", "Your session has expired. Please log in again.");
        
        // Clear invalid token
        await AsyncStorage.removeItem('authToken');
        setAuthToken(null);
        
        // Redirect to login screen
        // navigation.navigate('Login');
      } else {
        Alert.alert("Error", err.response?.data?.message || err.message || "Failed to select carrier. Please try again.");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Render progress indicator
  const renderProgressIndicator = () => {
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressItem}>
          <View style={[styles.progressCircle, step >= 1 && styles.progressCircleActive]}>
            <MaterialIcons name="location-on" size={20} color={step >= 1 ? COLORS.PRIMARY : "#9ca3af"} />
          </View>
          <Text style={[styles.progressText, step >= 1 && styles.progressTextActive]}>Route</Text>
        </View>

        <View style={styles.progressLine} />

        <View style={styles.progressItem}>
          <View style={[styles.progressCircle, step >= 2 && styles.progressCircleActive]}>
            <MaterialIcons name="inventory-2" size={20} color={step >= 2 ? COLORS.PRIMARY : "#9ca3af"} />
          </View>
          <Text style={[styles.progressText, step >= 2 && styles.progressTextActive]}>Package</Text>
        </View>

        <View style={styles.progressLine} />

        <View style={styles.progressItem}>
          <View style={[styles.progressCircle, step >= 3 && styles.progressCircleActive]}>
            <FontAwesome5 name="truck" size={18} color={step >= 3 ? COLORS.PRIMARY : "#9ca3af"} />
          </View>
          <Text style={[styles.progressText, step >= 3 && styles.progressTextActive]}>Results</Text>
        </View>
      </View>
    )
  }

  // Render route details form (Step 1)
  const renderRouteDetails = () => {
    return (
      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>Route Details</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Start Location</Text>
          <View style={styles.inputWrapper}>
            <MaterialIcons name="location-on" size={20} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter start address"
              value={journey.startLocation}
              onChangeText={(text) => handleTextChange("startLocation", text)}
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>End Location</Text>
          <View style={styles.inputWrapper}>
            <MaterialIcons name="location-on" size={20} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter destination address"
              value={journey.endLocation}
              onChangeText={(text) => handleTextChange("endLocation", text)}
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Travel Date</Text>
          <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowDatePicker(true)}>
            <MaterialIcons name="calendar-today" size={20} color="#64748b" style={styles.inputIcon} />
            <Text style={styles.dateText}>{journey.date.toLocaleDateString()}</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <View style={styles.datePickerOverlay}>
              <View style={styles.datePickerContainer}>
                <View style={styles.datePickerHeader}>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Text style={styles.datePickerCloseText}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={styles.datePickerTitle}>Select Date</Text>
                  <View style={{ width: 50 }} />
                </View>
                <DatePicker
                  mode={datePickerMode}
                  onSelectedChange={handleDateChange}
                  current={journey.date.toISOString().split('T')[0].replace(/-/g, '/')}
                  minimumDate={new Date().toISOString().split('T')[0].replace(/-/g, '/')}
                  style={styles.datePicker}
                />
              </View>
            </View>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Vehicle Type</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={journey.vehicleType}
              onValueChange={(itemValue) => handleTextChange("vehicleType", itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Car" value="car" />
              <Picker.Item label="Bike" value="bike" />
              <Picker.Item label="Electric Car" value="electric_car" />
              <Picker.Item label="Hybrid Vehicle" value="hybrid" />
              <Picker.Item label="Motorcycle" value="motorcycle" />
            </Picker>
          </View>
        </View>

        <View style={styles.rowContainer}>
          <View style={[styles.inputContainer, styles.halfWidth]}>
            <Text style={styles.inputLabel}>Search Radius (km)</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="10"
                value={journey.radius}
                onChangeText={(text) => handleTextChange("radius", text)}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={[styles.inputContainer, styles.halfWidth]}>
            <Text style={styles.inputLabel}>Max Carriers</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="5"
                value={journey.maxCarriers}
                onChangeText={(text) => handleTextChange("maxCarriers", text)}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>
      </View>
    )
  }

  // Render package details form (Step 2)
  const renderPackageDetails = () => {
    return (
      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>Package Details</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Package Weight (kg)</Text>
          <View style={styles.inputWrapper}>
            <MaterialIcons name="fitness-center" size={20} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter weight"
              value={journey.packageDetails.weight}
              onChangeText={(text) => handleTextChange("packageDetails.weight", text)}
              keyboardType="numeric"
            />
          </View>
        </View>

        <Text style={styles.dimensionsLabel}>Package Dimensions (cm)</Text>
        <View style={styles.rowContainer}>
          <View style={[styles.inputContainer, styles.thirdWidth]}>
            <Text style={styles.inputLabel}>Length</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Length"
                value={journey.packageDetails.dimensions.length}
                onChangeText={(text) => handleTextChange("dimensions.length", text)}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={[styles.inputContainer, styles.thirdWidth]}>
            <Text style={styles.inputLabel}>Width</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Width"
                value={journey.packageDetails.dimensions.width}
                onChangeText={(text) => handleTextChange("dimensions.width", text)}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={[styles.inputContainer, styles.thirdWidth]}>
            <Text style={styles.inputLabel}>Height</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Height"
                value={journey.packageDetails.dimensions.height}
                onChangeText={(text) => handleTextChange("dimensions.height", text)}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Package Description</Text>
          <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
            <TextInput
              style={styles.textArea}
              placeholder="Describe your package (contents, handling instructions, etc.)"
              value={journey.packageDetails.description}
              onChangeText={(text) => handleTextChange("packageDetails.description", text)}
              multiline={true}
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>
      </View>
    )
  }

  // Render carrier matches (Step 3)
  const renderCarrierMatches = () => {
    return (
      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>Available Carriers</Text>

        {matches.length === 0 ? (
          <View style={styles.noMatchesContainer}>
            <Text style={styles.noMatchesText}>No carriers found for your route.</Text>
          </View>
        ) : (
          <View style={styles.matchesContainer}>
            {matches.map((match: any) => (
              <View key={match.carrierId} style={styles.matchCard}>
                <View style={styles.matchHeader}>
                  <View>
                    <Text style={styles.carrierName}>{match.carrierName}</Text>
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={16} color="#f59e0b" />
                      <Text style={styles.ratingText}>{match.carrierRating.toFixed(1)}</Text>
                    </View>
                    <Text style={styles.vehicleType}>Vehicle: {match.carrierVehicleType}</Text>
                  </View>
                  <View style={styles.priceContainer}>
                    <Text style={styles.priceText}>${match.compensation.toFixed(2)}</Text>
                    <Text style={styles.scoreText}>Match: {match.score}%</Text>
                  </View>
                </View>

                <View style={styles.detailsContainer}>
                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>Detour:</Text>
                    <Text style={styles.detailValue}>
                      {match.routeDeviation.distance.toFixed(1)} km ({match.routeDeviation.time} mins)
                    </Text>
                  </View>
                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>CO₂ Saving:</Text>
                    <Text style={styles.detailValue}>{match.estimatedCarbonSavings.toFixed(1)} kg</Text>
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.selectButton} 
                  onPress={() => acceptMatch(match.carrierId)}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.selectButtonText}>Select Carrier</Text>
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.newSearchButton} onPress={() => setStep(1)}>
          <Text style={styles.newSearchText}>Start New Search</Text>
        </TouchableOpacity>
      </View>
    )
  }

  // Render navigation buttons
  const renderNavButtons = () => {
    if (step >= 3) return null

    return (
      <View style={styles.navButtonsContainer}>
        {step > 1 ? (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.emptyButton} />
        )}

        <TouchableOpacity
          style={[styles.nextButton, loading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.nextButtonText}>{step === 1 ? "Next" : "Find Carriers"}</Text>
          )}
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingView}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <Text style={styles.screenTitle}>Create Journey & Find Carriers</Text>

          {renderProgressIndicator()}

          {error && (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={20} color={COLORS.ERROR} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {step === 1 && renderRouteDetails()}
          {step === 2 && renderPackageDetails()}
          {step === 3 && renderCarrierMatches()}

          {renderNavButtons()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  datePickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  datePickerContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    width: '90%',
    maxWidth: 350,
    overflow: 'hidden',
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.BLACK,
  },
  datePickerCloseText: {
    color: COLORS.PRIMARY,
    fontSize: 16,
  },
  datePicker: {
    width: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.BLACK,
    textAlign: "center",
    marginBottom: 20,
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  progressItem: {
    alignItems: "center",
  },
  progressCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  progressCircleActive: {
    backgroundColor: "#e0e7ff",
  },
  progressText: {
    fontSize: 12,
    color: "#9ca3af",
  },
  progressTextActive: {
    color: COLORS.PRIMARY,
    fontWeight: "500",
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: "#e5e7eb",
    marginHorizontal: 8,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fee2e2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.ERROR,
    marginLeft: 8,
    flex: 1,
  },
  formContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
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
  inputWrapper: {
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
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: SIZES.RADIUS,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateText: {
    fontSize: 16,
    color: COLORS.BLACK,
  },
  pickerWrapper: {
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: SIZES.RADIUS,
    overflow: "hidden",
  },
  picker: {
    height: 50,
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfWidth: {
    width: "48%",
  },
  thirdWidth: {
    width: "31%",
  },
  dimensionsLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.BLACK,
    marginBottom: 12,
  },
  textAreaWrapper: {
    paddingVertical: 8,
  },
  textArea: {
    flex: 1,
    height: 100,
    textAlignVertical: "top",
    fontSize: 16,
    color: COLORS.BLACK,
  },
  navButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 24,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: SIZES.RADIUS,
    backgroundColor: COLORS.WHITE,
  },
  backButtonText: {
    color: COLORS.SECONDARY,
    fontSize: 16,
    fontWeight: "500",
  },
  emptyButton: {
    width: 80,
  },
  nextButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: SIZES.RADIUS,
    minWidth: 120,
    alignItems: "center",
  },
  nextButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.7,
  },
  noMatchesContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  noMatchesText: {
    color: COLORS.SECONDARY,
    fontSize: 16,
  },
  matchesContainer: {
    marginBottom: 16,
  },
  matchCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.RADIUS,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  matchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  carrierName: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.BLACK,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  ratingText: {
    marginLeft: 4,
    color: COLORS.BLACK,
  },
  vehicleType: {
    color: COLORS.SECONDARY,
    fontSize: 14,
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  priceText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.SUCCESS,
    marginBottom: 4,
  },
  scoreText: {
    fontSize: 14,
    color: COLORS.SECONDARY,
  },
  detailsContainer: {
    flexDirection: "row",
    marginTop: 12,
    marginBottom: 12,
  },
  detailBox: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    padding: 8,
    borderRadius: 6,
    marginRight: 8,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.PRIMARY,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 12,
    color: COLORS.BLACK,
  },
  selectButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: SIZES.RADIUS,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  selectButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: "600",
  },
  newSearchButton: {
    alignItems: "center",
    marginTop: 16,
  },
  newSearchText: {
    color: COLORS.PRIMARY,
    fontSize: 16,
    fontWeight: "600",
  },
})