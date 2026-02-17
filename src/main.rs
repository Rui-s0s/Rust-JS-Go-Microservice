use axum::{
    extract::{Path, State},
    http::{Request, StatusCode},
    response::Response,
    routing::{any, get},
    Router,
};


use reqwest::Client;
use std::{collections::HashMap, sync::Arc};
use tracing::{info, Level};

#[derive(Clone)]
struct AppState {
    client: Client,
    services: Arc<HashMap<&'static str, &'static str>>,
}

async fn proxy(
    State(state): State<AppState>,
    Path((service, path)): Path<(String, String)>,
    req: Request<axum::body::Body>, // Removed mut, as into_body() consumes it
) -> Result<Response, StatusCode> {
    let base_url = state
        .services
        .get(service.as_str())
        .ok_or(StatusCode::NOT_FOUND)?;

    // Construct the target URL (ensure the leading slash is handled)
    let uri = format!("{}/{}", base_url.trim_end_matches('/'), path.trim_start_matches('/'));

    info!("Forwarding to {} -> {}", service, uri);

    // 1. Extract pieces of the request
    let method = req.method().clone();
    let headers = req.headers().clone();
    
    // 2. Consume the body (Ownership move)
    let body = req.into_body(); 
    let body_bytes = axum::body::to_bytes(body, 5 * 1024 * 1024) // 5MB limit
        .await
        .map_err(|_| StatusCode::BAD_REQUEST)?;

    // 3. Send the request to the microservice
    let response = state
        .client
        .request(method, uri)
        .headers(headers)
        .body(body_bytes)
        .send()
        .await
        .map_err(|_| {StatusCode::BAD_GATEWAY})?;

    // 4. Transform reqwest::Response -> axum::Response
    let status = response.status();
    let resp_headers = response.headers().clone();
    
    // Consume the downstream response body
    let resp_body = response.bytes().await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let mut builder = Response::builder().status(status);
    
    // Copy headers back
    if let Some(headers_map) = builder.headers_mut() {
        *headers_map = resp_headers;
    }

    Ok(builder.body(axum::body::Body::from(resp_body)).unwrap())
}



// async fn auth(req: Request<axum::body::Body>, next: Next) -> impl IntoResponse {
//     if req.headers().get("authorization").is_none() {
//         return StatusCode::UNAUTHORIZED;
//     }
//     next.run(req).await
// }



#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_max_level(Level::INFO)
        .init();

    let client = Client::new();

    let services = HashMap::from([
        ("users", "http://localhost:3001"),
        ("admin", "http://localhost:3002"),
    ]);

    let state = AppState {
        client,
        services: Arc::new(services),
    };

    let app: Router = Router::new()
        .route("/", get(root))
        .route("/{service}/{*path}", any(proxy))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080")
        .await
        .unwrap();

    info!("API Gateway running on 8080");

    axum::serve(listener, app).await.unwrap();
}

async fn root() -> &'static str {
    "API Gateway"
}


#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::Body;
    use axum::http::{Method, Request};
    use std::collections::HashMap;

    #[tokio::test]
    async fn test_proxy() {
        let client = Client::new();
        let services = HashMap::from([("users", "http://localhost:3001")]);
        let state = AppState {
            client,
            services: Arc::new(services),
        };

        // Create a dummy request to proxy
        let req = Request::builder()
            .method(Method::GET)
            .uri("/users/profile")
            .body(Body::empty())
            .unwrap();

        // Call the proxy function directly
        let response = proxy(State(state), Path(("users".to_string(), "profile".to_string())), req).await;

        // Assert the response is successful (or handle as needed)
        assert!(response.is_ok());
    }
}