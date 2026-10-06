export type ImageableType = "wine" | "producer" | "article" | "review" | "wine_package"

/**
 * A rich per-image record, as emitted by `ImageAttributes#image_details` in
 * Rails. Note that a domain model's `images` field is a flat `string[]` of URLs
 * and is *not* this type — see the doc comment on `Wine.images`.
 */
export interface ImageDetail {
  id: number
  url?: string | null
  filename?: string | null
  content_type?: string | null
  position?: number | null
  alt?: string | null
  primary?: boolean
  [key: string]: unknown
}

/** Alias kept for the upload/list response shapes below. */
export type Image = ImageDetail

export interface ImageUploadResponse {
  imageable_type: string
  imageable_id: number
  uploaded_image_ids?: number[]
  images: Image[]
}

export interface ImageListResponse {
  images: Image[]
  primary_image?: string | null
}

export interface ImagesApi {
  upload(imageableType: ImageableType, imageableId: string | number, files: FileList | File[]): Promise<ImageUploadResponse>
  destroy(imageableType: ImageableType, imageableId: string | number, imageId: number): Promise<unknown>
  reorder(imageableType: ImageableType, imageableId: string | number, orderedIds: number[]): Promise<ImageListResponse>
  setPrimary(imageableType: ImageableType, imageableId: string | number, imageId: number): Promise<ImageListResponse>
}
