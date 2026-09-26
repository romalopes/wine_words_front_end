import type {
  AuthResponse,
  ForgotPasswordPayload,
  Identity,
  ResetPasswordPayload,
  SignInPayload,
  SignUpPayload,
  SocialSignInInput,
  User,
} from "./authentication"

export type SocialProvider = "google" | "apple" | "microsoft" | "facebook"

export interface AuthApi {
  signIn(payload: SignInPayload): Promise<AuthResponse>
  signUp(payload: SignUpPayload): Promise<AuthResponse>
  signOut(): Promise<unknown>
  forgotPassword(email: string): Promise<unknown>
  resetPassword(payload: ResetPasswordPayload): Promise<AuthResponse>
  me(): Promise<AuthResponse>
  socialSignIn(
    provider: SocialProvider,
    payload?: SocialSignInInput,
  ): Promise<AuthResponse>
}

export interface IdentityListResponse {
  identities: Identity[]
  password_authentication: boolean
}

export interface IdentityResponse {
  identity: Identity
}

export interface IdentitiesApi {
  list(): Promise<IdentityListResponse>
  connect(
    provider: SocialProvider,
    payload?: SocialSignInInput,
  ): Promise<IdentityResponse>
  disconnect(id: number): Promise<unknown>
}

export interface ForgotPasswordRequest {
  email: ForgotPasswordPayload["email"]
}

import type { QueryParams, ResourceResponse } from "./common"
import type { Account, AccountUpdate, PasswordChange } from "./account"
import type { Configuration, Setting } from "./notification"
import type { LogEntry, ImpersonationResponse } from "./user"
import type { Article } from "./article"
import type {
  Category,
  CategoryDetail,
  GrapeDetail,
  GrapeSearchResult,
  TasteParameter,
} from "./catalog"
import type {
  Country,
  CountryDetail,
  CountryListItem,
  CountryRegionNode,
  Region,
  RegionDetail,
} from "./reference"
import type { Notification } from "./notification"
import type { Stats } from "./stats"
import type { Producer, ProducerSearchResult, Subscription } from "./producer"
import type { Review } from "./review"
import type { ShipmentTracking } from "./shipmentTracking"
import type { ImageableType, ImageListResponse, ImageUploadResponse } from "./image"
import type { WineProfile } from "./user"
import type { Vintage, Wine, WineListItem } from "./wine"
import type { WinePackage, WinePackageItem } from "./winePackage"

export interface WineSearchInput {
  q?: string
  producerId?: number
}

export interface WineWritePayload {
  name?: string
  slug?: string
  producer_id?: number | null
  color?: string | null
  category_ids?: number[]
  [key: string]: unknown
}

export interface WineGroup {
  category: string
  count: number
  wines: WineListItem[]
}

export interface WineApi {
  list(params?: QueryParams): Promise<ResourceResponse<WineListItem>>
  grouped(params?: QueryParams): Promise<WineGroup[]>
  search(query: string | WineSearchInput, options?: Omit<WineSearchInput, "q">): Promise<WineListItem[]>
  advancedSearch(params?: QueryParams): Promise<ResourceResponse<WineListItem>>
  show(id: string | number): Promise<Wine>
  create(payload: WineWritePayload): Promise<Wine>
  update(id: string | number, payload: WineWritePayload): Promise<Wine>
  destroy(id: string | number): Promise<unknown>
}

export interface ProducerWritePayload {
  name?: string
  email?: string | null
  [key: string]: unknown
}

export interface ProducerApi {
  list(params?: QueryParams): Promise<ResourceResponse<Producer>>
  search(query: string): Promise<ProducerSearchResult[]>
  show(id: string | number): Promise<Producer>
  create(payload: ProducerWritePayload): Promise<Producer>
  update(id: string | number, payload: ProducerWritePayload): Promise<Producer>
  destroy(id: string | number): Promise<unknown>
  uploadLogo(id: string | number, file: File): Promise<unknown>
  removeLogo(id: string | number): Promise<unknown>
  linkWine(id: string | number, wineId: string | number): Promise<Producer>
}

export interface ReviewWritePayload {
  title?: string
  comment?: string | null
  score?: number | null
  status?: string
  category_ids?: number[]
  [key: string]: unknown
}

export interface ReviewGroup {
  category: string
  count: number
  reviews: Review[]
}

export interface ReviewApi {
  all(params?: QueryParams): Promise<ResourceResponse<Review>>
  list(wineSlug: string, vintageId: number): Promise<Review[]>
  show(id: string | number): Promise<Review>
  create(wineSlug: string, vintageId: number, payload: ReviewWritePayload): Promise<Review>
  update(id: string | number, payload: ReviewWritePayload): Promise<Review>
  destroy(id: string | number): Promise<unknown>
  myReviews(): Promise<Review[]>
  grouped(params?: QueryParams): Promise<ReviewGroup[]>
}

export interface ArticleWritePayload {
  title?: string
  body?: string
  status?: string
  [key: string]: unknown
}

export interface ArticleGroup {
  category: string
  count: number
  articles: Article[]
}

export interface ArticleApi {
  list(params?: QueryParams): Promise<ResourceResponse<Article>>
  myArticles(): Promise<Article[]>
  show(id: string | number): Promise<Article>
  create(payload: ArticleWritePayload | FormData): Promise<Article>
  update(id: string | number, payload: ArticleWritePayload | FormData): Promise<Article>
  destroy(id: string | number): Promise<unknown>
  grouped(params?: QueryParams): Promise<ArticleGroup[]>
}

export interface WinePackageWritePayload {
  producer_id?: number | null
  reviewer_id?: number | null
  source?: string
  expected_at?: string | null
  announced_at?: string | null
  arrived_at?: string | null
  review_deadline?: string | null
  reviewed_at?: string | null
  notes?: string | null
  [key: string]: unknown
}

export interface WinePackageActionPayload {
  arrived_at?: string
  review_deadline?: string
  reviewed_at?: string
}

export interface WinePackagesApi {
  list(params?: QueryParams): Promise<ResourceResponse<WinePackage>>
  show(id: string | number): Promise<WinePackage>
  create(payload: WinePackageWritePayload): Promise<WinePackage>
  update(id: string | number, payload: WinePackageWritePayload): Promise<WinePackage>
  destroy(id: string | number): Promise<unknown>
  markArrived(id: string | number, payload?: WinePackageActionPayload): Promise<WinePackage>
  markInTransit(id: string | number): Promise<WinePackage>
  markCompleted(id: string | number, payload?: WinePackageActionPayload): Promise<WinePackage>
  reopen(id: string | number): Promise<WinePackage>
  cancel(id: string | number): Promise<WinePackage>
  accept(id: string | number): Promise<WinePackage>
  reject(id: string | number, reason?: string | null): Promise<WinePackage>
}

export interface WinePackageItemWritePayload {
  vintage_id?: number | null
  quantity?: number
  review_requested?: boolean
  condition?: string | null
  notes?: string | null
  received_at?: string | null
  review_id?: number | null
  [key: string]: unknown
}

export interface WinePackageItemsApi {
  create(packageId: string | number, payload: WinePackageItemWritePayload): Promise<WinePackageItem>
  update(packageId: string | number, itemId: string | number, payload: WinePackageItemWritePayload): Promise<WinePackageItem>
  destroy(packageId: string | number, itemId: string | number): Promise<unknown>
  createReview(packageId: string | number, itemId: string | number, payload: ReviewWritePayload): Promise<Review>
}

export interface ShipmentTrackingWritePayload {
  carrier?: string | null
  number?: string | null
  url?: string | null
  provider?: string | null
  status?: string | null
  estimated_delivery_at?: string | null
  delivered_at?: string | null
  [key: string]: unknown
}

export interface ShipmentTrackingsApi {
  show(packageId: string | number): Promise<ShipmentTracking>
  update(packageId: string | number, payload: ShipmentTrackingWritePayload): Promise<ShipmentTracking>
  refresh(packageId: string | number): Promise<ShipmentTracking>
}

export interface NotificationsApi {
  list(params?: QueryParams): Promise<ResourceResponse<Notification>>
  markRead(id: string | number): Promise<Notification>
  markAllRead(): Promise<{ marked: number }>
}

export interface ConfigurationUpdatePayload {
  logs_saved_to_database?: boolean
  use_test_email?: boolean
  test_email?: string | null
  [key: string]: unknown
}

export interface TestAccessResponse {
  authenticated: boolean
  disabled?: boolean
  token?: string
  error?: string
  [key: string]: unknown
}

export interface AccountUpdatePayload extends AccountUpdate {}
export interface PasswordUpdatePayload extends PasswordChange {}

export interface AccountApi {
  show(): Promise<Account>
  update(payload: AccountUpdatePayload): Promise<Account>
  changePassword(payload: PasswordUpdatePayload): Promise<unknown>
}

export interface UserApi {
  findUser(email: string): Promise<User>
}

export interface UsersApi {
  roles(): Promise<unknown>
  search(query: string, page?: number): Promise<ResourceResponse<User>>
  assignRoles(userId: number, roleIds: number[]): Promise<unknown>
  assignSubscription(userId: number, subscriptionId: number | null): Promise<unknown>
}

export interface SubscriptionsApi {
  list(options?: { auth?: boolean }): Promise<Subscription[]>
  show(id: string | number): Promise<Subscription>
  create(payload: Record<string, unknown>): Promise<Subscription>
  update(id: string | number, payload: Record<string, unknown>): Promise<Subscription>
  destroy(id: string | number): Promise<unknown>
}

export interface BillingApi {
  checkout(subscriptionId: number): Promise<unknown>
  confirm(sessionId: string): Promise<unknown>
  portal(): Promise<unknown>
  changePreview(subscriptionId: number): Promise<unknown>
  changeConfirm(subscriptionId: number, idempotencyKey: string): Promise<unknown>
}

export interface TasteParametersApi {
  list(): Promise<TasteParameter[]>
}

/** Payload of `vintages#create` — nested under a wine slug. */
export interface VintageInput {
  year: number
  no_vintage?: boolean
  prompt?: string | null
  price?: number | null
}

export interface VintagesApi {
  create(wineSlug: string, payload: VintageInput): Promise<Vintage>
}

export interface CategoryCounts {
  [key: string]: number
}

export interface CategoriesApi {
  list(type?: string | null): Promise<ResourceResponse<Category>>
  show(id: string | number): Promise<CategoryDetail>
  counts(): Promise<CategoryCounts>
  create(payload: Record<string, unknown>): Promise<Category>
  update(id: string | number, payload: Record<string, unknown>): Promise<Category>
  remove(id: string | number): Promise<unknown>
  reorder(type: string, orderedIds: number[]): Promise<unknown>
  linkWine(id: string | number, wineId: string | number): Promise<Category>
  linkProducer(id: string | number, producerId: string | number): Promise<Category>
  linkReview(id: string | number, reviewId: string | number): Promise<Category>
  linkArticle(id: string | number, articleId: string | number): Promise<Category>
}

export interface GrapesApi {
  /**
   * `index` and `show` share the same `grape_json`, differing only in the
   * `wines` key that `show` adds — so both are `GrapeDetail` (`wines`
   * optional). `search` is a reduced projection: only these four keys.
   */
  list(): Promise<ResourceResponse<GrapeDetail>>
  search(query: string): Promise<GrapeSearchResult[]>
  show(id: string | number): Promise<GrapeDetail>
  create(payload: Record<string, unknown>): Promise<GrapeDetail>
  update(id: string | number, payload: Record<string, unknown>): Promise<GrapeDetail>
  remove(id: string | number): Promise<unknown>
  linkWine(id: string | number, wineId: string | number): Promise<GrapeDetail>
  linkProducer(id: string | number, producerId: string | number): Promise<GrapeDetail>
}

export interface CountriesApi {
  list(): Promise<ResourceResponse<CountryListItem>>
  show(id: string | number): Promise<CountryDetail>
  create(payload: Record<string, unknown>): Promise<Country>
  update(id: string | number, payload: Record<string, unknown>): Promise<Country>
  remove(id: string | number): Promise<unknown>
  linkProducer(id: string | number, producerId: string | number): Promise<Country>
}

export interface StatsApi {
  get(): Promise<Stats>
}

export interface RegionsApi {
  list(): Promise<Region[]>
  tree(): Promise<CountryRegionNode[]>
  show(id: string | number): Promise<RegionDetail>
  create(payload: Record<string, unknown>): Promise<Region>
  update(id: string | number, payload: Record<string, unknown>): Promise<Region>
  linkWine(id: string | number, wineId: string | number): Promise<RegionDetail>
  linkProducer(id: string | number, producerId: string | number): Promise<Region>
  remove(id: string | number): Promise<unknown>
}

export interface LogsApi {
  fetchLines(lines?: number): Promise<LogEntry[]>
  fetchAuditLogs(params?: QueryParams): Promise<ResourceResponse<LogEntry>>
  fetchAuditLog(id: string | number): Promise<LogEntry>
}

export interface ImpersonationApi {
  start(userId: number): Promise<ImpersonationResponse>
  stop(): Promise<ImpersonationResponse>
  status(): Promise<ImpersonationResponse>
}

export interface ConfigurationApi {
  fetch(): Promise<Configuration>
  update(payload: ConfigurationUpdatePayload): Promise<Configuration>
}

/**
 * Success body of `GET /api/v1/email-verifications/:token`. `message` is
 * optional because the API returns `status`/`email`/`user_name`; the UI falls
 * back to its own copy.
 */
export interface EmailVerificationResult {
  status: string
  email?: string | null
  user_name?: string | null
  message?: string | null
}

/** 202 body of `POST /api/v1/email-verifications/resend`. */
export interface EmailVerificationResendResult {
  status: string
  email_address?: string | null
  message?: string | null
}

export interface EmailVerificationsApi {
  verify(token: string): Promise<EmailVerificationResult>
  resend(emailAddress: string): Promise<EmailVerificationResendResult>
}

export interface SettingsApi {
  list(): Promise<Setting[]>
  create(payload: { key: string; value: unknown }): Promise<Setting>
  update(id: string | number, payload: { value: unknown }): Promise<Setting>
  destroy(id: string | number): Promise<unknown>
}

export interface TestAccessApi {
  submit(password: string): Promise<TestAccessResponse>
  verify(): Promise<TestAccessResponse>
}


export interface ImagesApi {
  upload(imageableType: ImageableType, imageableId: string | number, files: FileList | File[]): Promise<ImageUploadResponse>
  destroy(imageableType: ImageableType, imageableId: string | number, imageId: number): Promise<unknown>
  reorder(imageableType: ImageableType, imageableId: string | number, orderedIds: number[]): Promise<ImageListResponse>
  setPrimary(imageableType: ImageableType, imageableId: string | number, imageId: number): Promise<ImageListResponse>
}

export interface WineProfileSearchResponse {
  wines: Wine[]
  wine_profiles: WineProfile[]
  llm_interpreted?: unknown
}

export interface WineProfilesApi {
  list(): Promise<WineProfile[]>
  show(id: string): Promise<WineProfile>
  search(query: string, limit?: number): Promise<WineProfileSearchResponse>
}

