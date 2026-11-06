import type { ComponentProps } from 'react';
import { OtpInput } from '../../components/otp-input/otp-input';
import { appearance } from '../tokens';

export const DsOtpInput = (
  props: Omit<ComponentProps<typeof OtpInput>, 'appearance'>,
) => <OtpInput autoFocus={false} {...props} appearance={appearance} />;
