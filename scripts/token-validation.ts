import type { CompleteTokenDocuments } from './token-types.ts';
import {
  loadTokenDocuments,
  validateDocumentShape,
  validateRequiredThemeTokens
} from './token-document-validation.ts';
import { validateDocumentReferences } from './token-reference-validation.ts';

function validateTokenDocuments(documents: CompleteTokenDocuments): string[] {
  const errors: string[] = [];
  const entries = Object.entries(documents);

  for (const [label, document] of entries) validateDocumentShape(document, label, errors);
  validateDocumentReferences(documents, errors);
  validateRequiredThemeTokens(documents.lightTheme, 'lightTheme', errors);
  validateRequiredThemeTokens(documents.darkTheme, 'darkTheme', errors);
  return [...new Set(errors)];
}

export { loadTokenDocuments, validateTokenDocuments };
