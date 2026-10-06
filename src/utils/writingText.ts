import DOMPurify from "dompurify";

export function countWritingWords(html: string): number {
  const template = document.createElement("template");
  template.innerHTML = DOMPurify.sanitize(html);
  template.content.querySelectorAll("figure").forEach((node) => node.remove());
  template.content.querySelectorAll("br, div, p, li, h1, h2, h3, blockquote, pre")
    .forEach((node) => node.appendChild(document.createTextNode(" ")));
  return template.content.textContent?.trim().split(/\s+/u).filter(Boolean).length ?? 0;
}
