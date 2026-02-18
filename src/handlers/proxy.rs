use axum::{
    body::Body,
    extract::{Path, State},
    http::{Request, Response, StatusCode},
};
use crate::state::AppState;
use crate::models::auth::verify_token;

pub async fn proxy_handler(
    State(state): State<AppState>,
    Path((token, service, path)): Path<(String, String, String)>,
    req: Request<Body>,
) -> Result<Response<Body>, StatusCode> {
    
    // 1. JWT Validation (The first gate)
    // If this fails, the '?' sends a StatusCode::UNAUTHORIZED back immediately
    let claims = verify_token(&token, &state.jwt_secret)?;

    // 2. Resolve Service URL
    let base_url = state.services.get(&service)
        .ok_or(StatusCode::NOT_FOUND)?;

    // 3. Construct Target URI
    let target_uri = format!("{}/{}", base_url.trim_end_matches('/'), path.trim_start_matches('/'));

    // 4. Prepare Proxy Request
    let method = req.method().clone();
    let mut headers = req.headers().clone();
    
    // Inject User ID into headers for the Go Backend
    headers.insert("X-User-ID", claims.sub.parse().unwrap_or("unknown".parse().unwrap()));

    let body_bytes = axum::body::to_bytes(req.into_body(), 5 * 1024 * 1024)
        .await
        .map_err(|_| StatusCode::BAD_REQUEST)?;

    // 5. Forward to Downstream Service (Go Backend)
    let client_resp = state.client
        .request(method, target_uri)
        .headers(headers)
        .body(body_bytes)
        .send()
        .await
        .map_err(|_| StatusCode::BAD_GATEWAY)?;

    // 6. Build Axum Response from Client Response
    let status = client_resp.status();
    let resp_headers = client_resp.headers().clone();
    let resp_body = client_resp.bytes().await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let mut builder = Response::builder().status(status);
    if let Some(h) = builder.headers_mut() {
        *h = resp_headers;
    }

    Ok(builder.body(Body::from(resp_body)).unwrap())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Arc;
    use std::collections::HashMap;
    use axum::extract::State;

    // Helper to create a dummy AppState
    fn mock_state() -> AppState {
        let mut services = HashMap::new();
        services.insert("backend".to_string(), "http://localhost:8081".to_string());
        AppState {
            client: reqwest::Client::new(),
            services: Arc::new(services),
            jwt_secret: "secret".to_string(),
        }
    }

    #[tokio::test]
    async fn test_proxy_invalid_token() {
        let state = mock_state();
        let path = Path(("invalid-token".to_string(), "backend".to_string(), "users".to_string()));
        let req = Request::builder().body(Body::empty()).unwrap();

        // Call the handler directly
        let result = proxy_handler(State(state), path, req).await;

        // Assert that the Railroad switched to the Red Track (Unauthorized)
        assert_eq!(result.unwrap_err(), StatusCode::UNAUTHORIZED);
    }
}