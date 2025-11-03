package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"go-crawler/web/BE/internal/domain/response"
	"net/http"
	"time"
)

type MLPredictionService interface {
	PredictFunction(ctx context.Context, sequence string) (*response.FunctionPrediction, error)
}
type mlService struct {
	baseURL string
	client  *http.Client
}

func (s *mlService) PredictFunction(ctx context.Context, sequence string) (*response.FunctionPrediction, error) {
	requestBody := map[string]interface{}{
		"sequence": sequence,
	}
	jsonBody, err := json.Marshal(requestBody)
	if err != nil {
		return &response.FunctionPrediction{}, fmt.Errorf("failed to marshal request: %w", err)
	}
	url := fmt.Sprintf("%s/predict/disease", s.baseURL)
	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonBody))
	if err != nil {
		return &response.FunctionPrediction{}, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := s.client.Do(req)
	if err != nil {
		return &response.FunctionPrediction{}, fmt.Errorf("failed to make request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return &response.FunctionPrediction{}, fmt.Errorf("ML service returned status code: %d", resp.StatusCode)
	}

	var response response.FunctionPrediction
	_ = json.NewDecoder(resp.Body).Decode(&response)

	return &response, nil
}
func NewMLService(baseURL string, client *http.Client) *mlService {
	if client == nil {
		client = &http.Client{
			Timeout: 30 * time.Second,
		}
	}
	return &mlService{
		baseURL: baseURL,
		client:  client,
	}
}
