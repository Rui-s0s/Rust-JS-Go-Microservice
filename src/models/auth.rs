use jsonwebtoken::{decode, DecodingKey, Validation, Algorithm}; 
use serde::{Deserialize, Serialize};
use axum::http::StatusCode;
#[derive(Debug, Serialize, Deserialize, Clone)] // Added Clone and Debug
pub struct Claims {
    pub sub: String,
    pub exp: usize,
}

pub fn verify_token(token: &str, secret: &str) -> Result<Claims, StatusCode> {
    let key = DecodingKey::from_secret(secret.as_ref());
    let validation = Validation::new(Algorithm::HS256);

    decode::<Claims>(token, &key, &validation)
        .map(|data| data.claims)
        .map_err(|_| StatusCode::UNAUTHORIZED)
}

#[cfg(test)]
mod tests {
    use super::*;
    use jsonwebtoken::{encode, Header, EncodingKey}; 
    use std::time::{SystemTime, UNIX_EPOCH};

    // Helper to get current unix timestamp
    fn now() -> usize {
        SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs() as usize
    }

    #[test]
    fn test_valid_token_verification() {
        let secret = "secret";
        let my_claims = Claims {
            sub: "123".to_string(),
            exp: now() + 60,
        };

        let token = encode(
            &Header::default(),
            &my_claims,
            &EncodingKey::from_secret(secret.as_ref()),
        ).expect("Failed to encode token");

        let result = verify_token(&token, secret);
        assert!(result.is_ok());
        assert_eq!(result.unwrap().sub, "123");
    }

    #[test]
    fn test_expired_token() {
        let secret = "secret";
        let my_claims = Claims {
            sub: "123".to_string(),
            // Change -60 to -300 to bypass the 60s leeway
            exp: now() - 300, 
        };

        let token = encode(
            &Header::default(), 
            &my_claims, 
            &EncodingKey::from_secret(secret.as_ref())
        ).unwrap();
        
        let result = verify_token(&token, secret);
        
        // Now this should correctly return an Err(StatusCode::UNAUTHORIZED)
        assert_eq!(result.unwrap_err(), StatusCode::UNAUTHORIZED);
    }

    #[test]
    fn test_wrong_secret() {
        let my_claims = Claims { sub: "123".to_string(), exp: now() + 60 };
        let token = encode(&Header::default(), &my_claims, &EncodingKey::from_secret("right".as_ref())).unwrap();
        
        let result = verify_token(&token, "wrong");
        assert_eq!(result.unwrap_err(), StatusCode::UNAUTHORIZED);
    }
}