import {
  OpenAPISpec,
  ParsedEndpoint,
  Parameter,
  SchemaObject,
  Operation,
  PathItem,
} from "../types";

const HTTP_METHODS = ["get", "post", "put", "patch", "delete", "head", "options"] as const;

function resolveRef(ref: string, spec: OpenAPISpec): SchemaObject | undefined {
  if (!ref.startsWith("#/")) return undefined;
  const parts = ref.slice(2).split("/");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let node: any = spec;
  for (const p of parts) {
    node = node?.[p];
  }
  return node as SchemaObject | undefined;
}

export function resolveSchema(
  schema: SchemaObject | undefined,
  spec: OpenAPISpec,
  depth = 0
): SchemaObject | undefined {
  if (!schema || depth > 8) return schema;
  if (schema.$ref) {
    const resolved = resolveRef(schema.$ref, spec);
    return resolveSchema(resolved, spec, depth + 1);
  }
  return schema;
}

function generateOperationId(method: string, path: string): string {
  const parts = path
    .replace(/[{}]/g, "")
    .split("/")
    .filter((p) => p && !p.startsWith("{"));
  const pascal = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
  return `${method}${pascal}`;
}

function getResponseSchema(op: Operation, spec: OpenAPISpec): SchemaObject | undefined {
  const successCode = Object.keys(op.responses).find((c) =>
    ["200", "201", "202"].includes(c)
  );
  if (!successCode) return undefined;
  const resp = op.responses[successCode];
  const jsonContent = resp?.content?.["application/json"];
  return resolveSchema(jsonContent?.schema, spec);
}

function getRequestBodySchema(op: Operation, spec: OpenAPISpec): SchemaObject | undefined {
  const rb = op.requestBody;
  if (!rb) return undefined;
  const jsonContent = rb.content?.["application/json"];
  return resolveSchema(jsonContent?.schema, spec);
}

export function parseSpec(spec: OpenAPISpec): ParsedEndpoint[] {
  const endpoints: ParsedEndpoint[] = [];

  for (const [path, pathItem] of Object.entries(spec.paths)) {
    const pathLevelParams: Parameter[] = (pathItem as PathItem).parameters ?? [];

    for (const method of HTTP_METHODS) {
      const op = (pathItem as PathItem)[method] as Operation | undefined;
      if (!op) continue;

      const allParams: Parameter[] = [
        ...pathLevelParams,
        ...(op.parameters ?? []),
      ];

      const pathParams = allParams.filter((p) => p.in === "path");
      const queryParams = allParams.filter((p) => p.in === "query");
      const headerParams = allParams.filter((p) => p.in === "header");

      const operationId =
        op.operationId ?? generateOperationId(method, path);

      endpoints.push({
        operationId,
        method: method.toUpperCase(),
        path,
        summary: op.summary,
        description: op.description,
        tags: op.tags ?? ["default"],
        pathParams,
        queryParams,
        headerParams,
        requestBodySchema: getRequestBodySchema(op, spec),
        requestBodyRequired: op.requestBody?.required ?? false,
        responseSchema: getResponseSchema(op, spec),
        deprecated: op.deprecated ?? false,
      });
    }
  }

  return endpoints;
}
