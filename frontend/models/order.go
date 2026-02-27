package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Order struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	ProductID primitive.ObjectID `bson:"product_id" json:"product_id"`
	Email     string             `bson:"email" json:"email"`
	Location  string             `bson:"location" json:"location"`
	Status    string             `bson:"status" json:"status"`
	CreatedAt time.Time          `bson:"created_at" json:"created_at"`
}
