import ParallaxScrollView from '@/components/ParallaxScrollView';
import ResultDisplay from '@/components/ResultDisplay';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Address, beginCell, fromNano, toNano } from '@ton/core';
import * as Clipboard from 'expo-clipboard';
import React, { useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function TonCoreDemoScreen() {
  const [addressString] = useState<string>('Ef8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAU');
  const [addressParsed, setAddressParsed] = useState<string>('');
  const [amountNano] = useState<string>('1000000000');
  const [amountHuman, setAmountHuman] = useState<string>('');
  const [cellHash, setCellHash] = useState<string>('');
  const [bocBase64, setBocBase64] = useState<string>('');
  const [error, setError] = useState<string>('');

  const demoActions = useMemo(() => ({
    buildCellAndHash: () => {
      try {
        const cell = beginCell().storeUint(0xdeadbeef, 32).storeStringTail('hello-ton-core').endCell();
        const hash = cell.hash().toString('hex');
        const boc = cell.toBoc().toString('base64');
        setCellHash(hash);
        setBocBase64(boc);
        setError('');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error');
      }
    },
    parseAndFormatAddress: () => {
      try {
        const addr = Address.parse(addressString);
        const bounceable = addr.toString({ testOnly: false, bounceable: true });
        const nonBounce = addr.toString({ testOnly: false, bounceable: false });
        setAddressParsed(JSON.stringify({ bounceable, nonBounce }, null, 2));
        setError('');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Invalid address');
      }
    },
    convertNano: () => {
      try {
        const human = fromNano(BigInt(amountNano));
        const back = toNano(human).toString();
        setAmountHuman(JSON.stringify({ human, back }, null, 2));
        setError('');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Conversion error');
      }
    },
    copy: async (text: string, label: string) => {
      try {
        await Clipboard.setStringAsync(text);
        Alert.alert('Copied', `${label} copied to clipboard`);
      } catch {
        Alert.alert('Error', 'Failed to copy to clipboard');
      }
    }
  }), [addressString, amountNano]);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#E8F3FF', dark: '#1B2A38' }}
      headerImage={
        <IconSymbol
          size={300}
          color="#007AFF"
          name="paperplane.fill"
          style={styles.headerImage}
        /> as React.ReactElement<unknown, string | React.JSXElementConstructor<any>>
      }>
      <ScrollView style={styles.container}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">@ton/core</ThemedText>
        </ThemedView>

        {error ? (
          <ThemedView style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </ThemedView>
        ) : null}

        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Build Cell and compute hash</ThemedText>
          <ThemedText style={[styles.sectionTitle, styles.code]} selectable>
            {"beginCell().storeUint(0xdeadbeef, 32).storeStringTail('hello-ton-core').endCell()"}
          </ThemedText>
          <View style={styles.row}>
            <TouchableOpacity onPress={demoActions.buildCellAndHash} style={styles.primaryButton}>
              <ThemedText style={styles.buttonText}>Run</ThemedText>
            </TouchableOpacity>
          </View>
          <ResultDisplay title="Cell hash (hex)" content={cellHash} onCopy={() => demoActions.copy(cellHash, 'Cell hash')} />
          <ResultDisplay title="BoC (base64)" content={bocBase64} onCopy={() => demoActions.copy(bocBase64, 'BoC base64')} />
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Parse Address {addressString}</ThemedText>
          <View style={styles.row}>
            <TouchableOpacity onPress={demoActions.parseAndFormatAddress} style={styles.primaryButton}>
              <ThemedText style={styles.buttonText}>Parse</ThemedText>
            </TouchableOpacity>
          </View>
          <ResultDisplay title="Address formats" content={addressParsed} onCopy={() => demoActions.copy(addressParsed, 'Address formats')} />
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Convert nanoTON amount {amountNano}</ThemedText>
          <View style={styles.row}>
            <TouchableOpacity onPress={demoActions.convertNano} style={styles.primaryButton}>
              <ThemedText style={styles.buttonText}>Convert</ThemedText>
            </TouchableOpacity>
          </View>
          <ResultDisplay title="Conversion" content={amountHuman} onCopy={() => demoActions.copy(amountHuman, 'Conversion')} />
        </ThemedView>
      </ScrollView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    bottom: -100,
    left: -20,
    position: 'absolute',
  },
  container: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: 'column',
    gap: 4,
    marginBottom: 16,
    marginHorizontal: 16,
  },
  subtitle: {
    color: '#666',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  code: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: undefined }),
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
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


