"use client";

import { useEffect, useRef, useState } from "react";
import { UploadIcon } from "@animateicons/react/lucide/upload-icon";
import { LinkIcon } from "@animateicons/react/lucide/link-icon";
import { Trash2Icon } from "@animateicons/react/lucide/trash-2-icon";
import { ApiError } from "@/lib/api";
import { addAttachmentLink, listAttachments, removeAttachment, uploadAttachmentImage, uploadAttachmentPdf, type Attachment } from "@/lib/admissions";

const MAX_EACH = 3;
const MAX_PDFS = 2;
const MAX_PDF_MB = 10;

export default function AttachmentsPanel({ token, locked }: { token: string; locked: boolean }) {
  const [items, setItems] = useState<Attachment[] | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const pdfInput = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      setItems(await listAttachments(token));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't load your attachments.");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const images = items?.filter((a) => a.kind === "image") ?? [];
  const links = items?.filter((a) => a.kind === "link") ?? [];
  const pdfs = items?.filter((a) => a.kind === "pdf") ?? [];

  const handleFile = async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      await uploadAttachmentImage(token, file);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "That image didn't upload.");
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const handlePdf = async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      if (file.size > MAX_PDF_MB * 1024 * 1024) throw new ApiError(`A PDF must be under ${MAX_PDF_MB} MB.`, "TOO_BIG", 400);
      await uploadAttachmentPdf(token, file);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "That PDF didn't upload.");
    } finally {
      setBusy(false);
      if (pdfInput.current) pdfInput.current.value = "";
    }
  };

  const handleAddLink = async () => {
    if (!linkUrl.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await addAttachmentLink(token, linkUrl.trim());
      setLinkUrl("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "That link didn't save.");
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (id: string) => {
    setBusy(true);
    try {
      await removeAttachment(token, id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't remove that.");
    } finally {
      setBusy(false);
    }
  };

  if (!items) return <p className="text-sm text-muted">Loading…</p>;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">Show us something you&rsquo;ve made: up to {MAX_EACH} images, {MAX_PDFS} PDFs and {MAX_EACH} links. For a video, paste a public YouTube, Vimeo or Drive link (check it opens when you&rsquo;re logged out).</p>
      {error && <p className="text-sm text-rose">{error}</p>}

      <div>
        <p className="mb-2 text-sm font-bold">Images ({images.length}/{MAX_EACH})</p>
        <div className="flex flex-wrap gap-2">
          {images.map((a) => (
            <div key={a.id} className="relative h-20 w-20 overflow-hidden rounded-md border border-ink">
              {a.url ? <img src={a.url} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center break-all bg-cream p-1 text-center text-[10px] text-muted">{a.filename ?? "image"}</span>}
              {!locked && (
                <button type="button" onClick={() => handleRemove(a.id)} aria-label="Remove image" className="absolute right-0.5 top-0.5 rounded-full bg-ink/80 p-1 text-cream">
                  <Trash2Icon size={12} />
                </button>
              )}
            </div>
          ))}
          {!locked && images.length < MAX_EACH && (
            <button type="button" onClick={() => fileInput.current?.click()} disabled={busy} className="btn-secondary btn-icon h-20 w-20">
              <UploadIcon size={18} />
            </button>
          )}
          <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-bold">PDFs ({pdfs.length}/{MAX_PDFS}, up to {MAX_PDF_MB} MB each)</p>
        <div className="flex flex-col gap-2">
          {pdfs.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-2 rounded-md border border-ink bg-white px-3 py-2 text-sm">
              <span className="truncate">{a.filename ?? "document.pdf"}</span>
              {!locked && (
                <button type="button" onClick={() => handleRemove(a.id)} aria-label="Remove PDF" className="shrink-0 text-muted hover:text-rose">
                  <Trash2Icon size={14} />
                </button>
              )}
            </div>
          ))}
          {!locked && pdfs.length < MAX_PDFS && (
            <button type="button" onClick={() => pdfInput.current?.click()} disabled={busy} className="btn-secondary self-start text-sm">Add a PDF</button>
          )}
          <input ref={pdfInput} type="file" accept="application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePdf(f); }} />
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-bold">Links ({links.length}/{MAX_EACH})</p>
        <div className="flex flex-col gap-2">
          {links.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-2 rounded-md border border-ink bg-white px-3 py-2 text-sm">
              <a href={a.url ?? "#"} target="_blank" rel="noreferrer noopener" className="truncate underline">{a.url}</a>
              {!locked && (
                <button type="button" onClick={() => handleRemove(a.id)} aria-label="Remove link" className="shrink-0 text-muted hover:text-rose">
                  <Trash2Icon size={14} />
                </button>
              )}
            </div>
          ))}
          {!locked && links.length < MAX_EACH && (
            <div className="flex gap-2">
              <input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://…"
                className="flex-1 rounded-md border border-ink bg-cream px-4 py-2.5 text-[15px] outline-none focus:ring-2 focus:ring-rose"
              />
              <button type="button" onClick={handleAddLink} disabled={busy} className="btn-secondary btn-icon shrink-0">
                <LinkIcon size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
