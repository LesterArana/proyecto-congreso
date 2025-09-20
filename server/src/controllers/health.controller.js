export const ping = (req, res) => {
  res.json({ ok: true, message: 'API up', time: new Date().toISOString() });
};
