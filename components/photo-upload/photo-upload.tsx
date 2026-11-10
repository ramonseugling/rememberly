import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/avatar/avatar';
import {
  ACCEPTED_PHOTO_TYPES,
  deletePhoto,
  uploadPhoto,
  validatePhotoFile,
} from '@/lib/photo';

interface PhotoUploadProps {
  endpoint: string;
  responseKey: 'avatar_url' | 'photo_url';
  currentUrl: string | null;
  alt: string;
  fallback: React.ReactNode;
  avatarClassName: string;
  hint?: string;
}

export const PhotoUpload = ({
  endpoint,
  responseKey,
  currentUrl,
  alt,
  fallback,
  avatarClassName,
  hint = 'JPEG, PNG ou WebP, até 2 MB.',
}: PhotoUploadProps) => {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [savedUrl, setSavedUrl] = useState(currentUrl);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setSavedUrl(currentUrl);
  }, [currentUrl]);

  useEffect(() => {
    if (!pendingFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(pendingFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingFile]);

  const isBusy = isUploading || isRemoving;

  const handleSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const validationError = validatePhotoFile(file);
    if (validationError) {
      setPendingFile(null);
      setError(validationError);
      return;
    }
    setError('');
    setPendingFile(file);
  };

  const handleCancel = () => {
    setPendingFile(null);
    setError('');
  };

  const handleUpload = async () => {
    if (!pendingFile) return;
    setIsUploading(true);
    setError('');

    const result = await uploadPhoto(endpoint, pendingFile, responseKey);
    setIsUploading(false);

    if ('error' in result) {
      setError(result.error);
      return;
    }
    setSavedUrl(result.url);
    setPendingFile(null);
    router.replace(router.asPath);
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    setError('');

    const failure = await deletePhoto(endpoint);
    setIsRemoving(false);

    if (failure) {
      setError(failure.error);
      return;
    }
    setSavedUrl(null);
    router.replace(router.asPath);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <Avatar
          src={previewUrl ?? savedUrl}
          alt={alt}
          className={avatarClassName}
        >
          {fallback}
        </Avatar>

        <div className="flex flex-col gap-2 min-w-0">
          <div className="flex flex-wrap gap-2">
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_PHOTO_TYPES.join(',')}
              className="hidden"
              onChange={handleSelect}
            />
            {pendingFile ? (
              <>
                <Button
                  size="sm"
                  className="gradient-warm text-white hover:opacity-90 rounded-2xl"
                  onClick={handleUpload}
                  disabled={isBusy}
                >
                  {isUploading && (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                  )}
                  {isUploading ? 'Enviando...' : 'Salvar foto'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-2xl"
                  onClick={handleCancel}
                  disabled={isBusy}
                >
                  Cancelar
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-2xl gap-1.5"
                  onClick={() => inputRef.current?.click()}
                  disabled={isBusy}
                >
                  <Camera className="w-4 h-4" />
                  {savedUrl ? 'Trocar foto' : 'Escolher foto'}
                </Button>
                {savedUrl && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-2xl gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={handleRemove}
                    disabled={isBusy}
                  >
                    {isRemoving ? (
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    {isRemoving ? 'Removendo...' : 'Remover'}
                  </Button>
                )}
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
};
