package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"strings"

	_ "github.com/joho/godotenv/autoload"
)

func writeError(w http.ResponseWriter, code int, message string) {
	resp := struct {
		Code    int
		Message string
	}{code, message}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)

	json.NewEncoder(w).Encode(resp)
}

func invalidRequestHandler(w http.ResponseWriter) {
	writeError(w, http.StatusBadGateway /*502*/, "Cannot process request")
}

func internalServerError(w http.ResponseWriter) {
	writeError(w, http.StatusInternalServerError /*500*/, "Internal server error")
}

func redirect(base string, redirectTo string, w http.ResponseWriter, r *http.Request) {
	targetUrl, err := url.Parse(redirectTo)
	if err != nil {
		internalServerError(w)
		return
	}
	var proxyReq *httputil.ProxyRequest
	proxy := &httputil.ReverseProxy{
		Rewrite: func(pr *httputil.ProxyRequest) {
			pr.Out.URL.Path = strings.TrimLeft(pr.Out.URL.Path, base)
			pr.SetURL(targetUrl)
			pr.Out.URL.Path = strings.TrimRight(pr.Out.URL.Path, "/")
			proxyReq = pr
		},
	}
	proxy.ServeHTTP(w, r)
	fmt.Printf("%v -> %v\n", proxyReq.In.URL, proxyReq.Out.URL)
}

var services = map[string]string{
	"cart":    os.Getenv("CART"),
	"product": os.Getenv("PRODUCT"),
}

func main() {
	router := http.NewServeMux()
	router.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		invalidRequestHandler(w)
	})
	router.HandleFunc("/{service}/", func(w http.ResponseWriter, r *http.Request) {
		service := strings.ToLower(r.PathValue("service"))
		serviceUrl := services[service]
		if serviceUrl == "" {
			invalidRequestHandler(w)
			return
		}
		redirect("/"+service, serviceUrl, w, r)
	})
	PORT := os.Getenv("PORT")
	if PORT == "" {
		PORT = "4005"
	}
	fmt.Printf("Starting server on port: %v\n\n", PORT)
	err := http.ListenAndServe(":"+PORT, nil)
	if err != nil {
		panic(err)
	}
}
