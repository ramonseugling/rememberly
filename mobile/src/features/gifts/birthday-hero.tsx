import { LinearGradient } from 'expo-linear-gradient';
import { Share2 } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { DsAvatar, DsGradientText, DsText, tokens } from '../../design-system';
import { BirthdayHat } from './birthday-hat';
import { ConfettiLayer } from './confetti';
import type { ConfettiPiece } from './confetti';
import type { BirthdayCard } from './model';

interface BirthdayHeroProps {
  name: string;
  photoUri: string | null;
  card: BirthdayCard | null;
  onShare?: () => void;
  children?: ReactNode;
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

export const BirthdayHero = ({
  name,
  photoUri,
  card,
  onShare,
  children,
}: BirthdayHeroProps) => {
  const today = card?.days === 0;
  return (
    <View style={styles.shadow}>
      <LinearGradient
        colors={tokens.celebration}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.4, y: 1 }}
        style={[styles.card, today && styles.cardToday]}
      >
        <ConfettiLayer pieces={confetti} width={CARD_WIDTH} />
        {onShare && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Compartilhar lista"
            onPress={onShare}
            style={({ pressed }) => [styles.share, pressed && { opacity: 0.8 }]}
          >
            <Share2 size={20} color={tokens.colors.actionText} />
          </Pressable>
        )}
        <View style={styles.photo}>
          <DsAvatar name={name} size={92} photoUri={photoUri} />
          {today && (
            <View style={styles.crown}>
              <BirthdayHat />
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
              {card.days === 1 ? 'Falta 1 dia' : `Faltam ${card.days} dias`}
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
        {children && <View style={styles.children}>{children}</View>}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  shadow: {
    borderRadius: 28,
    backgroundColor: tokens.celebration[0],
    boxShadow: '0 8px 24px rgba(108, 39, 77, 0.10)',
  },
  cardToday: { paddingTop: 44 },
  card: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#F7D9E4',
    paddingTop: 26,
    paddingBottom: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 6,
    overflow: 'hidden',
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
    right: 7,
    top: -38,
    transform: [{ rotate: '20deg' }],
  },
  share: {
    position: 'absolute',
    right: 12,
    top: 12,
    zIndex: 2,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    boxShadow: '0 2px 8px rgba(108, 39, 77, 0.12)',
  },
  children: { alignSelf: 'stretch', gap: 10, marginTop: 14 },
  copy: { alignItems: 'center', gap: 2, marginTop: 6 },
  number: {
    fontFamily: tokens.fonts.headingBold,
    fontWeight: '700',
    fontSize: 38,
    lineHeight: 46,
    textAlign: 'center',
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
