mod models;
mod state;
mod handlers;

use std::sync::Arc;
use std::collections::HashMap;
use std::env;
use dotenvy::dotenv;
use axum::{routing::any,Router,};

use crate::state::AppState;
use crate::handlers::proxy::proxy_handler;

#[tokio::main]
async fn main() {
    dotenv().ok();
    let jwt_secret = env::var("JWT_SECRET").expect("JWT_SECRET must be set");

    let mut services = HashMap::new();
    // 1. Setup the "State" (Your shared memory)
    services.insert("go-service".to_string(), "http://localhost:8081".to_string());
    services.insert("node-service".to_string(), "http://localhost:8082".to_string());

    let shared_state = AppState {
        client: reqwest::Client::new(),
        services: Arc::new(services),
        jwt_secret: jwt_secret, // Keep this safe!
    };

    // 2. Build the Router
    // This route matches: /:token/:service/*path
    // Example: /ey.../go-service/users/profile
    let app = Router::new()
        .route("/{token}/{service}/{*path}", any(proxy_handler))
        .with_state(shared_state);

    // 3. Start the Server
    let addr = "0.0.0.0:3000";
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    
    println!("🚀 Rust Gateway running on http://{}", addr);
    println!("Forwarding 'go-service' -> http://localhost:8081");
    println!("Forwarding 'node-service' -> http://localhost:8082");

    axum::serve(listener, app).await.unwrap();
}