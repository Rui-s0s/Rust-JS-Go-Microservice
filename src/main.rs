use axum::Router;
use axum_reverse_proxy::ReverseProxy;
use std::net::SocketAddr;

#[tokio::main]
async fn main() {
    let backend_url = "http://127.0.0.1:3000";

    // Create a single proxy for the root path
    // This will catch /user, /admin, and anything else
    let main_proxy = ReverseProxy::new("/", backend_url);

    // Convert directly to a Router. No .merge() needed!
    let app: Router = main_proxy.into();

    let addr = SocketAddr::from(([127, 0, 0, 1], 4000));
    println!("Rust Proxy running on http://{}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}