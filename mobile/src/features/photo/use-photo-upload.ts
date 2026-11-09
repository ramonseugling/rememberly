import { useCallback, useRef, useState } from 'react';
import { ApiError, useAuthenticatedApi } from '../../data/hooks';
import { pickPhoto } from './pick-photo';
import {
  PHOTO_CONTENT_TYPE,
  permissionDeniedMessage,
  photoUploadError,
} from './photo-rules';
import type { PhotoSource } from './photo-rules';

export function usePhotoUpload(path: string, onChanged: () => Promise<void>) {
  const { request } = useAuthenticatedApi();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);

  const run = useCallback(
    async (action: () => Promise<boolean>) => {
      if (busy.current) return false;
      busy.current = true;
      setPending(true);
      setError(null);
      try {
        const changed = await action();
        if (changed) await onChanged();
        return changed;
      } catch (cause) {
        setError(
          photoUploadError(
            cause instanceof ApiError ? cause.status : undefined,
          ),
        );
        return false;
      } finally {
        busy.current = false;
        setPending(false);
      }
    },
    [onChanged],
  );

  const choose = useCallback(
    (source: PhotoSource) =>
      run(async () => {
        const picked = await pickPhoto(source);
        if (picked.kind === 'denied') {
          setError(permissionDeniedMessage(source));
          return false;
        }
        if (picked.kind === 'cancelled') return false;
        await request(path, {
          method: 'PUT',
          rawBody: { data: picked.data, contentType: PHOTO_CONTENT_TYPE },
        });
        return true;
      }),
    [path, request, run],
  );

  const remove = useCallback(
    () =>
      run(async () => {
        await request(path, { method: 'DELETE' });
        return true;
      }),
    [path, request, run],
  );

  return { pending, error, choose, remove, clearError: () => setError(null) };
}
