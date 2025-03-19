"use client"

import { useState } from "react"
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, StatusBar } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { MaterialIcons } from "@expo/vector-icons"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"

const { width } = Dimensions.get("window")

interface OnboardingSlide {
  id: string
  title: string
  description: string
  image: any // In a real app, you would use a proper type for images
}

const slides: OnboardingSlide[] = [
  {
    id: "1",
    title: "Welcome to PackMan",
    description: "The easiest way to ship your packages with the help of the crowd.",
    image: require("../../../assets/onboarding-1.jpg"), // You'll need to add these images
  },
  {
    id: "2",
    title: "Find Delivery Partners",
    description: "Connect with trusted delivery partners in your area for quick and reliable deliveries.",
    image: require("../../../assets/onboarding-2.jpg"),
  },
  {
    id: "3",
    title: "Track in Real-Time",
    description: "Track your packages in real-time and get updates on their delivery status.",
    image: require("../../../assets/onboarding-3.jpg"),
  },
]

// Define the props type with correct navigation typing
type RootStackParamList = {
  Welcome: {
    onComplete: () => void
  }
}

type WelcomeScreenProps = NativeStackScreenProps<RootStackParamList, "Welcome">

export default function WelcomeScreen(props: WelcomeScreenProps) {
  const { route } = props
  const { onComplete } = route.params || { onComplete: () => {} }
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)

  const handleNext = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1)
    } else {
      onComplete()
    }
  }

  const handleSkip = () => {
    onComplete()
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#2A5D3C" barStyle="light-content" />
      <View style={styles.skipContainer}>
        {currentSlideIndex < slides.length - 1 ? (
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
      </View>

      <View style={styles.slidesContainer}>
        {slides.map((slide, index) => {
          const isActive = index === currentSlideIndex
          return (
            <View
              key={slide.id}
              style={[
                styles.slide,
                {
                  opacity: isActive ? 1 : 0,
                  transform: [
                    {
                      translateX: isActive ? 0 : width * (index < currentSlideIndex ? -1 : 1),
                    },
                  ],
                },
              ]}
            >
              <Image source={slide.image} style={styles.image} resizeMode="contain" />
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.description}>{slide.description}</Text>
            </View>
          )
        })}
      </View>

      <View style={styles.pagination}>
        {slides.map((_, index) => (
          <View key={index} style={[styles.paginationDot, index === currentSlideIndex && styles.paginationDotActive]} />
        ))}
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>{currentSlideIndex === slides.length - 1 ? "Get Started" : "Next"}</Text>
          <MaterialIcons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  skipContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  skipText: {
    fontSize: 16,
    color: "#2A5D3C",
    fontWeight: "500",
  },
  slidesContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  slide: {
    position: "absolute",
    width: width,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  image: {
    width: width * 0.8,
    height: width * 0.8,
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2A5D3C",
    textAlign: "center",
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 24,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#cbd5e1",
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: "#8CD867",
    width: 20,
  },
  buttonsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  button: {
    backgroundColor: "#2A5D3C",
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
})

