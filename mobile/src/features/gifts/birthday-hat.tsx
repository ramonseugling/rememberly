import Svg, { Circle, Path } from 'react-native-svg';
import { tokens } from '../../design-system';

export const BirthdayHat = ({ size = 52 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 5 L19 21 H5 Z"
      fill="#FEC8A0"
      stroke={tokens.colors.brand}
      strokeWidth={1.5}
      strokeLinejoin="round"
    />
    <Path
      d="M8.6 13 L15.4 13 M6.9 17 L17.1 17"
      stroke={tokens.colors.brand}
      strokeWidth={1.5}
      strokeLinecap="round"
    />
    <Circle cx={12} cy={4} r={2} fill={tokens.colors.brand} />
  </Svg>
);
