// The 4AM Commit: Funniest Agent Bug-Fix Message — one-line entry.
//
// The line below is the whole entry: a commit message an agent would
// leave in the log after a long night of chasing down and fixing its
// own bugs. This program validates the line (valid UTF-8, exactly one
// line, not blank, at most 200 characters counted as Unicode code
// points) and writes it to /output/entry.txt. The file is forced to
// mode 0644 so the grader's output checker can read it no matter
// what umask is in effect, and the read-back check confirms the
// content on disk and the permission bits. Any failure exits
// non-zero before anything is shipped.

import { chmodSync, statSync } from "node:fs";

const ENTRY =
  "4AM: the bug was a typo I wrote, found, fixed, and reintroduced. Final commit: 'third time is the charm, do not touch.'";

const OUTPUT_PATH = "/output/entry.txt";
const MAX_CHARS = 200;

function reject(reason: string): never {
  console.error(`entry rejected: ${reason}`);
  process.exit(1);
}

// Characters are Unicode code points, so an astral character counts
// as one instead of two UTF-16 code units.
const charCount = [...ENTRY].length;

if (ENTRY.trim().length === 0) {
  reject("entry is blank");
}
if (ENTRY.includes("\n") || ENTRY.includes("\r")) {
  reject("entry must be exactly one line");
}
if (charCount > MAX_CHARS) {
  reject(`entry is ${charCount} characters, limit is ${MAX_CHARS}`);
}

// Valid UTF-8: encoding and then decoding must reproduce the line.
const encoded = new TextEncoder().encode(ENTRY);
if (new TextDecoder("utf-8", { fatal: true }).decode(encoded) !== ENTRY) {
  reject("entry is not valid UTF-8");
}

await Bun.write(Bun.file(OUTPUT_PATH), encoded);

// The grader reads this file as a different identity, so force the
// mode to 0644 instead of trusting the ambient umask.
chmodSync(OUTPUT_PATH, 0o644);

// Read-back: the bytes on disk must decode as UTF-8 and equal the
// validated line exactly, or the run fails loudly.
const written = await Bun.file(OUTPUT_PATH).text();
if (written !== ENTRY) {
  reject(
    `read-back mismatch (got ${[...written].length} characters, expected ${charCount})`,
  );
}

// Mode check: the file must be exactly 0644 so the grader can read it.
const stats = statSync(OUTPUT_PATH);
const mode = stats.mode & 0o777;
if (mode !== 0o644) {
  reject(`output file mode is ${mode.toString(8)}, expected 644`);
}

// Byte-length check: the file must hold exactly the bytes we encoded,
// so a truncated or padded write cannot slip through the text check.
if (stats.size !== encoded.length) {
  reject(
    `output file is ${stats.size} bytes, expected ${encoded.length}`,
  );
}

console.log(`wrote ${charCount} characters to ${OUTPUT_PATH}`);
