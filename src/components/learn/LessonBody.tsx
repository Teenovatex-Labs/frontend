import { Fragment, type ReactNode } from "react";
import { parseLesson } from "@/lib/lesson";

// Lessons are plain text with light formatting, so a lesson author never writes HTML:
//   "## Heading", "- bullet", four spaces to indent a code block, **bold**, blank line between paragraphs.
// Nothing here uses dangerouslySetInnerHTML, so lesson text can never inject markup.

function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>
  );
}

export default function LessonBody({ body }: { body: string }) {
  return (
    <div className="space-y-5 text-[17px] leading-relaxed">
      {parseLesson(body).map((b, i) => {
        switch (b.type) {
          case "h":
            return (
              <h2 key={i} className="pt-3 text-[24px] leading-tight tracking-[-0.02em]">
                {b.text}
              </h2>
            );
          case "ul":
            return (
              <ul key={i} className="list-disc space-y-2 pl-6 marker:text-rose">
                {b.items.map((item, j) => (
                  <li key={j}>{inline(item)}</li>
                ))}
              </ul>
            );
          case "code":
            return (
              <pre key={i} className="overflow-x-auto border border-ink bg-ink p-4 text-[14px] leading-relaxed text-cream shadow-[4px_4px_0_var(--pink)]">
                <code>{b.text}</code>
              </pre>
            );
          default:
            return <p key={i}>{inline(b.text)}</p>;
        }
      })}
    </div>
  );
}
