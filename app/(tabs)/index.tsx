import ParallaxScrollView from '@/components/ParallaxScrollView';
import ResultDisplay from '@/components/ResultDisplay';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { SecureStoreAdapter } from '@/lib/SecureStoreAdapter';
import { fromNano } from '@ton/core';
import { TonWalletKit, WalletInitConfigMnemonic } from '@ton/walletkit';
import * as Clipboard from 'expo-clipboard';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import React, { useMemo, useRef, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

const STORAGE_KEY = 'wallet_mnemonic';

async function getPersistedMnemonic(): Promise<string | null> {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(STORAGE_KEY);
    }
    const available = await SecureStore.isAvailableAsync().catch(() => false);
    if (available) {
      return await SecureStore.getItemAsync(STORAGE_KEY);
    }
  } catch {}
  return null;
}

async function setPersistedMnemonic(value: string): Promise<void> {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, value);
      return;
    }
    const available = await SecureStore.isAvailableAsync().catch(() => false);
    if (available) {
      await SecureStore.setItemAsync(STORAGE_KEY, value);
      return;
    }
  } catch {}
}

async function removePersistedMnemonic(): Promise<void> {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    const available = await SecureStore.isAvailableAsync().catch(() => false);
    if (available) {
      await SecureStore.deleteItemAsync(STORAGE_KEY);
      return;
    }
  } catch {}
}

function parsMnemonic(data?: string | null): string[] {
  return (data || '').split(/\s+/).map((w) => w.trim()).filter((w) => w.length > 0);
}

function initConfigMnemonicV5r1(mnemonic: string[], mnemonicType: 'ton' | 'bip39'): WalletInitConfigMnemonic {
  if (mnemonic.length !== 12 && mnemonic.length !== 24) {
    throw new Error('Need enter valid mnemonic');
  }
  return new WalletInitConfigMnemonic({
    mnemonic,
    version: 'v5r1',
    mnemonicType,
    network: 'mainnet',
  })
}

function mnemonicToConfig(data?: string | null | string[], mnemonicType: 'auto' |'ton' | 'bip39' = 'auto'): WalletInitConfigMnemonic {
  const mnemonic = Array.isArray(data) ? data : parsMnemonic(data)
  if (mnemonicType === 'auto') {
    try {
      return initConfigMnemonicV5r1(mnemonic, 'ton');
    } catch {
      return initConfigMnemonicV5r1(mnemonic, 'bip39');
    }
  }
  return initConfigMnemonicV5r1(mnemonic, mnemonicType);
}

export default function WalletKitScreen() {
  const [mnemonicInput, setMnemonicInput] = useState<string>('');
  const [userWalletAddress, setUserWalletAddress] = useState<string>('');
  const [isInitializingWallet, setIsInitializingWallet] = useState<boolean>(false);
  const [isKitReady, setIsKitReady] = useState<boolean>(false);
  const [kit] = useState<TonWalletKit>(() => {
    let storage;
    try {
      storage = new SecureStoreAdapter({ prefix: 'tonwalletkit:' });
      console.log('Storage adapter created:', storage.getStorageStatus());
    } catch (error) {
      console.warn('Failed to create SecureStoreAdapter, using default storage:', error);
      storage = undefined; // Let walletkit use default storage
    }
    
    return new TonWalletKit({
      network: 'mainnet',
      apiKey: '25a9b2326a34b39a5fa4b264fb78fb4709e1bd576fc5e6b176639f5b71e94b0d',
      storage,
      bridgeUrl: 'https://bridge.tonapi.io/bridge',
    });
  });

  const [error, setError] = useState<string>('');
  const [mnemonicError, setMnemonicError] = useState<string>('');
  const [balance, setBalance] = useState<string>('');
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(false);
  const isInitializingRef = useRef<boolean>(false);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState<boolean>(false);
  const consolePatchedRef = useRef<boolean>(false);

  const logDebug = React.useCallback((message: string) => {
    const line = `${new Date().toISOString()} ${message}`;
     
    console.log(line);
    setDebugLog((prev) => [...prev, line].slice(-200));
  }, []);

  // Enhanced Android debugging functions
  const collectSystemInfo = React.useCallback(() => {
    const info = {
      platform: Platform.OS,
      platformVersion: Platform.Version,
      expoVersion: Constants.expoVersion,
      nativeAppVersion: Constants.nativeAppVersion,
      timestamp: new Date().toISOString(),
      userAgent: Platform.OS === 'web' ? navigator.userAgent : 'React Native',
      memory: Platform.OS === 'web' ? (performance as any)?.memory : 'N/A',
    };
    
    logDebug(`[system] Platform: ${info.platform} ${info.platformVersion}`);
    logDebug(`[system] Expo: ${info.expoVersion}`);
    logDebug(`[system] App: ${info.nativeAppVersion}`);
    logDebug(`[system] UserAgent: ${info.userAgent}`);
    
    // Enhanced crypto diagnostics for Android
    try {
      const cryptoInfo = {
        hasGlobalCrypto: typeof globalThis.crypto !== 'undefined',
        hasSubtle: globalThis.crypto && typeof globalThis.crypto.subtle !== 'undefined',
        hasDeriveBits: globalThis.crypto?.subtle && typeof globalThis.crypto.subtle.deriveBits === 'function',
        hasDeriveKey: globalThis.crypto?.subtle && typeof globalThis.crypto.subtle.deriveKey === 'function',
        hasGetRandomValues: globalThis.crypto && typeof globalThis.crypto.getRandomValues === 'function',
        hasBuffer: typeof Buffer !== 'undefined',
        hasUint8Array: typeof Uint8Array !== 'undefined',
        hasArrayBuffer: typeof ArrayBuffer !== 'undefined',
      };
      
      logDebug(`[crypto] Global crypto: ${cryptoInfo.hasGlobalCrypto}`);
      logDebug(`[crypto] Subtle crypto: ${cryptoInfo.hasSubtle}`);
      logDebug(`[crypto] DeriveBits: ${cryptoInfo.hasDeriveBits}`);
      logDebug(`[crypto] DeriveKey: ${cryptoInfo.hasDeriveKey}`);
      logDebug(`[crypto] GetRandomValues: ${cryptoInfo.hasGetRandomValues}`);
      logDebug(`[crypto] Buffer: ${cryptoInfo.hasBuffer}`);
      logDebug(`[crypto] Uint8Array: ${cryptoInfo.hasUint8Array}`);
      logDebug(`[crypto] ArrayBuffer: ${cryptoInfo.hasArrayBuffer}`);
      
      // Check PBKDF2 shim health
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pbkdf2Shim = require('../../lib/pbkdf2');
        if (pbkdf2Shim && typeof pbkdf2Shim.checkHealth === 'function') {
          const health = pbkdf2Shim.checkHealth();
          logDebug(`[pbkdf2] Health check: ${JSON.stringify(health)}`);
        } else {
          logDebug(`[pbkdf2] Health check function not available`);
        }
      } catch (e) {
        logDebug(`[pbkdf2] Failed to check health: ${e instanceof Error ? e.message : 'unknown'}`);
      }
      
      Object.assign(info, { crypto: cryptoInfo });
    } catch (e) {
      logDebug(`[crypto] Error collecting crypto info: ${e instanceof Error ? e.message : 'unknown'}`);
    }
    
    return info;
  }, [logDebug]);

  const waitForReadySafe = React.useCallback(async () => {
    try {
      const hasES = typeof globalThis !== 'undefined' && typeof (globalThis as any).EventSource !== 'undefined';
      logDebug(`[env] EventSource: ${hasES ? 'present' : 'missing'}`);
      logDebug(`[env] Platform=${Platform.OS} RN=${(Platform as any).Version ?? 'unknown'} Expo=${Constants.expoVersion ?? 'unknown'} App=${Constants.nativeAppVersion ?? 'unknown'}`);
      logDebug(`[config] bridgeUrl=${'https://bridge.tonapi.io/bridge'} network=${'mainnet'}`);
      
      // Check storage availability
      try {
        const available = await SecureStore.isAvailableAsync();
        logDebug(`[env] SecureStore available: ${available}`);
      } catch (e) {
        logDebug(`[env] SecureStore check error: ${e instanceof Error ? e.message : 'unknown'}`);
      }
      
      // Run crypto diagnostics
      try {
        logDebug('[env] Running crypto diagnostics...');
        const systemInfo = collectSystemInfo();
        const cryptoInfo = (systemInfo as any).crypto;
        if (cryptoInfo) {
          logDebug(`[env] Crypto diagnostics completed: ${JSON.stringify(cryptoInfo)}`);
        } else {
          logDebug('[env] Crypto diagnostics completed but no crypto info available');
        }
      } catch (e) {
        logDebug(`[env] Crypto diagnostics error: ${e instanceof Error ? e.message : 'unknown'}`);
      }
      
      // Just log environment info, don't wait for kit here
      logDebug('[env] Environment check completed');
    } catch (e) {
      logDebug(`[env] Environment check error: ${e instanceof Error ? e.message : 'unknown'}`);
    }
  }, [logDebug, collectSystemInfo]);

  // Capture relevant console logs into debug panel (WalletKit + bridge + SSE + network)
  React.useEffect(() => {
    if (consolePatchedRef.current) return;
    consolePatchedRef.current = true;
    const methods: (keyof Console)[] = ['log', 'info', 'warn', 'error'];
    const originals: Partial<Record<keyof Console, any>> = {};
    const shouldCapture = (args: unknown[]): boolean => {
      try {
        return args.some((a) => {
          if (typeof a !== 'string') return false;
          return (
            a.includes('TonWalletKit:') ||
            a.includes('BridgeManager') ||
            a.includes('Initializer') ||
            a.includes('EventProcessor') ||
            a.includes('EventEmitter') ||
            a.includes('JettonsManager') ||
            a.includes('JSBridge') ||
            a.includes('[EventSource:wrapper]') ||
            a.includes('[xhr]') ||
            a.includes('[fetch]')
          );
        });
      } catch { return false; }
    };
    const addLine = (line: string) => {
      const ts = new Date().toISOString();
      setDebugLog((prev) => [...prev, `${ts} ${line}`].slice(-200));
    };
    methods.forEach((m) => {
      originals[m] = console[m];
      // @ts-ignore
      console[m] = (...args: unknown[]) => {
        try {
          if (shouldCapture(args)) {
            addLine(`[console:${m}] ${args.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' ')}`);
          }
        } catch {}
        // @ts-ignore
        return originals[m](...args);
      };
    });
    return () => {
      methods.forEach((m) => {
        if (originals[m]) {
          // @ts-ignore
          console[m] = originals[m];
        }
      });
      consolePatchedRef.current = false;
    };
  }, []);

  const loadBalance = React.useCallback(async (wallet: { getBalance: () => Promise<bigint> }) => {
    if (!isKitReady) {
      logDebug('[balance] skip: kit not ready');
      return;
    }
    try {
      setIsLoadingBalance(true);
      logDebug('[balance] start');
      const value = await wallet.getBalance();
      setBalance(fromNano(value));
      logDebug(`[balance] ok: ${fromNano(value)}`);
    } catch (e) {
      setBalance('');
      const msg = e instanceof Error ? e.message : 'unknown error';
      setError(`Load balance ${msg}`);
      logDebug(`[balance] error: ${msg}`);
    } finally {
      setIsLoadingBalance(false);
    }
  }, [isKitReady, logDebug]);

  const withTimeout = React.useCallback(async <T,>(p: Promise<T>, ms: number, label: string): Promise<T> => {
    let to: any;
    try {
      const res = await Promise.race([
        p,
        new Promise<never>((_, reject) => {
          to = setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms);
        })
      ]);
      // @ts-ignore
      return res;
    } finally {
      if (to) clearTimeout(to);
    }
  }, []);

  const initializeWallet = React.useCallback(async (input: string) => {
    if (!input || userWalletAddress) return;
    if (isInitializingRef.current) return;
    if (!isKitReady) {
      setMnemonicError('Wallet kit not ready. Please wait for initialization to complete.');
      return;
    }
    logDebug(`[init] start, inputLength=${input.length}`);
    setMnemonicError('Initializing wallet…');
    isInitializingRef.current = true;
    setIsInitializingWallet(true);
    try {
      const walletConfig = mnemonicToConfig(input)
      logDebug(`[init] config prepared, words=${walletConfig.mnemonic.length}, type=${walletConfig.mnemonicType}`);
      
      // Wait for kit to be ready with retry logic
      let retryCount = 0;
      const maxRetries = 3;
      
              while (retryCount < maxRetries) {
          try {
            await Promise.race([
              kit.waitForReady(),
              new Promise((resolve) => setTimeout(resolve, 15000)),
            ]);
            logDebug(`[init] kit ready/timeout (attempt ${retryCount + 1})`);
            setIsKitReady(true);
            break;
          } catch (e) {
            retryCount++;
            logDebug(`[init] kit not ready (attempt ${retryCount}): ${e instanceof Error ? e.message : 'unknown'}`);
            
            if (retryCount >= maxRetries) {
              setIsKitReady(false);
              throw new Error('Wallet kit not ready after multiple attempts. Please try again.');
            }
            
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
        }
      
      logDebug('[init] addWallet start');
      const t0 = Date.now();
      await withTimeout(kit.addWallet(walletConfig), 15000, 'addWallet');
      logDebug('[init] wallet added');
      logDebug(`[init] addWallet duration=${Date.now() - t0}ms`);
      await setPersistedMnemonic(walletConfig.mnemonic.join(' '));
      logDebug('[init] mnemonic persisted');
      const wallets = kit.getWallets();
      logDebug(`[init] wallets count=${wallets.length}`);
      if (wallets.length > 0) {
        const wallet = wallets[0];
        setUserWalletAddress(wallet.getAddress({ testnet: false }));
        logDebug('[init] address set');
        await loadBalance(wallet);
        logDebug('[init] balance loaded');
        setMnemonicInput('');
        setError('');
        setMnemonicError('');
      } else {
        setMnemonicError('Failed to initialize wallet. Please check mnemonic.');
        logDebug('[init] no wallets after addWallet');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Need enter valid mnemonic';
      setMnemonicError(msg);
      logDebug(`[init] error: ${msg}`);
    } finally {
      isInitializingRef.current = false;
      setIsInitializingWallet(false);
      logDebug('[init] done');
    }
  }, [kit, userWalletAddress, logDebug, withTimeout, isKitReady, loadBalance]);

  const collectWalletKitInfo = React.useCallback(() => {
    try {
      const wallets = kit.getWallets();
      const info = {
        walletsCount: wallets.length,
        isKitReady,
        hasStorage: !!kit,
        timestamp: new Date().toISOString(),
      };
      
      logDebug(`[walletkit] Wallets: ${info.walletsCount}`);
      logDebug(`[walletkit] Ready: ${info.isKitReady}`);
      logDebug(`[walletkit] HasStorage: ${info.hasStorage}`);
      
      return info;
    } catch (e) {
      logDebug(`[walletkit] Error collecting info: ${e instanceof Error ? e.message : 'unknown'}`);
      return null;
    }
  }, [kit, isKitReady, logDebug]);

  const exportDebugReport = React.useCallback(async () => {
    try {
      const systemInfo = collectSystemInfo();
      const walletKitInfo = collectWalletKitInfo();
      
      const report = {
        timestamp: new Date().toISOString(),
        system: systemInfo,
        walletKit: walletKitInfo,
        debugLog: debugLog.slice(-100), // Last 100 log entries
        errors: error ? [error] : [],
        mnemonicErrors: mnemonicError ? [mnemonicError] : [],
      };
      
      const reportText = JSON.stringify(report, null, 2);
      await Clipboard.setStringAsync(reportText);
      Alert.alert('Debug Report', 'Debug report copied to clipboard');
      logDebug('[debug] Report exported to clipboard');
      
      return report;
    } catch (e) {
      logDebug(`[debug] Failed to export report: ${e instanceof Error ? e.message : 'unknown'}`);
      Alert.alert('Error', 'Failed to export debug report');
    }
  }, [collectSystemInfo, collectWalletKitInfo, debugLog, error, mnemonicError, logDebug]);

  const clearDebugLog = React.useCallback(() => {
    setDebugLog([]);
    logDebug('[debug] Log cleared');
  }, [logDebug]);



  // Generate new mnemonic function
  const generateNewMnemonic = React.useCallback(async () => {
    try {
      logDebug('[generate] start');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { mnemonicNew } = require('@ton/crypto');
      const newMnemonic = await mnemonicNew();
      const mnemonicString = newMnemonic.join(' ');
      setMnemonicInput(mnemonicString);
      logDebug(`[generate] new mnemonic created, words=${newMnemonic.length}`);
      
      // Auto-initialize with new mnemonic
      requestAnimationFrame(() => {
        initializeWallet(mnemonicString);
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to generate mnemonic';
      setMnemonicError(msg);
      logDebug(`[generate] error: ${msg}`);
    }
  }, [initializeWallet, logDebug]);

  // Load mnemonic from secure storage on mount and initialize wallet if present
  React.useEffect(() => {
    (async () => {
      try {
        logDebug('[mount] starting...');
        await waitForReadySafe();
        
        // Check if kit is ready before proceeding
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
          try {
            await kit.waitForReady();
            logDebug(`[mount] kit is ready (attempt ${retryCount + 1})`);
            setIsKitReady(true);
            break;
          } catch (e) {
            retryCount++;
            logDebug(`[mount] kit not ready (attempt ${retryCount}): ${e instanceof Error ? e.message : 'unknown error'}`);
            
            if (retryCount >= maxRetries) {
              setError('Wallet kit not ready after multiple attempts. Please restart the app.');
              setIsKitReady(false);
              return;
            }
            
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
        }
        
        const saved = await getPersistedMnemonic();
        logDebug(`[mount] saved exists: ${!!saved}`);
        if (saved && isKitReady) {
          // Skip if we are already initializing or already have a wallet
          const existing = kit.getWallets();
          if (isInitializingRef.current) {
            logDebug('[mount] skip addWallet(saved): initializing in progress');
          } else if (existing.length > 0) {
            logDebug(`[mount] skip addWallet(saved): already have ${existing.length} wallet(s)`);
          } else {
            try {
              logDebug('[mount] addWallet from saved start');
              const t0 = Date.now();
              await withTimeout(kit.addWallet(mnemonicToConfig(saved)), 15000, 'addWallet(saved)');
              logDebug('[mount] wallet added from saved');
              logDebug(`[mount] addWallet(saved) duration=${Date.now() - t0}ms`);
            } catch (e) {
              logDebug(`[mount] addWallet error: ${e instanceof Error ? e.message : 'unknown error'}`);
              throw e;
            }
          }
          const wallets = kit.getWallets();
          logDebug(`[mount] wallets count=${wallets.length}`);
          if (wallets.length > 0) {
            const wallet = wallets[0];
            setUserWalletAddress(wallet.getAddress({ testnet: false }));
            logDebug('[mount] address set');
            await loadBalance(wallet);
          }
        } else if (saved && !isKitReady) {
          logDebug('[mount] skip addWallet(saved): kit not ready');
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'unknown error';
        setError(`Wallet initialization ${msg}`);
        logDebug(`[mount] error: ${msg}`);
      }
    })();
  }, [kit, logDebug, isKitReady, waitForReadySafe, withTimeout, loadBalance]);

  // Try to add saved wallet when kit becomes ready
  React.useEffect(() => {
    if (isKitReady && !userWalletAddress) {
      (async () => {
        try {
          const saved = await getPersistedMnemonic();
          if (saved) {
            logDebug('[kit-ready] attempting to add saved wallet');
            const existing = kit.getWallets();
            if (existing.length === 0) {
              try {
                await withTimeout(kit.addWallet(mnemonicToConfig(saved)), 15000, 'addWallet(saved)');
                logDebug('[kit-ready] wallet added from saved');
                const wallets = kit.getWallets();
                if (wallets.length > 0) {
                  const wallet = wallets[0];
                  setUserWalletAddress(wallet.getAddress({ testnet: false }));
                  logDebug('[kit-ready] address set');
                  await loadBalance(wallet);
                }
              } catch (e) {
                logDebug(`[kit-ready] addWallet error: ${e instanceof Error ? e.message : 'unknown error'}`);
                setError(`Failed to restore wallet: ${e instanceof Error ? e.message : 'unknown error'}`);
              }
            }
          }
        } catch (e) {
          logDebug(`[kit-ready] error: ${e instanceof Error ? e.message : 'unknown error'}`);
        }
      })();
    }
  }, [isKitReady, userWalletAddress, kit, logDebug, withTimeout, loadBalance]);

  // Attach TonWalletKit event listeners for deep diagnostics
  React.useEffect(() => {
    try {
      const onConnect = (evt: any) => logDebug(`[kit:onConnectRequest] from=${evt?.dAppName ?? 'unknown'}`);
      const onTx = (evt: any) => logDebug(`[kit:onTransactionRequest] items=${Array.isArray(evt?.messages) ? evt.messages.length : 0}`);
      const onSign = (evt: any) => logDebug(`[kit:onSignDataRequest] dataLen=${evt?.data ? String(evt.data).length : 0}`);
      const onDisconnect = (evt: any) => logDebug(`[kit:onDisconnect] reason=${evt?.reason ?? 'unknown'}`);
      // @ts-ignore - typing depends on SDK
      kit.onConnectRequest(onConnect);
      // @ts-ignore
      kit.onTransactionRequest(onTx);
      // @ts-ignore
      kit.onSignDataRequest(onSign);
      // @ts-ignore
      kit.onDisconnect(onDisconnect);
    } catch {}
  }, [kit, logDebug]);

  // Auto-validate and initialize on mnemonic change
  React.useEffect(() => {
    (async () => {
      try {
        if (!mnemonicInput || userWalletAddress) {
          if (mnemonicError) setMnemonicError('');
          if (!mnemonicInput) logDebug('[effect] skipped: empty input');
          if (userWalletAddress) logDebug('[effect] skipped: already has address');
          return;
        }
        await initializeWallet(mnemonicInput);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Need enter valid mnemonic';
        if (mnemonicError !== message) setMnemonicError(message);
        logDebug(`[effect] error: ${message}`);
      } finally {}
    })();
  }, [mnemonicInput, userWalletAddress, initializeWallet, mnemonicError, logDebug]);

  const handleDeleteAccount = useMemo(() => async () => {
    if (!isKitReady) {
      setError('Cannot delete account: wallet kit not ready');
      return;
    }
    try {
      await removePersistedMnemonic();
      await kit.clearWallets();
      setMnemonicInput('');
      setUserWalletAddress('');
      setBalance('');
      Alert.alert('Removed', 'Account data removed from this device');
    } catch (e) {
      setError(`Remove account ${e instanceof Error ? e.message : 'unknown error'}`);
    }
  }, [kit, isKitReady]);

  const toClipboardActions = useMemo(() => ({
    copy: async (text: string, label: string) => {
      try {
        await Clipboard.setStringAsync(text);
        Alert.alert('Copied', `${label} copied to clipboard`);
      } catch {
        Alert.alert('Error', 'Failed to copy to clipboard');
      }
    }
  }), []);

  // Disable input when kit is not ready
  const isInputDisabled = !isKitReady || isInitializingWallet;

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#E8F3FF', dark: '#1B2A38' }}
      headerImage={<View style={styles.headerImage} /> as React.ReactElement<unknown, string | React.JSXElementConstructor<any>>}>
      <ScrollView style={styles.container}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">WalletKit</ThemedText>
        </ThemedView>

        {/* WalletKit: Initialize the kit and paste mnemonic */}
        <ThemedView style={styles.section}>

          {/* Kit Status Indicator */}
          <View style={styles.statusContainer}>
              <ThemedText type="default" style={styles.statusText}>
                {isKitReady ? '✅ Ready' : '⏳ Initializing...'}
              </ThemedText>
              {error && (
                <ThemedText type="default" style={styles.errorText}>
                  Error: {error}
                </ThemedText>
              )}
            {!isKitReady && (
              <TouchableOpacity
                style={[styles.retryButton, isKitReady && styles.retryButtonDisabled]}
                onPress={() => {
                  setError('');
                  setIsKitReady(false);
                  // Force re-initialization
                  kit.waitForReady().then(() => {
                    setIsKitReady(true);
                    setError('');
                  }).catch((e) => {
                    setError(`Re-initialization failed: ${e instanceof Error ? e.message : 'unknown error'}`);
                  });
                }}
                disabled={isKitReady}
              >
                <ThemedText style={[styles.retryButtonText, isKitReady && styles.retryButtonTextDisabled]}>Retry Initialization</ThemedText>
              </TouchableOpacity>
            )}
          </View>

          {!userWalletAddress ? (
            <>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, isInputDisabled && styles.inputDisabled]}
                  placeholder={isInputDisabled ? "Wallet kit not ready..." : "Enter or paste mnemonic phrase"}
                  placeholderTextColor="#888"
                  value={mnemonicInput}
                  onChangeText={setMnemonicInput}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="password"
                  editable={!isInputDisabled}
                />
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Generate new mnemonic"
                  disabled={isInputDisabled}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  onPress={generateNewMnemonic}
                  style={[styles.inputIconButton, styles.generateButton, isInputDisabled && styles.inputIconButtonDisabled]}
                >
                  <ThemedText style={[styles.inputIconText, isInputDisabled && styles.inputIconTextDisabled]}>🆕</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Paste mnemonic from clipboard"
                  disabled={isInputDisabled}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  onPress={async () => {
                    if (isInputDisabled) return;
                    try {
                      const has = await Clipboard.hasStringAsync();
                      if (!has) {
                        Alert.alert('Clipboard is empty');
                        logDebug('[paste] clipboard empty');
                        return;
                      }
                      const text = await Clipboard.getStringAsync();
                      if (text && text.trim().length > 0) {
                        const normalized = text.replace(/\s+/g, ' ').trim();
                        logDebug(`[paste] got text, len=${normalized.length}`);
                        setMnemonicInput(normalized);
                        requestAnimationFrame(() => {
                          initializeWallet(normalized);
                        });
                      } else {
                        Alert.alert('Clipboard is empty');
                        logDebug('[paste] clipboard had only whitespace');
                      }
                    } catch {
                      Alert.alert('Error', 'Failed to read from clipboard');
                      logDebug('[paste] error reading clipboard');
                    }
                  }}
                  style={[styles.inputIconButton, styles.pasteButton, isInputDisabled && styles.inputIconButtonDisabled]}
                >
                  <ThemedText style={[styles.inputIconText, isInputDisabled && styles.inputIconTextDisabled]}>📋</ThemedText>
                </TouchableOpacity>
              </View>
              {/* Removed Test SSE controls */}
              <TouchableOpacity 
                onPress={() => setShowDebug((v) => !v)} 
                style={[
                  styles.dangerButton, 
                  { backgroundColor: '#4A5568', marginTop: 8 },
                  !isKitReady && styles.dangerButtonDisabled
                ]}
                disabled={!isKitReady}
              >
                <ThemedText style={[styles.dangerButtonText, !isKitReady && styles.inputIconTextDisabled]}>
                  {showDebug ? 'Hide debug' : 'Show debug'}
                </ThemedText>
              </TouchableOpacity>
              {showDebug ? (
                <ThemedView style={[styles.errorContainer, { backgroundColor: 'rgba(0,0,0,0.05)', borderColor: 'rgba(0,0,0,0.1)' }]}>
                  <ThemedText style={[styles.errorText, { color: '#333', textAlign: 'left' }]}>
                    {debugLog.join('\n')}
                  </ThemedText>
                  <View style={[styles.row, { marginTop: 8 }] }>
                                          <TouchableOpacity
                        style={[
                          styles.dangerButton, 
                          { backgroundColor: '#0098EA' },
                          !isKitReady && styles.dangerButtonDisabled
                        ]}
                        onPress={exportDebugReport}
                        disabled={!isKitReady}
                      >
                        <ThemedText style={[styles.dangerButtonText, !isKitReady && styles.inputIconTextDisabled]}>📋</ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.dangerButton, 
                          { backgroundColor: '#0098EA' },
                          !isKitReady && styles.dangerButtonDisabled
                        ]}
                        onPress={clearDebugLog}
                        disabled={!isKitReady}
                      >
                        <ThemedText style={[styles.dangerButtonText, !isKitReady && styles.inputIconTextDisabled]}>🧹</ThemedText>
                      </TouchableOpacity>

                  </View>
                  {/* Removed Test SSE controls */}
                </ThemedView>
              ) : null}
              {mnemonicError ? (
                <ThemedText style={styles.errorText}>{mnemonicError}</ThemedText>
              ) : null}
            </>
          ) : null}
          {userWalletAddress ? (
            <>
              <ResultDisplay 
                title="Wallet v5r1 address" 
                content={userWalletAddress} 
                onCopy={() => toClipboardActions.copy(userWalletAddress, 'Wallet address')} 
                disabled={!isKitReady}
              />
              <ResultDisplay 
                title="Balance" 
                content={isLoadingBalance ? 'Loading…' : balance ? `${balance} TON` : ''} 
                onCopy={() => toClipboardActions.copy(balance, 'Balance')} 
                disabled={!isKitReady}
              />
              <TouchableOpacity 
                onPress={handleDeleteAccount} 
                style={[
                  styles.dangerButton,
                  !isKitReady && styles.dangerButtonDisabled
                ]}
                disabled={!isKitReady}
              >
                <ThemedText style={[styles.dangerButtonText, !isKitReady && styles.inputIconTextDisabled]}>Delete account</ThemedText>
              </TouchableOpacity>
            </>
          ) : null}
        </ThemedView>

        {error ? (
          <ThemedView style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </ThemedView>
        ) : null}
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
  input: {
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#000',
    marginBottom: 8,
    minHeight: 48,
    paddingRight: 44,
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    color: '#999',
    borderColor: '#ccc',
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputIconButton: {
    position: 'absolute',
    right: 8,
    top: 8,
    height: 32,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    zIndex: 2,
    elevation: 2,
  },
  generateButton: {
    right: 48,
    backgroundColor: '#F7F9FB',
  },
  pasteButton: {
    right: 8,
    backgroundColor: '#F7F9FB',
  },
  inputIconButtonDisabled: {
    opacity: 0.5,
  },
  inputIconText: {
    fontSize: 18,
  },
  inputIconTextDisabled: {
    opacity: 0.5,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
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
  statusContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statusText: {
    fontSize: 14,
    marginBottom: 4,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  retryButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  retryButtonTextDisabled: {
    opacity: 0.6,
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  dangerButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  dangerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});


