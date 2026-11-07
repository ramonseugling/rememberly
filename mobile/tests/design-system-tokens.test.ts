import assert from 'node:assert/strict';
import test from 'node:test';
import { tokens } from '../src/design-system/tokens.ts';

function luminance(hex: string): number {
  const rgb = [1, 3, 5].map((offset) => {
    const channel = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return rgb[0]! * 0.2126 + rgb[1]! * 0.7152 + rgb[2]! * 0.0722;
}

function contrast(foreground: string, background: string): number {
  const values = [luminance(foreground), luminance(background)].sort(
    (a, b) => b - a,
  );
  return (values[0]! + 0.05) / (values[1]! + 0.05);
}

test('design system text pairs meet normal-text contrast across supported surfaces', () => {
  const colors = tokens.colors;
  for (const foreground of [
    colors.text,
    colors.textMuted,
    colors.actionText,
    colors.danger,
    colors.success,
  ]) {
    for (const background of [
      colors.background,
      colors.surface,
      colors.surfaceMuted,
    ]) {
      assert.ok(
        contrast(foreground, background) >= 4.5,
        `${foreground} on ${background} must reach 4.5:1`,
      );
    }
  }
  assert.ok(contrast(colors.onPrimary, colors.primary) >= 4.5);
  assert.ok(contrast(colors.onPrimary, colors.primaryPressed) >= 4.5);
  assert.ok(contrast(colors.todayText, colors.todaySurface) >= 4.5);
  assert.ok(contrast(colors.textMuted, colors.surfaceMuted) >= 4.5);
  for (const background of tokens.celebration)
    assert.ok(contrast(colors.text, background) >= 4.5);
  for (const background of [
    ...tokens.actionGradient,
    ...tokens.actionPressedGradient,
  ])
    assert.ok(contrast(colors.onPrimary, background) >= 4.5);
});

test('enabled control boundaries remain distinguishable from input surfaces', () => {
  for (const surface of [tokens.colors.surface, tokens.colors.background]) {
    assert.ok(
      contrast(tokens.colors.controlBorder, surface) >= 3,
      `control boundary on ${surface} must reach 3:1`,
    );
  }
});
