import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface ResultDisplayProps {
  title: string;
  content: string;
  onCopy?: () => void;
  showCopyButton?: boolean;
}

export default function ResultDisplay({ 
  title, 
  content, 
  onCopy, 
  showCopyButton = true 
}: ResultDisplayProps) {
  if (!content.trim()) {
    return null;
  }

  // Check if this is an error message about TLB runtime
  const isTLBRuntimeError = content.includes('TLB runtime') || content.includes('fallback implementation');

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.title}>{title}</ThemedText>
        {showCopyButton && onCopy && (
          <TouchableOpacity onPress={onCopy} style={styles.copyButton}>
            <ThemedText style={styles.copyButtonText}>Copy</ThemedText>
          </TouchableOpacity>
        )}
      </ThemedView>
      <ScrollView style={styles.contentContainer}>
        <ThemedText style={styles.content}>{content}</ThemedText>
        {isTLBRuntimeError && (
          <ThemedView style={styles.infoContainer}>
            <ThemedText style={styles.infoText}>
              💡 Tip: This is a demonstration app. For full TLB functionality, ensure the TLB runtime is properly installed and configured.
            </ThemedText>
          </ThemedView>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 255, 0, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 0, 0.2)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  copyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  copyButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  contentContainer: {
    maxHeight: 150,
  },
  content: {
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
    color: '#333',
  },
  infoContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  infoText: {
    fontSize: 12,
    color: '#007AFF',
    fontStyle: 'italic',
  },
});
