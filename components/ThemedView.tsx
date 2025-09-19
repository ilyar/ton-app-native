import React from 'react';
import { Text, View, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, children, ...otherProps }: ThemedViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  // Map deprecated prop pointerEvents -> style.pointerEvents to silence RN web warning
   
  const { pointerEvents, ...restProps } = otherProps as any;
   
  const composedStyle: any[] = [{ backgroundColor }];
  if (style) composedStyle.push(style as any);
  if (pointerEvents) composedStyle.push({ pointerEvents });

  const wrapPrimitive = (node: unknown) =>
    typeof node === 'string' || typeof node === 'number' ? <Text>{node}</Text> : (node as React.ReactNode);

  const normalizedChildren = React.Children.map(children, wrapPrimitive);

  return (
    <View style={composedStyle} {...restProps}>
      {normalizedChildren}
    </View>
  );
}
