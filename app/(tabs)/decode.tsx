import BoCInput from '@/components/BoCInput';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import ResultDisplay from '@/components/ResultDisplay';
import TLBSchema from '@/components/TLBSchema';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { decodeFromBoC, getExampleBoC } from '@/lib/tlb';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

export default function DecodeScreen() {
  const [bocInput, setBocInput] = useState('');
  const [decodedResult, setDecodedResult] = useState('');
  const [error, setError] = useState('');

  const handleDecode = () => {
    if (!bocInput.trim()) {
      setError('Please enter BoC base64 string');
      return;
    }

    const result = decodeFromBoC(bocInput);

    if (result.success) {
      setDecodedResult(result.data!);
      setError('');
    } else {
      setError(result.error!);
      setDecodedResult('');
    }
  };

  const handleLoadExample = () => {
    setBocInput(getExampleBoC());
    setError('');
    setDecodedResult('');
  };

  const handleCopyResult = async () => {
    try {
      await Clipboard.setStringAsync(decodedResult);
      Alert.alert('Copied!', 'Decoded JSON has been copied to clipboard');
    } catch {
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };

  const handleClear = () => {
    setBocInput('');
    setDecodedResult('');
    setError('');
  };

  const handlePaste = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        setBocInput(text);
        setError('');
        setDecodedResult('');
      }
    } catch {
      Alert.alert('Error', 'Failed to read from clipboard');
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/adaptive-icon.png')}
          style={styles.reactLogo}
        />
      }>
      <ScrollView style={styles.container}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Decode</ThemedText>
        </ThemedView>
        <TLBSchema />

        <BoCInput
          label="BoC Base64 Input"
          placeholder="Enter BoC base64 string here..."
          value={bocInput}
          onChangeText={setBocInput}
          onPaste={handlePaste}
        />

        {error ? (
          <ThemedView style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </ThemedView>
        ) : null}

        <ThemedView style={styles.buttonContainer}>
          <TouchableOpacity onPress={handleDecode} style={styles.decodeButton}>
            <ThemedText style={styles.buttonText}>Decode</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleLoadExample} style={styles.exampleButton}>
            <ThemedText style={styles.buttonText}>Load Example</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <ThemedText style={styles.buttonText}>Clear</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <ResultDisplay
          title="Decoded JSON"
          content={decodedResult}
          onCopy={handleCopyResult}
        />
      </ScrollView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  container: {
    flex: 1,
  },
  description: {
    fontSize: 16,
    marginBottom: 16,
    marginHorizontal: 16,
    textAlign: 'center',
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  decodeButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  exampleButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  clearButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    textAlign: 'center',
  },
});
