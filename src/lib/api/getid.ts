async function getId(context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return id;
}
