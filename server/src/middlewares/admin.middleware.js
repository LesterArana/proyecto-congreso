export function requireAdmin(req, res, next) {
  const key = req.header('x-admin-key') || req.query.adminKey;
  if (!process.env.ADMIN_KEY) {
    return res.status(500).json({ message: 'ADMIN_KEY not set in server' });
  }
  if (key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
}
