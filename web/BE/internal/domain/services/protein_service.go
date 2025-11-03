package services

import (
	"errors"
	"go-crawler/web/BE/internal/domain/entities"
	"math"
	"regexp"
	"strings"
)

var (
	ErrProteinNil         = errors.New("protein cannot be nil")
	ErrInvalidSequence    = errors.New("invalid protein sequence")
)

type ProteinDomainService interface {
	CompareSequences(protein1, protein2 *entities.Protein) (float64, error)
	ValidateSequence(sequence []string) error
	CalculateSimilarity(seq1, seq2 string) float64
	CalculateMolecularWeight(sequence string) float64
	CalculateIsoelectricPoint(sequence string) float64
	CalculateHydrophobicity(sequence string) float64
}

type ProteinService struct{}

func NewProteinService() ProteinDomainService {
	return &ProteinService{}
}

func (p *ProteinService) CompareSequences(protein1, protein2 *entities.Protein) (float64, error) {
	if protein1 == nil || protein2 == nil {
		return 0, ErrProteinNil
	}

	seq1 := protein1.GetFullSequence()
	seq2 := protein2.GetFullSequence()

	if seq1 == "" || seq2 == "" {
		return 0, ErrInvalidSequence
	}

	return p.CalculateSimilarity(seq1, seq2), nil
}

func (p *ProteinService) ValidateSequence(sequence []string) error {
	if len(sequence) == 0 {
		return entities.ErrSequenceTooShort
	}

	validAminoAcids := regexp.MustCompile(`^[ACDEFGHIKLMNPQRSTVWY]+$`)
	for _, chunk := range sequence {
		if chunk == "" {
			continue
		}
		if !validAminoAcids.MatchString(strings.ToUpper(chunk)) {
			return entities.ErrInvalidSequenceFormat
		}
	}
	return nil
}

func (p *ProteinService) CalculateSimilarity(seq1, seq2 string) float64 {
	if seq1 == "" || seq2 == "" {
		return 0.0
	}

	if seq1 == seq2 {
		return 1.0
	}

	return p.calculateLevenshteinSimilarity(seq1, seq2)
}

func (p *ProteinService) calculateLevenshteinSimilarity(seq1, seq2 string) float64 {
	len1, len2 := len(seq1), len(seq2)
	if len1 == 0 {
		return 0.0
	}
	if len2 == 0 {
		return 0.0
	}

	matrix := make([][]int, len1+1)
	for i := range matrix {
		matrix[i] = make([]int, len2+1)
	}

	for i := 0; i <= len1; i++ {
		matrix[i][0] = i
	}
	for j := 0; j <= len2; j++ {
		matrix[0][j] = j
	}

	for i := 1; i <= len1; i++ {
		for j := 1; j <= len2; j++ {
			cost := 0
			if seq1[i-1] != seq2[j-1] {
				cost = 1
			}
			matrix[i][j] = min(
				matrix[i-1][j]+1,
				min(matrix[i][j-1]+1, matrix[i-1][j-1]+cost),
			)
		}
	}

	maxLen := max(len1, len2)
	distance := matrix[len1][len2]
	return 1.0 - float64(distance)/float64(maxLen)
}

func (p *ProteinService) CalculateMolecularWeight(sequence string) float64 {
	weights := map[rune]float64{
		'A': 89.09, 'R': 174.20, 'N': 132.12, 'D': 133.10, 'C': 121.16,
		'E': 147.13, 'Q': 146.15, 'G': 75.07, 'H': 155.16, 'I': 131.17,
		'L': 131.17, 'K': 146.19, 'M': 149.21, 'F': 165.19, 'P': 115.13,
		'S': 105.09, 'T': 119.12, 'W': 204.23, 'Y': 181.19, 'V': 117.15,
	}

	totalWeight := 0.0
	for _, aa := range strings.ToUpper(sequence) {
		if weight, exists := weights[aa]; exists {
			totalWeight += weight
		}
	}

	if len(sequence) > 1 {
		totalWeight -= float64(len(sequence)-1) * 18.015
	}

	return totalWeight
}

func (p *ProteinService) CalculateIsoelectricPoint(sequence string) float64 {
	pKValues := map[rune]float64{
		'C': 8.5, 'D': 3.9, 'E': 4.2, 'H': 6.0, 'K': 10.5, 'R': 12.5, 'Y': 10.1,
	}

	counts := make(map[rune]int)
	for _, aa := range strings.ToUpper(sequence) {
		counts[aa]++
	}

	ph := 7.0
	for i := 0; i < 100; i++ {
		charge := p.calculateChargeAtPH(ph, counts, pKValues)
		if math.Abs(charge) < 0.01 {
			break
		}
		if charge > 0 {
			ph += 0.1
		} else {
			ph -= 0.1
		}
	}

	return ph
}

func (p *ProteinService) calculateChargeAtPH(ph float64, counts map[rune]int, pKValues map[rune]float64) float64 {
	charge := 0.0

	charge += 1.0 / (1.0 + math.Pow(10, ph-9.69))
	charge -= 1.0 / (1.0 + math.Pow(10, 2.34-ph))

	for aa, pK := range pKValues {
		count := float64(counts[aa])
		if aa == 'D' || aa == 'E' || aa == 'C' || aa == 'Y' {
			charge -= count / (1.0 + math.Pow(10, pK-ph))
		} else {
			charge += count / (1.0 + math.Pow(10, ph-pK))
		}
	}

	return charge
}

func (p *ProteinService) CalculateHydrophobicity(sequence string) float64 {
	hydrophobicity := map[rune]float64{
		'A': 1.8, 'R': -4.5, 'N': -3.5, 'D': -3.5, 'C': 2.5,
		'E': -3.5, 'Q': -3.5, 'G': -0.4, 'H': -3.2, 'I': 4.5,
		'L': 3.8, 'K': -3.9, 'M': 1.9, 'F': 2.8, 'P': -1.6,
		'S': -0.8, 'T': -0.7, 'W': -0.9, 'Y': -1.3, 'V': 4.2,
	}

	totalHydrophobicity := 0.0
	validCount := 0

	for _, aa := range strings.ToUpper(sequence) {
		if value, exists := hydrophobicity[aa]; exists {
			totalHydrophobicity += value
			validCount++
		}
	}

	if validCount == 0 {
		return 0.0
	}

	return totalHydrophobicity / float64(validCount)
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
