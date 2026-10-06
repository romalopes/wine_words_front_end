import { act, render, screen, waitFor } from "@testing-library/react";
import RichTextEditor from "./RichTextEditor";

// jsdom does not implement the layout APIs used by Trix selection.
beforeAll(() => {
  Object.defineProperty(Range.prototype, "getBoundingClientRect", { configurable: true, value: () => new DOMRect() });
  Object.defineProperty(Range.prototype, "getClientRects", { configurable: true, value: () => [] });
});

it("initializes the bundled Trix engine and round-trips restored HTML", async () => {
  const change = vi.fn();
  const view = render(<RichTextEditor label="Article body" value="<div>Initial text</div>" onChange={change} />);
  await waitFor(() => expect(screen.queryByText("Loading editor…")).not.toBeInTheDocument());
  const editor = screen.getByLabelText("Article body") as HTMLElement & {
    value: string;
    editor: { insertString: (text: string) => void; setSelectedRange: (range: number[]) => void };
  };
  expect(editor.value).toContain("Initial text");
  view.rerender(<RichTextEditor label="Article body" value="<div>Recovered <strong>writing</strong></div>" onChange={change} />);
  await waitFor(() => expect(editor.value).toContain("<strong>writing</strong>"));
  expect(change).not.toHaveBeenCalled();
  act(() => { editor.editor.setSelectedRange([0, 0]); editor.editor.insertString("More "); });
  await waitFor(() => expect(change).toHaveBeenCalledWith(expect.stringContaining("More ")));
});
