import express from 'express'
import { verifyToken } from '../middleware/authMiddleware.js';
import { login, getLogin } from '../controllers/loginController.js'
import { getAllProducts, newProduct, editProduct, deleteProduct, getEditProduct } from '../controllers/productController.js';

const router = express.Router();

// Login logic
router.get('/', getLogin);
router.post('/login', login);

// Products logic
router.get('/products', verifyToken, getAllProducts);
router.post('/products', verifyToken, newProduct);
router.get('/products/edit/:id', verifyToken, getEditProduct);
router.post('/products/update/:id', verifyToken, editProduct);
router.post('/products/delete/:id', verifyToken, deleteProduct);

export default router