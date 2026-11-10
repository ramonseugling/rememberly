import { LinearGradient } from 'expo-linear-gradient';
import { Crown } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { DsAvatar, DsGradientText, DsText, tokens } from '../../design-system';
import { ConfettiLayer } from './confetti';
import type { ConfettiPiece } from './confetti';
import type { BirthdayCard } from './model';

interface BirthdayHeroProps {
  name: string;
  photoUri: string | null;
  card: BirthdayCard | null;
}

const CARD_WIDTH = 358;

const confetti: readonly ConfettiPiece[] = [
  { left: 24, top: 22, w: 10, h: 5, rotate: 20, color: '#F7A8C4' },
  { left: 70, top: 70, w: 6, h: 6, rotate: 0, color: '#FEC8A0' },
  { left: 300, top: 26, w: 10, h: 5, rotate: -30, color: '#F58FB0' },
  { left: 330, top: 92, w: 6, h: 6, rotate: 0, color: '#FDB87C' },
  { left: 250, top: 60, w: 6, h: 6, rotate: 0, color: '#F7A8C4' },
  { left: 34, top: 130, w: 8, h: 4, rotate: 40, color: '#FDB87C' },
  { left: 318, top: 150, w: 10, h: 5, rotate: 15, color: '#F7A8C4' },
  { left: 120, top: 18, w: 8, h: 4, rotate: -20, color: '#F58FB0' },
  { left: 200, top: 14, w: 6, h: 6, rotate: 0, color: '#FEC8A0' },
  { left: 14, top: 86, w: 6, h: 6, rotate: 0, color: '#F58FB0' },
  { left: 352, top: 60, w: 8, h: 4, rotate: 35, color: '#FEC8A0' },
  { left: 96, top: 150, w: 6, h: 6, rotate: 0, color: '#F7A8C4' },
];

export const BirthdayHero = ({ name, photoUri, card }: BirthdayHeroProps) => {
  const today = card?.days === 0;
  return (
    <LinearGradient
      colors={tokens.celebration}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.4, y: 1 }}
      style={styles.card}
    >
      <ConfettiLayer pieces={confetti} width={CARD_WIDTH} />
      <View style={styles.photo}>
        <DsAvatar name={name} size={92} photoUri={photoUri} />
        {today && (
          <View style={styles.crown}>
            <Crown
              size={38}
              color={tokens.colors.brand}
              fill="#FEC8A0"
              strokeWidth={1.6}
            />
          </View>
        )}
      </View>
      {card && today ? (
        <View style={styles.copy}>
          <DsGradientText style={styles.today}>
            {`Feliz aniversário, ${name}! 🎉`}
          </DsGradientText>
          <DsText style={styles.muted}>
            Hoje é o seu dia. Sua lista de presentes está pronta para quem
            quiser te surpreender.
          </DsText>
        </View>
      ) : card ? (
        <View style={styles.copy}>
          <DsGradientText style={styles.number}>
            {`${card.days} `}
            <DsText style={styles.unit}>
              {card.days === 1 ? 'dia' : 'dias'}
            </DsText>
          </DsGradientText>
          <DsText role="label" style={styles.label}>
            para o seu aniversário
          </DsText>
          <DsText role="caption" style={styles.muted}>
            {card.age
              ? `${card.dateLabel} · você faz ${card.age} anos`
              : card.dateLabel}
          </DsText>
        </View>
      ) : (
        <View style={styles.copy}>
          <DsText role="section" style={styles.centered}>
            Sua lista de presentes
          </DsText>
          <DsText role="caption" style={styles.muted}>
            Informe sua data de nascimento no perfil para ver quantos dias
            faltam para o seu aniversário.
          </DsText>
        </View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    paddingTop: 26,
    paddingBottom: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 6,
    overflow: 'hidden',
    boxShadow: '0 8px 24px rgba(108, 39, 77, 0.10)',
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    boxShadow: '0 8px 22px rgba(229, 53, 101, 0.25)',
  },
  crown: {
    position: 'absolute',
    right: -12,
    top: -22,
    transform: [{ rotate: '18deg' }],
  },
  copy: { alignItems: 'center', gap: 2, marginTop: 6 },
  number: {
    fontFamily: tokens.fonts.headingBold,
    fontWeight: '700',
    fontSize: 60,
    lineHeight: 66,
    textAlign: 'center',
  },
  unit: {
    fontFamily: tokens.fonts.headingBold,
    fontWeight: '700',
    fontSize: 32,
    lineHeight: 66,
  },
  today: {
    fontFamily: tokens.fonts.headingBold,
    fontWeight: '700',
    fontSize: 28,
    lineHeight: 34,
    textAlign: 'center',
  },
  label: { textAlign: 'center' },
  centered: { textAlign: 'center' },
  muted: {
    color: tokens.colors.textMuted,
    textAlign: 'center',
  },
});
