"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { ApiError } from "@/lib/api";
import { labsApi } from "@/lib/services";
import { LAB_CATEGORIES, keys } from "@/lib/labs";
import { fieldErrors } from "@/lib/validation";
import FormField from "@/components/FormField";
import TextAreaField from "@/components/TextAreaField";
import SelectField from "@/components/ui/SelectField";
import PageHeader from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";

const optionalUrl = z.union([z.literal(""), z.string().url("Enter a full link, starting with https://")]);

const labSchema = z.object({
  name: z.string().trim().min(2, "Give it a name (2+ characters)").max(100),
  short_description: z.string().trim().min(1, "Say what it is in a line").max(160, "Keep it under 160 characters"),
  description: z.string().trim().min(10, "Tell us a little more (10+ characters)").max(5000),
  category: z.string().min(1),
  demo_url: optionalUrl,
  github_url: optionalUrl,
  tx_post_url: optionalUrl,
});

const MAX_COVER_MB = 5;

export default function NewLabPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();

  const [values, setValues] = useState({
    name: "",
    short_description: "",
    description: "",
    category: "web",
    demo_url: "",
    github_url: "",
    tx_post_url: "",
    tags: "",
  });
  const [cover, setCover] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const preview = useMemo(() => (cover ? URL.createObjectURL(cover) : null), [cover]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const set = (key: keyof typeof values) => (e: { target: { value: string } }) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  const create = useMutation({
    mutationFn: (form: FormData) => labsApi.create(form),
    onSuccess: (lab) => {
      void qc.invalidateQueries({ queryKey: keys.labs });
      toast.success("Your lab is live!");
      router.replace(`/labs/${lab.slug}`);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Couldn't launch that. Try again."),
  });

  const pickCover = (file: File | undefined) => {
    if (!file) return setCover(null);
    if (!file.type.startsWith("image/")) return setErrors((e) => ({ ...e, cover: "That needs to be an image." }));
    if (file.size > MAX_COVER_MB * 1024 * 1024) return setErrors((e) => ({ ...e, cover: `Keep it under ${MAX_COVER_MB}MB.` }));
    setErrors((e) => ({ ...e, cover: "" }));
    setCover(file);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = labSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed));
      return;
    }
    setErrors({});
    const form = new FormData();
    for (const [k, v] of Object.entries(parsed.data)) if (v) form.append(k, v);
    values.tags
      .split(",")
      .map((t) => t.trim().replace(/^#/, ""))
      .filter(Boolean)
      .slice(0, 10)
      .forEach((t) => form.append("tags", t));
    if (cover) form.append("cover_image", cover);
    create.mutate(form);
  };

  return (
    <main className="mx-auto w-full max-w-[720px] px-5 py-10 md:px-10 md:py-14">
      <Link href="/labs" className="text-sm text-muted underline underline-offset-4 hover:text-ink">
        ← All labs
      </Link>
      <div className="mt-5">
        <PageHeader eyebrow="Labs" title="Start a" accent="lab.">
          Share something you&rsquo;re making. You can add links to the demo and the code.
        </PageHeader>
      </div>

      <form onSubmit={onSubmit} noValidate className="mt-8 flex flex-col gap-5">
        <FormField label="Name" name="name" value={values.name} onChange={set("name")} error={errors.name} autoFocus />
        <FormField
          label="One-line summary"
          name="short_description"
          value={values.short_description}
          onChange={set("short_description")}
          maxLength={160}
          error={errors.short_description}
        />
        <TextAreaField
          label="The full story"
          name="description"
          rows={6}
          maxLength={5000}
          value={values.description}
          onChange={set("description")}
          error={errors.description}
        />
        <SelectField label="Category" name="category" value={values.category} onChange={set("category")} options={[...LAB_CATEGORIES]} />

        <div>
          <p className="text-sm font-medium">Cover image (optional)</p>
          <label className="mt-1.5 flex cursor-pointer flex-col items-center justify-center overflow-hidden border border-dashed border-ink bg-cream px-4 py-6 text-center text-sm text-muted hover:bg-yellow/40">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Cover preview" className="max-h-56 w-auto" />
            ) : (
              <span>Click to choose an image (JPG or PNG, up to {MAX_COVER_MB}MB)</span>
            )}
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => pickCover(e.target.files?.[0])} />
          </label>
          {errors.cover && <p className="mt-1.5 text-xs text-rose">{errors.cover}</p>}
          {cover && (
            <button type="button" onClick={() => setCover(null)} className="mt-2 text-xs text-muted underline underline-offset-4">
              Remove image
            </button>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Demo link (optional)" name="demo_url" value={values.demo_url} onChange={set("demo_url")} error={errors.demo_url} inputMode="url" />
          <FormField label="Code link (optional)" name="github_url" value={values.github_url} onChange={set("github_url")} error={errors.github_url} inputMode="url" />
        </div>
        <FormField label="Your post on X (optional, earns 5 points)" name="tx_post_url" value={values.tx_post_url} onChange={set("tx_post_url")} error={errors.tx_post_url} inputMode="url" />
        <FormField label="Tags, separated by commas (optional)" name="tags" value={values.tags} onChange={set("tags")} />

        <div className="flex items-center gap-3">
          <button type="submit" disabled={create.isPending} className="btn disabled:opacity-60">
            {create.isPending ? "Launching…" : "Launch it"} <span aria-hidden="true">↗︎</span>
          </button>
          <Link href="/labs" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </main>
  );
}
