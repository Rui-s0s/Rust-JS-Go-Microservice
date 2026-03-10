import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET
const ADMIN_USER = process.env.ADMIN_USERNAME; 
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

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