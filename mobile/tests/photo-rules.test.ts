import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PHOTO_SIZE,
  permissionDeniedMessage,
  photoUploadError,
} from '../src/features/photo/photo-rules.ts';

test('photo upload errors explain what happened in Portuguese', () => {
  assert.match(photoUploadError(400), /JPEG, PNG ou WebP/);
  assert.match(photoUploadError(401), /permissão/);
  assert.match(photoUploadError(undefined), /conexão/);
  assert.match(photoUploadError(503), /conexão/);
});

test('permission messages differ per source and photos are sent at 512 px', () => {
  assert.match(permissionDeniedMessage('camera'), /câmera/);
  assert.match(permissionDeniedMessage('library'), /fotos/);
  assert.equal(PHOTO_SIZE, 512);
});
