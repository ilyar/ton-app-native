import JSONInput from '@/components/JSONInput';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import ResultDisplay from '@/components/ResultDisplay';
import TLBSchema from '@/components/TLBSchema';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { encodeToBoC, getExampleJSON } from '@/lib/tlb';
import * as Clipboard from 'expo-clipboard';
import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

export default function EncodeScreen() {
  const [jsonInput, setJsonInput] = useState('');
  const [encodedResult, setEncodedResult] = useState('');
  const [error, setError] = useState('');

  const handleEncode = () => {
    if (!jsonInput.trim()) {
      setError('Please enter JSON data');
      return;
    }

    const result = encodeToBoC(jsonInput);

    if (result.success) {
      setEncodedResult(result.data!);
      setError('');
    } else {
      setError(result.error!);
      setEncodedResult('');
    }
  };

  const handleLoadExample = () => {
    setJsonInput(getExampleJSON());
    setError('');
    setEncodedResult('');
  };

  const handleCopyResult = async () => {
    try {
      await Clipboard.setStringAsync(encodedResult);
      Alert.alert('Copied!', 'BoC base64 has been copied to clipboard');
    } catch {
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };

  const handleClear = () => {
    setJsonInput('');
    setEncodedResult('');
    setError('');
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="chevron.left.forwardslash.chevron.right"
          style={styles.headerImage}
        /> as React.ReactElement<unknown, string | React.JSXElementConstructor<any>>
      }>
      <ScrollView style={styles.container}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Encode</ThemedText>
        </ThemedView>

        <TLBSchema />

        <JSONInput
          label="JSON Input"
          placeholder="Enter JSON data here..."
          value={jsonInput}
          onChangeText={setJsonInput}
          multiline={true}
        />

        {error ? (
          <ThemedView style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </ThemedView>
        ) : null}

        <ThemedView style={styles.buttonContainer}>
          <TouchableOpacity onPress={handleEncode} style={styles.encodeButton}>
            <ThemedText style={styles.buttonText}>Encode</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleLoadExample} style={styles.exampleButton}>
            <ThemedText style={styles.buttonText}>Load Example</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <ThemedText style={styles.buttonText}>Clear</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <ResultDisplay
          title="Encoded BoC Base64"
          content={encodedResult}
          onCopy={handleCopyResult}
        />
      </ScrollView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
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
  encodeButton: {
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
