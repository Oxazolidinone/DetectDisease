package entities

import (
	"errors"
	"regexp"
	"strings"
	"time"
)

var (
	ErrInvalidProteinID      = errors.New("protein ID cannot be empty")
	ErrInvalidProteinName    = errors.New("protein name cannot be empty")
	ErrSequenceTooShort      = errors.New("protein sequence is too short")
	ErrInvalidSequenceFormat = errors.New("protein sequence contains invalid characters")
)

type Protein struct {
	ID                  string    `json:"id" db:"id"`
	Name                string    `json:"name" db:"name"`
	Gene                *string   `json:"gene,omitempty" db:"gene"`
	Taxo                *string   `json:"taxo,omitempty" db:"taxo"`
	CC                  *string   `json:"cc,omitempty" db:"cc"`
	Length              *int      `json:"length,omitempty" db:"length"`
	Domain              *string   `json:"domain,omitempty" db:"domain"`
	Family              *string   `json:"family,omitempty" db:"family"`
	BioProcess          *string   `json:"bio_process,omitempty" db:"bio_process"`
	Function            *string   `json:"function,omitempty" db:"function"`
	MW                  *float64  `json:"mw,omitempty" db:"mw"`
	Seq                 []string  `json:"seq" db:"seq"`
	NInteractors        *int      `json:"n_interactors,omitempty" db:"n_interactors"`
	PI                  *float64  `json:"pi,omitempty" db:"pi"`
	NC74                *float64  `json:"nc_7_4,omitempty" db:"nc_7_4"`
	HydrophobicityGravy *float64  `json:"hydrophobicity_gravy,omitempty" db:"hydrophobicity_gravy"`
	DRank               *int      `json:"d_rank,omitempty" db:"d_rank"`
	LRank               *int      `json:"l_rank,omitempty" db:"l_rank"`
	FRank               *int      `json:"f_rank,omitempty" db:"f_rank"`
	Created             time.Time `json:"created" db:"created"`
	Updated             time.Time `json:"updated" db:"updated"`
}

func NewProtein(id, name string, seq []string) (*Protein, error) {
	if strings.TrimSpace(id) == "" {
		return nil, ErrInvalidProteinID
	}
	if strings.TrimSpace(name) == "" {
		return nil, ErrInvalidProteinName
	}
	if len(seq) == 0 {
		return nil, ErrSequenceTooShort
	}

	p := &Protein{
		ID:      strings.TrimSpace(id),
		Name:    strings.TrimSpace(name),
		Seq:     seq,
		Created: time.Now(),
		Updated: time.Now(),
	}

	if err := p.ValidateSequence(); err != nil {
		return nil, err
	}

	p.calculateLength()
	return p, nil
}

func (p *Protein) ValidateSequence() error {
	if len(p.Seq) == 0 {
		return ErrSequenceTooShort
	}

	validAminoAcids := regexp.MustCompile(`^[ACDEFGHIKLMNPQRSTVWY]+$`)
	for _, chunk := range p.Seq {
		if !validAminoAcids.MatchString(strings.ToUpper(chunk)) {
			return ErrInvalidSequenceFormat
		}
	}
	return nil
}

func (p *Protein) calculateLength() {
	totalLength := 0
	for _, chunk := range p.Seq {
		totalLength += len(chunk)
	}
	p.Length = &totalLength
}

func (p *Protein) GetFullSequence() string {
	return strings.Join(p.Seq, "")
}

func (p *Protein) UpdateSequence(seq []string) error {
	if len(seq) == 0 {
		return ErrSequenceTooShort
	}

	oldSeq := p.Seq
	p.Seq = seq
	if err := p.ValidateSequence(); err != nil {
		p.Seq = oldSeq
		return err
	}

	p.calculateLength()
	p.Updated = time.Now()
	return nil
}

func (p *Protein) SetGene(gene string) {
	if strings.TrimSpace(gene) != "" {
		geneVal := strings.TrimSpace(gene)
		p.Gene = &geneVal
		p.Updated = time.Now()
	}
}

func (p *Protein) SetTaxonomy(taxo string) {
	if strings.TrimSpace(taxo) != "" {
		taxoVal := strings.TrimSpace(taxo)
		p.Taxo = &taxoVal
		p.Updated = time.Now()
	}
}

func (p *Protein) SetMolecularWeight(mw float64) {
	if mw > 0 {
		p.MW = &mw
		p.Updated = time.Now()
	}
}

type Gene struct {
	ID   int    `json:"id" db:"id"`
	Name string `json:"name" db:"name"`
}

type ProteinFamily struct {
	ID   int    `json:"id" db:"id"`
	Name string `json:"name" db:"name"`
}

type ProteinFilter struct {
	ID              *string  `json:"id,omitempty"`
	Name            *string  `json:"name,omitempty"`
	Gene            *string  `json:"gene,omitempty"`
	Family          *string  `json:"family,omitempty"`
	MinLength       *int     `json:"min_length,omitempty"`
	MaxLength       *int     `json:"max_length,omitempty"`
	MinMW           *float64 `json:"min_mw,omitempty"`
	MaxMW           *float64 `json:"max_mw,omitempty"`
	MinPI           *float64 `json:"min_pi,omitempty"`
	MaxPI           *float64 `json:"max_pi,omitempty"`
	MinNInteractors *int     `json:"min_n_interactors,omitempty"`
	MaxNInteractors *int     `json:"max_n_interactors,omitempty"`
	MinDRank        *int     `json:"min_d_rank,omitempty"`
	MaxDRank        *int     `json:"max_d_rank,omitempty"`
	Limit           int      `json:"limit"`
	Offset          int      `json:"offset"`
	OrderBy         string   `json:"order_by"`
	OrderDirection  string   `json:"order_direction"`
}

type PaginatedProteins struct {
	Proteins []Protein `json:"proteins"`
	Total    int       `json:"total"`
	Limit    int       `json:"limit"`
	Offset   int       `json:"offset"`
	HasMore  bool      `json:"has_more"`
}

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
