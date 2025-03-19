import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../hooks/useAuth';
import { PATTERNS, VALIDATION, COLORS, SIZES } from '../../config/constant';
import { StatusBar } from 'expo-status-bar';

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
};

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList, 
  'ForgotPassword'
>;

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  const { forgotPassword } = useAuth();
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

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

  const handleForgotPassword = async () => {
    if (!validateEmail()) {
      return;
    }

    setIsLoading(true);
    try {
      const success = await forgotPassword(email);
      
      if (success) {
        setIsSuccess(true);
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      // For security, we still show success message even if there was an error
      setIsSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
            disabled={isLoading}
          >
            <MaterialIcons name="arrow-back" size={24} color={COLORS.BLACK} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Forgot Password</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          {isSuccess ? (
            <View style={styles.successContainer}>
              <MaterialIcons 
                name="check-circle" 
                size={64} 
                color={COLORS.SUCCESS} 
                style={styles.successIcon}
              />
              <Text style={styles.successTitle}>Check Your Email</Text>
              <Text style={styles.successText}>
                If an account exists with the email {email}, you will receive a password reset link shortly.
              </Text>
              <TouchableOpacity
                style={styles.button}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.buttonText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.title}>Reset Password</Text>
              <Text style={styles.subtitle}>
                Enter your email address and we'll send you instructions to reset your password.
              </Text>

              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email Address</Text>
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
                  {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
                </View>

                <TouchableOpacity
                  style={[
                    styles.button,
                    isLoading && styles.buttonDisabled
                  ]}
                  onPress={handleForgotPassword}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color={COLORS.WHITE} size="small" />
                  ) : (
                    <Text style={styles.buttonText}>Send Reset Link</Text>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Remember your password?</Text>
                <TouchableOpacity 
                  onPress={() => navigation.navigate('Login')}
                  disabled={isLoading}
                >
                  <Text style={styles.loginText}>Login</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
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
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
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
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 24,
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
  button: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: SIZES.RADIUS,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  buttonDisabled: {
    backgroundColor: COLORS.DISABLED,
  },
  buttonText: {
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
  loginText: {
    color: COLORS.PRIMARY,
    fontSize: SIZES.BODY,
    fontWeight: '600',
    marginLeft: 4,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.PADDING,
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: SIZES.H2,
    fontWeight: 'bold',
    color: COLORS.BLACK,
    marginBottom: 16,
    textAlign: 'center',
  },
  successText: {
    fontSize: SIZES.BODY,
    color: COLORS.SECONDARY,
    textAlign: 'center',
    marginBottom: 32,
  },
});