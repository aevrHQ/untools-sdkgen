import { SchemaObject, OpenAPISpec } from "../types";
import { resolveSchema } from "../parsers/parser";

export function schemaToTsType(
  schema: SchemaObject | undefined,
  spec: OpenAPISpec,
  depth = 0,
  prefix = "Types."
): string {
  if (!schema) return "unknown";
  
  if (schema.$ref) {
    const name = schema.$ref.split("/").pop();
    return name ? `${prefix}${name}` : "unknown";
  }

  const resolved = resolveSchema(schema, spec);
  if (!resolved) return "unknown";

  if (resolved.nullable) {
    return `${schemaToTsType({ ...resolved, nullable: false }, spec, depth, prefix)} | null`;
  }

  if (resolved.enum) {
    return resolved.enum.map((v) => JSON.stringify(v)).join(" | ");
  }

  if (resolved.allOf) {
    return resolved.allOf
      .map((s) => schemaToTsType(s, spec, depth + 1, prefix))
      .join(" & ");
  }

  if (resolved.oneOf || resolved.anyOf) {
    const arr = resolved.oneOf ?? resolved.anyOf ?? [];
    return arr.map((s) => schemaToTsType(s, spec, depth + 1, prefix)).join(" | ");
  }

  switch (resolved.type) {
    case "string":
      if (resolved.format === "date-time") return "string";
      if (resolved.format === "binary") return "Blob | File";
      return "string";
    case "integer":
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "array":
      return `Array<${schemaToTsType(resolved.items, spec, depth + 1, prefix)}>`;
    case "object": {
      if (!resolved.properties) {
        if (resolved.additionalProperties && typeof resolved.additionalProperties === "object") {
          return `Record<string, ${schemaToTsType(resolved.additionalProperties, spec, depth + 1, prefix)}>`;
        }
        return "Record<string, unknown>";
      }
      const indent = "  ".repeat(depth + 1);
      const closing = "  ".repeat(depth);
      const props = Object.entries(resolved.properties)
        .map(([key, val]) => {
          const optional = !(resolved.required ?? []).includes(key);
          const type = schemaToTsType(val, spec, depth + 1, prefix);
          const jsDoc = val.description ? `${indent}/** ${val.description} */\n` : "";
          return `${jsDoc}${indent}${key}${optional ? "?" : ""}: ${type};`;
        })
        .join("\n");
      return `{\n${props}\n${closing}}`;
    }
    default:
      return "unknown";
  }
}

export function schemaToTsInterface(
  name: string,
  schema: SchemaObject,
  spec: OpenAPISpec
): string {
  const type = schemaToTsType(schema, spec, 0, "");
  if (type.startsWith("{")) {
    return `export interface ${name} ${type}\n`;
  }
  return `export type ${name} = ${type};\n`;
}

export function toCamelCase(str: string): string {
  return str
    .replace(/[-_\s](.)/g, (_, c: string) => c.toUpperCase())
    .replace(/^(.)/, (_, c: string) => c.toLowerCase());
}

export function toPascalCase(str: string): string {
  const camel = toCamelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

export function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, "_$1")
    .replace(/[-\s]/g, "_")
    .toLowerCase()
    .replace(/^_/, "");
}
