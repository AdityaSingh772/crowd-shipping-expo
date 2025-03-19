"use client"

import { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  Dimensions,
  ImageBackground,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { MaterialIcons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useAuth } from "../../hooks/useAuth"
import type { UserType } from "../../context/AuthContext"

const { width, height } = Dimensions.get("window")

type AuthStackParamList = {
  Login: undefined
  Register: undefined
  ForgotPassword: undefined
}

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, "Login">

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>()
  const { login } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [userType, setUserType] = useState<UserType>("user")
  const [isLoading, setIsLoading] = useState(false)

  // Animation values
  // const logoOpacity = new Animated.Value(0)
  // const formTranslateY = new Animated.Value(50)
  // const formOpacity = new Animated.Value(0)

  // useEffect(() => {
  //   // Animate logo
  //   Animated.timing(logoOpacity, {
  //     toValue: 1,
  //     duration: 1000,
  //     useNativeDriver: true,
  //   }).start()

  //   // Animate form
  //   Animated.parallel([
  //     Animated.timing(formTranslateY, {
  //       toValue: 0,
  //       duration: 800,
  //       delay: 300,
  //       useNativeDriver: true,
  //     }),
  //     Animated.timing(formOpacity, {
  //       toValue: 1,
  //       duration: 800,
  //       delay: 300,
  //       useNativeDriver: true,
  //     }),
  //   ]).start()
  // }, [])

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password")
      return
    }

    setIsLoading(true)
    const success = await login(email, password, userType)
    setIsLoading(false)
  }

  return (
    <ImageBackground source={require("../../../assets/pattern-bg.jpg")} style={styles.backgroundImage}>
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#2A5D3C" barStyle="light-content" />
        <View style={styles.overlay} />

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Shiplancer</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>

          <View style={styles.userTypeContainer}>
            <TouchableOpacity
              style={[styles.userTypeButton, userType === "user" && styles.userTypeButtonActive]}
              onPress={() => setUserType("user")}
            >
              <MaterialIcons name="person" size={20} color={userType === "user" ? "#2A5D3C" : "#64748b"} />
              <Text style={[styles.userTypeText, userType === "user" && styles.userTypeTextActive]}>User</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.userTypeButton, userType === "partner" && styles.userTypeButtonActive]}
              onPress={() => setUserType("partner")}
            >
              <MaterialIcons name="local-shipping" size={20} color={userType === "partner" ? "#2A5D3C" : "#64748b"} />
              <Text style={[styles.userTypeText, userType === "partner" && styles.userTypeTextActive]}>
                Delivery Partner
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="email" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor="#a3a3a3"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="lock" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholderTextColor="#a3a3a3"
                />
                <TouchableOpacity style={styles.passwordToggle} onPress={() => setShowPassword(!showPassword)}>
                  <MaterialIcons name={showPassword ? "visibility-off" : "visibility"} size={20} color="#64748b" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.forgotPassword} onPress={() => navigation.navigate("ForgotPassword")}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loginButtonText}>Signing in</Text>
                  <View style={styles.loadingDots}>
                    <View style={styles.loadingDot} />
                    <View style={[styles.loadingDot, { marginLeft: 4 }]} />
                    <View style={[styles.loadingDot, { marginLeft: 4 }]} />
                  </View>
                </View>
              ) : (
                <Text style={styles.loginButtonText}>{isLoading ? "Signing in..." : "Sign In"}</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.signUpText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  container: {
    flex: 1,
    backgroundColor: "rgba(42, 93, 60, 0.85)",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(42, 93, 60, 0)",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: "center",
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  content: {
    flex: 1,
    padding: 24,
    zIndex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
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
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  userTypeButtonActive: {
    backgroundColor: "#E8F5E0",
  },
  userTypeText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
    color: "#64748b",
  },
  userTypeTextActive: {
    color: "#2A5D3C",
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#fff",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
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
    color: "#1e293b",
  },
  passwordToggle: {
    padding: 8,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  loginButton: {
    backgroundColor: "#8CD867",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  loginButtonDisabled: {
    backgroundColor: "rgba(148, 163, 184, 0.7)",
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingDots: {
    flexDirection: "row",
    marginLeft: 4,
  },
  loadingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    color: "#fff",
    fontSize: 14,
  },
  signUpText: {
    color: "#8CD867",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
})

