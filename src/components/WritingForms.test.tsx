import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ArticleForm from "./ArticleForm";
import ReviewForm from "./ReviewForm";
import type { RichTextEditorProps } from "./RichTextEditor";
import { articlesApi, reviewsApi } from "../services/api";

vi.mock("../contexts/AuthContext", () => ({ useAuth: () => ({ user: { id: 7 } }) }));
vi.mock("../services/api", () => ({
  articlesApi: { update: vi.fn() }, reviewsApi: { update: vi.fn() },
  categoriesApi: { list: vi.fn().mockResolvedValue([]) },
  producersApi: { list: vi.fn().mockResolvedValue([]) },
  imagesApi: { upload: vi.fn() }, winesApi: {}, winePackageItemsApi: {},
}));
vi.mock("./ImageManager", () => ({ default: () => null }));
vi.mock("./RichTextEditor", () => ({ default: ({ value, onChange, onUploadingChange, label }: RichTextEditorProps) => <>
  <textarea aria-label={label} value={value} onChange={(event) => onChange?.(event.target.value)} />
  <button type="button" onClick={() => onUploadingChange?.(true)}>Start upload</button>
  <button type="button" onClick={() => onUploadingChange?.(false)}>Finish upload</button>
</> }));

beforeEach(() => { localStorage.clear(); vi.clearAllMocks(); });

it("restores article writing, blocks saving during uploads, and clears recovery after success", async () => {
  const key = "wine-words:writing:7:article:3";
  localStorage.setItem(key, JSON.stringify({ fields: { title: "Recovered title", abstract: "Recovered abstract", body: "Recovered body" }, savedAt: "2026-10-06" }));
  const onSaved = vi.fn();
  vi.mocked(articlesApi.update).mockResolvedValue({ id: 3, title: "Recovered title", status: "draft" });
  const view = render(<ArticleForm article={{ id: 3, title: "Server title", body: "Server body", status: "draft" }} onSaved={onSaved} />);
  expect(screen.getByLabelText("Article body")).toHaveValue("Server body");
  fireEvent.click(screen.getByRole("button", { name: "Restore writing" }));
  expect(screen.getByLabelText("Article body")).toHaveValue("Recovered body");
  expect(screen.getByLabelText("Title")).toHaveValue("Recovered title");
  fireEvent.click(screen.getByRole("button", { name: "Start upload" }));
  expect(screen.getByRole("button", { name: "Update Article" })).toBeDisabled();
  fireEvent.submit(view.container.querySelector("form")!);
  expect(articlesApi.update).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Finish upload" }));
  fireEvent.click(screen.getByRole("button", { name: "Update Article" }));
  await waitFor(() => expect(onSaved).toHaveBeenCalled());
  expect(articlesApi.update).toHaveBeenCalledWith(3, expect.objectContaining({ body: "Recovered body", status: "draft" }));
  view.unmount();
  expect(localStorage.getItem(key)).toBeNull();
});

it("retains review writing after a failed save and clears it only after success", async () => {
  const key = "wine-words:writing:7:review:4";
  const onSaved = vi.fn();
  vi.mocked(reviewsApi.update).mockRejectedValueOnce(new Error("Save failed"));
  const view = render(<ReviewForm review={{ id: 4, slug: "review", title: "Review", status: "draft", comment: "Server comment" }} vintageYear={2020} onSaved={onSaved} />);
  fireEvent.change(screen.getByLabelText("Review comment"), { target: { value: "Unsaved tasting notes" } });
  fireEvent.click(screen.getByRole("button", { name: "Update Review" }));
  expect(await screen.findByText("Save failed")).toBeInTheDocument();
  expect(onSaved).not.toHaveBeenCalled();
  fireEvent(window, new Event("pagehide"));
  expect(JSON.parse(localStorage.getItem(key)!).fields.comment).toBe("Unsaved tasting notes");
  vi.mocked(reviewsApi.update).mockResolvedValue({ id: 4, slug: "review", title: "Review", status: "draft" });
  fireEvent.click(screen.getByRole("button", { name: "Update Review" }));
  await waitFor(() => expect(onSaved).toHaveBeenCalled());
  view.unmount();
  expect(localStorage.getItem(key)).toBeNull();
});
