import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DsButton, DsText, tokens } from '../../design-system';
import { OnboardingArt } from './onboarding-art';
import {
  ONBOARDING_STEPS,
  isLastStep,
  nextStepIndex,
} from './onboarding-rules';
import { LinearGradient } from 'expo-linear-gradient';

interface OnboardingScreenProps {
  onFinish: () => Promise<void>;
}

export const OnboardingScreen = ({ onFinish }: OnboardingScreenProps) => {
  const [index, setIndex] = useState(0);
  const step = ONBOARDING_STEPS[index]!;
  const last = isLastStep(index);

  async function finish() {
    await onFinish();
    router.replace('/(tabs)');
  }

  return (
    <LinearGradient colors={tokens.backgroundGradient} style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <View style={styles.top}>
          {step.skippable && (
            <DsButton
              label="Pular"
              variant="text"
              onPress={() => {
                void finish();
              }}
            />
          )}
        </View>
        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
        >
          <OnboardingArt id={step.id} />
          <View style={styles.copy}>
            <DsText role="title" style={[styles.center, styles.title]}>
              {step.title}
            </DsText>
            <DsText style={[styles.center, styles.description]}>
              {step.description}
            </DsText>
          </View>
        </ScrollView>
        <View style={styles.bottom}>
          <View
            accessible
            accessibilityRole="image"
            accessibilityLabel={`Passo ${index + 1} de ${ONBOARDING_STEPS.length}`}
            style={styles.dots}
          >
            {ONBOARDING_STEPS.map((item, position) =>
              position === index ? (
                <LinearGradient
                  key={item.id}
                  colors={tokens.actionGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.dotActive}
                />
              ) : (
                <View key={item.id} style={styles.dot} />
              ),
            )}
          </View>
          <DsButton
            label={step.action}
            onPress={() => {
              if (last) void finish();
              else setIndex(nextStepIndex(index));
            }}
            style={styles.action}
          />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  fill: { flex: 1 },
  top: {
    minHeight: 48,
    paddingHorizontal: 24,
    paddingTop: 8,
    alignItems: 'flex-end',
  },
  body: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  copy: { gap: 10, maxWidth: 310 },
  center: { textAlign: 'center' },
  title: { fontSize: 26, lineHeight: 32 },
  description: { fontSize: 15, lineHeight: 22, color: tokens.colors.textMuted },
  bottom: { paddingHorizontal: 24, paddingBottom: 24, gap: 24 },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: tokens.colors.border,
  },
  dotActive: { width: 28, height: 8, borderRadius: 4 },
  action: { alignSelf: 'stretch', minHeight: 52 },
});
