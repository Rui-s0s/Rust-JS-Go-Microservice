import express from 'express';
import connectDB from './db.js';
import productRoutes from './routes/productRoutes.js';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true}))
app.set('view engine', 'pug')

await connectDB();

app.use("/", productRoutes);

app.listen(3000, () => console.log('Server at http://localhost:3000'));