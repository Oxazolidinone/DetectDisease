package handlers

import (
	"go-crawler/web/BE/internal/domain/entities"
	"go-crawler/web/BE/internal/usecases"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type ProteinHandler struct {
	proteinUseCases usecases.ProteinUseCases
}

func NewProteinHandler(proteinUseCases usecases.ProteinUseCases) *ProteinHandler {
	return &ProteinHandler{
		proteinUseCases: proteinUseCases,
	}
}

type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message,omitempty"`
	Code    int    `json:"code"`
}

type SuccessResponse struct {
	Data    interface{} `json:"data,omitempty"`
	Message string      `json:"message,omitempty"`
}

func (h *ProteinHandler) handleError(c *gin.Context, err error, statusCode int) {
	c.JSON(statusCode, ErrorResponse{
		Error:   err.Error(),
		Code:    statusCode,
		Message: "An error occurred while processing your request",
	})
}

func (h *ProteinHandler) handleSuccess(c *gin.Context, data interface{}, message string) {
	c.JSON(http.StatusOK, SuccessResponse{
		Data:    data,
		Message: message,
	})
}

// SearchProteins godoc
// @Summary Search proteins with filters
// @Description Search for proteins based on various filters like name, gene, family, etc.
// @Tags proteins
// @Accept json
// @Produce json
// @Param id query string false "Protein ID"
// @Param name query string false "Protein name"
// @Param gene query string false "Gene name"
// @Param family query string false "Protein family"
// @Param limit query int false "Limit results" default(10)
// @Param offset query int false "Offset for pagination" default(0)
// @Param order_by query string false "Order by field"
// @Param order_direction query string false "Order direction (ASC/DESC)" default(ASC)
// @Success 200 {object} SuccessResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/proteins [get]
func (h *ProteinHandler) SearchProteins(c *gin.Context) {
	filter := &entities.ProteinFilter{}

	if id := c.Query("id"); id != "" {
		filter.ID = &id
	}
	if name := c.Query("name"); name != "" {
		filter.Name = &name
	}
	if gene := c.Query("gene"); gene != "" {
		filter.Gene = &gene
	}
	if family := c.Query("family"); family != "" {
		filter.Family = &family
	}

	if limitStr := c.DefaultQuery("limit", "10"); limitStr != "" {
		if limit, err := strconv.Atoi(limitStr); err == nil && limit > 0 {
			filter.Limit = limit
		} else {
			filter.Limit = 10
		}
	}

	if offsetStr := c.DefaultQuery("offset", "0"); offsetStr != "" {
		if offset, err := strconv.Atoi(offsetStr); err == nil && offset >= 0 {
			filter.Offset = offset
		}
	}

	if orderBy := c.Query("order_by"); orderBy != "" {
		filter.OrderBy = orderBy
	}
	if orderDir := c.DefaultQuery("order_direction", "ASC"); orderDir != "" {
		filter.OrderDirection = orderDir
	}

	response, err := h.proteinUseCases.SearchProteins(c.Request.Context(), filter)
	if err != nil {
		h.handleError(c, err, http.StatusInternalServerError)
		return
	}

	h.handleSuccess(c, response, "Proteins retrieved successfully")
}

// GetProteinByID godoc
// @Summary Get protein by ID
// @Description Get a specific protein by its ID
// @Tags proteins
// @Accept json
// @Produce json
// @Param id path string true "Protein ID"
// @Success 200 {object} SuccessResponse
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/proteins/{id} [get]
func (h *ProteinHandler) GetProteinByID(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		h.handleError(c, usecases.ErrInvalidInput, http.StatusBadRequest)
		return
	}

	protein, err := h.proteinUseCases.GetProteinByID(c.Request.Context(), id)
	if err != nil {
		if err == usecases.ErrProteinNotFound {
			h.handleError(c, err, http.StatusNotFound)
			return
		}
		h.handleError(c, err, http.StatusInternalServerError)
		return
	}

	h.handleSuccess(c, protein, "Protein retrieved successfully")
}

// CompareProteins godoc
// @Summary Compare proteins
// @Description Compare multiple proteins for analysis
// @Tags proteins
// @Accept json
// @Produce json
// @Param comparison body usecases.ComparisonRequest true "Comparison request"
// @Success 200 {object} SuccessResponse
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/proteins/compare [post]
func (h *ProteinHandler) CompareProteins(c *gin.Context) {
	var req usecases.ComparisonRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.handleError(c, err, http.StatusBadRequest)
		return
	}

	response, err := h.proteinUseCases.CompareProteins(c.Request.Context(), &req)
	if err != nil {
		if err == usecases.ErrProteinNotFound {
			h.handleError(c, err, http.StatusNotFound)
			return
		}
		h.handleError(c, err, http.StatusInternalServerError)
		return
	}

	h.handleSuccess(c, response, "Proteins compared successfully")
}

// AnalyzeSequence godoc
// @Summary Analyze protein sequence
// @Description Analyze a protein sequence for various properties
// @Tags proteins
// @Accept json
// @Produce json
// @Param analysis body usecases.SequenceAnalysisRequest true "Sequence analysis request"
// @Success 200 {object} SuccessResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/proteins/analyze [post]
func (h *ProteinHandler) AnalyzeSequence(c *gin.Context) {
	var req usecases.SequenceAnalysisRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.handleError(c, err, http.StatusBadRequest)
		return
	}

	response, err := h.proteinUseCases.AnalyzeSequence(c.Request.Context(), &req)
	if err != nil {
		h.handleError(c, err, http.StatusInternalServerError)
		return
	}

	h.handleSuccess(c, response, "Sequence analyzed successfully")
}

// CreateProtein godoc
// @Summary Create a new protein
// @Description Create a new protein entry
// @Tags proteins
// @Accept json
// @Produce json
// @Param protein body usecases.ProteinCreateRequest true "Protein data"
// @Success 201 {object} SuccessResponse
// @Failure 400 {object} ErrorResponse
// @Failure 409 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/proteins [post]
func (h *ProteinHandler) CreateProtein(c *gin.Context) {
	var req usecases.ProteinCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.handleError(c, err, http.StatusBadRequest)
		return
	}

	if err := h.proteinUseCases.CreateProtein(c.Request.Context(), &req); err != nil {
		if err == usecases.ErrProteinExists {
			h.handleError(c, err, http.StatusConflict)
			return
		}
		h.handleError(c, err, http.StatusInternalServerError)
		return
	}

	c.JSON(http.StatusCreated, SuccessResponse{
		Message: "Protein created successfully",
	})
}

// UpdateProtein godoc
// @Summary Update a protein
// @Description Update an existing protein by ID
// @Tags proteins
// @Accept json
// @Produce json
// @Param id path string true "Protein ID"
// @Param protein body usecases.ProteinUpdateRequest true "Updated protein data"
// @Success 200 {object} SuccessResponse
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/proteins/{id} [put]
func (h *ProteinHandler) UpdateProtein(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		h.handleError(c, usecases.ErrInvalidInput, http.StatusBadRequest)
		return
	}

	var req usecases.ProteinUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.handleError(c, err, http.StatusBadRequest)
		return
	}

	if err := h.proteinUseCases.UpdateProtein(c.Request.Context(), id, &req); err != nil {
		if err == usecases.ErrProteinNotFound {
			h.handleError(c, err, http.StatusNotFound)
			return
		}
		h.handleError(c, err, http.StatusInternalServerError)
		return
	}

	h.handleSuccess(c, nil, "Protein updated successfully")
}

// DeleteProtein godoc
// @Summary Delete a protein
// @Description Delete a protein by ID
// @Tags proteins
// @Accept json
// @Produce json
// @Param id path string true "Protein ID"
// @Success 204
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/proteins/{id} [delete]
func (h *ProteinHandler) DeleteProtein(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		h.handleError(c, usecases.ErrInvalidInput, http.StatusBadRequest)
		return
	}

	if err := h.proteinUseCases.DeleteProtein(c.Request.Context(), id); err != nil {
		if err == usecases.ErrProteinNotFound {
			h.handleError(c, err, http.StatusNotFound)
			return
		}
		h.handleError(c, err, http.StatusInternalServerError)
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

// GetProteinStats godoc
// @Summary Get protein statistics
// @Description Get statistical information about proteins in the database
// @Tags proteins
// @Accept json
// @Produce json
// @Success 200 {object} SuccessResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/proteins/stats [get]
func (h *ProteinHandler) GetProteinStats(c *gin.Context) {
	stats, err := h.proteinUseCases.GetProteinStats(c.Request.Context())
	if err != nil {
		h.handleError(c, err, http.StatusInternalServerError)
		return
	}

	h.handleSuccess(c, stats, "Protein statistics retrieved successfully")
}

// BulkCreateProteins godoc
// @Summary Bulk create proteins
// @Description Create multiple proteins in a single request
// @Tags proteins
// @Accept json
// @Produce json
// @Param proteins body []usecases.ProteinCreateRequest true "Array of protein data"
// @Success 200 {object} SuccessResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/proteins/bulk [post]
func (h *ProteinHandler) BulkCreateProteins(c *gin.Context) {
	var requests []*usecases.ProteinCreateRequest
	if err := c.ShouldBindJSON(&requests); err != nil {
		h.handleError(c, err, http.StatusBadRequest)
		return
	}

	if err := h.proteinUseCases.BulkCreateProteins(c.Request.Context(), requests); err != nil {
		h.handleError(c, err, http.StatusInternalServerError)
		return
	}

	h.handleSuccess(c, nil, "Proteins created successfully")
}
