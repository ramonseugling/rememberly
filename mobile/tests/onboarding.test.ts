import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ONBOARDING_STEPS,
  isLastStep,
  nextStepIndex,
  onboardingStorageKey,
  previousStepIndex,
  parseOnboardingSeen,
} from '../src/features/onboarding/onboarding-rules.ts';

test('onboarding has five steps, only the last one cannot be skipped', () => {
  assert.equal(ONBOARDING_STEPS.length, 5);
  assert.deepEqual(
    ONBOARDING_STEPS.map((step) => step.skippable),
    [true, true, true, true, false],
  );
  assert.equal(ONBOARDING_STEPS[0]!.action, 'Vamos lá');
  assert.equal(ONBOARDING_STEPS.at(-1)!.action, 'Começar');
});

test('step navigation stops at the last step', () => {
  assert.equal(nextStepIndex(0), 1);
  assert.equal(nextStepIndex(4), 4);
  assert.equal(isLastStep(3), false);
  assert.equal(isLastStep(4), true);
});

test('seen flag is per environment, origin and user and only accepts 1', () => {
  const key = onboardingStorageKey('staging', 'https://a.example', 'u1');
  assert.match(key, /^rememberly\.onboarding\./);
  assert.notEqual(
    key,
    onboardingStorageKey('staging', 'https://a.example', 'u2'),
  );
  assert.notEqual(
    key,
    onboardingStorageKey('production', 'https://a.example', 'u1'),
  );
  assert.equal(parseOnboardingSeen('1'), true);
  assert.equal(parseOnboardingSeen('0'), false);
  assert.equal(parseOnboardingSeen(null), false);
});

test('going back never leaves the first step', () => {
  assert.equal(previousStepIndex(3), 2);
  assert.equal(previousStepIndex(0), 0);
});
