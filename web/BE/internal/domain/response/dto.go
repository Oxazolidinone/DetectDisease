package response

import (
	"time"
)

type MLServiceResponse struct {
	Success   bool        `json:"success"`
	Message   string      `json:"message,omitempty"`
	Data      interface{} `json:"data,omitempty"`
	Error     string      `json:"error,omitempty"`
	Timestamp time.Time   `json:"timestamp"`
}

type FunctionPrediction struct {
	FunctionClass string  `json:"function_class"`
	Confidence    float64 `json:"confidence"`
	Description   string  `json:"description,omitempty"`
	EvidenceCode  string  `json:"evidence_code,omitempty"`
}

type ProteinFunctionPredictionResponse struct {
	ProteinID     string               `json:"protein_id,omitempty"`
	Sequence      string               `json:"sequence,omitempty"`
	Predictions   []FunctionPrediction `json:"predictions"`
	TopPrediction *FunctionPrediction  `json:"top_prediction,omitempty"`
	ModelVersion  string               `json:"model_version"`
	ProcessedAt   time.Time            `json:"processed_at"`
}

type DiseasePrediction struct {
	DiseaseName string  `json:"disease_name"`
	DiseaseID   string  `json:"disease_id,omitempty"`
	Confidence  float64 `json:"confidence"`
	RiskScore   float64 `json:"risk_score,omitempty"`
	Description string  `json:"description,omitempty"`
	Category    string  `json:"category,omitempty"`
}

type ProteinDiseasePredictionResponse struct {
	ProteinID     string              `json:"protein_id,omitempty"`
	Sequence      string              `json:"sequence,omitempty"`
	Predictions   []DiseasePrediction `json:"predictions"`
	TopPrediction *DiseasePrediction  `json:"top_prediction,omitempty"`
	ModelVersion  string              `json:"model_version"`
	ProcessedAt   time.Time           `json:"processed_at"`
}

type ClusterPrediction struct {
	ClusterID   string  `json:"cluster_id"`
	ClusterName string  `json:"cluster_name"`
	Confidence  float64 `json:"confidence"`
	Distance    float64 `json:"distance,omitempty"`
	Description string  `json:"description,omitempty"`
	Members     int     `json:"members,omitempty"`
}

type ProteinClusterPredictionResponse struct {
	ProteinID     string              `json:"protein_id,omitempty"`
	Sequence      string              `json:"sequence,omitempty"`
	Predictions   []ClusterPrediction `json:"predictions"`
	TopPrediction *ClusterPrediction  `json:"top_prediction,omitempty"`
	ModelVersion  string              `json:"model_version"`
	ProcessedAt   time.Time           `json:"processed_at"`
}

type StructurePrediction struct {
	StructureType      string                      `json:"structure_type"`
	Confidence         float64                     `json:"confidence"`
	Coordinates        []StructurePoint            `json:"coordinates,omitempty"`
	SecondaryStructure []SecondaryStructureElement `json:"secondary_structure,omitempty"`
}

type StructurePoint struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
	Z float64 `json:"z"`
}

type SecondaryStructureElement struct {
	Type       string  `json:"type"`
	Start      int     `json:"start"`
	End        int     `json:"end"`
	Confidence float64 `json:"confidence"`
}

type ProteinStructurePredictionResponse struct {
	ProteinID    string               `json:"protein_id,omitempty"`
	Sequence     string               `json:"sequence,omitempty"`
	Prediction   *StructurePrediction `json:"prediction,omitempty"`
	ModelVersion string               `json:"model_version"`
	ProcessedAt  time.Time            `json:"processed_at"`
}

type BatchPredictionRequest struct {
	ProteinIDs []string `json:"protein_ids" validate:"required,min=1"`
	ModelType  string   `json:"model_type" validate:"required"`
}

type BatchPredictionResponse struct {
	JobID       string        `json:"job_id"`
	Status      string        `json:"status"`
	TotalItems  int           `json:"total_items"`
	Completed   int           `json:"completed"`
	Failed      int           `json:"failed"`
	Results     []interface{} `json:"results,omitempty"`
	SubmittedAt time.Time     `json:"submitted_at"`
	CompletedAt *time.Time    `json:"completed_at,omitempty"`
}

type ModelInfo struct {
	Name        string    `json:"name"`
	Version     string    `json:"version"`
	Type        string    `json:"type"`
	Description string    `json:"description"`
	Accuracy    float64   `json:"accuracy,omitempty"`
	LastTrained time.Time `json:"last_trained"`
	IsActive    bool      `json:"is_active"`
}

type MLServiceHealthResponse struct {
	Status         string      `json:"status"`
	Models         []ModelInfo `json:"models"`
	QueueSize      int         `json:"queue_size"`
	ProcessedToday int         `json:"processed_today"`
	Uptime         string      `json:"uptime"`
	CheckedAt      time.Time   `json:"checked_at"`
}
