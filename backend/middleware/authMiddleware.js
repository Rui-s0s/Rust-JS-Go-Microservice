import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';

export const verifyToken = (req, res, next) => {
  // Pull token from the URL: /products?token=...
  const token = req.query?.token || req.body?.token;

  if (!token) {
    return res.status(401).send(`
      <h1>Unauthorized</h1>
      <p>Access denied. No token provided.</p>
      <a href="/login">Return to Login</a>
    `);
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded; // Store user data in request for later use
    next(); // Move to the next function (the route handler)
  } catch (err) {
    return res.status(403).send(`
      <h1>Session Expired</h1>
      <p>Your token is invalid or has expired.</p>
      <a href="/login">Login Again</a>
    `);
  }
};
