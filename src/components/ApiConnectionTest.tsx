import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { authService } from '../api/authService';
import { COLORS, SIZES, API_URL } from '../config/constant';

/**
 * A debug component to test API connectivity
 * Add this component to your login screen for easier debugging
 */
const ApiConnectionTest = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const testApiConnection = async () => {
    setIsLoading(true);
    setTestResult('Testing API connection...');
    
    try {
      // Test a simple fetch to the API URL
      const response = await fetch(API_URL);
      const text = await response.text();
      
      // Check if the response is HTML (indicates a wrong URL)
      if (text.includes('<html>')) {
        setTestResult(`❌ Connection failed. Received HTML instead of JSON. This usually means the API URL is incorrect or points to a domain parking page.\n\nAPI URL: ${API_URL}\n\nResponse (first 200 chars):\n${text.substring(0, 200)}...`);
      } else {
        try {
          // Try to parse as JSON
          const json = JSON.parse(text);
          setTestResult(`✅ Connection successful!\n\nAPI URL: ${API_URL}\n\nResponse:\n${JSON.stringify(json, null, 2)}`);
        } catch (e) {
          setTestResult(`⚠️ Connected, but received non-JSON response.\n\nAPI URL: ${API_URL}\n\nResponse (first 200 chars):\n${text.substring(0, 200)}...`);
        }
      }
    } catch (error) {
      setTestResult(`❌ Connection failed: ${error instanceof Error ? error.message : String(error)}\n\nAPI URL: ${API_URL}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.testButton}
        onPress={testApiConnection}
        disabled={isLoading}
      >
        <Text style={styles.testButtonText}>
          {isLoading ? 'Testing...' : 'Test API Connection'}
        </Text>
      </TouchableOpacity>
      
      {testResult ? (
        <ScrollView style={styles.resultContainer}>
          <Text style={styles.resultText}>{testResult}</Text>
        </ScrollView>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  testButton: {
    backgroundColor: COLORS.PRIMARY,
    padding: 10,
    borderRadius: SIZES.RADIUS,
    alignItems: 'center',
  },
  testButtonText: {
    color: COLORS.WHITE,
    fontWeight: '600',
  },
  resultContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: SIZES.RADIUS,
    maxHeight: 300,
  },
  resultText: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
});

export default ApiConnectionTest;