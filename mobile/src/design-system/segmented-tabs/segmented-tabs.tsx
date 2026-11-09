import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { DsText } from '../text/text';
import { tokens } from '../tokens';

export interface DsSegmentedTab<T extends string> {
  id: T;
  label: string;
  icon?: (color: string) => ReactNode;
}

interface DsSegmentedTabsProps<T extends string> {
  tabs: readonly DsSegmentedTab<T>[];
  value: T;
  onChange: (id: T) => void;
}

export const DsSegmentedTabs = <T extends string>({
  tabs,
  value,
  onChange,
}: DsSegmentedTabsProps<T>) => (
  <View accessibilityRole="tablist" style={styles.row}>
    {tabs.map((tab) => {
      const selected = tab.id === value;
      const color = selected
        ? tokens.colors.onPrimary
        : tokens.colors.textMuted;
      const content = (
        <>
          {tab.icon?.(color)}
          <DsText
            role="caption"
            style={{
              color,
              fontFamily: tokens.fonts.bold,
              fontWeight: '600',
              fontSize: 14,
            }}
          >
            {tab.label}
          </DsText>
        </>
      );
      return (
        <Pressable
          key={tab.id}
          accessibilityRole="tab"
          accessibilityState={{ selected }}
          onPress={() => onChange(tab.id)}
          style={[styles.tab, !selected && styles.idle]}
        >
          {selected ? (
            <LinearGradient
              colors={tokens.actionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.content}
            >
              {content}
            </LinearGradient>
          ) : (
            <View style={styles.content}>{content}</View>
          )}
        </Pressable>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  tab: {
    flex: 1,
    minHeight: tokens.controlMinHeight,
    borderRadius: tokens.radius.button,
    overflow: 'hidden',
  },
  idle: {
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.surface,
  },
  content: {
    flex: 1,
    minHeight: tokens.controlMinHeight,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
});
