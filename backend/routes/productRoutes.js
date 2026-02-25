import express from 'express'
const router = express.Router();
import { Product } from '../models/productModels.js';
import jwt from 'jsonwebtoken';

const SECRET_KEY = "your_super_secret_key"; // Use an environment variable in production!

// Middleware to check for token in body
const verifyToken = (req, res, next) => {
  const token = req.body.token; // We are looking in the form body now
 
  if (!token) {
    return res.status(403).send("A token is required for authentication");
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    delete req.body.token;
  } catch (err) {
    return res.status(401).send("Invalid Token");
  }
  return next();
};

// GET Login Page
router.get('/login', (req, res) => {
  res.render('login', { token: null });
});

// POST Login (Simulated authentication)
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Simple hardcoded check for demonstration
  if (username === 'admin' && password === 'password123') {
    const token = jwt.sign({ user: 'admin' }, SECRET_KEY, { expiresIn: '1h' });
    return res.render('login', { token });
  }

  res.render('login', { error: 'Invalid credentials', token: null });
});



// GET all products and render the Pug view
router.get('/products', async (req, res) => {
  let referer = req.headers.referer;
  console.log(referer)

  // If there's no referer, or the referer isn't your login page, block them
  if (!referer || !referer.includes('localhost:3000')) {
    return res.status(403).send("<h1>Access Denied</h1><p>You must obtain a token from the login page first.</p><a href='/login'>Go to Login</a>");
  }

  const products = await Product.find();
  res.render('index', { products }); // Renders index.pug
});

// POST a new product (Redirects back to list)
router.post('/products', verifyToken, async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.redirect('/products');
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).send(`
        <h1>Duplicate Error</h1>
        <p>A product named "${req.body.name}" already exists.</p>
        <button onclick="history.back()">Go Back</button>
      `);
    }}
});

// GET the edit page
router.get('/products/edit/:id', async (req, res) => {
  const product = await Product.findById(req.params.id);
  res.render('edit', { product }); // Renders edit.pug
});

// POST update (since forms can't do PUT)
router.post('/products/update/:id', verifyToken, async (req, res) => {
  await Product.findByIdAndUpdate(req.params.id, req.body);
  res.redirect('/products');
});

// POST delete (since forms can't do DELETE)
router.post('/products/delete/:id', verifyToken, async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.redirect('/products');
});

export default router