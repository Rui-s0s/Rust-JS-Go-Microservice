package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Order struct {
	ID        primitive.ObjectID `bson:"_id,omitempty"`
	ProductID primitive.ObjectID `bson:"product_id"`
	Email     string             `bson:"email"`
	Location  string             `bson:"location"`
	CreatedAt time.Time          `bson:"created_at"`
}
