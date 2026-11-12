import {
  Cake,
  CalendarPlus,
  ChevronRight,
  Gift,
  Plus,
  Share2,
  Users,
} from 'lucide-react-native';
import { Image, StyleSheet, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import type { ReactNode } from 'react';
import {
  DsAvatar,
  DsBadge,
  DsGradientText,
  DsText,
  DsDaysBadge,
  tokens,
} from '../../design-system';
import { LinearGradient } from 'expo-linear-gradient';
import type { OnboardingStepId } from './onboarding-rules';

const pink = require('../../../assets/avatars/pink-avatar.png');
const yellow = require('../../../assets/avatars/yellow-avatar.png');
const purple = require('../../../assets/avatars/purple-avatar.png');
const logo = require('../../../assets/brand/new-3d-logo.png');
const giftFone = require('../../../assets/gifts/fone.png');
const giftLivro = require('../../../assets/gifts/livro.png');
const giftTenis = require('../../../assets/gifts/tenis.png');

function GradientBar({
  label,
  icon,
}: {
  label: string;
  icon: 'plus' | 'share';
}) {
  return (
    <LinearGradient
      colors={tokens.actionGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.bar}
    >
      {icon === 'plus' ? (
        <Plus size={16} color={tokens.colors.onPrimary} />
      ) : (
        <Share2 size={16} color={tokens.colors.onPrimary} />
      )}
      <DsText role="caption" style={styles.barText}>
        {label}
      </DsText>
    </LinearGradient>
  );
}

function PersonRow({
  name,
  subtitle,
  source,
  badge,
}: {
  name: string;
  subtitle: string;
  source: ImageSourcePropType;
  badge: ReactNode;
}) {
  return (
    <View style={styles.row}>
      <DsAvatar name={name} size={40} source={source} />
      <View style={styles.grow}>
        <DsText role="label" style={styles.rowTitle}>
          {name}
        </DsText>
        <View style={styles.inline}>
          <Cake size={12} color={tokens.colors.brand} />
          <DsText role="caption" style={styles.muted}>
            {subtitle}
          </DsText>
        </View>
      </View>
      {badge}
    </View>
  );
}

function Heading({ children }: { children: string }) {
  return (
    <DsText role="section" style={styles.heading}>
      {children}
    </DsText>
  );
}

function GiftRow({
  title,
  note,
  source,
}: {
  title: string;
  note: string;
  source: ImageSourcePropType;
}) {
  return (
    <View style={styles.row}>
      <Image source={source} style={styles.giftPhoto} />
      <View style={styles.grow}>
        <DsText role="label" style={styles.rowTitle}>
          {title}
        </DsText>
        <DsText role="caption" style={styles.muted}>
          {note}
        </DsText>
      </View>
    </View>
  );
}

export function OnboardingArt({ id }: { id: OnboardingStepId }) {
  if (id === 'welcome')
    return (
      <View style={styles.welcome}>
        <Image source={logo} style={styles.bigLogo} resizeMode="contain" />
        <DsGradientText
          style={{
            fontFamily: tokens.fonts.headingBold,
            fontWeight: '700',
            fontSize: 32,
            lineHeight: 38,
          }}
        >
          Rememberly
        </DsGradientText>
      </View>
    );
  if (id === 'events')
    return (
      <View style={styles.card}>
        <GradientBar label="Adicionar evento" icon="plus" />
        <Heading>Próximos 7 dias</Heading>
        <PersonRow
          name="Marina"
          subtitle="Aniversário"
          source={pink}
          badge={<DsDaysBadge days={0} />}
        />
        <PersonRow
          name="Rafael"
          subtitle="Aniversário"
          source={yellow}
          badge={<DsDaysBadge days={7} />}
        />
        <Heading>Este mês</Heading>
        <PersonRow
          name="Vó Lúcia"
          subtitle="Aniversário"
          source={purple}
          badge={<DsBadge label="28 nov" />}
        />
      </View>
    );
  if (id === 'groups')
    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={[styles.groupIcon]}>
            <Users size={18} color={tokens.groupPalette[0].color} />
          </View>
          <View style={styles.grow}>
            <DsText role="label" style={styles.rowTitle}>
              Família
            </DsText>
            <DsText role="caption" style={styles.muted}>
              8 membros · Criado por você
            </DsText>
          </View>
          <ChevronRight size={14} color={tokens.colors.textMuted} />
        </View>
        <Heading>Próximos aniversários</Heading>
        <PersonRow
          name="Marina"
          subtitle="15 de novembro"
          source={pink}
          badge={<DsDaysBadge days={7} />}
        />
        <PersonRow
          name="Rafael"
          subtitle="20 de novembro"
          source={yellow}
          badge={<DsDaysBadge days={12} />}
        />
        <GradientBar label="Convidar" icon="share" />
      </View>
    );
  if (id === 'gifts')
    return (
      <View style={styles.card}>
        <Heading>Minha lista de presentes</Heading>
        <GiftRow title="Fone de ouvido" note="Na cor preta" source={giftFone} />
        <GiftRow
          title="Livro de receitas"
          note="Edição de capa dura"
          source={giftLivro}
        />
        <GiftRow title="Tênis de corrida" note="Número 38" source={giftTenis} />
        <GradientBar label="Adicionar presente" icon="plus" />
      </View>
    );
  return (
    <View style={styles.card}>
      <View style={styles.profile}>
        <DsAvatar name="Ana Souza" size={72} source={pink} />
        <DsText role="section">Ana Souza</DsText>
        <DsText role="caption" style={styles.muted}>
          ana@exemplo.com
        </DsText>
      </View>
      <View style={styles.row}>
        <View style={styles.giftIcon}>
          <CalendarPlus size={18} color={tokens.colors.brand} />
        </View>
        <View style={styles.grow}>
          <DsText role="label" style={styles.rowTitle}>
            Notificações
          </DsText>
          <DsText role="caption" style={styles.muted}>
            Push e e-mail
          </DsText>
        </View>
        <ChevronRight size={14} color={tokens.colors.textMuted} />
      </View>
      <View style={styles.row}>
        <View style={styles.giftIcon}>
          <Gift size={18} color={tokens.colors.brand} />
        </View>
        <View style={styles.grow}>
          <DsText role="label" style={styles.rowTitle}>
            Datas especiais
          </DsText>
          <DsText role="caption" style={styles.muted}>
            Dia das Mães e mais
          </DsText>
        </View>
        <ChevronRight size={14} color={tokens.colors.textMuted} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  welcome: { alignItems: 'center', gap: 4 },
  bigLogo: { width: 200, height: 200 },
  card: {
    width: 310,
    maxWidth: '100%',
    padding: 14,
    gap: 8,
    borderRadius: tokens.radius.sheet,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.surface,
    boxShadow: '0 16px 36px rgba(108, 39, 77, 0.14)',
  },
  bar: {
    height: 40,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  barText: {
    color: tokens.colors.onPrimary,
    fontFamily: tokens.fonts.bold,
    fontWeight: '700',
    fontSize: 14,
  },
  heading: { fontSize: 15, lineHeight: 20, marginTop: 4 },
  row: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: '#FFFFFF',
  },
  rowTitle: { fontSize: 14, lineHeight: 19 },
  grow: { flex: 1, minWidth: 0 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  muted: { color: tokens.colors.textMuted, fontSize: 12, lineHeight: 16 },
  giftPhoto: { width: 40, height: 40, borderRadius: 10 },
  giftIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.iconSurface,
  },
  groupIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.groupPalette[0].surface,
  },
  profile: { alignItems: 'center', gap: 4, paddingVertical: 4 },
});
