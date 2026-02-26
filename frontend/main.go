package main

import (
	"back/controllers"
	"back/database"
	"back/routes"
	"log"
	"net/http"
)

func main() {
	client, err := database.InitMongo("mongodb://localhost:27017")
	if err != nil {
		log.Fatal(err)
	}

	// Initialize both collections
	productColl := client.Database("shopDB").Collection("products")
	orderColl := client.Database("shopDB").Collection("orders")

	// Inject BOTH into the controller
	pc := &controllers.ProductController{
		ProductCollection: productColl,
		OrderCollection:   orderColl,
	}

	routes.RegisterRoutes(pc)

	log.Println("Server running on http://localhost:8080")
	http.ListenAndServe(":8080", nil)
}
