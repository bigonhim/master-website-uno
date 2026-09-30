"use client";

import { useCallback, useMemo, useState } from "react";

import { DevicePreview } from "@/components/studio/DevicePreview";
import { HistoryPanel } from "@/components/studio/HistoryPanel";
import { useSaveShortcut, useUnsavedChanges } from "@/components/studio/hooks";
import { useToast } from "@/components/studio/Toaster";
import { Badge, Button, Field, Notice, Panel, cx, inputClass } from "@/components/studio/ui";
import { StudioError, studio } from "@/lib/studio/client";
import { formatDate } from "@/lib/studio/format";
import type { PreviewView } from "@/lib/studio/preview";
import type { Section, SectionData, SectionField } from "@/lib/studio/types";
import type { HeroSlide, SiteSections } from "@/lib/site/types";

type Items = Record<string, string>[];

export function SectionEditor({
  initial,
  site,
  canChange,
}: {
  initial: Section;
  site: { sections: SiteSections; heroSlides: HeroSlide[] };
  canChange: boolean;
}) {
  const [section, setSection] = useState(initial);
  const [data, setData] = useState<SectionData>(initial.data);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [problem, setProblem] = useState("");
  const [conflict, setConflict] = useState<Section | null>(null);
  const [busy, setBusy] = useState<"" | "save" | "reset">("");
  const [historyKey, setHistoryKey] = useState(0);
  const toast = useToast();

  const dirty = JSON.stringify(data) !== JSON.stringify(section.data);
  useUnsavedChanges(dirty);

  const save = useCallback(async () => {
    if (!dirty || busy || !canChange) return;
    setBusy("save");
    setErrors({});
    setProblem("");
    try {
      const saved = await studio<Section>(`sections/${section.key}`, {
        method: "PUT",
        body: { data },
        version: section.version,
      });
      setSection(saved);
      setData(saved.data);
      setConflict(null);
      setHistoryKey((n) => n + 1);
      toast("Saved. It's live on the site now.");
    } catch (error) {
      if (error instanceof StudioError) {
        if (error.status === 409 && error.data.current) setConflict(error.data.current as Section);
        setErrors(error.fieldErrors);
        setProblem(error.message);
      }
    } finally {
      setBusy("");
    }
  }, [dirty, busy, canChange, section, data, toast]);

  useSaveShortcut(save, dirty);

  async function reset() {
    if (!window.confirm("Put this whole section back to its original words? The current words stay in the history.")) return;
    setBusy("reset");
    try {
      const saved = await studio<Section>(`sections/${section.key}`, { method: "DELETE" });
      setSection(saved);
      setData(saved.data);
      setErrors({});
      setHistoryKey((n) => n + 1);
      toast("Back to the original words.");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Couldn't reset it.", "error");
    } finally {
      setBusy("");
    }
  }

  const view = useMemo(() => previewFor(section.key, data, site), [section.key, data, site]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 rounded-lg bg-ink-0 px-4 py-3 shadow-xs ring-1 ring-ink-100">
        {section.is_default ? (
          <Badge>Original words</Badge>
        ) : (
          <span className="text-meta text-ink-600">
            Last saved {formatDate(section.updated_at, true)}
            {section.updated_by ? ` by ${section.updated_by}` : ""}
          </span>
        )}
        {dirty ? <span className="text-meta font-semibold text-gold-800">Unsaved changes</span> : null}
        <div className="ml-auto flex flex-wrap gap-2">
          {canChange && !section.is_default ? (
            <Button variant="ghost" busy={busy === "reset"} onClick={reset}>
              Reset to original
            </Button>
          ) : null}
          {dirty ? (
            <Button onClick={() => { setData(section.data); setErrors({}); }}>Discard changes</Button>
          ) : null}
          {canChange ? (
            <Button variant="primary" busy={busy === "save"} disabled={!dirty} onClick={save}>
              Save and publish
            </Button>
          ) : null}
        </div>
      </div>

      {conflict ? (
        <Notice tone="warning">
          Someone else saved this section while you were editing.{" "}
          <button
            type="button"
            className="underline underline-offset-2"
            onClick={() => {
              setSection(conflict);
              setData(conflict.data);
              setConflict(null);
              setProblem("");
            }}
          >
            Load their version
          </button>{" "}
          (your edits will be replaced), or copy what you need first.
        </Notice>
      ) : problem ? (
        <Notice tone="danger">{problem}</Notice>
      ) : null}

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,34rem)_1fr]">
        <Panel title="Words">
          <div className="space-y-5">
            {section.fields.map((field) =>
              field.kind === "items" ? (
                <ItemsField
                  key={field.name}
                  field={field}
                  value={(data[field.name] as Items) ?? []}
                  defaults={(section.defaults[field.name] as Items) ?? []}
                  errors={errors}
                  disabled={!canChange}
                  onChange={(v) => setData((d) => ({ ...d, [field.name]: v }))}
                />
              ) : (
                <TextField
                  key={field.name}
                  id={field.name}
                  field={field}
                  value={String(data[field.name] ?? "")}
                  original={String(section.defaults[field.name] ?? "")}
                  error={errors[field.name]}
                  disabled={!canChange}
                  onChange={(v) => setData((d) => ({ ...d, [field.name]: v }))}
                />
              ),
            )}
          </div>
        </Panel>
        <div className="min-w-0 space-y-6">
          {view ? <DevicePreview view={view} /> : null}
        </div>
      </div>

      <HistoryPanel key={historyKey} model="sitecontent.sitesection" objectId={section.key} />
    </div>
  );
}

function TextField({
  id,
  field,
  value,
  original,
  error,
  disabled,
  onChange,
}: {
  id: string;
  field: SectionField;
  value: string;
  original: string;
  error?: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const changed = original !== "" && value !== original;
  const help = (
    <>
      {field.help}
      {changed ? (
        <>
          {field.help ? " " : ""}
          <button type="button" disabled={disabled} onClick={() => onChange(original)}
            className="font-bold text-primary-700 underline underline-offset-2 hover:text-primary-900">
            Use the original words
          </button>
        </>
      ) : null}
    </>
  );
  const props = {
    id,
    value,
    disabled,
    "aria-invalid": Boolean(error) || value.length > field.max_length || undefined,
    onChange: (e: { target: { value: string } }) => onChange(e.target.value),
    className: cx(inputClass, changed && "border-l-4 border-l-cyan-400"),
  };

  return (
    <Field
      label={
        <>
          {field.label}
          {!field.required ? <span className="font-medium text-ink-500"> (optional)</span> : null}
        </>
      }
      htmlFor={id}
      error={error}
      help={field.help || changed ? help : undefined}
      count={[value.length, field.max_length]}
    >
      {field.kind === "textarea" ? (
        <textarea rows={field.max_length > 600 ? 8 : field.max_length > 250 ? 4 : 2} {...props} />
      ) : (
        <input type={field.kind === "email" ? "email" : field.kind === "phone" ? "tel" : "text"} {...props} />
      )}
    </Field>
  );
}

function ItemsField({
  field,
  value,
  defaults,
  errors,
  disabled,
  onChange,
}: {
  field: SectionField;
  value: Items;
  defaults: Items;
  errors: Record<string, string>;
  disabled: boolean;
  onChange: (value: Items) => void;
}) {
  return (
    <fieldset>
      <legend className="text-meta font-bold text-ink-800">{field.label}</legend>
      {field.help ? <p className="mt-0.5 text-meta text-ink-600">{field.help}</p> : null}
      {errors[field.name] ? <p className="mt-1 text-meta font-semibold text-danger">{errors[field.name]}</p> : null}
      <div className="mt-3 space-y-4">
        {value.map((item, index) => (
          <div key={index} className="rounded-md bg-ink-25 p-4 ring-1 ring-inset ring-ink-100">
            <p className="mb-3 text-caption uppercase tracking-wide text-cyan-700">Card {index + 1}</p>
            <div className="space-y-4">
              {field.item_fields?.map((sub) => (
                <TextField
                  key={sub.name}
                  id={`${field.name}-${index}-${sub.name}`}
                  field={sub}
                  value={item[sub.name] ?? ""}
                  original={defaults[index]?.[sub.name] ?? ""}
                  error={errors[`${field.name}.${index}.${sub.name}`]}
                  disabled={disabled}
                  onChange={(v) => onChange(value.map((it, i) => (i === index ? { ...it, [sub.name]: v } : it)))}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </fieldset>
  );
}

/** What the preview shows for each section: the section itself, with the
 *  rest of what it sits beside taken from the live site. */
function previewFor(
  key: string,
  data: SectionData,
  site: { sections: SiteSections; heroSlides: HeroSlide[] },
): PreviewView | null {
  const s = site.sections;
  switch (key) {
    case "home_hero":
      return { view: "hero", hero: data as SiteSections["home_hero"], slides: site.heroSlides };
    case "about_intro":
      return { view: "about", intro: data as SiteSections["about_intro"], pillars: s.about_pillars };
    case "about_pillars":
      return { view: "about", intro: s.about_intro, pillars: data as SiteSections["about_pillars"] };
    case "home_message":
      return { view: "message", data: data as unknown as SiteSections["home_message"] };
    case "home_scripture":
      return { view: "scripture", data: data as SiteSections["home_scripture"] };
    case "home_radio":
      return { view: "radio", data: data as SiteSections["home_radio"] };
    case "contact":
      return { view: "footer", contact: data as SiteSections["contact"] };
    default:
      return null;
  }
}
