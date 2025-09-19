import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * SecureStore adapter for React Native/Expo environments
 * Implements the StorageAdapter interface required by walletkit
 * Automatically falls back to in-memory storage if SecureStore is unavailable
 */
export class SecureStoreAdapter {
  private prefix: string;
  private fallbackStorage: Map<string, any> = new Map();
  private useSecureStore: boolean = true;

  constructor(config: { prefix?: string } = {}) {
    // Expo SecureStore supports only [A-Za-z0-9._-] in keys
    const sanitize = (s: string) => s.replace(/[^A-Za-z0-9._-]/g, '_');
    const basePrefix = config.prefix || 'tonwalletkit_';
    this.prefix = sanitize(basePrefix);
    // Check if we're in a React Native environment
    this.useSecureStore = Platform.OS !== 'web';
  }

  private makeKey(key: string): string {
    // Ensure resulting key matches SecureStore constraints
    const sanitizedKey = key.replace(/[^A-Za-z0-9._-]/g, '_');
    const full = `${this.prefix}${sanitizedKey}`;
    // Fallback in the unlikely case key becomes empty after sanitization
    return full.length > 0 ? full : 'tonwalletkit_key';
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const fullKey = this.makeKey(key);
      
      // Try SecureStore first if available
      if (this.useSecureStore) {
        try {
          const available = await SecureStore.isAvailableAsync();
          if (available) {
            const value = await SecureStore.getItemAsync(fullKey);
            if (value) {
              return JSON.parse(value);
            }
          }
        } catch (secureStoreError) {
          console.warn('SecureStore not available, falling back to memory:', secureStoreError);
          this.useSecureStore = false;
        }
      }

      // Fallback to in-memory storage
      return this.fallbackStorage.get(fullKey) || null;
    } catch (error) {
      console.warn('SecureStoreAdapter.get error:', error);
      // Fallback to in-memory storage
      const fullKey = this.makeKey(key);
      return this.fallbackStorage.get(fullKey) || null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      const fullKey = this.makeKey(key);
      const serializedValue = JSON.stringify(value);

      // Try SecureStore first if available
      if (this.useSecureStore) {
        try {
          const available = await SecureStore.isAvailableAsync();
          if (available) {
            await SecureStore.setItemAsync(fullKey, serializedValue);
            return;
          }
        } catch (secureStoreError) {
          console.warn('SecureStore not available, falling back to memory:', secureStoreError);
          this.useSecureStore = false;
        }
      }

      // Fallback to in-memory storage
      this.fallbackStorage.set(fullKey, value);
    } catch (error) {
      console.warn('SecureStoreAdapter.set error:', error);
      // Fallback to in-memory storage
      const fullKey = this.makeKey(key);
      this.fallbackStorage.set(fullKey, value);
    }
  }

  async remove(key: string): Promise<void> {
    try {
      const fullKey = this.makeKey(key);

      // Try SecureStore first if available
      if (this.useSecureStore) {
        try {
          const available = await SecureStore.isAvailableAsync();
          if (available) {
            await SecureStore.deleteItemAsync(fullKey);
          }
        } catch (secureStoreError) {
          console.warn('SecureStore not available, falling back to memory:', secureStoreError);
          this.useSecureStore = false;
        }
      }

      // Also remove from fallback storage
      this.fallbackStorage.delete(fullKey);
    } catch (error) {
      console.warn('SecureStoreAdapter.remove error:', error);
      // Fallback to in-memory storage
      const fullKey = this.makeKey(key);
      this.fallbackStorage.delete(fullKey);
    }
  }

  async clear(): Promise<void> {
    try {
      // For SecureStore, we need to get all keys and remove them individually
      if (this.useSecureStore) {
        try {
          const available = await SecureStore.isAvailableAsync();
          if (available) {
            // Note: SecureStore doesn't have a way to list all keys
            // We'll just clear the fallback storage and let SecureStore items expire naturally
          }
        } catch (secureStoreError) {
          console.warn('SecureStore not available, falling back to memory:', secureStoreError);
          this.useSecureStore = false;
        }
      }

      // Clear fallback storage
      this.fallbackStorage.clear();
    } catch (error) {
      console.warn('SecureStoreAdapter.clear error:', error);
      // Clear fallback storage anyway
      this.fallbackStorage.clear();
    }
  }

  /**
   * Get current storage status
   */
  getStorageStatus(): { secureStore: boolean; memory: boolean; prefix: string } {
    return {
      secureStore: this.useSecureStore,
      memory: true, // Always available
      prefix: this.prefix,
    };
  }

  /**
   * Get current store size (for testing/debugging)
   */
  getSize(): number {
    return this.fallbackStorage.size;
  }

  /**
   * Get all keys (for testing/debugging)
   */
  getKeys(): string[] {
    return Array.from(this.fallbackStorage.keys());
  }
}
