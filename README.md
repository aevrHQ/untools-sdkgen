# sdkgen

> Generate TypeScript SDKs, Python SDKs, and vanilla fetch clients from an OpenAPI spec — local file or URL.

Inspired by [Fern](https://buildwithfern.com). No cloud required, no config files, just point it at a spec.

---

## Install

```bash
# Clone / copy this directory, then:
npm install
npm run build       # compiles TypeScript → dist/
npm link            # makes `sdkgen` available globally
```

Or run directly without building:
```bash
node bin/sdkgen.js <input> [options]
```

---

## Usage

```
sdkgen <input> [options]

ARGUMENTS
  <input>          Path to an OpenAPI JSON/YAML file, or a URL to an
                   OpenAPI endpoint (e.g. https://api.example.com/openapi.json)

OPTIONS
  -o, --output     Output directory              [default: ./generated]
  -l, --lang       Comma-separated targets:
                     typescript | python | fetch  [default: typescript,python,fetch]
  -n, --name       Package name                  [default: derived from spec title]
  -h, --help       Show help
```

### Examples

```bash
# Generate all three targets from a local file
sdkgen ./openapi.json

# TypeScript + Python from a live URL
sdkgen https://api.example.com/openapi.json -l typescript,python

# Just fetch wrappers, custom output dir and package name
sdkgen ./spec.yaml -l fetch -o ./sdk -n my-api
```

---

## Output structure

```
generated/
├── typescript/
│   ├── src/
│   │   ├── types.ts          ← All schema interfaces
│   │   ├── errors.ts         ← APIError class
│   │   ├── <tag>.ts          ← One typed class per tag
│   │   └── index.ts          ← Barrel + composite SDK class
│   ├── package.json
│   └── tsconfig.json
│
├── python/
│   ├── <pkg>/
│   │   ├── __init__.py       ← Composite SDK class
│   │   ├── models.py         ← @dataclass models
│   │   ├── exceptions.py     ← APIError
│   │   └── <tag>.py          ← One client class per tag
│   ├── setup.py
│   └── requirements.txt
│
└── fetch/
    ├── config.js             ← createConfig() helper
    ├── <tag>.js              ← Named async functions per tag
    ├── index.js              ← Barrel + create<Name>() factory
    └── package.json
```

---

## What gets generated

### TypeScript SDK

- Full interfaces for all `components/schemas`
- One `class <Tag>Client` per OpenAPI tag, with:
  - Typed method signatures (path params, query params, request body, return type)
  - JSDoc from `summary` / `description`
  - `@deprecated` annotations
- Composite `<Name>SDK` class grouping all clients
- `APIError` with status code

### Python SDK

- `@dataclass` models for all schemas
- One `class <Tag>Client` per tag using `requests.Session`
- Snake_case method names, optional params, `raise_for_status()`
- Composite SDK class injecting a shared session

### Fetch Client

- Zero-dependency, ESM-native
- One `async function` per endpoint
- `create<Name>(baseUrl, headers)` factory grouping everything
- Works in browsers and Node.js ≥ 18

---

## Supported OpenAPI features

| Feature | Supported |
|---|---|
| OpenAPI 3.x JSON | ✅ |
| OpenAPI 3.x YAML | ✅ (requires `js-yaml`) |
| Swagger 2.0 | ⚠️ Partial |
| `$ref` resolution | ✅ |
| Path / query / header params | ✅ |
| Request bodies (`application/json`) | ✅ |
| Response schemas | ✅ |
| `components/schemas` | ✅ |
| Enum types | ✅ |
| `allOf` / `oneOf` / `anyOf` | ✅ |
| `nullable` | ✅ |
| Deprecated operations | ✅ |
| Multi-server | ✅ (uses first) |
| Auth / security schemes | ⚠️ Header passthrough only |

---

## Extending

Each generator is a standalone module in `src/generators/`. To add a new target (e.g. Go, Ruby):

1. Create `src/generators/go.ts` implementing `generateGoSDK(spec, endpoints, outDir, pkgName)`
2. Register it in `src/index.ts` under the language switch
3. Add `"go"` to the valid `--lang` values
