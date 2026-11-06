import type { ComponentProps } from 'react';
import { SelectField } from '../../components/select-field/select-field';
import { appearance, tokens } from '../tokens';

export const DsSelect = (
  props: Omit<
    ComponentProps<typeof SelectField>,
    'appearance' | 'controlStyle'
  >,
) => (
  <SelectField
    {...props}
    appearance={appearance}
    controlStyle={{
      minHeight: tokens.controlMinHeight,
      borderRadius: tokens.radius.control,
    }}
  />
);
