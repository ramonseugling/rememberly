import { MigrationBuilder } from 'node-pg-migrate';

export const up = (pgm: MigrationBuilder) => {
  pgm.createTable('group_members', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    group_id: {
      type: 'uuid',
      notNull: true,
      references: 'groups(id)',
      onDelete: 'CASCADE',
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    role: {
      type: 'text',
      notNull: true,
      default: "'member'",
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.addConstraint(
    'group_members',
    'group_members_role_check',
    `CHECK (role IN ('owner', 'member'))`,
  );

  pgm.addConstraint('group_members', 'group_members_group_id_user_id_unique', {
    unique: ['group_id', 'user_id'],
  });

  pgm.createIndex('group_members', 'user_id');
  pgm.createIndex('group_members', 'group_id');
};

export const down = false;
