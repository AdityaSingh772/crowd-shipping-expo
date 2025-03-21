import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import authService from '../api/authService';

export type UserType = 'user' | 'partner';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  profileImageUrl?: string;
  role: string;
  isVerified: boolean;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  userType: UserType;
  login: (email: string, password: string, userType: UserType) => Promise<boolean>;
  register: (
    firstName: string, 
    lastName: string, 
    email: string, 
    password: string, 
    phoneNumber: string,
    role: string,
    vehicleType?: string
  ) => Promise<boolean>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (token: string, password: string) => Promise<boolean>;
  verifyEmail: (token: string) => Promise<boolean>;
  resendVerification: () => Promise<boolean>;
  updateProfile: (profileData: any) => Promise<boolean>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
}

// Create the context with a default value
export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  userType: 'user',
  login: async () => false,
  register: async () => false,
  logout: async () => {},
  forgotPassword: async () => false,
  resetPassword: async () => false,
  verifyEmail: async () => false,
  resendVerification: async () => false,
  updateProfile: async () => false,
  updatePassword: async () => false,
});

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userType, setUserType] = useState<UserType>('user');

  // Check for existing user session on app start
  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const token=await AsyncStorage.getItem('token');
        console.log(token);
        const userDataString = await AsyncStorage.getItem('userData');
        const storedUserType = await AsyncStorage.getItem('userType');
        
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          setUser(userData);
          setIsAuthenticated(true);
          
          if (storedUserType === 'user' || storedUserType === 'partner') {
            setUserType(storedUserType as UserType);
          }
          
          // Validate user session by fetching current user data
          const result = await authService.getCurrentUser();
          if (result.success && result.data) {
            setUser(result.data);
          } else {
            // Token is invalid, force logout
            await logout();
          }
        }
      } catch (error) {
        console.error('Error checking user session:', error);
        // If there's an error, best to clear any potentially corrupted data
        await logout();
      } finally {
        setIsLoading(false);
      }
    };

    checkUserSession();
  }, []);

  const login = async (email: string, password: string, userType: UserType): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const result = await authService.login(email, password, userType);
      
      if (result.success && result.data) {
        setUser(result.data.user);
        setIsAuthenticated(true);
        setUserType(userType);
        return true;
      } else {
        Alert.alert('Login Failed', result.message || 'Invalid credentials');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Login Error', 'An unexpected error occurred. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    firstName: string, 
    lastName: string, 
    email: string, 
    password: string, 
    phoneNumber: string,
    role: string,
    vehicleType?: string
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const result = await authService.register(
        firstName,
        lastName,
        email,
        password,
        phoneNumber,
        role,
        vehicleType
      );
      
      if (result.success) {
        Alert.alert(
          'Registration Successful',
          'Your account has been created. Please check your email for verification.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigation will be handled by the component
              },
            },
          ]
        );
        return true;
      } else {
        Alert.alert('Registration Failed', result.message || 'Please try again with different information.');
        return false;
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Registration Error', 'An unexpected error occurred. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear state regardless of API call success
      setUser(null);
      setIsAuthenticated(false);
      setUserType('user');
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const result = await authService.forgotPassword(email);
      
      Alert.alert(
        'Password Reset Email Sent',
        'If your email is registered, you will receive a password reset link.'
      );
      
      return result.success;
    } catch (error) {
      console.error('Forgot password error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (token: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const result = await authService.resetPassword(token, password);
      
      if (result.success) {
        Alert.alert(
          'Password Reset Successful',
          'Your password has been reset successfully. You can now log in with your new password.'
        );
        return true;
      } else {
        Alert.alert('Reset Failed', result.message || 'Failed to reset password. Please try again.');
        return false;
      }
    } catch (error) {
      console.error('Reset password error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async (token: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const result = await authService.verifyEmail(token);
      
      if (result.success) {
        Alert.alert(
          'Email Verified',
          'Your email has been verified successfully. You can now log in to your account.'
        );
        return true;
      } else {
        Alert.alert('Verification Failed', result.message || 'Failed to verify email. Please try again.');
        return false;
      }
    } catch (error) {
      console.error('Email verification error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerification = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const result = await authService.resendVerification();
      
      if (result.success) {
        Alert.alert(
          'Verification Email Sent',
          'A new verification email has been sent to your email address.'
        );
        return true;
      } else {
        Alert.alert('Failed to Resend', result.message || 'Failed to resend verification email. Please try again.');
        return false;
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (profileData: any): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const result = await authService.updateProfile(profileData);
      
      if (result.success && result.data) {
        setUser(result.data);
        Alert.alert('Profile Updated', 'Your profile has been updated successfully.');
        return true;
      } else {
        Alert.alert('Update Failed', result.message || 'Failed to update profile. Please try again.');
        return false;
      }
    } catch (error) {
      console.error('Update profile error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const result = await authService.updatePassword(currentPassword, newPassword);
      
      if (result.success) {
        Alert.alert('Password Updated', 'Your password has been updated successfully.');
        return true;
      } else {
        Alert.alert('Update Failed', result.message || 'Failed to update password. Please try again.');
        return false;
      }
    } catch (error) {
      console.error('Update password error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        userType,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
        verifyEmail,
        resendVerification,
        updateProfile,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => useContext(AuthContext);