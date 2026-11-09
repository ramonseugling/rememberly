import { Users } from 'lucide-react-native';
import { DsAvatar } from '../../design-system';
import { groupColors } from './group-palette';
import type { Group } from './model';

interface GroupAvatarProps {
  group: Pick<Group, 'id' | 'name' | 'photo_url'>;
  size?: number;
  onEdit?: () => void;
}

export const GroupAvatar = ({ group, size = 48, onEdit }: GroupAvatarProps) => {
  const palette = groupColors(group.id);
  return (
    <DsAvatar
      name={group.name}
      size={size}
      photoUri={group.photo_url}
      background={palette.surface}
      fallback={<Users size={Math.round(size * 0.5)} color={palette.color} />}
      onEdit={onEdit}
      editLabel="Editar foto do grupo"
    />
  );
};
