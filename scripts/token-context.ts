import type { TokenData, TokenDocuments } from './token-types.ts';

export function createTokenContext(documents: TokenDocuments, localDocument?: TokenData | null): TokenData {
  const primitives = documents.primitives || {};
  const context: TokenData = {
    ...primitives,
    primitives
  };

  if (documents.semantic) context.semantic = documents.semantic;
  if (localDocument) Object.assign(context, localDocument);

  return context;
}
