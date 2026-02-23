import express from 'express'
import postsRoutes from './routes/postsRoutes.js'

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.set('view engine', 'pug')
app.use(express.static('public'));

// Use the routes
app.use('/', postsRoutes)

app.listen(3000, () => console.log('Server running on http://localhost:3000'))