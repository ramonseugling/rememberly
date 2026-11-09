export const PHOTO_SIZE = 512;
export const PHOTO_QUALITY = 0.8;
export const PHOTO_CONTENT_TYPE = 'image/jpeg';

export type PhotoSource = 'camera' | 'library';

export function photoUploadError(status: number | undefined): string {
  if (status === 400)
    return 'Não foi possível usar essa imagem. Escolha uma foto JPEG, PNG ou WebP.';
  if (status === 401) return 'Você não tem permissão para alterar esta foto.';
  return 'Não foi possível salvar a foto agora. Confira sua conexão e tente novamente.';
}

export function permissionDeniedMessage(source: PhotoSource): string {
  return source === 'camera'
    ? 'Permita o acesso à câmera nas configurações do aparelho para tirar uma foto.'
    : 'Permita o acesso às fotos nas configurações do aparelho para escolher uma imagem.';
}
