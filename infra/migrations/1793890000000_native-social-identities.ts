import { MigrationBuilder } from 'node-pg-migrate';

export const up = (pgm: MigrationBuilder) => {
  pgm.createTable('native_social_identities', {
    provider: { type: 'text', notNull: true },
    subject: { type: 'text', notNull: true },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users',
      onDelete: 'CASCADE',
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });
  pgm.addConstraint('native_social_identities', 'native_social_identity_pk', {
    primaryKey: ['provider', 'subject'],
  });
  pgm.addConstraint(
    'native_social_identities',
    'native_social_provider_check',
    "CHECK (provider IN ('google', 'apple'))",
  );
  pgm.createIndex('native_social_identities', 'user_id');
  pgm.createTable('native_social_challenges', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    provider: { type: 'text', notNull: true },
    purpose: { type: 'text', notNull: true, default: 'login' },
    nonce_hash: { type: 'text', notNull: true },
    expires_at: { type: 'timestamptz', notNull: true },
    used_at: { type: 'timestamptz' },
  });
  pgm.addConstraint(
    'native_social_challenges',
    'native_social_challenge_provider_check',
    "CHECK (provider IN ('google', 'apple'))",
  );
  // A future linking purpose must also bind an authenticated actor; not enabled here.
  pgm.addConstraint(
    'native_social_challenges',
    'native_social_challenge_purpose_check',
    "CHECK (purpose = 'login')",
  );
  pgm.createIndex('native_social_challenges', 'expires_at');
};

export const down = false;
