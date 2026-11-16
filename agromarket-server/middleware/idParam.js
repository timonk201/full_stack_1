export function idParam(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Некорректный id' });
  }

  req.params.id = String(id);
  return next();
}
