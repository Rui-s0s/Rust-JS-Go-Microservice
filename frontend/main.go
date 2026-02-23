package main

import (
	"fmt"
	"html/template"
	"net/http"
)

type Product struct {
	ID    int
	Name  string
	Price float64
}

// In-memory "Database" and Cart
var products = []Product{
	{ID: 1, Name: "Virtual Machine Mug", Price: 15.99},
	{ID: 2, Name: "Monitoring Dashboard Poster", Price: 12.50},
	{ID: 3, Name: "Gopher Plushie", Price: 25.00},
}

var cartCount = 0

// Global variable to hold the templates in RAM
var templates *template.Template

func main() {
	// Parse all .html files inside the views folder at startup
	templates = template.Must(template.ParseGlob("views/*.html"))

	http.HandleFunc("/", handleHome)

	http.HandleFunc("/add-to-cart", handleAddToCart)

	fmt.Println("📍 URL: http://127.0.0.1:8080")

	err := http.ListenAndServe("127.0.0.1:8080", nil)
	if err != nil {
		fmt.Printf("❌ Server failed to start: %v\n", err)
	}
}

func handleHome(w http.ResponseWriter, r *http.Request) {
	data := map[string]interface{}{
		"Products":  products,
		"CartCount": cartCount,
	}
	// Use ExecuteTemplate and refer to the filename only
	templates.ExecuteTemplate(w, "index.html", data)
}

func handleAddToCart(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPost {
		cartCount++
		// HTMX expects a fragment of HTML back.
		// We just send the new number to update the cart badge.
		fmt.Fprintf(w, "%d", cartCount)
	}
}
