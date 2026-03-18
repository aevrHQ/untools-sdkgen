# @untools/sdkgen

> Generate TypeScript SDKs, Python SDKs, and vanilla fetch clients from an OpenAPI spec — local file or URL.

Inspired by [Fern](https://buildwithfern.com). No cloud required, no config files, just point it at a spec.

---

## Install

```bash
# Install globally
npm install -g @untools/sdkgen

# Or run directly via npx
npx @untools/sdkgen <input> [options]
```

---

## Usage

```bash
sdkgen <input> [options]
```

### Arguments
- `<input>`: Path to an OpenAPI JSON/YAML file, or a URL to an OpenAPI endpoint (e.g., `https://api.example.com/openapi.json`).

### Options
- `-o, --output <dir>`: Output directory (default: `./generated`).
- `-l, --lang <langs>`: Comma-separated list of targets: `typescript`, `python`, `fetch` (default: `typescript,python,fetch`).
- `-n, --name <name>`: Package name (default: derived from spec title).
- `-h, --help`: Show help message.

### Examples

```bash
# Generate all three targets from a local file
sdkgen ./openapi.json

# TypeScript + Python from a live URL
sdkgen https://api.example.com/openapi.json -l typescript,python

# Just fetch wrappers with a custom output directory and package name
sdkgen ./spec.yaml -l fetch -o ./sdk -n my-api
```

---

## Output Structure

The tool generates a clean, modular structure for each language:

```text
generated/
├── typescript/
│   ├── src/
│   │   ├── types.ts          ← All schema interfaces (namespaced)
│   │   ├── errors.ts         ← APIError class
│   │   ├── <tag>.ts          ← Typed client classes per OpenAPI tag
│   │   └── index.ts          ← Composite SDK entry point
│   ├── package.json
│   └── tsconfig.json
│
├── python/
│   ├── <pkg>/
│   │   ├── __init__.py       ← Composite SDK class
│   │   ├── models.py         ← @dataclass models
│   │   ├── exceptions.py     ← APIError
│   │   └── <tag>.py          ← Client classes per tag
│   ├── setup.py
│   └── requirements.txt
│
└── fetch/
    ├── config.js             ← createConfig() helper
    ├── <tag>.js              ← Async functions per tag
    ├── index.js              ← Factory entry point
    └── package.json
```

---

## Key Features

### TypeScript SDK
- **Full Type Safety**: Generates interfaces for all schemas with proper namespacing.
- **Tag-based Clients**: Groups operations by OpenAPI tags for a clean API.
- **JSDoc Support**: Pulls `summary` and `description` from the spec into your IDE.
- **Modern Fetch**: Uses vanilla `fetch` with no heavy dependencies.

### Python SDK
- **Type Hinting**: Full support for Python type hints.
- **Data Classes**: Uses `@dataclass` for all models.
- **Requests-based**: Reliable synchronous clients using the `requests` library.

### Fetch Clients
- **Zero Dependency**: Lightweight JavaScript wrappers for quick integrations.
- **Modular**: Only use what you need.

---

## Development

```bash
# Clone the repository
git clone https://github.com/aevrHQ/untools-sdkgen.git
cd untools-sdkgen/sdkgen

# Install dependencies
npm install

# Build the project
npm run build

# Link for local testing
npm link
```

### Releasing
This project uses `standard-version` for automated versioning and changelog generation.

```bash
npm run release        # Standard patch release
npm run release:minor  # Minor feature release
npm run release:major  # Major breaking release
```

---

## License
MIT
