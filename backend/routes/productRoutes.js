import express from 'express'
import { Product } from '../models/productModels.js';
import { Order } from '../models/orderModel.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

const SECRET_KEY = process.env.JWT_SECRET
const ADMIN_USER = process.env.ADMIN_USERNAME; 
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;


// GET Login Page
router.get('/', (req, res) => {
  res.render('login', { token: null });
});

// POST Login (Simulated authentication)
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === ADMIN_USER && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ user: ADMIN_USER }, SECRET_KEY, { expiresIn: '1h' });
    return res.render('login', { token });
  }

  res.render('login', { error: 'Invalid credentials', token: null });
});



// GET all products and render the Pug view
router.get('/products', verifyToken, async (req, res) => {
  const token = req.query.token || req.body.token; // Get token to pass to the view
  const products = await Product.find();
  const rawOrders = await Order.find().populate('product_id').lean();
  const orders = rawOrders.map(order => ({
    ...order,
    productName: order.product_id ? order.product_id.name : 'Unknown Product',
    displayDate: order.created_at ? new Date(order.created_at).toLocaleString() : 'No Date'
  }));

  res.render('index', { products, orders, token }); // Renders index.pug
});

// POST a new product (Redirects back to list)
router.post('/products', verifyToken, async (req, res) => {
  const { name, price, stock } = req.body;
  const token = req.query?.token || req.body?.token;

  try {
    // 1. Manual Validation for negatives
    if (parseFloat(price) < 0 || parseInt(stock) < 0) {
      return res.status(400).send(`
        <h1>Validation Error</h1>
        <p>Price and Stock cannot be negative.</p>
        <a href="/products?token=${token}">Go Back</a>
      `);
    }

    // 2. Create the product
    // We explicitly define the object to avoid saving the 'token' field into the DB
    await Product.create({
      name,
      price: parseFloat(price),
      stock: parseInt(stock)
    });

    // 3. Redirect back with the session token
    res.redirect(`/products?token=${token}`);

  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).send(`
        <h1>Duplicate Error</h1>
        <p>A product named "${name}" already exists.</p>
        <a href="/products?token=${token}">Go Back</a>
      `);
    }
    console.error("Error creating product:", err);
    res.status(500).send("Failed to create product.");
  }
});

// GET the edit page
router.get('/products/edit/:id', verifyToken, async (req, res) => {
  const product = await Product.findById(req.params.id);
  
  const token = req.query.token; 
  res.render('edit', { product, token }); 
});

// POST update
router.post('/products/update/:id', verifyToken, async (req, res) => {
  const { token } = req.body; // Token coming from hidden input
  
  try {
    const { name, price, stock } = req.body;
    await Product.findByIdAndUpdate(req.params.id, { name, price, stock });
    
    res.redirect(`/products?token=${token}`);
  } catch (err) {
    if (err.code === 11000) { 
      return res.status(400).send(`
        <h1>Duplicate Error</h1>
        <p>A product named "${req.body.name}" already exists.</p>
        <a href="/products/edit/${req.params.id}?token=${token}">Go Back</a>
      `);
    }

    console.error("Update Error:", err);
    res.status(500).send("Update failed");
  }
});

// POST delete (since forms can't do DELETE)
router.post('/products/delete/:id', verifyToken, async (req, res) => {
  // Pull the token from the body to persist the session in the redirect
  const token = req.body.token;

  try {
    await Product.findByIdAndDelete(req.params.id);
    
    // Redirect back to the list while keeping the user authenticated
    res.redirect(`/products?token=${token}`);
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).send("Failed to delete product.");
  }
});

export default router