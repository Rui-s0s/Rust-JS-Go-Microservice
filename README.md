# Mock Online Store

This project is a containerized mock online store consisting of a Go-based customer frontend and a Node.js-based admin backend, backed by a MongoDB database.

## Architecture

- **Customer Frontend (`frontend/`)**: Written in **Go**, this service allows customers to browse products and place orders. It connects directly to MongoDB to retrieve product data and record orders.
- **Admin Backend (`backend/`)**: Written in **Node.js/Express**, this service provides an admin dashboard for product management (CRUD operations) and order tracking. It uses **Pug** for server-side rendering.
- **Database (`mongo_db`)**: A **MongoDB** container that stores all product and order information. Both services share this database.
- **Authentication**: Admin access is secured with **JWT-based authentication**. After a successful login, the token is passed via URL parameters (e.g., `?token=...`) to maintain the session across different admin views.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Environment Setup

The project requires several environment variables for security and configuration. Create a `.env` file in the root directory with the following variables:

```env
JWT_SECRET=your_secret_key_here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_admin_password_here
```

## Running the Project

1. **Clone the repository** (if you haven't already).
2. **Build and start the containers**:
   ```bash
   docker-compose up --build
   ```
3. **Access the services**:
   - **Customer Storefront**: [http://localhost:8080/products](http://localhost:8080/products)
   - **Admin Dashboard**: [http://localhost:3000](http://localhost:3000)

## Service Details

### Go Frontend (Port 8080)
- `GET /products`: List all available products.
- `GET /product/{id}`: View details for a specific product.
- `POST /product/order/{id}`: Place an order for a product (automatically decrements stock).
- `GET /order-success`: Confirmation page after a successful purchase.

### Node.js Admin (Port 3000)
- `GET /`: Admin login page.
- `POST /login`: Authenticate and receive a JWT token.
- `GET /products?token=...`: View and manage products and orders.
- `POST /products?token=...`: Create a new product.
- `GET /products/edit/:id?token=...`: Edit an existing product.
- `POST /products/update/:id`: Save changes to a product.
- `POST /products/delete/:id`: Remove a product from the store.

## Database Management
You can interact with the MongoDB instance directly using `mongosh`:
```bash
docker exec -it store-db mongosh shopDB
```
To view logs for the database:
```bash
docker logs -f store-db
```
