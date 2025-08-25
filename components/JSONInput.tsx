import React, { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface JSONInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  multiline?: boolean;
}

export default function JSONInput({ 
  label, 
  placeholder, 
  value, 
  onChangeText, 
  multiline = false 
}: JSONInputProps) {
  const [isValid, setIsValid] = useState(true);

  const validateJSON = (text: string) => {
    if (!text.trim()) {
      setIsValid(true);
      return;
    }
    
    try {
      JSON.parse(text);
      setIsValid(true);
    } catch {
      setIsValid(false);
    }
  };

  const handleChangeText = (text: string) => {
    onChangeText(text);
    validateJSON(text);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <TextInput
        style={[
          styles.input,
          multiline && styles.multilineInput,
          !isValid && styles.errorInput
        ]}
        placeholder={placeholder}
        placeholderTextColor="#888"
        value={value}
        onChangeText={handleChangeText}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
      {!isValid && (
        <ThemedText style={styles.errorText}>Invalid JSON format</ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    color: '#000',
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  errorInput: {
    borderColor: '#ff4444',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
  },
});
