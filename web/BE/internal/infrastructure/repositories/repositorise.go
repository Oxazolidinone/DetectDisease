package Repositories

import (
	"context"
	"go-crawler/web/BE/internal/domain/entities"
	"go-crawler/web/BE/internal/infrastructure/database"
)

type ProteinRepositories struct {
	db *database.Database
}

func NewProteinRepository(db *database.Database) *ProteinRepositories {
	return &ProteinRepositories{db: db}
}
func (p ProteinRepositories) Create(ctx context.Context, protein *entities.Protein) error {
	//TODO implement me
	panic("implement me")
}

func (p ProteinRepositories) GetByID(ctx context.Context, id string) (*entities.Protein, error) {
	//TODO implement me
	panic("implement me")
}

func (p ProteinRepositories) GetByName(ctx context.Context, name string) ([]*entities.Protein, error) {
	//TODO implement me
	panic("implement me")
}

func (p ProteinRepositories) Search(ctx context.Context, filter *entities.ProteinFilter) (*entities.PaginatedProteins, error) {
	//TODO implement me
	panic("implement me")
}

func (p ProteinRepositories) Update(ctx context.Context, protein *entities.Protein) error {
	//TODO implement me
	panic("implement me")
}

func (p ProteinRepositories) Delete(ctx context.Context, id string) error {
	//TODO implement me
	panic("implement me")
}

func (p ProteinRepositories) GetStats(ctx context.Context) (*entities.ProteinStats, error) {
	//TODO implement me
	panic("implement me")
}

func (p ProteinRepositories) BulkCreate(ctx context.Context, proteins []*entities.Protein) error {
	//TODO implement me
	panic("implement me")
}
