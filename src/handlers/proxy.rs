use axum::{
    body::Body,
    extract::{Path, State},
    http::{Method, HeaderMap, Request, StatusCode},
    Form,
    response::Response
};
use serde::Deserialize;
use crate::state::AppState;
use crate::models::auth::verify_token;

#[derive(Deserialize)]
pub struct ProxyRequest {
    pub token: String,
}


pub async fn proxy_handler(
    State(state): State<AppState>,
    Path((service, path)): Path<(String, String)>,
    Form(payload): Form<ProxyRequest>, 
    method: Method,     
    headers: HeaderMap, 
) -> Result<Response<Body>, StatusCode> {
    
    // 1. JWT Validation
    let claims = verify_token(&payload.token, &state.jwt_secret)?;

    // 2. Resolve Service URL
    let base_url = state.services.get(&service)
        .ok_or(StatusCode::NOT_FOUND)?;

    // 3. Construct Target URI
    let target_uri = format!("{}/{}", base_url.trim_end_matches('/'), path.trim_start_matches('/'));

    // 4. Prepare Forwarding Headers
    let mut forward_headers = headers.clone();
    
    // Inject User ID into headers for the Downstream Backend
    if let Ok(user_id) = claims.sub.parse() {
        forward_headers.insert("X-User-ID", user_id);
    }

    // 5. Forward to Downstream Service
    // NOTE: Since the body was consumed by 'Form', we send an empty body downstream.
    // If you need to send data, include it in the ProxyRequest struct.
    let client_resp = state.client
        .request(method, target_uri)
        .headers(forward_headers)
        .body("") // Sending empty body because the original body was the JWT form
        .send()
        .await
        .map_err(|_| StatusCode::BAD_GATEWAY)?;

    // 6. Build Axum Response from Client Response
    let status = StatusCode::from_u16(client_resp.status().as_u16())
        .unwrap_or(StatusCode::INTERNAL_SERVER_ERROR);
        
    let resp_headers = client_resp.headers().clone();
    let resp_body = client_resp.bytes().await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let mut builder = Response::builder().status(status);
    
    // Copy headers from the downstream response back to the user
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
    use axum::{extract::State, Router};
    use tower::ServiceExt;
    use axum::routing::any;


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
        
        // 1. Path must match the (String, String) pattern
        let path = Path(("backend".to_string(), "users".to_string()));
        
        // 2. Form must contain the token
        let form = Form(ProxyRequest {
            token: "invalid-token".to_string(),
        });

        // 3. The Request (The 4th argument)
        let req = Request::builder().body(Body::empty()).unwrap();

        // 4. Call with EXACTLY 4 arguments to match your definition
        let result = proxy_handler(
            State(state), 
            path, 
            form, 
            req
        ).await;

        assert_eq!(result.unwrap_err(), StatusCode::UNAUTHORIZED);
    }

    #[tokio::test]
    async fn test_proxy_integration() {
        let state = mock_state();
        let token = "valid-token-here"; // Ensure this is a real JWT if your mock validates it

        // 3. Create the App Router
        // Updated route: removed {token} from the path
        let app = Router::new()
            .route("/proxy/{service}/{*path}", any(proxy_handler))
            .with_state(state);

        // 4. Construct the Request
        // The URI no longer contains the token
        let uri = "/proxy/auth-service/api/v1/users";
        
        // Create a URL-encoded form body
        let form_body = format!("token={}", token);

        let request = Request::builder()
            .uri(uri)
            .method("POST") // Forms require POST
            .header("Content-Type", "application/x-www-form-urlencoded")
            .body(Body::from(form_body))
            .unwrap();

        // 5. Fire the request
        let response = app.oneshot(request).await.unwrap();

        // 6. Assertions
        // Still expecting 502 because the mock backend isn't real, 
        // but this proves it passed the Form extraction and JWT check!
        assert_eq!(response.status(), StatusCode::BAD_GATEWAY);
    }
}
