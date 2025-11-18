package usecases

import (
	"context"
	"errors"
	"go-crawler/web/BE/internal/domain/entities"
	"go-crawler/web/BE/internal/domain/services"
	"go-crawler/web/BE/internal/infrastructure/repositories"
	"strings"
	"time"
)

var (
	ErrProteinNotFound = errors.New("protein not found")
	ErrInvalidInput    = errors.New("invalid input parameters")
	ErrProteinExists   = errors.New("protein already exists")
)

type ProteinCreateRequest struct {
	ID       string   `json:"id" validate:"required"`
	Name     string   `json:"name" validate:"required"`
	Seq      []string `json:"seq" validate:"required"`
	Gene     *string  `json:"gene,omitempty"`
	Taxo     *string  `json:"taxo,omitempty"`
	CC       *string  `json:"cc,omitempty"`
	Domain   *string  `json:"domain,omitempty"`
	Family   *string  `json:"family,omitempty"`
	Function *string  `json:"function,omitempty"`
}

type ProteinUpdateRequest struct {
	Name     *string  `json:"name,omitempty"`
	Seq      []string `json:"seq,omitempty"`
	Gene     *string  `json:"gene,omitempty"`
	Taxo     *string  `json:"taxo,omitempty"`
	CC       *string  `json:"cc,omitempty"`
	Domain   *string  `json:"domain,omitempty"`
	Family   *string  `json:"family,omitempty"`
	Function *string  `json:"function,omitempty"`
}

type ComparisonRequest struct {
	ProteinID1 string `json:"protein_id_1" validate:"required"`
	ProteinID2 string `json:"protein_id_2" validate:"required"`
}

type ComparisonResponse struct {
	Protein1   *entities.Protein `json:"protein_1"`
	Protein2   *entities.Protein `json:"protein_2"`
	Similarity float64           `json:"similarity"`
	ComparedAt time.Time         `json:"compared_at"`
}

type SequenceAnalysisRequest struct {
	Sequence []string `json:"sequence" validate:"required"`
}

type SequenceAnalysisResponse struct {
	MolecularWeight  float64   `json:"molecular_weight"`
	IsoelectricPoint float64   `json:"isoelectric_point"`
	Hydrophobicity   float64   `json:"hydrophobicity"`
	Length           int       `json:"length"`
	AnalyzedAt       time.Time `json:"analyzed_at"`
}

type ProteinUseCases interface {
	SearchProteins(ctx context.Context, filter *entities.ProteinFilter) (*entities.PaginatedProteins, error)
	GetProteinByID(ctx context.Context, id string) (*entities.Protein, error)
	CreateProtein(ctx context.Context, req *ProteinCreateRequest) error
	UpdateProtein(ctx context.Context, id string, req *ProteinUpdateRequest) error
	DeleteProtein(ctx context.Context, id string) error
	CompareProteins(ctx context.Context, req *ComparisonRequest) (*ComparisonResponse, error)
	AnalyzeSequence(ctx context.Context, req *SequenceAnalysisRequest) (*SequenceAnalysisResponse, error)
	GetProteinStats(ctx context.Context) (*entities.ProteinStats, error)
	BulkCreateProteins(ctx context.Context, requests []*ProteinCreateRequest) error
}

type proteinUseCases struct {
	proteinRepo    *repositories.ProteinRepositories
	proteinService services.ProteinDomainService
}

func NewProteinUseCases(
	proteinRepo *repositories.ProteinRepositories,
	proteinService services.ProteinDomainService,
) ProteinUseCases {
	return &proteinUseCases{
		proteinRepo:    proteinRepo,
		proteinService: proteinService,
	}
}

func (uc *proteinUseCases) SearchProteins(ctx context.Context, filter *entities.ProteinFilter) (*entities.PaginatedProteins, error) {
	if filter == nil {
		return nil, ErrInvalidInput
	}

	if filter.Limit <= 0 {
		filter.Limit = 10
	}
	if filter.Limit > 100 {
		filter.Limit = 100
	}

	return uc.proteinRepo.Search(ctx, filter)
}

func (uc *proteinUseCases) GetProteinByID(ctx context.Context, id string) (*entities.Protein, error) {
	if strings.TrimSpace(id) == "" {
		return nil, ErrInvalidInput
	}

	protein, err := uc.proteinRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if protein == nil {
		return nil, ErrProteinNotFound
	}
	return protein, nil
}

func (uc *proteinUseCases) CreateProtein(ctx context.Context, req *ProteinCreateRequest) error {
	if req == nil {
		return ErrInvalidInput
	}

	if err := uc.proteinService.ValidateSequence(req.Seq); err != nil {
		return err
	}

	existing, _ := uc.proteinRepo.GetByID(ctx, req.ID)
	if existing != nil {
		return ErrProteinExists
	}

	protein, err := entities.NewProtein(req.ID, req.Name, req.Seq)
	if err != nil {
		return err
	}

	if req.Gene != nil {
		protein.SetGene(*req.Gene)
	}
	if req.Taxo != nil {
		protein.SetTaxonomy(*req.Taxo)
	}
	if req.CC != nil {
		protein.CC = req.CC
	}
	if req.Domain != nil {
		protein.Domain = req.Domain
	}
	if req.Family != nil {
		protein.Family = req.Family
	}
	if req.Function != nil {
		protein.Function = req.Function
	}

	fullSeq := protein.GetFullSequence()
	mw := uc.proteinService.CalculateMolecularWeight(fullSeq)
	protein.SetMolecularWeight(mw)

	pi := uc.proteinService.CalculateIsoelectricPoint(fullSeq)
	protein.PI = &pi

	hydro := uc.proteinService.CalculateHydrophobicity(fullSeq)
	protein.HydrophobicityGravy = &hydro

	return uc.proteinRepo.Create(ctx, protein)
}

func (uc *proteinUseCases) UpdateProtein(ctx context.Context, id string, req *ProteinUpdateRequest) error {
	if strings.TrimSpace(id) == "" || req == nil {
		return ErrInvalidInput
	}

	protein, err := uc.proteinRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if protein == nil {
		return ErrProteinNotFound
	}

	if req.Name != nil {
		protein.Name = *req.Name
	}
	if len(req.Seq) > 0 {
		if err := uc.proteinService.ValidateSequence(req.Seq); err != nil {
			return err
		}
		if err := protein.UpdateSequence(req.Seq); err != nil {
			return err
		}

		fullSeq := protein.GetFullSequence()
		mw := uc.proteinService.CalculateMolecularWeight(fullSeq)
		protein.SetMolecularWeight(mw)

		pi := uc.proteinService.CalculateIsoelectricPoint(fullSeq)
		protein.PI = &pi

		hydro := uc.proteinService.CalculateHydrophobicity(fullSeq)
		protein.HydrophobicityGravy = &hydro
	}
	if req.Gene != nil {
		protein.SetGene(*req.Gene)
	}
	if req.Taxo != nil {
		protein.SetTaxonomy(*req.Taxo)
	}
	if req.CC != nil {
		protein.CC = req.CC
	}
	if req.Domain != nil {
		protein.Domain = req.Domain
	}
	if req.Family != nil {
		protein.Family = req.Family
	}
	if req.Function != nil {
		protein.Function = req.Function
	}

	protein.Updated = time.Now()
	return uc.proteinRepo.Update(ctx, protein)
}

func (uc *proteinUseCases) DeleteProtein(ctx context.Context, id string) error {
	if strings.TrimSpace(id) == "" {
		return ErrInvalidInput
	}

	existing, err := uc.proteinRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if existing == nil {
		return ErrProteinNotFound
	}

	return uc.proteinRepo.Delete(ctx, id)
}

func (uc *proteinUseCases) CompareProteins(ctx context.Context, req *ComparisonRequest) (*ComparisonResponse, error) {
	if req == nil || strings.TrimSpace(req.ProteinID1) == "" || strings.TrimSpace(req.ProteinID2) == "" {
		return nil, ErrInvalidInput
	}

	protein1, err := uc.proteinRepo.GetByID(ctx, req.ProteinID1)
	if err != nil || protein1 == nil {
		return nil, ErrProteinNotFound
	}

	protein2, err := uc.proteinRepo.GetByID(ctx, req.ProteinID2)
	if err != nil || protein2 == nil {
		return nil, ErrProteinNotFound
	}

	similarity, err := uc.proteinService.CompareSequences(protein1, protein2)
	if err != nil {
		return nil, err
	}

	return &ComparisonResponse{
		Protein1:   protein1,
		Protein2:   protein2,
		Similarity: similarity,
		ComparedAt: time.Now(),
	}, nil
}

func (uc *proteinUseCases) AnalyzeSequence(ctx context.Context, req *SequenceAnalysisRequest) (*SequenceAnalysisResponse, error) {
	if req == nil || len(req.Sequence) == 0 {
		return nil, ErrInvalidInput
	}

	if err := uc.proteinService.ValidateSequence(req.Sequence); err != nil {
		return nil, err
	}

	fullSeq := strings.Join(req.Sequence, "")

	return &SequenceAnalysisResponse{
		MolecularWeight:  uc.proteinService.CalculateMolecularWeight(fullSeq),
		IsoelectricPoint: uc.proteinService.CalculateIsoelectricPoint(fullSeq),
		Hydrophobicity:   uc.proteinService.CalculateHydrophobicity(fullSeq),
		Length:           len(fullSeq),
		AnalyzedAt:       time.Now(),
	}, nil
}

func (uc *proteinUseCases) GetProteinStats(ctx context.Context) (*entities.ProteinStats, error) {
	return uc.proteinRepo.GetStats(ctx)
}

func (uc *proteinUseCases) BulkCreateProteins(ctx context.Context, requests []*ProteinCreateRequest) error {
	if len(requests) == 0 {
		return ErrInvalidInput
	}

	proteins := make([]*entities.Protein, 0, len(requests))

	for _, req := range requests {
		if req == nil {
			continue
		}

		if err := uc.proteinService.ValidateSequence(req.Seq); err != nil {
			return err
		}

		protein, err := entities.NewProtein(req.ID, req.Name, req.Seq)
		if err != nil {
			return err
		}

		if req.Gene != nil {
			protein.SetGene(*req.Gene)
		}
		if req.Taxo != nil {
			protein.SetTaxonomy(*req.Taxo)
		}
		if req.CC != nil {
			protein.CC = req.CC
		}
		if req.Domain != nil {
			protein.Domain = req.Domain
		}
		if req.Family != nil {
			protein.Family = req.Family
		}
		if req.Function != nil {
			protein.Function = req.Function
		}

		fullSeq := protein.GetFullSequence()
		mw := uc.proteinService.CalculateMolecularWeight(fullSeq)
		protein.SetMolecularWeight(mw)

		pi := uc.proteinService.CalculateIsoelectricPoint(fullSeq)
		protein.PI = &pi

		hydro := uc.proteinService.CalculateHydrophobicity(fullSeq)
		protein.HydrophobicityGravy = &hydro

		proteins = append(proteins, protein)
	}

	return uc.proteinRepo.BulkCreate(ctx, proteins)
}
