package middlewares

import (
	"log"
	"net/http"
)

type loggingResponseWriter struct {
	http.ResponseWriter
	statusCode int
}

// We implement the WriteHeader method to capture the code
func (lrw *loggingResponseWriter) WriteHeader(code int) {
	lrw.statusCode = code
	lrw.ResponseWriter.WriteHeader(code)
}

// The Middleware: It takes a handler and returns a new handler
func RequestLogger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Default to 200 OK
		lrw := &loggingResponseWriter{
			ResponseWriter: w,
			statusCode:     http.StatusOK,
		}

		// Execute the actual route logic
		next.ServeHTTP(lrw, r)

		// Print the Flask-style log line
		log.Printf("[%d] %s %s", lrw.statusCode, r.Method, r.URL.Path)
	})
}
