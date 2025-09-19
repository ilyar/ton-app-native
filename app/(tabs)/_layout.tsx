import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'WalletKit',
          tabBarIcon: ({ color }) => <MaterialIcons color={color} size={28} name="wallet" />,
        }}
      />
      <Tabs.Screen
        name="decode"
        options={{
          title: 'Decode',
          tabBarIcon: ({ color }) => <MaterialIcons color={color} size={28} name="toll" />,
        }}
      />
      <Tabs.Screen
        name="encode"
        options={{
          title: 'Encode',
          tabBarIcon: ({ color }) => <MaterialIcons color={color} size={28} name="tonality" />,
        }}
      />
    </Tabs>
  );
}
