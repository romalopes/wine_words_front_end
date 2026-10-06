import { imagesApi } from "./api";
import type { Image } from "../types/image";

export async function uploadInlineImage(
  type: "article" | "review", id: number, file: File,
  onImages: (images: Image[]) => void,
): Promise<string> {
  const result = await imagesApi.upload(type, id, [file]);
  onImages(result.images);
  const uploadedId = result.uploaded_image_ids?.[0];
  const uploaded = result.images.find((image) => image.id === uploadedId);
  if (!uploaded?.url) throw new Error("The uploaded image URL was not returned. Check Images below before trying again.");
  return uploaded.url;
}
