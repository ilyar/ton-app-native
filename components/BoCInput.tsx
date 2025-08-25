import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface BoCInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  onPaste?: () => void;
  showPasteButton?: boolean;
}

export default function BoCInput({ 
  label, 
  placeholder, 
  value, 
  onChangeText, 
  onPaste,
  showPasteButton = true 
}: BoCInputProps) {
  const [isValid, setIsValid] = useState(true);

  const validateBoC = (text: string) => {
    if (!text.trim()) {
      setIsValid(true);
      return;
    }
    
    // Basic BoC validation
    // BoC strings typically start with 'te6cck' and contain only base64 characters
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    const isBase64 = base64Regex.test(text);
    const hasValidPrefix = text.startsWith('te6cck') || text.startsWith('te6cck');
    
    setIsValid(isBase64 && (hasValidPrefix || text.length > 20));
  };

  const handleChangeText = (text: string) => {
    onChangeText(text);
    validateBoC(text);
  };

  const handlePaste = () => {
    if (onPaste) {
      onPaste();
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.labelContainer}>
        <ThemedText style={styles.label}>{label}</ThemedText>
        {showPasteButton && onPaste && (
          <TouchableOpacity onPress={handlePaste} style={styles.pasteButton}>
            <ThemedText style={styles.pasteButtonText}>Paste</ThemedText>
          </TouchableOpacity>
        )}
      </ThemedView>
      
      <TextInput
        style={[
          styles.input,
          !isValid && styles.errorInput
        ]}
        placeholder={placeholder}
        placeholderTextColor="#888"
        value={value}
        onChangeText={handleChangeText}
        multiline={false}
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        textAlignVertical="center"
      />
      
      {!isValid && (
        <ThemedText style={styles.errorText}>
          Invalid BoC format. Expected base64 string starting with &apos;te6cck&apos;
        </ThemedText>
      )}
      
      {value && isValid && (
        <ThemedView style={styles.infoContainer}>
          <ThemedText style={styles.infoText}>
            📋 Length: {value.length} characters
          </ThemedText>
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  pasteButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  pasteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    color: '#000',
    fontFamily: 'monospace',
  },
  errorInput: {
    borderColor: '#ff4444',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
  },
  infoContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    borderRadius: 6,
    borderLeftWidth: 2,
    borderLeftColor: '#34C759',
  },
  infoText: {
    fontSize: 12,
    color: '#34C759',
  },
});
