import { Order } from '../models/orderModel.js';
import { Product } from '../models/productModels.js';

// For '/products' GET all products
export async function getAllProducts (req, res) {
  const token = req.query.token || req.body.token; // Get token to pass to the view
  const products = await Product.find();
  const rawOrders = await Order.find().populate('product_id').lean();
  const orders = rawOrders.map(order => ({
    ...order,
    productName: order.product_id ? order.product_id.name : 'Unknown Product',
    displayDate: order.created_at ? new Date(order.created_at).toLocaleString() : 'No Date'
  }));

  res.render('index', { products, orders, token }); // Renders index.pug
}

// For '/products' POST a new product
export async function newProduct (req, res) {
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
      stock: parseInt(stock),
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
}

// For '/products/edit/:id' GET edit a product
export async function getEditProduct (req, res) {
  const product = await Product.findById(req.params.id);
  
  const token = req.query.token; 
  res.render('edit', { product, token }); 
}

// For '/products/edit/:id' POST edit a product
export async function editProduct (req, res) {
  const { token } = req.body; // Token coming from hidden input
      
  try {
    const { name, price, stock, state } = req.body;
    await Product.findByIdAndUpdate(req.params.id, { name, price, stock, state });
    
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
}

// For '/products/delete/:id' POST delete product
export async function deleteProduct (req, res) {
  const token = req.body.token;

  try {
    await Product.findByIdAndDelete(req.params.id);

    // Redirect back to the list while keeping the user authenticated
    res.redirect(`/products?token=${token}`);
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).send("Failed to delete product.");
  }
}

// For '/orders/update/:id' POST update order status
export async function updateOrderStatus (req, res) {
  const { status, token } = req.body;
  const { id } = req.params;

  try {
    await Order.findByIdAndUpdate(id, { status });
    res.redirect(`/products?token=${token}`);
  } catch (err) {
    console.error("Order Update Error:", err);
    res.status(500).send("Failed to update order status.");
  }
}

// For '/orders/delete/:id' POST delete order
export async function deleteOrder (req, res) {
  const token = req.body.token;

  try {
    await Order.findByIdAndDelete(req.params.id);
    res.redirect(`/products?token=${token}`);
  } catch (error) {
    console.error("Order Delete Error:", error);
    res.status(500).send("Failed to delete order.");
  }
}