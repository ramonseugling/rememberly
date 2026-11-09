import { useState } from 'react';
import { router } from 'expo-router';
import { ArrowLeft, Calendar, Heart, Plus, Users } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  DsAvatar,
  DsBackHeader,
  DsBrandHeader,
  DsBadge,
  DsButton,
  DsCard,
  DsCheckbox,
  DsConfirmSheet,
  DsChip,
  DsDaysBadge,
  DsEmptyState,
  DsFeedback,
  DsField,
  DsListCard,
  DsOtpInput,
  DsRow,
  DsSegmentedTabs,
  DsSelect,
  DsSheet,
  DsSwitch,
  DsText,
} from './index';
import { tokens } from './tokens';
import { ReferenceComposition } from './reference-composition';

export const DesignSystemCatalog = () => {
  const [field, setField] = useState('');
  const [checked, setChecked] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [selection, setSelection] = useState('birthday');
  const [code, setCode] = useState('');
  const [sheet, setSheet] = useState(false);
  const [segment, setSegment] = useState<'events' | 'members' | 'settings'>(
    'events',
  );
  const [chip, setChip] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [feedback, setFeedback] = useState(
    'Nenhuma ação real é executada neste catálogo.',
  );
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar ao perfil"
          onPress={() =>
            router.canGoBack()
              ? router.back()
              : router.replace('/(tabs)/profile')
          }
          style={styles.back}
        >
          <ArrowLeft size={20} color={tokens.colors.text} />
          <DsText>Voltar ao perfil</DsText>
        </Pressable>
        <DsText role="title">Design system</DsText>
        <DsBadge label="DESENVOLVIMENTO · DEMONSTRAÇÃO" />
        <DsText>
          Referência visual: fundos rosados, listas compactas e ações em rosa.
          Toque nos controles, mantenha os botões pressionados e amplie o texto
          nas configurações do dispositivo. Todos os valores abaixo são exemplos
          locais.
        </DsText>

        <DsText role="section">Composição do mock · demonstração</DsText>
        <ReferenceComposition onOpenExample={() => setSheet(true)} />

        <DsText role="section">Cores e tipografia</DsText>
        <DsCard>
          <View style={styles.swatches}>
            {[
              ['Ação', tokens.colors.primary],
              ['Rosa da marca', tokens.colors.brand],
              ['Fundo', tokens.colors.background],
              ['Hoje', tokens.colors.todaySurface],
              ['Badge', tokens.colors.surfaceMuted],
              ['Família', tokens.colors.familySurface],
              ['Amigos', tokens.colors.friends],
              ['Texto', tokens.colors.text],
              ['Secundário', tokens.colors.textMuted],
              ['Superfície', tokens.colors.surface],
              ['Erro', tokens.colors.danger],
              ['Sucesso', tokens.colors.success],
            ].map(([label, color]) => (
              <View style={styles.swatch} key={label}>
                <View
                  accessible={false}
                  style={[styles.color, { backgroundColor: color }]}
                />
                <DsText role="caption">
                  {label} · {color}
                </DsText>
              </View>
            ))}
          </View>
          <DsText role="title">Eventos que importam</DsText>
          <DsText role="section">Perto de quem você gosta</DsText>
          <DsText>
            Fonte nativa, títulos compactos e hierarquia próxima à referência.
          </DsText>
          <DsText role="caption">Legenda de apoio · 12/17</DsText>
        </DsCard>

        <DsText role="section">Ações</DsText>
        <DsCard>
          <DsButton
            label="Adicionar evento"
            icon={<Plus size={18} color={tokens.colors.onPrimary} />}
            onPress={() =>
              setFeedback('Botão primário acionado. Nenhum evento foi criado.')
            }
          />
          <DsButton
            label="Ação secundária"
            variant="outline"
            onPress={() => setFeedback('Ação secundária de demonstração.')}
          />
          <DsButton
            label="Ação destrutiva de exemplo"
            variant="destructive"
            onPress={() =>
              setFeedback(
                'Exemplo de ação destrutiva. Nenhum dado foi excluído.',
              )
            }
          />
          <DsButton
            label="Ação textual"
            variant="text"
            onPress={() => setFeedback('Ação textual de demonstração.')}
          />
          <DsButton label="Desabilitado" disabled onPress={() => {}} />
          <DsButton label="Carregando" pending onPress={() => {}} />
          <DsFeedback tone="info" message={feedback} />
        </DsCard>

        <DsText role="section">Formulários</DsText>
        <DsCard>
          <DsField
            label="Nome de demonstração"
            placeholder="Digite para ver o foco"
            value={field}
            onChangeText={setField}
            hint="Este valor não é salvo na sua conta."
          />
          <DsField
            label="Senha de demonstração"
            placeholder="••••••••"
            secureTextEntry
          />
          <DsField
            label="Campo desabilitado"
            value="Somente leitura"
            editable={false}
          />
          <DsField
            label="Campo com erro"
            value="Exemplo"
            editable={false}
            error="Exemplo de mensagem de erro com orientação."
          />
          <DsSelect
            label="Tipo de evento"
            value={selection}
            options={[
              { label: 'Aniversário', value: 'birthday' },
              { label: 'Celebração', value: 'celebration' },
            ]}
            onChange={setSelection}
          />
          <DsSwitch
            label="Preferência de demonstração"
            value={enabled}
            onValueChange={setEnabled}
          />
          <DsSwitch
            label="Switch desabilitado"
            value={false}
            disabled
            onValueChange={() => {}}
          />
          <DsCheckbox
            label="Checkbox de demonstração, sem inscrição em comunicações"
            checked={checked}
            onChange={setChecked}
          />
          <DsCheckbox
            label="Checkbox desabilitado"
            checked={false}
            disabled
            onChange={() => {}}
          />
          <DsText role="label">Código de demonstração</DsText>
          <DsOtpInput value={code} onChange={setCode} />
          <DsText role="caption">
            Digite ou cole seis dígitos. Nenhum código é enviado ou validado.
          </DsText>
        </DsCard>

        <DsText role="section">Superfícies e feedback</DsText>
        <DsCard>
          <DsRow
            title="Evento de demonstração"
            subtitle="Texto longo pode quebrar linha sem esconder informações importantes."
            leading={<Calendar size={20} color={tokens.colors.primary} />}
            onPress={() => setSheet(true)}
          />
          <DsRow
            title="Somente leitura"
            subtitle="Sem ação associada"
            leading={<Heart size={20} color={tokens.colors.primary} />}
          />
          <View style={styles.badges}>
            <DsBadge label="Informação" />
            <DsBadge label="Destaque" tone="primary" />
            <DsBadge label="Confirmado" tone="success" />
            <DsBadge label="Atenção" tone="danger" />
          </View>
          <View style={styles.badges}>
            <DsDaysBadge days={0} />
            <DsDaysBadge days={7} />
            <DsDaysBadge days={30} farLabel="15 dez" />
          </View>
          <View style={styles.badges}>
            <DsAvatar name="Ana" size={48} />
            <DsAvatar name="Marina" size={56} />
            <DsAvatar name="Perfil com lápis" size={72} onEdit={() => {}} />
          </View>
          <DsBackHeader label="Perfil" onPress={() => {}} />
          <DsBrandHeader />
          <DsButton
            label="Abrir confirmação"
            variant="outline"
            onPress={() => setConfirmOpen(true)}
          />
          <DsSegmentedTabs
            value={segment}
            onChange={setSegment}
            tabs={[
              { id: 'events', label: 'Eventos' },
              { id: 'members', label: 'Membros' },
              { id: 'settings', label: 'Ajustes' },
            ]}
          />
          <View style={styles.badges}>
            <DsChip
              label="Aniversário"
              selected={chip}
              onPress={() => setChip(!chip)}
            />
            <DsChip
              label="Amigos da faculdade"
              icon={<Users size={14} color={tokens.colors.textMuted} />}
            />
          </View>
          <DsEmptyState
            title="Comemore junto de quem importa"
            description="Crie um grupo e compartilhe aniversários com família, amigos ou colegas."
            actionLabel="Criar meu primeiro grupo"
            onAction={() => {}}
          />
          <DsListCard
            title="Datas especiais"
            subtitle="Dia das Mães, Dia dos Pais e mais"
            icon={<Heart size={22} color={tokens.colors.brand} />}
            onPress={() => setSheet(true)}
          />
          <DsFeedback tone="success" message="Exemplo: alteração concluída." />
          <DsFeedback
            tone="error"
            message="Exemplo: não foi possível salvar. Confira sua conexão e tente novamente."
          />
          <DsButton
            variant="outline"
            label="Abrir painel"
            onPress={() => setSheet(true)}
          />
        </DsCard>
        <DsText role="caption">
          Pilotos reais: Eventos e Perfil. Demais telas aguardam aprovação
          visual para migração.
        </DsText>
      </ScrollView>
      <DsConfirmSheet
        visible={confirmOpen}
        title="Excluir evento?"
        message="“Aniversário da Ana” será removido permanentemente."
        confirmLabel="Excluir"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => setConfirmOpen(false)}
      />
      <DsSheet
        visible={sheet}
        title="Painel de demonstração"
        onClose={() => setSheet(false)}
      >
        <DsText>
          O fundo fica parado enquanto somente o painel se move. Nenhuma
          alteração é enviada.
        </DsText>
        <DsField
          label="Campo no painel"
          placeholder="Teste o teclado e a rolagem"
        />
        <DsButton label="Fechar demonstração" onPress={() => setSheet(false)} />
      </DsSheet>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.colors.background },
  content: { paddingHorizontal: 16, paddingVertical: 24, gap: 20 },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 48,
    alignSelf: 'flex-start',
  },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  swatch: { flexGrow: 1, flexBasis: 100, gap: 6 },
  color: {
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
