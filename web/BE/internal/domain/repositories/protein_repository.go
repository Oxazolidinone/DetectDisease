package repositories

import (
	"context"
	"go-crawler/web/BE/internal/domain/entities"
)

type IProteinRepository interface {
	Create(ctx context.Context, protein *entities.Protein) error
	GetByID(ctx context.Context, id string) (*entities.Protein, error)
	GetByName(ctx context.Context, name string) ([]*entities.Protein, error)
	Search(ctx context.Context, filter *entities.ProteinFilter) (*entities.PaginatedProteins, error)
	Update(ctx context.Context, protein *entities.Protein) error
	Delete(ctx context.Context, id string) error
	GetStats(ctx context.Context) (*entities.ProteinStats, error)
	BulkCreate(ctx context.Context, proteins []*entities.Protein) error
}

type GeneRepository interface {
	Create(ctx context.Context, gene *entities.Gene) error
	GetByID(ctx context.Context, id int) (*entities.Gene, error)
	GetByName(ctx context.Context, name string) (*entities.Gene, error)
	GetAll(ctx context.Context) ([]*entities.Gene, error)
	Update(ctx context.Context, gene *entities.Gene) error
	Delete(ctx context.Context, id int) error
}

type ProteinFamilyRepository interface {
	Create(ctx context.Context, family *entities.ProteinFamily) error
	GetByID(ctx context.Context, id int) (*entities.ProteinFamily, error)
	GetByName(ctx context.Context, name string) (*entities.ProteinFamily, error)
	GetAll(ctx context.Context) ([]*entities.ProteinFamily, error)
	Update(ctx context.Context, family *entities.ProteinFamily) error
	Delete(ctx context.Context, id int) error
}
