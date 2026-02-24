import express from 'express'
const router = express.Router();
import { Product } from '../models/Product.js';

// GET all products
router.get('/', async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

// POST a new product
router.post('/', async (req, res) => {
  const newProduct = new Product(req.body);
  const savedProduct = await newProduct.save();
  res.status(201).json(savedProduct);
});

export default router