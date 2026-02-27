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

func (pc *ProductController) ListProducts(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	products, err := models.GetAllProducts(ctx, pc.ProductCollection)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	tmpl := template.Must(template.ParseFiles("views/templates/index.html"))
	tmpl.Execute(w, products)
}

func (pc *ProductController) GetProduct(w http.ResponseWriter, r *http.Request) {
	// URL expected: /product/{id}
	idParam := r.URL.Path[len("/product/"):] // strip prefix
	if idParam == "" {
		http.NotFound(w, r)
		return
	}

	objID, err := primitive.ObjectIDFromHex(idParam)
	if err != nil {
		http.NotFound(w, r)
		return
	}

	var product models.Product
	err = pc.ProductCollection.FindOne(r.Context(), bson.M{"_id": objID}).Decode(&product)
	if err != nil {
		http.NotFound(w, r)
		return
	}

	tmpl := template.Must(template.ParseFiles("views/templates/product.html"))
	tmpl.Execute(w, product)
}

func (pc *ProductController) PlaceOrder(w http.ResponseWriter, r *http.Request) {
	// 1. Extract Product ID from URL
	idParam := r.URL.Path[len("/product/order/"):]
	productID, _ := primitive.ObjectIDFromHex(idParam)

	// 2. The "Atomic" Stock Decrease
	// Only update IF the ID matches AND stock is greater than 0
	filter := bson.M{"_id": productID, "stock": bson.M{"$gt": 0}}
	update := bson.M{"$inc": bson.M{"stock": -1}}

	result, err := pc.ProductCollection.UpdateOne(r.Context(), filter, update)

	// If ModifiedCount is 0, it means either the ID was wrong
	// or (more likely) the stock was already 0.
	if err != nil || result.ModifiedCount == 0 {
		http.Error(w, "Item is out of stock!", http.StatusConflict)
		return
	}

	// 3. Create the Order Record
	newOrder := bson.M{
		"product_id": productID,
		"email":      r.FormValue("email"),
		"status":     "confirmed",
		"created_at": time.Now(),
	}

	_, err = pc.OrderCollection.InsertOne(r.Context(), newOrder)
	if err != nil {
		// ERROR HANDLING: If the order fails to save, we should
		// give the stock back! (A "Rollback")
		pc.ProductCollection.UpdateOne(r.Context(), bson.M{"_id": productID}, bson.M{"$inc": bson.M{"stock": 1}})
		http.Error(w, "Failed to create order", http.StatusInternalServerError)
		return
	}

	http.Redirect(w, r, "/order-success", http.StatusSeeOther)
}

func (pc *ProductController) OrderSuccess(w http.ResponseWriter, r *http.Request) {
	tmpl := template.Must(template.ParseFiles("views/templates/success.html"))
	tmpl.Execute(w, nil)
}
