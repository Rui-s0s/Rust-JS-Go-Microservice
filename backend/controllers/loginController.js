import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';
const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin'; 
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password';

export async function login (req,res) {
    const { username, password } = req.body;
      
    if (username === ADMIN_USER && password === ADMIN_PASSWORD) {
        const token = jwt.sign({ user: ADMIN_USER }, SECRET_KEY, { expiresIn: '1h' });
        return res.render('login', { token });
    }

    res.render('login', { error: 'Invalid credentials', token: null });
}

export async function getLogin (req, res) {
    res.render('login', { token: null });
}