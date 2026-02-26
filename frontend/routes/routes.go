package routes

import (
	"back/controllers"
	"net/http"
)

func RegisterRoutes(pc *controllers.ProductController) {
	http.HandleFunc("/products", pc.ListProducts)
	http.HandleFunc("/product/", pc.GetProduct)
	http.HandleFunc("/product/order/", pc.PlaceOrder)
}
