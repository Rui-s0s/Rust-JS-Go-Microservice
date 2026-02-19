use jsonwebtoken::{decode, DecodingKey, Validation, Algorithm, encode, Header, EncodingKey}; 
use serde::{Deserialize, Serialize};
use axum::http::StatusCode;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Serialize, Deserialize, Clone)] // Added Clone and Debug
pub struct Claims {
    pub sub: String,    // User ID
    pub exp: usize,     // Expiration time
    pub iat: usize,     // Issued at
}


pub fn verify_token(token: &str, secret: &str) -> Result<Claims, StatusCode> {
    let key = DecodingKey::from_secret(secret.as_ref());
    let validation = Validation::new(Algorithm::HS256);

    decode::<Claims>(token, &key, &validation)
        .map(|data| data.claims)
        .map_err(|_| StatusCode::UNAUTHORIZED)
}

pub fn create_token(user_id: &str, secret: &str) -> Result<String, jsonwebtoken::errors::Error> {
    let expiration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("Time went backwards")
        .as_secs() + 3600; // Expires in 1 hour

    let claims = Claims {
        sub: user_id.to_owned(),
        exp: expiration as usize,
        iat: (expiration - 3600) as usize,
    };

    let header = Header::new(Algorithm::HS256);
    
    encode(
        &header,
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
}

#[cfg(test)]
mod tests {
    use super::*;

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
            iat: now(),
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
            iat: now() - 3600,
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
        let my_claims = Claims { sub: "123".to_string(), exp: now() + 60, iat: now() };
        let token = encode(&Header::default(), &my_claims, &EncodingKey::from_secret("right".as_ref())).unwrap();
        
        let result = verify_token(&token, "wrong");
        assert_eq!(result.unwrap_err(), StatusCode::UNAUTHORIZED);
    }

    #[test]
    fn test_token_roundtrip() {
        let secret = "test_secret_123";
        let user_id = "user_99";

        // 1. Create the token
        let token = create_token(user_id, secret)
            .expect("Failed to create token");

        // 2. Verify the token immediately
        let claims = verify_token(&token, secret)
            .expect("Verification failed - secret or algorithm mismatch");

        assert_eq!(claims.sub, user_id);
        println!("Unit test passed: Token generated and verified correctly.");
    }
}