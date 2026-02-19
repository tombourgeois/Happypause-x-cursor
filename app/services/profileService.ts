import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { apiGet, apiPut, apiUpload, getAvatarUrl } from './api';
import type { UserProfile } from '../types';

/** Copy image to cache with file:// URI - fixes Android content:// upload issues */
async function getUploadableUri(uri: string): Promise<string> {
  if (uri.startsWith('file://')) return uri;
  if (uri.startsWith('blob:') || uri.startsWith('data:')) return uri;
  try {
    const ext = uri.includes('.png') ? 'png' : uri.includes('.webp') ? 'webp' : 'jpg';
    const dest = `${FileSystem.cacheDirectory}avatar-${Date.now()}.${ext}`;
    await FileSystem.copyAsync({ from: uri, to: dest });
    return dest;
  } catch {
    return uri;
  }
}

/** On web, blob/data URLs must be fetched and appended as File - browser FormData doesn't accept {uri,name,type} */
async function createFormDataForWeb(uri: string, mimeType: string, ext: string): Promise<FormData> {
  const response = await fetch(uri);
  const blob = await response.blob();
  const file = new File([blob], `avatar.${ext}`, { type: mimeType });
  const formData = new FormData();
  formData.append('file', file);
  return formData;
}

export async function getProfile(): Promise<UserProfile> {
  return apiGet<UserProfile>('/profile');
}

export async function saveProfile(profile: Partial<UserProfile>): Promise<void> {
  await apiPut('/profile', profile);
}

export async function setAvatarUrl(avatarUrl: string): Promise<string> {
  const res = await apiPut<{ avatarUrl: string }>('/profile/avatar', { avatarUrl });
  return res.avatarUrl;
}

export async function uploadAvatar(uri: string, mimeType: string = 'image/jpeg'): Promise<string> {
  const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
  let formData: FormData;

  if (Platform.OS === 'web' && (uri.startsWith('blob:') || uri.startsWith('data:'))) {
    formData = await createFormDataForWeb(uri, mimeType, ext);
  } else {
    const uploadUri = await getUploadableUri(uri);
    formData = new FormData();
    formData.append('file', {
      uri: uploadUri,
      type: mimeType,
      name: `avatar.${ext}`,
    } as any);
  }

  const res = await apiUpload<{ avatarUrl: string }>('/profile/avatar/upload', formData);
  return res.avatarUrl;
}

export { getAvatarUrl };
