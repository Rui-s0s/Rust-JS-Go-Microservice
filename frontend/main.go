package main

import (
	"back/controllers"
	"back/database"
	"back/middlewares"
	"back/routes"
	"log"
	"net/http"
	"os"
)

func main() {
	client, err := database.InitMongo(os.Getenv("MONGO_URI"))
	if err != nil {
		log.Fatal(err)
	}

	// Initialize both collections
	productColl := client.Database("shopDB").Collection("products")
	orderColl := client.Database("shopDB").Collection("orders")

	// Injects both into the controller
	pc := &controllers.ProductController{
		ProductCollection: productColl,
		OrderCollection:   orderColl,
	}

	routes.RegisterRoutes(pc)

	loggedRouter := middlewares.RequestLogger(http.DefaultServeMux)

	log.Println("Server running on http://0.0.0.0:8080")
	log.Fatal(http.ListenAndServe(":8080", loggedRouter))
}
