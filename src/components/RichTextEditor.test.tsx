import { StrictMode } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import RichTextEditor from "./RichTextEditor";
import { loadTrix } from "../utils/loadTrix";

vi.mock("../utils/loadTrix", () => ({ loadTrix: vi.fn().mockResolvedValue(undefined) }));

// Exercise the wrapper's DOM contract separately from Trix's browser editing engine.
class TestTrixElement extends HTMLElement {
  value = "";
  editor = { loadHTML: vi.fn((html: string) => { this.value = html; this.dispatchEvent(new Event("trix-change")); }) };
  connectedCallback() {
    this.value = (document.getElementById(this.getAttribute("input")!) as HTMLInputElement).value;
    this.dispatchEvent(new Event("trix-initialize"));
  }
}
beforeAll(() => customElements.define("trix-editor", TestTrixElement));
beforeEach(() => vi.mocked(loadTrix).mockResolvedValue(undefined));

async function editor() { return await screen.findByLabelText("Rich text") as TestTrixElement; }
function emit(target: HTMLElement, name: string, fields: object) {
  const event = Object.assign(new Event(name, { cancelable: true }), fields);
  act(() => { target.dispatchEvent(event); });
  return event;
}
function attachment() {
  return { file: new File(["image"], "wine.png", { type: "image/png" }), setAttributes: vi.fn(), setUploadProgress: vi.fn(), remove: vi.fn() };
}

it("loads late props, synchronizes external changes, and leaves typing echoes alone", async () => {
  let finish!: () => void;
  vi.mocked(loadTrix).mockReturnValueOnce(new Promise<void>((resolve) => { finish = resolve; }));
  const oldChange = vi.fn();
  const onChange = vi.fn();
  const view = render(<RichTextEditor value="old" onChange={oldChange} />);
  view.rerender(<RichTextEditor value="loaded from API" onChange={onChange} />);
  await act(async () => finish());
  const el = await editor();
  expect(el.value).toBe("loaded from API");
  el.value = "typed text";
  emit(el, "trix-change", {});
  expect(onChange).toHaveBeenCalledWith("typed text");
  expect(oldChange).not.toHaveBeenCalled();
  view.rerender(<RichTextEditor value="typed text" onChange={onChange} />);
  expect(el.editor.loadHTML).not.toHaveBeenCalled();
  view.rerender(<RichTextEditor value="restored draft" onChange={onChange} />);
  expect(el.editor.loadHTML).toHaveBeenCalledWith("restored draft");
  expect(onChange).toHaveBeenCalledTimes(1);
});

it("mounts only one editor in StrictMode and cleans up old listeners", async () => {
  const onChange = vi.fn();
  const view = render(<StrictMode><RichTextEditor onChange={onChange} /></StrictMode>);
  const el = await editor();
  expect(document.querySelectorAll("trix-editor")).toHaveLength(1);
  view.unmount();
  emit(el, "trix-change", {});
  expect(onChange).not.toHaveBeenCalled();
});

it("offers retry after a loading failure without losing text", async () => {
  vi.mocked(loadTrix).mockRejectedValueOnce(new Error("offline"));
  render(<RichTextEditor value="unsaved text" />);
  expect(await screen.findByRole("alert")).toHaveTextContent("could not load");
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect((await editor()).value).toBe("unsaved text");
});

it("counts block-separated words and sanitizes preview HTML", async () => {
  render(<RichTextEditor value={'<div>First</div><div>second<br>third</div><img src=x onerror="alert(1)"><script>alert(1)</script>'} />);
  await editor();
  expect(screen.getByText("3 words")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Preview" }));
  const preview = screen.getByLabelText("Rich text preview");
  expect(preview.querySelector("script")).toBeNull();
  expect(preview.querySelector("img")).not.toHaveAttribute("onerror");
  fireEvent.click(screen.getByRole("button", { name: "Continue writing" }));
  expect(screen.getByLabelText("Rich text")).toBeVisible();
});

it("rejects unsupported and oversized files, and uploads valid images", async () => {
  const uploadImage = vi.fn().mockResolvedValue("https://example.com/wine.png");
  const onUploadingChange = vi.fn();
  render(<RichTextEditor uploadImage={uploadImage} onUploadingChange={onUploadingChange} />);
  const el = await editor();
  expect(emit(el, "trix-file-accept", { file: new File(["x"], "file.svg", { type: "image/svg+xml" }) }).defaultPrevented).toBe(true);
  const huge = new File(["x"], "big.png", { type: "image/png" });
  Object.defineProperty(huge, "size", { value: 11 * 1024 * 1024 });
  expect(emit(el, "trix-file-accept", { file: huge }).defaultPrevented).toBe(true);
  const image = attachment();
  expect(emit(el, "trix-file-accept", { file: image.file }).defaultPrevented).toBe(false);
  emit(el, "trix-attachment-add", { attachment: image });
  expect(onUploadingChange).toHaveBeenCalledWith(true);
  await waitFor(() => expect(image.setAttributes).toHaveBeenCalledWith({ url: "https://example.com/wine.png", href: "https://example.com/wine.png" }));
  expect(uploadImage).toHaveBeenCalledWith(image.file);
  await waitFor(() => expect(onUploadingChange).toHaveBeenLastCalledWith(false));
});

it("removes a failed attachment and exposes the upload error", async () => {
  render(<RichTextEditor uploadImage={vi.fn().mockRejectedValue(new Error("Upload unavailable"))} />);
  const image = attachment();
  emit(await editor(), "trix-attachment-add", { attachment: image });
  expect(await screen.findByRole("alert")).toHaveTextContent("Upload unavailable");
  expect(image.remove).toHaveBeenCalled();
});

it("does not reinsert an image removed while its upload is pending", async () => {
  let complete!: (url: string) => void;
  render(<RichTextEditor uploadImage={() => new Promise((resolve) => { complete = resolve; })} />);
  const image = attachment();
  const el = await editor();
  emit(el, "trix-attachment-add", { attachment: image });
  emit(el, "trix-attachment-remove", { attachment: image });
  await act(async () => complete("https://example.com/image.png"));
  expect(image.setAttributes).not.toHaveBeenCalled();
});

it("prevents attachments for an unsaved record", async () => {
  render(<RichTextEditor />);
  const image = attachment();
  expect(emit(await editor(), "trix-file-accept", { file: image.file }).defaultPrevented).toBe(true);
  expect(screen.getByRole("alert")).toHaveTextContent("Save this article or review first");
});
