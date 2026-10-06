// Normalises the HTML that arrives for article bodies and review comments
// into real block paragraphs before sanitising/rendering.
//
// Two shapes reach the detail pages:
//  - seeded / hand-written content: a wrapper <div> with <br><br> between
//    paragraphs (the "legacy" format);
//  - Trix (the rich-text editor in ArticleForm/ReviewForm): one <div> per
//    block, with <div><br></div> for blank lines.
//
// Neither can be styled paragraph-by-paragraph with CSS alone — <br> creates
// no box, so there is nothing to put a margin on — so block-less runs are
// rebuilt as <p> elements here. Everything else (<p>, headings, <figure>,
// <blockquote>, lists, tables) is passed through untouched, and single <br>
// line breaks (e.g. a vintage list inside one paragraph) stay where they are.
//
// The function only moves nodes around inside an inert <template>; it never
// introduces markup of its own. Call it before sanitising:
//   DOMPurify.sanitize(normalizeArticleBody(html))

/** Inline tags: never treated as block children of a container. */
const INLINE_TAGS = new Set([
  "a", "abbr", "b", "bdi", "bdo", "br", "cite", "code", "del", "em", "img",
  "ins", "kbd", "mark", "q", "rp", "rt", "ruby", "s", "samp", "small", "span",
  "strong", "sub", "sup", "time", "u", "var", "wbr", "svg",
]);

/** Blocks that must never be rewritten or unwrapped. */
const PASS_THROUGH_TAGS = new Set([
  "address", "article", "aside", "blockquote", "center", "dd", "details",
  "dialog", "dl", "dt", "fieldset", "figcaption", "figure", "footer", "form",
  "h1", "h2", "h3", "h4", "h5", "h6", "header", "hr", "iframe", "li", "main",
  "menu", "nav", "ol", "p", "pre", "progress", "section", "summary", "table",
  "tbody", "td", "tfoot", "th", "thead", "tr", "ul",
]);

function isElement(node: Node): node is Element {
  return node.nodeType === Node.ELEMENT_NODE;
}

function isText(node: Node): node is Text {
  return node.nodeType === Node.TEXT_NODE;
}

function isInline(el: Element): boolean {
  return INLINE_TAGS.has(el.tagName.toLowerCase());
}

/** True when the element holds no text and nothing but line-break tags. */
function isEmptyBlock(el: Element): boolean {
  for (const node of el.childNodes) {
    if (isText(node) && node.textContent.trim() !== "") return false;
    if (isElement(node) && node.tagName.toLowerCase() !== "br") return false;
  }
  return true;
}

/** True when a paragraph candidate holds something worth rendering. */
function hasMeaningfulContent(el: HTMLElement): boolean {
  for (const node of el.childNodes) {
    if (isText(node) && node.textContent.trim() !== "") return true;
    if (isElement(node) && node.tagName.toLowerCase() !== "br") return true;
  }
  return false;
}

/**
 * True when `container` contains a run of two or more <br> (whitespace-only
 * text between the breaks is ignored, so `<br>\n<br>` counts too).
 */
function hasHardBreak(container: Node): boolean {
  let brCount = 0;
  for (const node of container.childNodes) {
    if (isElement(node) && node.tagName.toLowerCase() === "br") {
      brCount += 1;
      if (brCount >= 2) return true;
    } else if (!(isText(node) && node.textContent.trim() === "" && brCount > 0)) {
      brCount = 0;
    }
  }
  return false;
}

/**
 * Rebuilds the inline content of `container` as <p> elements, splitting on
 * runs of two or more <br>. A single <br> stays inside its paragraph; empty
 * paragraphs are dropped. Returns null when there is no hard break, so the
 * caller can leave the container untouched.
 */
function paragraphsFrom(container: Node): HTMLElement[] | null {
  if (!hasHardBreak(container)) return null;

  const snapshot = Array.from(container.childNodes);
  const paragraphs: HTMLElement[] = [];
  let current = document.createElement("p");
  let pendingBr: Element | null = null;
  let brCount = 0;

  const closeParagraph = () => {
    if (hasMeaningfulContent(current)) paragraphs.push(current);
    current = document.createElement("p");
    pendingBr = null;
    brCount = 0;
  };

  for (const node of snapshot) {
    if (isElement(node) && node.tagName.toLowerCase() === "br") {
      brCount += 1;
      if (brCount === 1) pendingBr = node;
      continue;
    }
    // Whitespace between the breaks of a run belongs to the break, not the text.
    if (isText(node) && node.textContent.trim() === "" && brCount > 0) continue;

    if (brCount >= 2) {
      closeParagraph();
    } else if (brCount === 1 && pendingBr) {
      current.appendChild(pendingBr);
      pendingBr = null;
      brCount = 0;
    }
    current.appendChild(node);
  }

  if (brCount === 1 && pendingBr) current.appendChild(pendingBr);
  if (hasMeaningfulContent(current)) paragraphs.push(current);

  return paragraphs.length > 0 ? paragraphs : null;
}


/** Rebuilds the block-less children of `container` as paragraphs. */
function normalizeContainer(container: Element | DocumentFragment): void {
  // 1. Element children: div wrappers (legacy / Trix) become paragraphs.
  for (const child of Array.from(container.children)) {
    const tag = child.tagName.toLowerCase();
    if (tag === "br" || INLINE_TAGS.has(tag) || PASS_THROUGH_TAGS.has(tag)) {
      continue;
    }

    const hasBlockChild = Array.from(child.children).some(
      (kid) => kid.tagName.toLowerCase() !== "br" && !isInline(kid),
    );

    if (hasBlockChild) {
      // A wrapper around real blocks (nested Trix/legacy markup): recurse,
      // then flatten the wrapper so paragraphs sit directly under the root.
      normalizeContainer(child);
      const stillInline = Array.from(child.children).some(isInline);
      const looseText = Array.from(child.childNodes).some(
        (node) => isText(node) && node.textContent.trim() !== "",
      );
      if (!stillInline && !looseText) {
        if (child.childNodes.length > 0) child.replaceWith(...child.childNodes);
        else child.remove();
      }
      continue;
    }

    if (isEmptyBlock(child)) {
      child.remove();
      continue;
    }

    const paragraphs = paragraphsFrom(child);
    if (paragraphs) {
      child.replaceWith(...paragraphs);
    } else {
      // A single-block wrapper (e.g. one Trix line) becomes one paragraph.
      const p = document.createElement("p");
      p.append(...child.childNodes);
      child.replaceWith(p);
    }
  }

  // 2. Loose text/inline content with no wrapper element at all.
  const hasBlockChild = Array.from(container.children).some(
    (kid) => kid.tagName.toLowerCase() !== "br" && !isInline(kid),
  );
  if (!hasBlockChild) {
    const paragraphs = paragraphsFrom(container);
    if (paragraphs) container.replaceChildren(...paragraphs);
  }
}

/**
 * Normalises article/review HTML so paragraphs can be styled with CSS.
 * Returns the rebuilt HTML string; see the file header for the contract.
 */
export function normalizeArticleBody(html: string): string {
  if (!html) return "";
  const template = document.createElement("template");
  template.innerHTML = html;
  normalizeContainer(template.content);
  return template.innerHTML;
}
