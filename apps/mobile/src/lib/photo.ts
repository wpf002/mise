import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

const MAX_EDGE = 1024;
const JPEG_QUALITY = 0.7;

export interface Photo {
  uri: string;
  base64: string;
}

/** Downscale to a size a vision model needs; nothing bigger ever leaves the phone. */
async function shrink(uri: string): Promise<Photo> {
  const context = ImageManipulator.manipulate(uri);
  context.resize({ width: MAX_EDGE });
  const image = await context.renderAsync();
  const result = await image.saveAsync({ compress: JPEG_QUALITY, format: SaveFormat.JPEG, base64: true });
  if (!result.base64) throw new Error('Could not encode photo');
  return { uri: result.uri, base64: result.base64 };
}

export async function takePhoto(): Promise<Photo | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return null;
  const picked = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 });
  const asset = picked.assets?.[0];
  if (picked.canceled || !asset) return null;
  return shrink(asset.uri);
}

export async function pickPhoto(): Promise<Photo | null> {
  const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
  const asset = picked.assets?.[0];
  if (picked.canceled || !asset) return null;
  return shrink(asset.uri);
}
