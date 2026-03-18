export interface OpenAPISpec {
  openapi?: string;
  swagger?: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  servers?: Array<{ url: string; description?: string }>;
  paths: Record<string, PathItem>;
  components?: {
    schemas?: Record<string, SchemaObject>;
    securitySchemes?: Record<string, SecurityScheme>;
  };
}

export interface PathItem {
  get?: Operation;
  post?: Operation;
  put?: Operation;
  patch?: Operation;
  delete?: Operation;
  head?: Operation;
  options?: Operation;
  parameters?: Parameter[];
}

export interface Operation {
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: Parameter[];
  requestBody?: RequestBody;
  responses: Record<string, ResponseObject>;
  security?: Record<string, string[]>[];
  deprecated?: boolean;
}

export interface Parameter {
  name: string;
  in: "query" | "header" | "path" | "cookie";
  required?: boolean;
  description?: string;
  schema?: SchemaObject;
}

export interface RequestBody {
  required?: boolean;
  description?: string;
  content: Record<string, { schema?: SchemaObject }>;
}

export interface ResponseObject {
  description?: string;
  content?: Record<string, { schema?: SchemaObject }>;
}

export interface SchemaObject {
  type?: string;
  format?: string;
  description?: string;
  properties?: Record<string, SchemaObject>;
  items?: SchemaObject;
  required?: string[];
  enum?: unknown[];
  $ref?: string;
  allOf?: SchemaObject[];
  oneOf?: SchemaObject[];
  anyOf?: SchemaObject[];
  nullable?: boolean;
  additionalProperties?: boolean | SchemaObject;
}

export interface SecurityScheme {
  type: string;
  scheme?: string;
  bearerFormat?: string;
  in?: string;
  name?: string;
}

export interface ParsedEndpoint {
  operationId: string;
  method: string;
  path: string;
  summary?: string;
  description?: string;
  tags: string[];
  pathParams: Parameter[];
  queryParams: Parameter[];
  headerParams: Parameter[];
  requestBodySchema?: SchemaObject;
  requestBodyRequired: boolean;
  responseSchema?: SchemaObject;
  deprecated: boolean;
}

export interface GeneratorOptions {
  output: string;
  language: "typescript" | "python" | "fetch";
  packageName: string;
  baseUrl?: string;
}
