import type { Json } from "@/types/database";
import type { Brand, JsonValue } from "@/types/common";

export function brandId<B extends string>(value: string): Brand<string, B> {
  return value as Brand<string, B>;
}

export function brandIdOrNull<B extends string>(
  value: string | null,
): Brand<string, B> | null {
  return value == null ? null : brandId<B>(value);
}

export function asJsonValue(value: Json): JsonValue {
  return value as JsonValue;
}

export function toDbJson(value: JsonValue | undefined): Json {
  if (value === undefined) return {};
  return value as Json;
}
