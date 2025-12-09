package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type MLHandler struct {
	mlServiceURL string
	client       *http.Client
}

func NewMLHandler(mlServiceURL string) *MLHandler {
	return &MLHandler{
		mlServiceURL: mlServiceURL,
		client: &http.Client{
			Timeout: 60 * time.Second,
		},
	}
}

// ProxyToML forwards requests to ML service
func (h *MLHandler) ProxyToML(endpoint string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Read request body
		var bodyBytes []byte
		if c.Request.Body != nil {
			bodyBytes, _ = io.ReadAll(c.Request.Body)
			c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))
		}

		// Create request to ML service
		mlURL := fmt.Sprintf("%s%s", h.mlServiceURL, endpoint)
		req, err := http.NewRequestWithContext(
			c.Request.Context(),
			c.Request.Method,
			mlURL,
			bytes.NewBuffer(bodyBytes),
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to create ML service request",
			})
			return
		}

		// Copy headers
		req.Header.Set("Content-Type", "application/json")
		for key, values := range c.Request.Header {
			for _, value := range values {
				req.Header.Add(key, value)
			}
		}

		// Make request to ML service
		resp, err := h.client.Do(req)
		if err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"error":   "ML service unavailable",
				"details": err.Error(),
			})
			return
		}
		defer resp.Body.Close()

		// Read ML service response
		respBody, err := io.ReadAll(resp.Body)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to read ML service response",
			})
			return
		}

		// Copy response headers
		for key, values := range resp.Header {
			for _, value := range values {
				c.Header(key, value)
			}
		}

		// Return ML service response
		c.Data(resp.StatusCode, resp.Header.Get("Content-Type"), respBody)
	}
}

// PredictDisease godoc
// @Summary Predict disease from protein sequence
// @Description Proxy request to ML service for disease prediction
// @Tags ml
// @Accept json
// @Produce json
// @Param request body object true "Prediction request with sequence"
// @Success 200 {object} object
// @Failure 400 {object} ErrorResponse
// @Failure 503 {object} ErrorResponse
// @Router /api/predict [post]
func (h *MLHandler) PredictDisease(c *gin.Context) {
	h.ProxyToML("/predict/disease")(c)
}

// CalculateSimilarity godoc
// @Summary Calculate sequence similarity
// @Description Proxy request to ML service for sequence similarity calculation
// @Tags ml
// @Accept json
// @Produce json
// @Param request body object true "Similarity request with sequences"
// @Success 200 {object} object
// @Failure 400 {object} ErrorResponse
// @Failure 503 {object} ErrorResponse
// @Router /api/similarity [post]
func (h *MLHandler) CalculateSimilarity(c *gin.Context) {
	h.ProxyToML("/similarity")(c)
}

// AlignSequences godoc
// @Summary Align protein sequences
// @Description Proxy request to ML service for sequence alignment
// @Tags ml
// @Accept json
// @Produce json
// @Param request body object true "Alignment request with sequences"
// @Success 200 {object} object
// @Failure 400 {object} ErrorResponse
// @Failure 503 {object} ErrorResponse
// @Router /api/align [post]
func (h *MLHandler) AlignSequences(c *gin.Context) {
	h.ProxyToML("/align")(c)
}

// HealthCheck checks ML service health
func (h *MLHandler) HealthCheck(c *gin.Context) {
	resp, err := h.client.Get(h.mlServiceURL + "/health")
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status": "unhealthy",
			"error":  err.Error(),
		})
		return
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status": "unknown",
			"error":  "Failed to decode ML service response",
		})
		return
	}

	c.JSON(resp.StatusCode, result)
}
