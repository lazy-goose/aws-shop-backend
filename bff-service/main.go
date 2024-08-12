package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"regexp"
	"strconv"
	"strings"
	"time"

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

func trimLeftOnce(s string, cutset string) string {
	if strings.HasPrefix(s, cutset) {
		return s[len(cutset):]
	}
	return s
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
			pr.Out.URL.Path = trimLeftOnce(pr.Out.URL.Path, base)
			pr.SetURL(targetUrl)
			if !strings.HasSuffix(pr.In.URL.Path, "/") {
				pr.Out.URL.Path = strings.TrimRight(pr.Out.URL.Path, "/")
			}
			proxyReq = pr
		},
	}
	proxy.ServeHTTP(w, r)
	log.Printf("[REDIRECT] %v -> %v\n", proxyReq.In.URL, proxyReq.Out.URL)
}

var (
	Cart    = "cart"
	Product = "product"
)

var services = map[string]string{
	Cart:    os.Getenv("REDIRECT_CART"),
	Product: os.Getenv("REDIRECT_PRODUCT"),
}

func CacheProducts(next http.Handler) http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		prodList, _ := regexp.MatchString(fmt.Sprintf(`/%s/?$`, Product), r.URL.Path)
		if prodList {
			cacheTime := 2 * time.Minute
			maxAge := strconv.Itoa(int(cacheTime.Seconds()))
			w.Header().Set("Cache-Control", "public, max-age="+maxAge)
		}
		next.ServeHTTP(w, r)
	})
}

func redirectHandler(w http.ResponseWriter, r *http.Request) {
	service := strings.ToLower(r.PathValue("service"))
	serviceUrl := services[service]
	if serviceUrl == "" {
		invalidRequestHandler(w)
		return
	}
	redirect("/"+service, serviceUrl, w, r)
}

func main() {
	router := http.NewServeMux()
	router.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		invalidRequestHandler(w)
	})
	router.HandleFunc("/{service}/", redirectHandler)
	router.HandleFunc("/{service}", redirectHandler)
	PORT := "4005"
	fmt.Printf("Starting server on port: %v\n\n", PORT)
	if err := http.ListenAndServe(":"+PORT, CacheProducts(router)); err != nil {
		panic(err)
	}
}
