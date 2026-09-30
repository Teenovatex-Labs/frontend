// Turns a lesson's plain text into blocks the page can render. Kept free of React so it is easy to test.

export type Block =
  | { type: "h"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "code"; text: string };

export function parseLesson(body: string): Block[] {
  const blocks: Block[] = [];
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i]!;
    if (!line.trim()) {
      i++;
    } else if (line.startsWith("## ")) {
      blocks.push({ type: "h", text: line.slice(3).trim() });
      i++;
    } else if (line.startsWith("    ")) {
      const code: string[] = [];
      while (i < lines.length && (lines[i]!.startsWith("    ") || !lines[i]!.trim())) code.push(lines[i++]!.slice(4));
      blocks.push({ type: "code", text: code.join("\n").replace(/\s+$/, "") });
    } else if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i]!.startsWith("- ")) items.push(lines[i++]!.slice(2).trim());
      blocks.push({ type: "ul", items });
    } else {
      const para: string[] = [];
      while (i < lines.length && lines[i]!.trim() && !/^(## |- |    )/.test(lines[i]!)) para.push(lines[i++]!.trim());
      blocks.push({ type: "p", text: para.join(" ") });
    }
  }
  return blocks;
}

