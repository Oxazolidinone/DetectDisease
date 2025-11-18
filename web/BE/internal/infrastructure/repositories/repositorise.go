package repositories

import (
	"context"
	"errors"
	"fmt"
	"go-crawler/web/BE/internal/domain/entities"
	"go-crawler/web/BE/internal/infrastructure/database"

	"github.com/uptrace/bun"
)

type ProteinRepositories struct {
	db *bun.DB
}

func NewProteinRepository(db *bun.DB) *ProteinRepositories {
	return &ProteinRepositories{db: db}
}

func (p *ProteinRepositories) Create(ctx context.Context, protein *entities.Protein) error {
	if protein == nil {
		return errors.New("protein is nil")
	}

	dbProtein := &database.Protein{
		ID:                  protein.ID,
		Name:                protein.Name,
		Gene:                protein.Gene,
		Taxo:                protein.Taxo,
		CC:                  protein.CC,
		Length:              protein.Length,
		Domain:              protein.Domain,
		Family:              protein.Family,
		BioProcess:          protein.BioProcess,
		Function:            protein.Function,
		MW:                  protein.MW,
		Seq:                 protein.Seq,
		NInteractors:        protein.NInteractors,
		PI:                  protein.PI,
		NC74:                protein.NC74,
		HydrophobicityGravy: protein.HydrophobicityGravy,
		DRank:               protein.DRank,
		LRank:               protein.LRank,
		FRank:               protein.FRank,
		Created:             protein.Created,
		Updated:             protein.Updated,
	}

	_, err := p.db.NewInsert().Model(dbProtein).Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to create protein: %w", err)
	}
	return nil
}

func (p *ProteinRepositories) GetByID(ctx context.Context, id string) (*entities.Protein, error) {
	var dbProtein database.Protein
	err := p.db.NewSelect().Model(&dbProtein).Where("id = ?", id).Scan(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get protein by ID: %w", err)
	}

	protein := &entities.Protein{
		ID:                  dbProtein.ID,
		Name:                dbProtein.Name,
		Gene:                dbProtein.Gene,
		Taxo:                dbProtein.Taxo,
		CC:                  dbProtein.CC,
		Length:              dbProtein.Length,
		Domain:              dbProtein.Domain,
		Family:              dbProtein.Family,
		BioProcess:          dbProtein.BioProcess,
		Function:            dbProtein.Function,
		MW:                  dbProtein.MW,
		Seq:                 dbProtein.Seq,
		NInteractors:        dbProtein.NInteractors,
		PI:                  dbProtein.PI,
		NC74:                dbProtein.NC74,
		HydrophobicityGravy: dbProtein.HydrophobicityGravy,
		DRank:               dbProtein.DRank,
		LRank:               dbProtein.LRank,
		FRank:               dbProtein.FRank,
		Created:             dbProtein.Created,
		Updated:             dbProtein.Updated,
	}

	return protein, nil
}

func (p *ProteinRepositories) GetByName(ctx context.Context, name string) ([]*entities.Protein, error) {
	var dbProteins []database.Protein
	err := p.db.NewSelect().Model(&dbProteins).Where("name ILIKE ?", "%"+name+"%").Scan(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get proteins by name: %w", err)
	}

	proteins := make([]*entities.Protein, len(dbProteins))
	for i, dbProtein := range dbProteins {
		proteins[i] = &entities.Protein{
			ID:                  dbProtein.ID,
			Name:                dbProtein.Name,
			Gene:                dbProtein.Gene,
			Taxo:                dbProtein.Taxo,
			CC:                  dbProtein.CC,
			Length:              dbProtein.Length,
			Domain:              dbProtein.Domain,
			Family:              dbProtein.Family,
			BioProcess:          dbProtein.BioProcess,
			Function:            dbProtein.Function,
			MW:                  dbProtein.MW,
			Seq:                 dbProtein.Seq,
			NInteractors:        dbProtein.NInteractors,
			PI:                  dbProtein.PI,
			NC74:                dbProtein.NC74,
			HydrophobicityGravy: dbProtein.HydrophobicityGravy,
			DRank:               dbProtein.DRank,
			LRank:               dbProtein.LRank,
			FRank:               dbProtein.FRank,
			Created:             dbProtein.Created,
			Updated:             dbProtein.Updated,
		}
	}

	return proteins, nil
}

func (p *ProteinRepositories) Search(ctx context.Context, filter *entities.ProteinFilter) (*entities.PaginatedProteins, error) {
	query := p.db.NewSelect().Model((*database.Protein)(nil))

	if filter.ID != nil {
		query = query.Where("id = ?", *filter.ID)
	}
	if filter.Name != nil {
		query = query.Where("name ILIKE ?", "%"+*filter.Name+"%")
	}
	if filter.Gene != nil {
		query = query.Where("gene ILIKE ?", "%"+*filter.Gene+"%")
	}
	if filter.Family != nil {
		query = query.Where("family ILIKE ?", "%"+*filter.Family+"%")
	}
	if filter.MinLength != nil {
		query = query.Where("length >= ?", *filter.MinLength)
	}
	if filter.MaxLength != nil {
		query = query.Where("length <= ?", *filter.MaxLength)
	}
	if filter.MinMW != nil {
		query = query.Where("mw >= ?", *filter.MinMW)
	}
	if filter.MaxMW != nil {
		query = query.Where("mw <= ?", *filter.MaxMW)
	}
	if filter.MinPI != nil {
		query = query.Where("pi >= ?", *filter.MinPI)
	}
	if filter.MaxPI != nil {
		query = query.Where("pi <= ?", *filter.MaxPI)
	}
	if filter.MinNInteractors != nil {
		query = query.Where("n_interactors >= ?", *filter.MinNInteractors)
	}
	if filter.MaxNInteractors != nil {
		query = query.Where("n_interactors <= ?", *filter.MaxNInteractors)
	}
	if filter.MinDRank != nil {
		query = query.Where("d_rank >= ?", *filter.MinDRank)
	}
	if filter.MaxDRank != nil {
		query = query.Where("d_rank <= ?", *filter.MaxDRank)
	}

	total, err := query.Count(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to count proteins: %w", err)
	}

	orderBy := "created"
	if filter.OrderBy != "" {
		orderBy = filter.OrderBy
	}
	orderDirection := "DESC"
	if filter.OrderDirection != "" {
		orderDirection = filter.OrderDirection
	}

	var dbProteins []database.Protein
	err = query.Order(fmt.Sprintf("%s %s", orderBy, orderDirection)).
		Limit(filter.Limit).
		Offset(filter.Offset).
		Scan(ctx, &dbProteins)

	if err != nil {
		return nil, fmt.Errorf("failed to search proteins: %w", err)
	}

	proteins := make([]entities.Protein, len(dbProteins))
	for i, dbProtein := range dbProteins {
		proteins[i] = entities.Protein{
			ID:                  dbProtein.ID,
			Name:                dbProtein.Name,
			Gene:                dbProtein.Gene,
			Taxo:                dbProtein.Taxo,
			CC:                  dbProtein.CC,
			Length:              dbProtein.Length,
			Domain:              dbProtein.Domain,
			Family:              dbProtein.Family,
			BioProcess:          dbProtein.BioProcess,
			Function:            dbProtein.Function,
			MW:                  dbProtein.MW,
			Seq:                 dbProtein.Seq,
			NInteractors:        dbProtein.NInteractors,
			PI:                  dbProtein.PI,
			NC74:                dbProtein.NC74,
			HydrophobicityGravy: dbProtein.HydrophobicityGravy,
			DRank:               dbProtein.DRank,
			LRank:               dbProtein.LRank,
			FRank:               dbProtein.FRank,
			Created:             dbProtein.Created,
			Updated:             dbProtein.Updated,
		}
	}

	hasMore := filter.Offset+filter.Limit < total

	return &entities.PaginatedProteins{
		Proteins: proteins,
		Total:    total,
		Limit:    filter.Limit,
		Offset:   filter.Offset,
		HasMore:  hasMore,
	}, nil
}

func (p *ProteinRepositories) Update(ctx context.Context, protein *entities.Protein) error {
	if protein == nil {
		return errors.New("protein is nil")
	}

	dbProtein := &database.Protein{
		ID:                  protein.ID,
		Name:                protein.Name,
		Gene:                protein.Gene,
		Taxo:                protein.Taxo,
		CC:                  protein.CC,
		Length:              protein.Length,
		Domain:              protein.Domain,
		Family:              protein.Family,
		BioProcess:          protein.BioProcess,
		Function:            protein.Function,
		MW:                  protein.MW,
		Seq:                 protein.Seq,
		NInteractors:        protein.NInteractors,
		PI:                  protein.PI,
		NC74:                protein.NC74,
		HydrophobicityGravy: protein.HydrophobicityGravy,
		DRank:               protein.DRank,
		LRank:               protein.LRank,
		FRank:               protein.FRank,
		Created:             protein.Created,
		Updated:             protein.Updated,
	}

	_, err := p.db.NewUpdate().Model(dbProtein).Where("id = ?", protein.ID).Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to update protein: %w", err)
	}
	return nil
}

func (p *ProteinRepositories) Delete(ctx context.Context, id string) error {
	_, err := p.db.NewDelete().Model((*database.Protein)(nil)).Where("id = ?", id).Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to delete protein: %w", err)
	}
	return nil
}

func (p *ProteinRepositories) GetStats(ctx context.Context) (*entities.ProteinStats, error) {
	var stats entities.ProteinStats

	err := p.db.NewSelect().Model((*database.Protein)(nil)).
		ColumnExpr("COUNT(*) as total_proteins").
		ColumnExpr("AVG(length) as avg_length").
		ColumnExpr("AVG(mw) as avg_mw").
		ColumnExpr("AVG(pi) as avg_pi").
		ColumnExpr("AVG(n_interactors) as avg_n_interactors").
		ColumnExpr("AVG(hydrophobicity_gravy) as avg_hydrophobicity").
		ColumnExpr("COUNT(DISTINCT gene) as total_genes").
		ColumnExpr("COUNT(DISTINCT family) as total_families").
		Scan(ctx, &stats)

	if err != nil {
		return nil, fmt.Errorf("failed to get protein stats: %w", err)
	}

	return &stats, nil
}

func (p *ProteinRepositories) BulkCreate(ctx context.Context, proteins []*entities.Protein) error {
	if len(proteins) == 0 {
		return errors.New("no proteins to create")
	}

	dbProteins := make([]*database.Protein, len(proteins))
	for i, protein := range proteins {
		dbProteins[i] = &database.Protein{
			ID:                  protein.ID,
			Name:                protein.Name,
			Gene:                protein.Gene,
			Taxo:                protein.Taxo,
			CC:                  protein.CC,
			Length:              protein.Length,
			Domain:              protein.Domain,
			Family:              protein.Family,
			BioProcess:          protein.BioProcess,
			Function:            protein.Function,
			MW:                  protein.MW,
			Seq:                 protein.Seq,
			NInteractors:        protein.NInteractors,
			PI:                  protein.PI,
			NC74:                protein.NC74,
			HydrophobicityGravy: protein.HydrophobicityGravy,
			DRank:               protein.DRank,
			LRank:               protein.LRank,
			FRank:               protein.FRank,
			Created:             protein.Created,
			Updated:             protein.Updated,
		}
	}

	_, err := p.db.NewInsert().Model(&dbProteins).Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to bulk create proteins: %w", err)
	}
	return nil
}

type GeneRepositories struct {
	db *bun.DB
}

func NewGeneRepository(db *bun.DB) *GeneRepositories {
	return &GeneRepositories{db: db}
}

func (g *GeneRepositories) Create(ctx context.Context, gene *entities.Gene) error {
	if gene == nil {
		return errors.New("gene is nil")
	}

	dbGene := &database.Gene{
		ID:   gene.ID,
		Name: gene.Name,
	}

	_, err := g.db.NewInsert().Model(dbGene).Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to create gene: %w", err)
	}
	return nil
}

func (g *GeneRepositories) GetByID(ctx context.Context, id int) (*entities.Gene, error) {
	var dbGene database.Gene
	err := g.db.NewSelect().Model(&dbGene).Where("id = ?", id).Scan(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get gene by ID: %w", err)
	}

	gene := &entities.Gene{
		ID:   dbGene.ID,
		Name: dbGene.Name,
	}

	return gene, nil
}

func (g *GeneRepositories) GetByName(ctx context.Context, name string) (*entities.Gene, error) {
	var dbGene database.Gene
	err := g.db.NewSelect().Model(&dbGene).Where("name = ?", name).Scan(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get gene by name: %w", err)
	}

	gene := &entities.Gene{
		ID:   dbGene.ID,
		Name: dbGene.Name,
	}

	return gene, nil
}

func (g *GeneRepositories) GetAll(ctx context.Context) ([]*entities.Gene, error) {
	var dbGenes []database.Gene
	err := g.db.NewSelect().Model(&dbGenes).Scan(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get all genes: %w", err)
	}

	genes := make([]*entities.Gene, len(dbGenes))
	for i, dbGene := range dbGenes {
		genes[i] = &entities.Gene{
			ID:   dbGene.ID,
			Name: dbGene.Name,
		}
	}

	return genes, nil
}

func (g *GeneRepositories) Update(ctx context.Context, gene *entities.Gene) error {
	if gene == nil {
		return errors.New("gene is nil")
	}

	dbGene := &database.Gene{
		ID:   gene.ID,
		Name: gene.Name,
	}

	_, err := g.db.NewUpdate().Model(dbGene).Where("id = ?", gene.ID).Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to update gene: %w", err)
	}
	return nil
}

func (g *GeneRepositories) Delete(ctx context.Context, id int) error {
	_, err := g.db.NewDelete().Model((*database.Gene)(nil)).Where("id = ?", id).Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to delete gene: %w", err)
	}
	return nil
}

type ProteinFamilyRepositories struct {
	db *bun.DB
}

func NewProteinFamilyRepository(db *bun.DB) *ProteinFamilyRepositories {
	return &ProteinFamilyRepositories{db: db}
}

func (pf *ProteinFamilyRepositories) Create(ctx context.Context, family *entities.ProteinFamily) error {
	if family == nil {
		return errors.New("protein family is nil")
	}

	dbFamily := &database.ProteinFamily{
		ID:   family.ID,
		Name: family.Name,
	}

	_, err := pf.db.NewInsert().Model(dbFamily).Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to create protein family: %w", err)
	}
	return nil
}

func (pf *ProteinFamilyRepositories) GetByID(ctx context.Context, id int) (*entities.ProteinFamily, error) {
	var dbFamily database.ProteinFamily
	err := pf.db.NewSelect().Model(&dbFamily).Where("id = ?", id).Scan(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get protein family by ID: %w", err)
	}

	family := &entities.ProteinFamily{
		ID:   dbFamily.ID,
		Name: dbFamily.Name,
	}

	return family, nil
}

func (pf *ProteinFamilyRepositories) GetByName(ctx context.Context, name string) (*entities.ProteinFamily, error) {
	var dbFamily database.ProteinFamily
	err := pf.db.NewSelect().Model(&dbFamily).Where("name = ?", name).Scan(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get protein family by name: %w", err)
	}

	family := &entities.ProteinFamily{
		ID:   dbFamily.ID,
		Name: dbFamily.Name,
	}

	return family, nil
}

func (pf *ProteinFamilyRepositories) GetAll(ctx context.Context) ([]*entities.ProteinFamily, error) {
	var dbFamilies []database.ProteinFamily
	err := pf.db.NewSelect().Model(&dbFamilies).Scan(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get all protein families: %w", err)
	}

	families := make([]*entities.ProteinFamily, len(dbFamilies))
	for i, dbFamily := range dbFamilies {
		families[i] = &entities.ProteinFamily{
			ID:   dbFamily.ID,
			Name: dbFamily.Name,
		}
	}

	return families, nil
}

func (pf *ProteinFamilyRepositories) Update(ctx context.Context, family *entities.ProteinFamily) error {
	if family == nil {
		return errors.New("protein family is nil")
	}

	dbFamily := &database.ProteinFamily{
		ID:   family.ID,
		Name: family.Name,
	}

	_, err := pf.db.NewUpdate().Model(dbFamily).Where("id = ?", family.ID).Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to update protein family: %w", err)
	}
	return nil
}

func (pf *ProteinFamilyRepositories) Delete(ctx context.Context, id int) error {
	_, err := pf.db.NewDelete().Model((*database.ProteinFamily)(nil)).Where("id = ?", id).Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to delete protein family: %w", err)
	}
	return nil
}
