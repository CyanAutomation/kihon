function createTokenContext(documents, localDocument) {
  const primitives = documents.primitives || {};
  const context = {
    ...primitives,
    primitives
  };

  if (documents.semantic) context.semantic = documents.semantic;
  if (localDocument) Object.assign(context, localDocument);

  return context;
}

module.exports = { createTokenContext };
