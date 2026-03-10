package controllers

import (
	"back/models"
	"html/template"
	"net/http"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type ProductController struct {
	ProductCollection *mongo.Collection
	OrderCollection   *mongo.Collection
}

// r request w response (r what you "r"ead, w what you "w"rite as a response)

// For "/products"
func (pc *ProductController) ListProducts(w http.ResponseWriter, r *http.Request) {
	// ctx checks the status of the conection
	ctx := r.Context()

	products, err := models.GetAllProducts(ctx, pc.ProductCollection)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Loads the html and sends the data along with it
	tmpl := template.Must(template.ParseFiles("views/templates/index.html"))
	tmpl.Execute(w, products)
}

// For "/product/"
func (pc *ProductController) GetProduct(w http.ResponseWriter, r *http.Request) {
	// Getting the id from url
	idParam := r.URL.Path[len("/product/"):]
	if idParam == "" {
		http.NotFound(w, r)
		return
	}

	// Converting to ObjectID for mongo to use
	objID, err := primitive.ObjectIDFromHex(idParam)
	if err != nil {
		http.NotFound(w, r)
		return
	}
	// Calls the struct that we defined to hold the data that we're going to send
	var product models.Product
	err = pc.ProductCollection.FindOne(r.Context(), bson.M{"_id": objID}).Decode(&product)
	if err != nil {
		http.NotFound(w, r)
		return
	}

	// Loads the html and sends the data along with it
	tmpl := template.Must(template.ParseFiles("views/templates/product.html"))
	tmpl.Execute(w, product)
}

// For "/product/order/"
func (pc *ProductController) PlaceOrder(w http.ResponseWriter, r *http.Request) {
	// Getting the id and converting to ObjectID for mongo to use
	idParam := r.URL.Path[len("/product/order/"):]
	productID, _ := primitive.ObjectIDFromHex(idParam)

	// Check if the stock is greater than 0 then decrease it by one
	filter := bson.M{"_id": productID, "stock": bson.M{"$gt": 0}}
	update := bson.M{"$inc": bson.M{"stock": -1}}

	result, err := pc.ProductCollection.UpdateOne(r.Context(), filter, update)

	// If we get any errors when updating the database we respond to the client
	if err != nil || result.ModifiedCount == 0 {
		http.Error(w, "Item is out of stock!", http.StatusConflict)
		return
	}

	// Create a new order
	newOrder := bson.M{
		"product_id": productID,
		"email":      r.FormValue("email"),
		"status":     "confirmed",
		"created_at": time.Now(),
	}

	// If an error happens while creating an order we increment the value for that product
	_, err = pc.OrderCollection.InsertOne(r.Context(), newOrder)
	if err != nil {
		pc.ProductCollection.UpdateOne(r.Context(), bson.M{"_id": productID}, bson.M{"$inc": bson.M{"stock": 1}})
		http.Error(w, "Failed to create order", http.StatusInternalServerError)
		return
	}

	http.Redirect(w, r, "/order-success", http.StatusSeeOther)
}

// For "/order-success"
func (pc *ProductController) OrderSuccess(w http.ResponseWriter, r *http.Request) {
	tmpl := template.Must(template.ParseFiles("views/templates/success.html"))
	tmpl.Execute(w, nil)
}
