import { Camera, Image as ImageIcon, Trash2 } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import {
  DsAvatar,
  DsFeedback,
  DsListCard,
  DsSheet,
  tokens,
} from '../../design-system';
import type { PhotoSource } from './photo-rules';

interface PhotoSheetProps {
  visible: boolean;
  title: string;
  name: string;
  photoUri: string | null;
  pending: boolean;
  error: string | null;
  onChoose: (source: PhotoSource) => void;
  onRemove: () => void;
  onClose: () => void;
}

export const PhotoSheet = ({
  visible,
  title,
  name,
  photoUri,
  pending,
  error,
  onChoose,
  onRemove,
  onClose,
}: PhotoSheetProps) => (
  <DsSheet visible={visible} title={title} pending={pending} onClose={onClose}>
    <View style={styles.preview}>
      <DsAvatar name={name} size={96} photoUri={photoUri} />
    </View>
    {error && <DsFeedback tone="error" message={error} />}
    <View style={styles.options}>
      <DsListCard
        title="Tirar foto"
        icon={<Camera size={20} color={tokens.colors.brand} />}
        disabled={pending}
        trailing={<View />}
        onPress={() => onChoose('camera')}
      />
      <DsListCard
        title="Escolher da galeria"
        icon={<ImageIcon size={20} color={tokens.colors.brand} />}
        disabled={pending}
        trailing={<View />}
        onPress={() => onChoose('library')}
      />
      {photoUri && (
        <DsListCard
          title="Remover foto"
          icon={<Trash2 size={20} color={tokens.colors.danger} />}
          disabled={pending}
          trailing={<View />}
          onPress={onRemove}
        />
      )}
    </View>
  </DsSheet>
);

const styles = StyleSheet.create({
  preview: { alignItems: 'center' },
  options: { gap: 8 },
});
