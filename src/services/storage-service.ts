import { decode } from "base64-arraybuffer";
import * as ImagePicker from "expo-image-picker";
import { env } from "../lib/env";
import { supabase } from "../lib/supabase";

export type StorageBucket =
  | "avatars"
  | "banners"
  | "post-media"
  | "community-assets";

const MAX_IMAGE_BYTES = 6 * 1024 * 1024;

export type PickImageOptions = {
  aspect?: [number, number];
  maxBytes?: number;
  quality?: number;
};

function formatMegabytes(bytes: number) {
  return Math.round(bytes / 1024 / 1024);
}

export async function pickImage(options: PickImageOptions = {}) {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  const maxBytes = options.maxBytes ?? MAX_IMAGE_BYTES;

  if (!permission.granted) {
    throw new Error("Necesitamos permiso para elegir una imagen.");
  }

  const pickerOptions: ImagePicker.ImagePickerOptions = {
    mediaTypes: ["images"],
    allowsEditing: true,
    quality: options.quality ?? 0.82,
    base64: true,
  };

  if (options.aspect) {
    pickerOptions.aspect = options.aspect;
  }

  const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  const asset = result.assets[0];

  if (asset.fileSize && asset.fileSize > maxBytes) {
    throw new Error(`La imagen supera el limite de ${formatMegabytes(maxBytes)} MB.`);
  }

  if (!asset.base64) {
    throw new Error("No se pudo leer la imagen seleccionada.");
  }

  return asset;
}

export async function uploadBase64Image({
  bucket,
  path,
  base64,
  contentType = "image/jpeg",
}: {
  bucket: StorageBucket;
  path: string;
  base64: string;
  contentType?: string;
}) {
  if (env.demoMode) {
    return `data:${contentType};base64,${base64}`;
  }

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, decode(base64), {
      contentType,
      upsert: true,
    });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
