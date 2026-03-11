package models

import (
	"context"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// Internal labels			 // External labels (mongo)
type Product struct {
	ID    primitive.ObjectID `bson:"_id,omitempty"`
	Name  string             `bson:"name"`
	Price float64            `bson:"price"`
	Stock int                `bson:"stock"`
	State string             `bson:"state"`
}

// Context works like a signal to not waste resources, this is get all like db.products.find({})

func GetAllProducts(ctx context.Context, col *mongo.Collection) ([]Product, error) {
	cursor, err := col.Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}

	// After everything ends close the connection
	defer cursor.Close(ctx)

	// Call our struct and fetch all the data
	var products []Product
	err = cursor.All(ctx, &products)
	return products, err
}
