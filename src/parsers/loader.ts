import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as http from "http";
import { OpenAPISpec } from "../types";

// js-yaml loaded dynamically to keep it optional
let yaml: { load: (s: string) => unknown } | null = null;
try {
  yaml = require("js-yaml");
} catch {}

function parseContent(raw: string, hint = ""): OpenAPISpec {
  // Try JSON first
  if (raw.trimStart().startsWith("{") || hint.endsWith(".json")) {
    return JSON.parse(raw) as OpenAPISpec;
  }
  // Try YAML
  if (yaml) {
    return yaml.load(raw) as OpenAPISpec;
  }
  // Last resort: JSON
  return JSON.parse(raw) as OpenAPISpec;
}

function fetchUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    client
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      })
      .on("error", reject);
  });
}

export async function loadSpec(input: string): Promise<OpenAPISpec> {
  let raw: string;
  let hint = "";

  if (input.startsWith("http://") || input.startsWith("https://")) {
    console.log(`  Fetching spec from ${input} ...`);
    raw = await fetchUrl(input);
    hint = input;
  } else if (fs.existsSync(input)) {
    hint = input;
    raw = fs.readFileSync(path.resolve(input), "utf-8");
  } else {
    // Maybe it's a raw JSON string passed directly
    raw = input;
  }

  const spec = parseContent(raw, hint);

  if (!spec.paths) {
    throw new Error("Invalid OpenAPI spec: missing `paths` object.");
  }

  return spec;
}
