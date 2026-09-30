import type { ApiRequester } from "./apiClient"
import type { LikeableKind, LikeState } from "../types/like"

export type { ApiRequester } from "./apiClient"

function likePath(kind: LikeableKind, id: string | number): string {
  switch (kind) {
    case "wine":
      return `/wines/${id}/like`
    case "review":
      return `/reviews/${id}/like`
    case "article":
      return `/articles/${id}/like`
  }
}

export interface LikesApi {
  like(kind: LikeableKind, id: string | number): Promise<LikeState>
  unlike(kind: LikeableKind, id: string | number): Promise<LikeState>
  toggle(kind: LikeableKind, id: string | number, liked: boolean): Promise<LikeState>
}

export function createLikesApi(request: ApiRequester): LikesApi {
  return {
    like(kind, id) {
      return request<LikeState>(likePath(kind, id), { method: "POST", auth: true })
    },
    unlike(kind, id) {
      return request<LikeState>(likePath(kind, id), { method: "DELETE", auth: true })
    },
    toggle(kind, id, liked) {
      return liked
        ? request<LikeState>(likePath(kind, id), { method: "DELETE", auth: true })
        : request<LikeState>(likePath(kind, id), { method: "POST", auth: true })
    },
  }
}
