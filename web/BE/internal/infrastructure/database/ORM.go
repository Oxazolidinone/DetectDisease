package database

import (
	"time"
)

// Protein represents a protein entity in the database
type Protein struct {
	ID                  string    `db:"id" json:"id"`
	Name                string    `db:"name" json:"name"`
	Gene                *string   `db:"gene" json:"gene,omitempty"`
	Taxo                *string   `db:"taxo" json:"taxo,omitempty"`
	CC                  *string   `db:"cc" json:"cc,omitempty"`
	Length              *int      `db:"length" json:"length,omitempty"`
	Domain              *string   `db:"domain" json:"domain,omitempty"`
	Family              *string   `db:"family" json:"family,omitempty"`
	BioProcess          *string   `db:"bio_process" json:"bio_process,omitempty"`
	Function            *string   `db:"function" json:"function,omitempty"`
	MW                  *float64  `db:"mw" json:"mw,omitempty"`
	Seq                 []string  `db:"seq" json:"seq"`
	NInteractors        *int      `db:"n_interactors" json:"n_interactors,omitempty"`
	PI                  *float64  `db:"pi" json:"pi,omitempty"`
	NC74                *float64  `db:"nc_7_4" json:"nc_7_4,omitempty"`
	HydrophobicityGravy *float64  `db:"hydrophobicity_gravy" json:"hydrophobicity_gravy,omitempty"`
	DRank               *int      `db:"d_rank" json:"d_rank,omitempty"`
	LRank               *int      `db:"l_rank" json:"l_rank,omitempty"`
	FRank               *int      `db:"f_rank" json:"f_rank,omitempty"`
	Created             time.Time `db:"created" json:"created"`
	Updated             time.Time `db:"updated" json:"updated"`
}

// Gene represents a gene entity in the database
type Gene struct {
	ID   int    `db:"id" json:"id"`
	Name string `db:"name" json:"name"`
}

// ProteinFamily represents a protein family entity in the database
type ProteinFamily struct {
	ID   int    `db:"id" json:"id"`
	Name string `db:"name" json:"name"`
}

// ProteinCreateInput represents input for creating a new protein
type ProteinCreateInput struct {
	ID                  string   `json:"id" binding:"required"`
	Name                string   `json:"name" binding:"required"`
	Gene                *string  `json:"gene"`
	Taxo                *string  `json:"taxo"`
	CC                  *string  `json:"cc"`
	Length              *int     `json:"length"`
	Domain              *string  `json:"domain"`
	Family              *string  `json:"family"`
	BioProcess          *string  `json:"bio_process"`
	Function            *string  `json:"function"`
	MW                  *float64 `json:"mw"`
	Seq                 []string `json:"seq" binding:"required"`
	NInteractors        *int     `json:"n_interactors"`
	PI                  *float64 `json:"pi"`
	NC74                *float64 `json:"nc_7_4"`
	HydrophobicityGravy *float64 `json:"hydrophobicity_gravy"`
	DRank               *int     `json:"d_rank"`
	LRank               *int     `json:"l_rank"`
	FRank               *int     `json:"f_rank"`
}

// ProteinUpdateInput represents input for updating a protein
type ProteinUpdateInput struct {
	Name                *string  `json:"name"`
	Gene                *string  `json:"gene"`
	Taxo                *string  `json:"taxo"`
	CC                  *string  `json:"cc"`
	Length              *int     `json:"length"`
	Domain              *string  `json:"domain"`
	Family              *string  `json:"family"`
	BioProcess          *string  `json:"bio_process"`
	Function            *string  `json:"function"`
	MW                  *float64 `json:"mw"`
	Seq                 []string `json:"seq"`
	NInteractors        *int     `json:"n_interactors"`
	PI                  *float64 `json:"pi"`
	NC74                *float64 `json:"nc_7_4"`
	HydrophobicityGravy *float64 `json:"hydrophobicity_gravy"`
	DRank               *int     `json:"d_rank"`
	LRank               *int     `json:"l_rank"`
	FRank               *int     `json:"f_rank"`
}

// GeneCreateInput represents input for creating a new gene
type GeneCreateInput struct {
	Name string `json:"name" binding:"required"`
}

// ProteinFamilyCreateInput represents input for creating a new protein family
type ProteinFamilyCreateInput struct {
	Name string `json:"name" binding:"required"`
}

// ProteinFilter represents filters for querying proteins
type ProteinFilter struct {
	ID              *string  `json:"id"`
	Name            *string  `json:"name"`
	Gene            *string  `json:"gene"`
	Family          *string  `json:"family"`
	MinLength       *int     `json:"min_length"`
	MaxLength       *int     `json:"max_length"`
	MinMW           *float64 `json:"min_mw"`
	MaxMW           *float64 `json:"max_mw"`
	MinPI           *float64 `json:"min_pi"`
	MaxPI           *float64 `json:"max_pi"`
	MinNInteractors *int     `json:"min_n_interactors"`
	MaxNInteractors *int     `json:"max_n_interactors"`
	MinDRank        *int     `json:"min_d_rank"`
	MaxDRank        *int     `json:"max_d_rank"`
	Limit           int      `json:"limit"`
	Offset          int      `json:"offset"`
	OrderBy         string   `json:"order_by"`        // e.g., "length", "mw", "pi"
	OrderDirection  string   `json:"order_direction"` // "ASC" or "DESC"
}

// PaginatedProteins represents paginated protein results
type PaginatedProteins struct {
	Proteins []Protein `json:"proteins"`
	Total    int       `json:"total"`
	Limit    int       `json:"limit"`
	Offset   int       `json:"offset"`
	HasMore  bool      `json:"has_more"`
}

// ProteinStats represents statistics for proteins
type ProteinStats struct {
	TotalProteins     int     `json:"total_proteins"`
	AvgLength         float64 `json:"avg_length"`
	AvgMW             float64 `json:"avg_mw"`
	AvgPI             float64 `json:"avg_pi"`
	AvgNInteractors   float64 `json:"avg_n_interactors"`
	AvgHydrophobicity float64 `json:"avg_hydrophobicity"`
	TotalGenes        int     `json:"total_genes"`
	TotalFamilies     int     `json:"total_families"`
}

// TableName specifies the table name for Protein model
func (Protein) TableName() string {
	return "proteins"
}

// TableName specifies the table name for Gene model
func (Gene) TableName() string {
	return "genes"
}

// TableName specifies the table name for ProteinFamily model
func (ProteinFamily) TableName() string {
	return "protein_families"
}
