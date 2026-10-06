import type { useWritingDraft } from "../hooks/useWritingDraft";

interface Props {
  draft: ReturnType<typeof useWritingDraft>;
  onRestore: (fields: Record<string, string>) => void;
}

export default function WritingDraftNotice({ draft, onRestore }: Props) {
  return <div className="writing-draft">
    {draft.pending ? <>
      <p>A previous copy of your writing is available on this device. Restore it or keep the current writing.</p>
      <button type="button" onClick={() => {
        onRestore(draft.pending!.fields);
        draft.resolve();
      }}>Restore writing</button>
      <button type="button" onClick={draft.discard}>Keep current writing</button>
    </> : <p role="status">{draft.status}</p>}
    <small>Recovery includes text only. Save the form to keep other fields and selected files. This does not publish your work.</small>
  </div>;
}
