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

func (h *ProteinHandler) GetProteinStats(c *gin.Context) {
	stats, err := h.proteinUseCases.GetProteinStats(c.Request.Context())
	if err != nil {
		h.handleError(c, err, http.StatusInternalServerError)
		return
	}

	h.handleSuccess(c, stats, "Protein statistics retrieved successfully")
}

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
