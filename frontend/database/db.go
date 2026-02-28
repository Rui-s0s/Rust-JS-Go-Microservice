package database

import (
	"context"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func InitMongo(uri string) (*mongo.Client, error) {
	// Retry loop: try 5 times with a delay
	var client *mongo.Client
	var err error

	for i := 0; i < 5; i++ {
		// Use a shorter context for individual attempts
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		client, err = mongo.Connect(ctx, options.Client().ApplyURI(uri))
		cancel() // Clean up context immediately

		if err == nil {
			// Check if ping works
			pingCtx, pingCancel := context.WithTimeout(context.Background(), 2*time.Second)
			err = client.Ping(pingCtx, nil)
			pingCancel()

			if err == nil {
				return client, nil // Connected successfully!
			}
		}

		log.Printf("Waiting for MongoDB... (attempt %d/5)", i+1)
		time.Sleep(3 * time.Second) // Wait before retrying
	}
	return nil, err
}
