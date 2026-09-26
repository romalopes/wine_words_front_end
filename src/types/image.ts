export type ImageableType = "wine" | "producer" | "article" | "review" | "wine_package"

export interface ImageDetail {
  id: number
  url?: string | null
  alt?: string | null
  primary?: boolean
  [key: string]: unknown
}

export interface Image {
  id: number
  url?: string | null
  alt?: string | null
  primary?: boolean
  [key: string]: unknown
}

export interface ImageUploadResponse {
  imageable_type: string
  imageable_id: number
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

export interface ImageDetailResponse {
  id: number
  url?: string | null
  alt?: string | null
  primary?: boolean
  [key: string]: unknown
}
