use std::sync::Arc;
use std::collections::HashMap;
use reqwest::Client;

#[derive(Clone)]
pub struct AppState {
    pub client: Client,
    pub services: Arc<HashMap<String, String>>,
    pub jwt_secret: String,
}