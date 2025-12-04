package database

import (
	"time"

	"github.com/uptrace/bun"
)

// Protein represents a protein entity in the database
type Protein struct {
	bun.BaseModel `bun:"table:proteins"`

	ID   string `bun:"id,pk" json:"id"`
	Name string `bun:"name" json:"name"`

	Gene       *string `bun:"gene" json:"gene,omitempty"`
	Taxo       *string `bun:"taxo" json:"taxo,omitempty"`
	CC         *string `bun:"cc" json:"cc,omitempty"`
	Length     *int    `bun:"length" json:"length,omitempty"`
	Domain     *string `bun:"domain" json:"domain,omitempty"`
	Family     *string `bun:"family" json:"family,omitempty"`
	BioProcess *string `bun:"bio_process" json:"bio_process,omitempty"`
	Function   *string `bun:"function" json:"function,omitempty"`

	MW  *float64 `bun:"mw" json:"mw,omitempty"` // numeric(12,4)
	Seq []string `bun:"seq,array" json:"seq"`

	NInteractors        *int     `bun:"n_interactors" json:"n_interactors,omitempty"`
	PI                  *float64 `bun:"pi" json:"pi,omitempty"`                                     // numeric(4,2)
	NC74                *float64 `bun:"nc_7_4" json:"nc_7_4,omitempty"`                             // numeric(8,4)
	HydrophobicityGravy *float64 `bun:"hydrophobicity_gravy" json:"hydrophobicity_gravy,omitempty"` // numeric(8,4)

	DRank *int    `bun:"d_rank" json:"d_rank,omitempty"`
	LRank *string `bun:"l_rank" json:"l_rank,omitempty"` // varchar(100)
	FRank *string `bun:"f_rank" json:"f_rank,omitempty"` // varchar(100)

	Created time.Time `bun:"created,default:current_timestamp" json:"created"`
	Updated time.Time `bun:"updated,default:current_timestamp" json:"updated"`
}

// Gene represents a gene entity in the database
type Gene struct {
	ID   int    `bun:"id" json:"id"`
	Name string `bun:"name" json:"name"`
}

// ProteinFamily represents a protein family entity in the database
type ProteinFamily struct {
	ID   int    `bun:"id" json:"id"`
	Name string `bun:"name" json:"name"`
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
