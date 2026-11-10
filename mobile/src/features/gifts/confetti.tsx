import { View } from 'react-native';

export interface ConfettiPiece {
  left: number;
  top: number;
  w: number;
  h: number;
  rotate: number;
  color: string;
}

interface ConfettiLayerProps {
  pieces: readonly ConfettiPiece[];
  width: number;
  opacity?: number;
}

export const ConfettiLayer = ({
  pieces,
  width,
  opacity = 0.9,
}: ConfettiLayerProps) => (
  <>
    {pieces.map((piece, index) => (
      <View
        key={index}
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: `${(piece.left / width) * 100}%`,
          top: piece.top,
          width: piece.w,
          height: piece.h,
          borderRadius: 2,
          backgroundColor: piece.color,
          opacity,
          transform: [{ rotate: `${piece.rotate}deg` }],
        }}
      />
    ))}
  </>
);
