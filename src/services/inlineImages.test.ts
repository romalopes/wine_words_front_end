import { uploadInlineImage } from "./inlineImages";
import { imagesApi } from "./api";

vi.mock("./api", () => ({ imagesApi: { upload: vi.fn() } }));

it("uses the ID returned for this upload instead of guessing from gallery order", async () => {
  const file = new File(["image"], "wine.png", { type: "image/png" });
  const images = [{ id: 3, url: "https://example.com/new.png" }, { id: 8, url: "https://example.com/other.png" }];
  vi.mocked(imagesApi.upload).mockResolvedValue({ imageable_type: "Article", imageable_id: 1, uploaded_image_ids: [3], images });
  const onImages = vi.fn();
  expect(await uploadInlineImage("article", 1, file, onImages)).toBe(images[0]!.url);
  expect(onImages).toHaveBeenCalledWith(images);
});

it("reports a missing uploaded URL instead of embedding an unrelated image", async () => {
  vi.mocked(imagesApi.upload).mockResolvedValue({ imageable_type: "Review", imageable_id: 1, images: [{ id: 1, url: "https://example.com/old.png" }] });
  await expect(uploadInlineImage("review", 1, new File([], "image.png"), vi.fn())).rejects.toThrow("URL was not returned");
});
