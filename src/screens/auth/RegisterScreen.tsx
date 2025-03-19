import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../../hooks/useAuth";
import { COLORS, SIZES, PATTERNS, VALIDATION } from "../../config/constant";
import { StatusBar } from "expo-status-bar";

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

type RegisterScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Register"
>;

export default function RegisterScreen() {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { register } = useAuth();

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"sender" | "carrier">("sender");
  const [isLoading, setIsLoading] = useState(false);

  // Validation states
  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [vehicleTypeError, setVehicleTypeError] = useState("");

  // Validate first name
  const validateFirstName = (): boolean => {
    if (!firstName.trim()) {
      setFirstNameError(VALIDATION.REQUIRED);
      return false;
    }
    setFirstNameError("");
    return true;
  };

  // Validate last name
  const validateLastName = (): boolean => {
    if (!lastName.trim()) {
      setLastNameError(VALIDATION.REQUIRED);
      return false;
    }
    setLastNameError("");
    return true;
  };

  // Validate email
  const validateEmail = (): boolean => {
    if (!email) {
      setEmailError(VALIDATION.REQUIRED);
      return false;
    } else if (!PATTERNS.EMAIL.test(email)) {
      setEmailError(VALIDATION.INVALID_EMAIL);
      return false;
    }
    setEmailError("");
    return true;
  };

  // Validate phone number
  const validatePhone = (): boolean => {
    if (!phoneNumber) {
      setPhoneError(VALIDATION.REQUIRED);
      return false;
    } else if (!PATTERNS.PHONE.test(phoneNumber)) {
      setPhoneError(VALIDATION.INVALID_PHONE);
      return false;
    }
    setPhoneError("");
    return true;
  };

  // Validate password
  const validatePassword = (): boolean => {
    if (!password) {
      setPasswordError(VALIDATION.REQUIRED);
      return false;
    } else if (password.length < 8) {
      setPasswordError(VALIDATION.PASSWORD_LENGTH);
      return false;
    }
    setPasswordError("");
    return true;
  };

  // Validate confirm password
  const validateConfirmPassword = (): boolean => {
    if (!confirmPassword) {
      setConfirmPasswordError(VALIDATION.REQUIRED);
      return false;
    } else if (confirmPassword !== password) {
      setConfirmPasswordError(VALIDATION.PASSWORD_MATCH);
      return false;
    }
    setConfirmPasswordError("");
    return true;
  };

  // Validate vehicle type (only for carrier)
  const validateVehicleType = (): boolean => {
    if (role === "carrier" && !vehicleType.trim()) {
      setVehicleTypeError(VALIDATION.REQUIRED);
      return false;
    }
    setVehicleTypeError("");
    return true;
  };

  // Handle role change
  const handleRoleChange = (newRole: "sender" | "carrier") => {
    setRole(newRole);
    if (newRole === "sender") {
      setVehicleTypeError("");
    } else {
      validateVehicleType();
    }
  };

  // Handle registration
  const handleRegister = async () => {
    // Validate all fields
    const isFirstNameValid = validateFirstName();
    const isLastNameValid = validateLastName();
    const isEmailValid = validateEmail();
    const isPhoneValid = validatePhone();
    const isPasswordValid = validatePassword();
    const isConfirmPasswordValid = validateConfirmPassword();
    const isVehicleTypeValid = validateVehicleType();

    // If any validation fails, stop the registration process
    if (
      !isFirstNameValid ||
      !isLastNameValid ||
      !isEmailValid ||
      !isPhoneValid ||
      !isPasswordValid ||
      !isConfirmPasswordValid ||
      !isVehicleTypeValid
    ) {
      return;
    }

    // Start registration process
    setIsLoading(true);
    try {
      const success = await register(
        firstName,
        lastName,
        email,
        password,
        phoneNumber,
        role,
        role === "carrier" ? vehicleType : undefined
      );

      if (success) {
        // Registration successful, navigation handled in the provider (alert shown)
        navigation.navigate("Login");
      }
    } catch (error) {
      console.error("Registration error:", error);
      Alert.alert(
        "Registration Failed",
        "An unexpected error occurred. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color={COLORS.WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Account</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidView}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Sign Up</Text>
          <Text style={styles.subtitle}>Create your account</Text>

          <View style={styles.userTypeContainer}>
            <TouchableOpacity
              style={[
                styles.userTypeButton,
                role === "sender" && styles.userTypeButtonActive,
              ]}
              onPress={() => handleRoleChange("sender")}
              disabled={isLoading}
            >
              <MaterialIcons
                name="person"
                size={20}
                color={role === "sender" ? COLORS.PRIMARY : COLORS.SECONDARY}
              />
              <Text
                style={[
                  styles.userTypeText,
                  role === "sender" && styles.userTypeTextActive,
                ]}
              >
                Sender
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.userTypeButton,
                role === "carrier" && styles.userTypeButtonActive,
              ]}
              onPress={() => handleRoleChange("carrier")}
              disabled={isLoading}
            >
              <MaterialIcons
                name="local-shipping"
                size={20}
                color={role === "carrier" ? COLORS.PRIMARY : COLORS.SECONDARY}
              />
              <Text
                style={[
                  styles.userTypeText,
                  role === "carrier" && styles.userTypeTextActive,
                ]}
              >
                Carrier
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            {/* First Name */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>First Name</Text>
              <View
                style={[
                  styles.inputWrapper,
                  firstNameError ? styles.inputError : null,
                ]}
              >
                <MaterialIcons
                  name="person"
                  size={20}
                  color={COLORS.SECONDARY}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your first name"
                  value={firstName}
                  onChangeText={(text) => {
                    setFirstName(text);
                    if (firstNameError) validateFirstName();
                  }}
                  onBlur={validateFirstName}
                  editable={!isLoading}
                />
              </View>
              {firstNameError ? (
                <Text style={styles.errorText}>{firstNameError}</Text>
              ) : null}
            </View>

            {/* Last Name */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <View
                style={[
                  styles.inputWrapper,
                  lastNameError ? styles.inputError : null,
                ]}
              >
                <MaterialIcons
                  name="person"
                  size={20}
                  color={COLORS.SECONDARY}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your last name"
                  value={lastName}
                  onChangeText={(text) => {
                    setLastName(text);
                    if (lastNameError) validateLastName();
                  }}
                  onBlur={validateLastName}
                  editable={!isLoading}
                />
              </View>
              {lastNameError ? (
                <Text style={styles.errorText}>{lastNameError}</Text>
              ) : null}
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <View
                style={[
                  styles.inputWrapper,
                  emailError ? styles.inputError : null,
                ]}
              >
                <MaterialIcons
                  name="email"
                  size={20}
                  color={COLORS.SECONDARY}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (emailError) validateEmail();
                  }}
                  onBlur={validateEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
              {emailError ? (
                <Text style={styles.errorText}>{emailError}</Text>
              ) : null}
            </View>

            {/* Phone Number */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <View
                style={[
                  styles.inputWrapper,
                  phoneError ? styles.inputError : null,
                ]}
              >
                <MaterialIcons
                  name="phone"
                  size={20}
                  color={COLORS.SECONDARY}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your phone number"
                  value={phoneNumber}
                  onChangeText={(text) => {
                    setPhoneNumber(text);
                    if (phoneError) validatePhone();
                  }}
                  onBlur={validatePhone}
                  keyboardType="phone-pad"
                  editable={!isLoading}
                />
              </View>
              {phoneError ? (
                <Text style={styles.errorText}>{phoneError}</Text>
              ) : null}
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View
                style={[
                  styles.inputWrapper,
                  passwordError ? styles.inputError : null,
                ]}
              >
                <MaterialIcons
                  name="lock"
                  size={20}
                  color={COLORS.SECONDARY}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Create a password"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (passwordError) validatePassword();
                    if (confirmPassword && confirmPasswordError) validateConfirmPassword();
                  }}
                  onBlur={validatePassword}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  <MaterialIcons
                    name={showPassword ? "visibility-off" : "visibility"}
                    size={20}
                    color={COLORS.SECONDARY}
                  />
                </TouchableOpacity>
              </View>
              {passwordError ? (
                <Text style={styles.errorText}>{passwordError}</Text>
              ) : null}
            </View>

            {/* Confirm Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View
                style={[
                  styles.inputWrapper,
                  confirmPasswordError ? styles.inputError : null,
                ]}
              >
                <MaterialIcons
                  name="lock"
                  size={20}
                  color={COLORS.SECONDARY}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (confirmPasswordError) validateConfirmPassword();
                  }}
                  onBlur={validateConfirmPassword}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                />
              </View>
              {confirmPasswordError ? (
                <Text style={styles.errorText}>{confirmPasswordError}</Text>
              ) : null}
            </View>

            {/* Vehicle Type - Only for carrier role */}
            {role === "carrier" && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Vehicle Type</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    vehicleTypeError ? styles.inputError : null,
                  ]}
                >
                  <MaterialIcons
                    name="directions-car"
                    size={20}
                    color={COLORS.SECONDARY}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Car, Bike, Van, etc."
                    value={vehicleType}
                    onChangeText={(text) => {
                      setVehicleType(text);
                      if (vehicleTypeError) validateVehicleType();
                    }}
                    onBlur={validateVehicleType}
                    editable={!isLoading}
                  />
                </View>
                {vehicleTypeError ? (
                  <Text style={styles.errorText}>{vehicleTypeError}</Text>
                ) : null}
              </View>
            )}

            {/* Register Button */}
            <TouchableOpacity
              style={[
                styles.registerButton,
                isLoading && styles.registerButtonDisabled,
              ]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.WHITE} size="small" />
              ) : (
                <Text style={styles.registerButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("Login")}
              disabled={isLoading}
            >
              <Text style={styles.signInText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  keyboardAvoidView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.PRIMARY,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.WHITE,
  },
  content: {
    flex: 1,
    padding: SIZES.PADDING,
  },
  title: {
    fontSize: SIZES.H1,
    fontWeight: "bold",
    color: COLORS.BLACK,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: SIZES.BODY,
    color: COLORS.SECONDARY,
    marginBottom: 32,
  },
  userTypeContainer: {
    flexDirection: "row",
    marginBottom: 24,
  },
  userTypeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: SIZES.RADIUS,
    marginRight: 12,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  userTypeButtonActive: {
    backgroundColor: COLORS.PRIMARY_LIGHT,
  },
  userTypeText: {
    marginLeft: 8,
    fontSize: SIZES.BODY,
    fontWeight: "500",
    color: COLORS.SECONDARY,
  },
  userTypeTextActive: {
    color: COLORS.PRIMARY,
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: SIZES.BODY,
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
  inputError: {
    borderColor: COLORS.ERROR,
  },
  errorText: {
    color: COLORS.ERROR,
    fontSize: SIZES.SMALL,
    marginTop: 4,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: SIZES.BODY,
  },
  passwordToggle: {
    padding: 8,
  },
  registerButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: SIZES.RADIUS,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    height: 50,
  },
  registerButtonDisabled: {
    backgroundColor: COLORS.DISABLED,
  },
  registerButtonText: {
    color: COLORS.WHITE,
    fontSize: SIZES.BODY,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  footerText: {
    color: COLORS.SECONDARY,
    fontSize: SIZES.BODY,
  },
  signInText: {
    color: COLORS.PRIMARY,
    fontSize: SIZES.BODY,
    fontWeight: "600",
    marginLeft: 4,
  },
});