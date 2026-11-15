/** Token files are validated at runtime against the checked-in DTCG schema. */
export type TokenData = Record<string, any>;

export interface ResolvedToken {
  value: any;
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
