import express from 'express';
import productRoutes from './routes/productRoutes.js';

const app = express();
app.use("/products", productRoutes);

app.listen(3000, () => console.log('Server at http://localhost:3000'));