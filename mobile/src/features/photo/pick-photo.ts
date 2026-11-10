import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { PHOTO_QUALITY, PHOTO_SIZE } from './photo-rules';
import type { PhotoSource } from './photo-rules';

export type PickResult =
  | { kind: 'picked'; data: Uint8Array; uri: string }
  | { kind: 'cancelled' }
  | { kind: 'denied' };

export async function pickPhoto(source: PhotoSource): Promise<PickResult> {
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return { kind: 'denied' };
  }
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  };
  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
  const asset = result.canceled ? null : result.assets[0];
  if (!asset) return { kind: 'cancelled' };

  const context = ImageManipulator.ImageManipulator.manipulate(asset.uri);
  context.resize({ width: PHOTO_SIZE });
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({
    format: ImageManipulator.SaveFormat.JPEG,
    compress: PHOTO_QUALITY,
  });
  const response = await fetch(saved.uri);
  return {
    kind: 'picked',
    data: new Uint8Array(await response.arrayBuffer()),
    uri: saved.uri,
  };
}
