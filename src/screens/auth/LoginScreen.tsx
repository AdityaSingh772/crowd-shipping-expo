import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../hooks/useAuth';
import { UserType } from '../../context/AuthContext';
import { PATTERNS, VALIDATION, COLORS, SIZES, API_URL } from '../../config/constant';
import { StatusBar } from 'expo-status-bar';
import ApiConnectionTest from '../../components/ApiConnectionTest';

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Home: undefined;
};

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { login, isAuthenticated } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState<UserType>('user');
  const [isLoading, setIsLoading] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  
  // Validation states
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Navigate away if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigation.replace('Home');
    }
  }, [isAuthenticated, navigation]);

  // Validate email
  const validateEmail = (): boolean => {
    if (!email) {
      setEmailError(VALIDATION.REQUIRED);
      return false;
    } else if (!PATTERNS.EMAIL.test(email)) {
      setEmailError(VALIDATION.INVALID_EMAIL);
      return false;
    }
    setEmailError('');
    return true;
  };

  // Validate password
  const validatePassword = (): boolean => {
    if (!password) {
      setPasswordError(VALIDATION.REQUIRED);
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleLogin = async () => {
    // Validate form
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    
    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setIsLoading(true);
    try {
      const success = await login(email, password, userType);
      
      if (!success) {
        // Login failed but no error was thrown (handled in the login function)
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert(
        'Login Failed', 
        'An unexpected error occurred. Please check your internet connection and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Secret debug mode toggle (tap the title 5 times)
  const [titleTapCount, setTitleTapCount] = useState(0);
  const handleTitlePress = () => {
    const newCount = titleTapCount + 1;
    setTitleTapCount(newCount);
    
    if (newCount >= 5) {
      setShowDebug(!showDebug);
      setTitleTapCount(0);
      Alert.alert(
        "Debug Mode", 
        showDebug ? "Debug mode disabled" : "Debug mode enabled"
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text onPress={handleTitlePress} style={styles.headerTitle}>Crowd Shipping</Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>

            <View style={styles.userTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.userTypeButton, 
                  userType === 'user' && styles.userTypeButtonActive
                ]}
                onPress={() => setUserType('user')}
              >
                <MaterialIcons
                  name="person"
                  size={20}
                  color={userType === 'user' ? COLORS.PRIMARY : COLORS.SECONDARY}
                />
                <Text
                  style={[
                    styles.userTypeText,
                    userType === 'user' && styles.userTypeTextActive,
                  ]}
                >
                  User
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.userTypeButton, 
                  userType === 'partner' && styles.userTypeButtonActive
                ]}
                onPress={() => setUserType('partner')}
              >
                <MaterialIcons
                  name="local-shipping"
                  size={20}
                  color={userType === 'partner' ? COLORS.PRIMARY : COLORS.SECONDARY}
                />
                <Text
                  style={[
                    styles.userTypeText,
                    userType === 'partner' && styles.userTypeTextActive,
                  ]}
                >
                  Delivery Partner
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email</Text>
                <View 
                  style={[
                    styles.inputWrapper,
                    emailError ? styles.inputError : null
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

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <View 
                  style={[
                    styles.inputWrapper,
                    passwordError ? styles.inputError : null
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
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (passwordError) validatePassword();
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
                      name={showPassword ? 'visibility-off' : 'visibility'}
                      size={20}
                      color={COLORS.SECONDARY}
                    />
                  </TouchableOpacity>
                </View>
                {passwordError ? (
                  <Text style={styles.errorText}>{passwordError}</Text>
                ) : null}
              </View>

              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={() => navigation.navigate('ForgotPassword')}
                disabled={isLoading}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.loginButton,
                  isLoading && styles.loginButtonDisabled
                ]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={COLORS.WHITE} size="small" />
                ) : (
                  <Text style={styles.loginButtonText}>Sign In</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account?</Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Register')}
                disabled={isLoading}
              >
                <Text style={styles.signUpText}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            {showDebug && (
              <View style={styles.debugContainer}>
                <Text style={styles.debugTitle}>Debug Information</Text>
                <Text style={styles.debugText}>API URL: {API_URL}</Text>
                <ApiConnectionTest />
              </View>
            )}
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
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.BLACK,
  },
  content: {
    flex: 1,
    padding: SIZES.PADDING,
  },
  title: {
    fontSize: SIZES.H1,
    fontWeight: 'bold',
    color: COLORS.BLACK,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: SIZES.BODY,
    color: COLORS.SECONDARY,
    marginBottom: 32,
  },
  userTypeContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  userTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: SIZES.RADIUS,
    marginRight: 12,
    backgroundColor: '#f1f5f9',
  },
  userTypeButtonActive: {
    backgroundColor: COLORS.PRIMARY_LIGHT,
  },
  userTypeText: {
    marginLeft: 8,
    fontSize: SIZES.BODY,
    fontWeight: '500',
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
    fontWeight: '500',
    color: COLORS.BLACK,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: COLORS.PRIMARY,
    fontSize: SIZES.BODY,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: SIZES.RADIUS,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  loginButtonDisabled: {
    backgroundColor: COLORS.DISABLED,
  },
  loginButtonText: {
    color: COLORS.WHITE,
    fontSize: SIZES.BODY,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: COLORS.SECONDARY,
    fontSize: SIZES.BODY,
  },
  signUpText: {
    color: COLORS.PRIMARY,
    fontSize: SIZES.BODY,
    fontWeight: '600',
    marginLeft: 4,
  },
  debugContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: SIZES.RADIUS,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  debugTitle: {
    fontSize: SIZES.H4,
    fontWeight: 'bold',
    marginBottom: 8,
    color: COLORS.BLACK,
  },
  debugText: {
    fontSize: SIZES.SMALL,
    fontFamily: 'monospace',
    marginBottom: 16,
    color: COLORS.SECONDARY,
  },
});