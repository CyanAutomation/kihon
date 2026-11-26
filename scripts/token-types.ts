/** Recursive values accepted by JSON.parse and the DTCG token files. */
export type JsonPrimitive = string | number | boolean | null;

export interface JsonObject {
  [key: string]: JsonValue;
}

export type JsonValue = JsonPrimitive | JsonValue[] | JsonObject;

declare const tokenReferenceBrand: unique symbol;
export type TokenReference = string & { readonly [tokenReferenceBrand]: true };

export type TokenData = JsonObject;

export type TokenDefinition = TokenData & {
  $value: JsonValue;
  $type?: string;
};

export interface DimensionValue {
  value: number;
  unit: 'px' | 'rem';
}

export interface DurationValue {
  value: number;
  unit: 'ms' | 's';
}

export type FontFamilyValue = string | string[];
export type FontWeightValue = number | string;

export interface DtcgColorValue {
  colorSpace: string;
  components: JsonValue[];
  alpha?: number;
  hex?: string;
}

export interface ShadowValue {
  offsetX: DimensionValue | TokenReference;
  offsetY: DimensionValue | TokenReference;
  blur: DimensionValue | TokenReference;
  spread: DimensionValue | TokenReference;
  color: DtcgColorValue | TokenReference;
  inset?: boolean;
}

export interface ResolvedToken {
  value: JsonValue;
  type: string | null | undefined;
}

export type TokenMap = Record<string, ResolvedToken>;

export interface TokenDocuments {
  primitives?: TokenData;
  semantic?: TokenData;
  lightTheme?: TokenData;
  darkTheme?: TokenData;
}

export interface CompleteTokenDocuments extends TokenDocuments {
  primitives: TokenData;
  semantic: TokenData;
  lightTheme: TokenData;
  darkTheme: TokenData;
}
