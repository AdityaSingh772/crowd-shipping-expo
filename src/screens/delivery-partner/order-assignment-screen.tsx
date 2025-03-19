import React, { useState, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { Card } from '../../components/Card';
import { AuthContext } from '../../context/AuthContext'; // Create this context
import { PackageSize } from '../../types/package';
import LocationService from '../../services/LocationService';
import PackageService, { CreatePackageRequest } from '../../services/PackageService';

// Type for the order form data
type OrderFormData = {
  title: string;
  description: string;
  pickupAddress: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  pickupContactName: string;
  pickupContactPhone: string;
  pickupTimeStart: Date;
  pickupTimeEnd: Date;
  deliveryAddress: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  deliveryContactName: string;
  deliveryContactPhone: string;
  deliveryTimeStart: Date;
  deliveryTimeEnd: Date;
  size: PackageSize;
  weight: number;
  value?: number;
  isFragile: boolean;
  requireSignature: boolean;
  isInsured: boolean;
  notes: string;
};

// Default time windows (current time + 2 hours, and current time + 4 hours)
const now = new Date();
const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
const fourHoursLater = new Date(now.getTime() + 4 * 60 * 60 * 1000);

// Initial form state with default values
const initialOrderForm: OrderFormData = {
  title: '',
  description: '',
  pickupAddress: '',
  pickupContactName: '',
  pickupContactPhone: '',
  pickupTimeStart: twoHoursLater,
  pickupTimeEnd: fourHoursLater,
  deliveryAddress: '',
  deliveryContactName: '',
  deliveryContactPhone: '',
  deliveryTimeStart: twoHoursLater,
  deliveryTimeEnd: fourHoursLater,
  size: PackageSize.MEDIUM,
  weight: 1, // Default weight in kg
  isFragile: false,
  requireSignature: false,
  isInsured: false,
  notes: '',
};

export default function OrderAssignmentScreen({}) {
  const { user } = useContext(AuthContext);
  const [bulkMode, setBulkMode] = useState(false);
  const [orderForm, setOrderForm] = useState<OrderFormData>(initialOrderForm);
  const [bulkOrders, setBulkOrders] = useState<OrderFormData[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Custom date/time picker state
  const [activeTimePicker, setActiveTimePicker] = useState<string | null>(null);

  // Input change handler
  const handleInputChange = (field: keyof OrderFormData, value: any) => {
    setOrderForm(prev => ({ ...prev, [field]: value }));
  };

  // Size change handler
  const handleSizeChange = (size: PackageSize) => {
    setOrderForm(prev => ({ ...prev, size }));
  };

  // Toggle switch handler
  const handleToggleSwitch = (field: keyof OrderFormData) => {
    setOrderForm(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // Get coordinates for pickup and delivery addresses
  const getCoordinates = async () => {
    if (!orderForm.pickupAddress || !orderForm.deliveryAddress) {
      Alert.alert('Error', 'Please enter both pickup and delivery addresses');
      return false;
    }

    try {
      setLoading(true);
      
      // Get coordinates for pickup address
      const pickupCoords = await LocationService.getCoordinatesFromAddress(orderForm.pickupAddress);
      
      // Get coordinates for delivery address
      const deliveryCoords = await LocationService.getCoordinatesFromAddress(orderForm.deliveryAddress);
      
      // Update form with coordinates
      setOrderForm(prev => ({
        ...prev,
        pickupLatitude: pickupCoords.data?.latitude,
        pickupLongitude: pickupCoords.data?.longitude,
        deliveryLatitude: deliveryCoords.data?.latitude,
        deliveryLongitude: deliveryCoords.data?.longitude,
      }));
      
      setLoading(false);
      return true;
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to get coordinates. Please check the addresses and try again.');
      console.error('Error getting coordinates:', error);
      return false;
    }
  };

  // Validate form data
  const validateForm = (): boolean => {
    if (
      !orderForm.title ||
      !orderForm.pickupAddress ||
      !orderForm.pickupContactName ||
      !orderForm.pickupContactPhone ||
      !orderForm.deliveryAddress ||
      !orderForm.deliveryContactName ||
      !orderForm.deliveryContactPhone ||
      !orderForm.weight
    ) {
      Alert.alert('Error', 'Please fill in all required fields');
      return false;
    }

    if (!orderForm.pickupLatitude || !orderForm.pickupLongitude || 
        !orderForm.deliveryLatitude || !orderForm.deliveryLongitude) {
      Alert.alert('Error', 'Please select locations on the map or validate addresses');
      return false;
    }

    return true;
  };

  // Prepare package data for API request
  const preparePackageData = (): CreatePackageRequest => {
    // Format time windows as JSON strings
    const pickupTimeWindow = JSON.stringify({
      start: orderForm.pickupTimeStart.toISOString(),
      end: orderForm.pickupTimeEnd.toISOString(),
    });

    const deliveryTimeWindow = JSON.stringify({
      start: orderForm.deliveryTimeStart.toISOString(),
      end: orderForm.deliveryTimeEnd.toISOString(),
    });

    return {
      title: orderForm.title,
      description: orderForm.description || undefined,
      size: orderForm.size,
      weight: orderForm.weight,
      value: orderForm.value,
      isFragile: orderForm.isFragile,
      requireSignature: orderForm.requireSignature,
      pickupAddress: orderForm.pickupAddress,
      pickupLatitude: orderForm.pickupLatitude!,
      pickupLongitude: orderForm.pickupLongitude!,
      pickupContactName: orderForm.pickupContactName,
      pickupContactPhone: orderForm.pickupContactPhone,
      pickupTimeWindow,
      deliveryAddress: orderForm.deliveryAddress,
      deliveryLatitude: orderForm.deliveryLatitude!,
      deliveryLongitude: orderForm.deliveryLongitude!,
      deliveryContactName: orderForm.deliveryContactName,
      deliveryContactPhone: orderForm.deliveryContactPhone,
      deliveryTimeWindow,
      notes: orderForm.notes || undefined,
      isInsured: orderForm.isInsured,
    };
  };

  // Handle add order button press
  const handleAddOrder = async () => {
    // First validate form and get coordinates if not already available
    if (!orderForm.pickupLatitude || !orderForm.deliveryLatitude) {
      const coordsSuccess = await getCoordinates();
      if (!coordsSuccess) return;
    }

    if (!validateForm()) return;

    if (bulkMode) {
      // Add to bulk orders
      setBulkOrders(prev => [...prev, { ...orderForm }]);
      setOrderForm(initialOrderForm); // Reset form
      Alert.alert('Success', 'Order added to bulk list');
    } else {
      // Submit single order
      Alert.alert(
        'Confirm Order',
        'Are you sure you want to create this order?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Create',
            onPress: createSingleOrder,
          },
        ]
      );
    }
  };

  // Create a single order
  const createSingleOrder = async () => {
    try {
      setLoading(true);
      const packageData = preparePackageData();
      
      // Call API to create package
      const result = await PackageService.createPackage(packageData);
      
      setLoading(false);
      Alert.alert('Success', `Order created successfully! Tracking code: ${result.data.trackingCode}`);
      setOrderForm(initialOrderForm); // Reset form
      
      // Navigate to order details screen if you have one
      // navigation.navigate('OrderDetails', { packageId: result.data.id });
    } catch (error) {
      setLoading(false);
      console.error('Error creating order:', error);
      Alert.alert('Error', 'Failed to create order. Please try again.');
    }
  };

  // Submit bulk orders
  const handleSubmitBulkOrders = () => {
    if (bulkOrders.length === 0) {
      Alert.alert('Error', 'No orders to submit');
      return;
    }

    Alert.alert(
      'Confirm Bulk Orders',
      `Are you sure you want to create ${bulkOrders.length} orders?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Create All',
          onPress: createBulkOrders,
        },
      ]
    );
  };

  // Create bulk orders
  const createBulkOrders = async () => {
    try {
      setLoading(true);
      
      // Prepare all package data
      const packagesData = bulkOrders.map(order => {
        // Set the form data to prepare package data
        setOrderForm(order);
        return preparePackageData();
      });
      
      // Reset form back to initial
      setOrderForm(initialOrderForm);
      
      // Call API to create multiple packages
      await PackageService.createBulkPackages(packagesData);
      
      setLoading(false);
      Alert.alert('Success', `${bulkOrders.length} orders created successfully!`);
      setBulkOrders([]); // Reset bulk orders
    } catch (error) {
      setLoading(false);
      console.error('Error creating bulk orders:', error);
      Alert.alert('Error', 'Failed to create bulk orders. Please try again.');
    }
  };

  // Remove a bulk order
  const handleRemoveBulkOrder = (index: number) => {
    setBulkOrders(prev => prev.filter((_, i) => i !== index));
  };

  // Map button press handler
  const handleMapPress = async (type: 'pickup' | 'delivery') => {
    // Navigate to map screen
    // You would implement this to select locations on a map
    // For now, we'll just get coordinates from the address
    try {
      setLoading(true);
      
      const address = type === 'pickup' ? orderForm.pickupAddress : orderForm.deliveryAddress;
      
      if (!address) {
        Alert.alert('Error', `Please enter a ${type} address first`);
        setLoading(false);
        return;
      }
      
      const coords = await LocationService.getCoordinatesFromAddress(address);
      
      if (type === 'pickup') {
        setOrderForm(prev => ({
          ...prev,
          pickupLatitude: coords.data?.latitude,
          pickupLongitude: coords.data?.longitude,
        }));
      } else {
        setOrderForm(prev => ({
          ...prev,
          deliveryLatitude: coords.data?.latitude,
          deliveryLongitude: coords.data?.longitude,
        }));
      }
      
      setLoading(false);
      Alert.alert('Success', `${type === 'pickup' ? 'Pickup' : 'Delivery'} location validated`);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', `Failed to validate ${type} address`);
    }
  };

  // New date/time picker methods
  const showDateTimePicker = (pickerType: string) => {
    setActiveTimePicker(pickerType);
  };

  const hideDateTimePicker = () => {
    setActiveTimePicker(null);
  };

  // Get the current active date based on the active picker
  const getActiveDate = () => {
    switch (activeTimePicker) {
      case 'pickupStart':
        return orderForm.pickupTimeStart;
      case 'pickupEnd':
        return orderForm.pickupTimeEnd;
      case 'deliveryStart':
        return orderForm.deliveryTimeStart;
      case 'deliveryEnd':
        return orderForm.deliveryTimeEnd;
      default:
        return new Date();
    }
  };

  // Format date for display
  const formatTimeDisplay = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });
  };

  // Format date for display with date
  const formatDateTimeDisplay = (date: Date) => {
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric'
    }) + ' ' + formatTimeDisplay(date);
  };

  // Update date based on picker selection
  const updateDate = (newDate: Date) => {
    if (!activeTimePicker) return;
    
    setOrderForm(prev => ({
      ...prev,
      [activeTimePicker === 'pickupStart' ? 'pickupTimeStart' : 
       activeTimePicker === 'pickupEnd' ? 'pickupTimeEnd' :
       activeTimePicker === 'deliveryStart' ? 'deliveryTimeStart' : 'deliveryTimeEnd']: newDate
    }));
  };

  // Handle date/time adjustments with buttons
  const adjustDateTime = (amount: number, unit: 'hours' | 'minutes') => {
    const currentDate = getActiveDate();
    const newDate = new Date(currentDate);
    
    if (unit === 'hours') {
      newDate.setHours(currentDate.getHours() + amount);
    } else {
      newDate.setMinutes(currentDate.getMinutes() + amount);
    }
    
    updateDate(newDate);
  };

  // Render custom date time picker
  const renderCustomDateTimePicker = () => {
    if (!activeTimePicker) return null;
    
    const currentDate = getActiveDate();
    
    return (
      <Modal
        visible={!!activeTimePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={hideDateTimePicker}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dateTimePickerContainer}>
            <View style={styles.dateTimePickerHeader}>
              <Text style={styles.dateTimePickerTitle}>
                Select {activeTimePicker?.includes('pickup') ? 'Pickup' : 'Delivery'} {activeTimePicker?.includes('Start') ? 'Start' : 'End'} Time
              </Text>
              <TouchableOpacity onPress={hideDateTimePicker}>
                <MaterialIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.dateTimeDisplay}>
              <Text style={styles.selectedDateTime}>{formatDateTimeDisplay(currentDate)}</Text>
            </View>
            
            <View style={styles.timeAdjustContainer}>
              <View style={styles.timeUnitAdjust}>
                <Text style={styles.timeUnitLabel}>Hours</Text>
                <View style={styles.adjustButtonsRow}>
                  <TouchableOpacity 
                    style={styles.adjustButton} 
                    onPress={() => adjustDateTime(-1, 'hours')}
                  >
                    <Text style={styles.adjustButtonText}>-1</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.adjustButton} 
                    onPress={() => adjustDateTime(1, 'hours')}
                  >
                    <Text style={styles.adjustButtonText}>+1</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.timeUnitAdjust}>
                <Text style={styles.timeUnitLabel}>Minutes</Text>
                <View style={styles.adjustButtonsRow}>
                  <TouchableOpacity 
                    style={styles.adjustButton} 
                    onPress={() => adjustDateTime(-15, 'minutes')}
                  >
                    <Text style={styles.adjustButtonText}>-15</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.adjustButton} 
                    onPress={() => adjustDateTime(15, 'minutes')}
                  >
                    <Text style={styles.adjustButtonText}>+15</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.confirmButton}
              onPress={hideDateTimePicker}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Order Assignment</Text>
        <View style={styles.bulkModeContainer}>
          <Text style={styles.bulkModeLabel}>Bulk Mode</Text>
          <Switch
            value={bulkMode}
            onValueChange={setBulkMode}
            trackColor={{ false: '#cbd5e1', true: '#bfdbfe' }}
            thumbColor={bulkMode ? '#4A80F0' : '#f4f4f5'}
          />
        </View>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A80F0" />
        </View>
      )}

      {/* Custom Date Time Picker Modal */}
      {renderCustomDateTimePicker()}

      <ScrollView style={styles.scrollView}>
        <Card style={styles.formCard}>
          <Text style={styles.formTitle}>
            {bulkMode ? 'Add Multiple Orders' : 'Create New Order'}
          </Text>

          {/* Package Title */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Package Title*</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="title" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter package title"
                value={orderForm.title}
                onChangeText={(value) => handleInputChange('title', value)}
              />
            </View>
          </View>

          {/* Description */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                placeholder="Enter package description"
                value={orderForm.description}
                onChangeText={(value) => handleInputChange('description', value)}
                multiline
                numberOfLines={2}
              />
            </View>
          </View>

          {/* Pickup Location */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Pickup Location*</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="location-on" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter pickup address"
                value={orderForm.pickupAddress}
                onChangeText={(value) => handleInputChange('pickupAddress', value)}
              />
            </View>
            <TouchableOpacity 
              style={styles.mapButton}
              onPress={() => handleMapPress('pickup')}
            >
              <MaterialIcons name="map" size={16} color="#4A80F0" />
              <Text style={styles.mapButtonText}>Validate Address</Text>
            </TouchableOpacity>
          </View>

          {/* Pickup Contact Information */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Pickup Contact Name*</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="person" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter contact name"
                value={orderForm.pickupContactName}
                onChangeText={(value) => handleInputChange('pickupContactName', value)}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Pickup Contact Phone*</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="phone" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter contact phone"
                value={orderForm.pickupContactPhone}
                onChangeText={(value) => handleInputChange('pickupContactPhone', value)}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Pickup Time Window */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Pickup Time Window*</Text>
            <View style={styles.timeWindowContainer}>
              <TouchableOpacity 
                style={styles.timePickerButton}
                onPress={() => showDateTimePicker('pickupStart')}
              >
                <MaterialIcons name="access-time" size={20} color="#64748b" />
                <Text style={styles.timePickerText}>
                  {formatTimeDisplay(orderForm.pickupTimeStart)}
                </Text>
              </TouchableOpacity>

              <Text style={styles.timeWindowSeparator}>to</Text>

              <TouchableOpacity 
                style={styles.timePickerButton}
                onPress={() => showDateTimePicker('pickupEnd')}
              >
                <MaterialIcons name="access-time" size={20} color="#64748b" />
                <Text style={styles.timePickerText}>
                  {formatTimeDisplay(orderForm.pickupTimeEnd)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Delivery Location */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Delivery Location*</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="location-on" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter delivery address"
                value={orderForm.deliveryAddress}
                onChangeText={(value) => handleInputChange('deliveryAddress', value)}
              />
            </View>
            <TouchableOpacity 
              style={styles.mapButton}
              onPress={() => handleMapPress('delivery')}
            >
              <MaterialIcons name="map" size={16} color="#4A80F0" />
              <Text style={styles.mapButtonText}>Validate Address</Text>
            </TouchableOpacity>
          </View>

          {/* Delivery Contact Information */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Delivery Contact Name*</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="person" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter contact name"
                value={orderForm.deliveryContactName}
                onChangeText={(value) => handleInputChange('deliveryContactName', value)}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Delivery Contact Phone*</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="phone" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter contact phone"
                value={orderForm.deliveryContactPhone}
                onChangeText={(value) => handleInputChange('deliveryContactPhone', value)}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Delivery Time Window */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Delivery Time Window*</Text>
            <View style={styles.timeWindowContainer}>
              <TouchableOpacity 
                style={styles.timePickerButton}
                onPress={() => showDateTimePicker('deliveryStart')}
              >
                <MaterialIcons name="access-time" size={20} color="#64748b" />
                <Text style={styles.timePickerText}>
                  {formatTimeDisplay(orderForm.deliveryTimeStart)}
                </Text>
              </TouchableOpacity>

              <Text style={styles.timeWindowSeparator}>to</Text>

              <TouchableOpacity 
                style={styles.timePickerButton}
                onPress={() => showDateTimePicker('deliveryEnd')}
              >
                <MaterialIcons name="access-time" size={20} color="#64748b" />
                <Text style={styles.timePickerText}>
                  {formatTimeDisplay(orderForm.deliveryTimeEnd)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Package Size */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Package Size*</Text>
            <View style={styles.sizeButtons}>
              <TouchableOpacity
                style={[
                  styles.sizeButton,
                  orderForm.size === PackageSize.SMALL && styles.sizeButtonActive,
                ]}
                onPress={() => handleSizeChange(PackageSize.SMALL)}
              >
                <FontAwesome5
                  name="box"
                  size={16}
                  color={orderForm.size === PackageSize.SMALL ? '#4A80F0' : '#64748b'}
                />
                <Text
                  style={[
                    styles.sizeButtonText,
                    orderForm.size === PackageSize.SMALL && styles.sizeButtonTextActive,
                  ]}
                >
                  Small
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.sizeButton,
                  orderForm.size === PackageSize.MEDIUM && styles.sizeButtonActive,
                ]}
                onPress={() => handleSizeChange(PackageSize.MEDIUM)}
              >
                <FontAwesome5
                  name="box"
                  size={18}
                  color={orderForm.size === PackageSize.MEDIUM ? '#4A80F0' : '#64748b'}
                />
                <Text
                  style={[
                    styles.sizeButtonText,
                    orderForm.size === PackageSize.MEDIUM && styles.sizeButtonTextActive,
                  ]}
                >
                  Medium
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.sizeButton,
                  orderForm.size === PackageSize.LARGE && styles.sizeButtonActive,
                ]}
                onPress={() => handleSizeChange(PackageSize.LARGE)}
              >
                <FontAwesome5
                  name="box"
                  size={20}
                  color={orderForm.size === PackageSize.LARGE ? '#4A80F0' : '#64748b'}
                />
                <Text
                  style={[
                    styles.sizeButtonText,
                    orderForm.size === PackageSize.LARGE && styles.sizeButtonTextActive,
                  ]}
                >
                  Large
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.sizeButton,
                  orderForm.size === PackageSize.EXTRA_LARGE && styles.sizeButtonActive,
                ]}
                onPress={() => handleSizeChange(PackageSize.EXTRA_LARGE)}
              >
                <FontAwesome5
                  name="box"
                  size={22}
                  color={orderForm.size === PackageSize.EXTRA_LARGE ? '#4A80F0' : '#64748b'}
                />
                <Text
                  style={[
                    styles.sizeButtonText,
                    orderForm.size === PackageSize.EXTRA_LARGE && styles.sizeButtonTextActive,
                  ]}
                >
                  XL
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Weight */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Weight (kg)*</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="fitness-center" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter weight in kg"
                value={orderForm.weight.toString()}
                onChangeText={(value) => handleInputChange('weight', parseFloat(value) || 0)}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Value */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Value ($)</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="attach-money" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter package value (for insurance)"
                value={orderForm.value ? orderForm.value.toString() : ''}
                onChangeText={(value) => handleInputChange('value', parseFloat(value) || undefined)}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Package Options */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Package Options</Text>
            
            <View style={styles.optionRow}>
              <Text style={styles.optionLabel}>Fragile</Text>
              <Switch
                value={orderForm.isFragile}
                onValueChange={() => handleToggleSwitch('isFragile')}
                trackColor={{ false: '#cbd5e1', true: '#bfdbfe' }}
                thumbColor={orderForm.isFragile ? '#4A80F0' : '#f4f4f5'}
              />
            </View>
            
            <View style={styles.optionRow}>
              <Text style={styles.optionLabel}>Require Signature</Text>
              <Switch
                value={orderForm.requireSignature}
                onValueChange={() => handleToggleSwitch('requireSignature')}
                trackColor={{ false: '#cbd5e1', true: '#bfdbfe' }}
                thumbColor={orderForm.requireSignature ? '#4A80F0' : '#f4f4f5'}
              />
            </View>
            
            <View style={styles.optionRow}>
              <Text style={styles.optionLabel}>Insurance</Text>
              <Switch
                value={orderForm.isInsured}
                onValueChange={() => handleToggleSwitch('isInsured')}
                trackColor={{ false: '#cbd5e1', true: '#bfdbfe' }}
                thumbColor={orderForm.isInsured ? '#4A80F0' : '#f4f4f5'}
              />
            </View>
          </View>

          {/* Notes */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Special Instructions</Text>
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                placeholder="Enter any special instructions or notes"
                value={orderForm.notes}
                onChangeText={(value) => handleInputChange('notes', value)}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>
          
          {/* Submit Button */}
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={handleAddOrder}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialIcons name="add" size={20} color="#fff" />
                <Text style={styles.addButtonText}>
                  {bulkMode ? 'Add to Bulk' : 'Create Order'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </Card>

        {bulkMode && bulkOrders.length > 0 && (
          <Card style={styles.bulkOrdersCard}>
            <View style={styles.bulkOrdersHeader}>
              <Text style={styles.bulkOrdersTitle}>Bulk Orders ({bulkOrders.length})</Text>
              <TouchableOpacity 
                style={styles.submitBulkButton} 
                onPress={handleSubmitBulkOrders}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitBulkButtonText}>Submit All</Text>
                )}
              </TouchableOpacity>
            </View>

            {bulkOrders.map((order, index) => (
              <View key={`order-${index}`} style={styles.bulkOrderItem}>
                <View style={styles.bulkOrderInfo}>
                  <Text style={styles.bulkOrderNumber}>Order #{index + 1}</Text>
                  <Text style={styles.bulkOrderDetail}>
                    Title: {order.title}
                  </Text>
                  <Text style={styles.bulkOrderDetail}>
                    From: {order.pickupAddress}
                  </Text>
                  <Text style={styles.bulkOrderDetail}>
                    To: {order.deliveryAddress}
                  </Text>
                  <Text style={styles.bulkOrderDetail}>
                    Size: {order.size.charAt(0).toUpperCase() + order.size.slice(1)} | Weight: {order.weight}kg
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.removeBulkButton}
                  onPress={() => handleRemoveBulkOrder(index)}
                  disabled={loading}
                >
                  <MaterialIcons name="close" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e7ff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  bulkModeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bulkModeLabel: {
    marginRight: 8,
    fontSize: 14,
    color: '#64748b',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    zIndex: 1000,
  },
  scrollView: {
    flex: 1,
    padding: 15,
  },
  formCard: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 15,
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  mapButtonText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#4A80F0',
  },
  sizeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sizeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingVertical: 12,
    marginHorizontal: 4,
  },
  sizeButtonActive: {
    backgroundColor: '#e0e7ff',
  },
  sizeButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#64748b',
  },
  sizeButtonTextActive: {
    color: '#4A80F0',
    fontWeight: '500',
  },
  textAreaContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    fontSize: 16,
  },
  timeWindowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timePickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  timePickerText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#1e293b',
  },
  timeWindowSeparator: {
    marginHorizontal: 8,
    color: '#64748b',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  optionLabel: {
    fontSize: 14,
    color: '#1e293b',
  },
  addButton: {
    backgroundColor: '#4A80F0',
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  bulkOrdersCard: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  bulkOrdersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  bulkOrdersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  submitBulkButton: {
    backgroundColor: '#4A80F0',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  submitBulkButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  bulkOrderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  bulkOrderInfo: {
    flex: 1,
  },
  bulkOrderNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  bulkOrderDetail: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  removeBulkButton: {
    padding: 8,
  },
    // Modal styles
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    dateTimePickerContainer: {
      width: '80%',
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 16,
    },
    dateTimePickerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    dateTimePickerTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#1e293b',
    },
    dateTimeDisplay: {
      alignItems: 'center',
      marginBottom: 16,
    },
    selectedDateTime: {
      fontSize: 18,
      fontWeight: '500',
      color: '#1e293b',
    },
    timeAdjustContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    timeUnitAdjust: {
      flex: 1,
      alignItems: 'center',
    },
    timeUnitLabel: {
      fontSize: 14,
      color: '#64748b',
      marginBottom: 8,
    },
    adjustButtonsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '80%',
    },
    adjustButton: {
      backgroundColor: '#f1f5f9',
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    adjustButtonText: {
      fontSize: 14,
      color: '#1e293b',
      fontWeight: '500',
    },
    confirmButton: {
      backgroundColor: '#4A80F0',
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    confirmButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  
});