export const STORAGE_BUCKET = "garment-photos";

export function getPublicImageUrl(path: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl || !path) return "";
  return `${baseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`;
}
