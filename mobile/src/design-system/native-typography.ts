import { Platform } from 'react-native';

export const nativeFontFamily = Platform.OS === 'ios' ? 'System' : 'sans-serif';
