import { Image } from 'react-native';

// Bundled images are served by Metro in development, so the first time a
// screen shows one it can flash. Prefetching at startup warms the system
// image cache, which the OS trims by itself under memory pressure.
const bundled = [
  require('../../assets/brand/new-3d-logo.png'),
  require('../../assets/avatars/pink-avatar.png'),
  require('../../assets/avatars/yellow-avatar.png'),
  require('../../assets/avatars/purple-avatar.png'),
  require('../../assets/gifts/fone.png'),
  require('../../assets/gifts/livro.png'),
  require('../../assets/gifts/tenis.png'),
];

export function preloadImages() {
  for (const source of bundled) {
    const uri = Image.resolveAssetSource(source)?.uri;
    if (uri) Image.prefetch(uri).catch(() => undefined);
  }
}
