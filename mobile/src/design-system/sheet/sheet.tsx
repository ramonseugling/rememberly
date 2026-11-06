import type { ComponentProps } from 'react';
import { BottomSheet } from '../../components/bottom-sheet/bottom-sheet';
import { appearance } from '../tokens';

export const DsSheet = (
  props: Omit<ComponentProps<typeof BottomSheet>, 'appearance'>,
) => <BottomSheet {...props} appearance={appearance} />;
