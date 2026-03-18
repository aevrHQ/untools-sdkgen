import * as path from "path";
import * as fs from "fs";
import { loadSpec } from "./parsers/loader";
import { parseSpec } from "./parsers/parser";
import { generateTypeScriptSDK } from "./generators/typescript";
import { generatePythonSDK } from "./generators/python";
import { generateFetchClient } from "./generators/fetch";

interface CLIArgs {
  input: string;
  output: string;
  languages: Array<"typescript" | "python" | "fetch">;
  packageName: string;
  help: boolean;
}

const HELP_TEXT = `
sdkgen — Generate SDKs from an OpenAPI spec
───────────────────────────────────────────

USAGE
  sdkgen <input> [options]

ARGUMENTS
  <input>                  Path to an OpenAPI JSON/YAML file, or a URL to an
                           OpenAPI endpoint (e.g. https://api.example.com/openapi.json)

OPTIONS
  -o, --output <dir>       Output directory              [default: ./generated]
  -l, --lang <langs>       Comma-separated list of targets:
                             typescript | python | fetch  [default: typescript,python,fetch]
  -n, --name <name>        Package name                  [default: derived from spec title]
  -h, --help               Show this help message

EXAMPLES
  sdkgen ./openapi.json
  sdkgen https://petstore3.swagger.io/api/v3/openapi.json -l typescript,python
  sdkgen ./spec.yaml -o ./sdk -n my-api -l fetch
`;

function parseArgs(argv: string[]): CLIArgs {
  const args = argv.slice(2);
  const result: CLIArgs = {
    input: "",
    output: "./generated",
    languages: ["typescript", "python", "fetch"],
    packageName: "",
    help: false,
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    if (arg === "-h" || arg === "--help") {
      result.help = true;
    } else if (arg === "-o" || arg === "--output") {
      result.output = args[++i];
    } else if (arg === "-l" || arg === "--lang") {
      const raw = args[++i].split(",").map((s) => s.trim());
      const valid = ["typescript", "python", "fetch"];
      for (const lang of raw) {
        if (!valid.includes(lang)) {
          console.error(`✗ Unknown language: "${lang}". Valid options: ${valid.join(", ")}`);
          process.exit(1);
        }
      }
      result.languages = raw as CLIArgs["languages"];
    } else if (arg === "-n" || arg === "--name") {
      result.packageName = args[++i];
    } else if (!arg.startsWith("-")) {
      result.input = arg;
    } else {
      console.error(`✗ Unknown option: ${arg}`);
      process.exit(1);
    }
    i++;
  }

  return result;
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  const args = parseArgs(process.argv);

  if (args.help || !args.input) {
    console.log(HELP_TEXT);
    process.exit(args.help ? 0 : 1);
  }

  console.log("\n  sdkgen — OpenAPI SDK Generator\n");

  // 1. Load spec
  console.log("  ⟳  Loading spec...");
  let spec;
  try {
    spec = await loadSpec(args.input);
  } catch (err) {
    console.error(`  ✗  Failed to load spec: ${(err as Error).message}`);
    process.exit(1);
  }
  console.log(`  ✓  Loaded: ${spec.info.title} v${spec.info.version}`);

  // 2. Parse endpoints
  console.log("  ⟳  Parsing endpoints...");
  const endpoints = parseSpec(spec);
  console.log(`  ✓  Found ${endpoints.length} endpoint(s) across ${new Set(endpoints.flatMap((e) => e.tags)).size} tag(s)`);

  // 3. Derive package name
  const packageName = args.packageName || slugify(spec.info.title);

  // 4. Generate per language
  for (const lang of args.languages) {
    const outDir = path.resolve(args.output, lang);
    console.log(`\n  ⟳  Generating ${lang.toUpperCase()} SDK → ${outDir}`);

    try {
      if (lang === "typescript") {
        generateTypeScriptSDK(spec, endpoints, outDir, packageName);
      } else if (lang === "python") {
        generatePythonSDK(spec, endpoints, outDir, packageName);
      } else if (lang === "fetch") {
        generateFetchClient(spec, endpoints, outDir, packageName);
      }
      console.log(`  ✓  ${lang.toUpperCase()} SDK generated`);
    } catch (err) {
      console.error(`  ✗  Failed to generate ${lang} SDK: ${(err as Error).message}`);
    }
  }

  // 5. Summary
  console.log(`\n  ✓  All done! Output in: ${path.resolve(args.output)}\n`);

  // Print tree
  try {
    const printTree = (dir: string, prefix = "     ") => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (let i = 0; i < entries.length; i++) {
        const e = entries[i];
        const isLast = i === entries.length - 1;
        const connector = isLast ? "└── " : "├── ";
        console.log(`${prefix}${connector}${e.name}`);
        if (e.isDirectory()) {
          printTree(path.join(dir, e.name), prefix + (isLast ? "    " : "│   "));
        }
      }
    };
    console.log(`     ${path.resolve(args.output)}`);
    printTree(path.resolve(args.output));
    console.log();
  } catch {}
}

main().catch((err) => {
  console.error("  ✗  Unexpected error:", err);
  process.exit(1);
});
