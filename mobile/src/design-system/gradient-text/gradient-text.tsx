import MaskedViewNative from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentProps, ComponentType, ReactElement } from 'react';
import type { ViewProps } from 'react-native';
import { DsText } from '../text/text';
import { tokens } from '../tokens';

// The package types its class component with an older React typing.
const MaskedView = MaskedViewNative as unknown as ComponentType<
  ViewProps & { maskElement: ReactElement }
>;

type DsGradientTextProps = ComponentProps<typeof DsText>;

export const DsGradientText = ({ style, ...props }: DsGradientTextProps) => (
  <MaskedView
    accessible={false}
    importantForAccessibility="no-hide-descendants"
    maskElement={<DsText {...props} style={[style, { color: '#000' }]} />}
  >
    <LinearGradient
      colors={tokens.actionGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <DsText {...props} style={[style, { opacity: 0 }]} />
    </LinearGradient>
  </MaskedView>
);
