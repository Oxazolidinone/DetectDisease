package database

import (
	"database/sql"
	"encoding/csv"
	"fmt"
	"io"
	"os"
	"strconv"
	"strings"

	"github.com/lib/pq"
)

func readDataFile(path string, ch chan<- []string) {
	f, err := os.Open(path)
	if err != nil {
		fmt.Printf("File does not exist: %v\n", err)
		close(ch)
		return
	}
	defer f.Close()

	r := csv.NewReader(f)

	// Skip header row if it exists
	if _, err := r.Read(); err != nil {
		fmt.Printf("Error reading header: %v\n", err)
		close(ch)
		return
	}

	go func() {
		defer close(ch)
		for {
			record, err := r.Read()
			if err == io.EOF {
				break
			}
			if err != nil {
				fmt.Printf("Error reading CSV line: %v\n", err)
				continue
			}
			ch <- record
		}
	}()
}

func split_and_fill(db *sql.DB, ch <-chan []string) {
	for rec := range ch {
		if len(rec) == 0 {
			continue
		}
		if err := fill(db, rec); err != nil {
			fmt.Printf("Error filling record: %v\n", err)
		}
	}
}

func fill(db *sql.DB, records []string) error {
	// Expecting CSV columns in this order (based on dataset fields):
	// ID, Name, Gene name, Taxonomic lineage, Cellular components, Domain, Family,
	// Biological process, Function, Length, Molecular weight, Number of interactors,
	// pI, Net_Charge_7_4, Hydrophobicity_GRAVY, Depth_Rank, Last_Rank, First_Rank, Sequence_Chunks

	if len(records) < 19 {
		return fmt.Errorf("insufficient columns in record: expected 19, got %d", len(records))
	}

	// Parse numeric fields with error handling - adjusted indices based on your dataset structure
	length := parseNullInt(records[9])           // Length (index 9)
	mw := parseNullFloat(records[10])            // Molecular weight (index 10)
	nInteractors := parseNullInt(records[11])    // Number of interactors (index 11)
	pi := parseNullFloat(records[12])            // pI (index 12)
	nc74 := parseNullFloat(records[13])          // Net_Charge_7_4 (index 13)
	hydrophobicity := parseNullFloat(records[14]) // Hydrophobicity_GRAVY (index 14)
	dRank := parseNullInt(records[15])           // Depth_Rank (index 15)
	lRank := parseNullInt(records[16])           // Last_Rank (index 16)
	fRank := parseNullInt(records[17])           // First_Rank (index 17)

	// Parse Sequence_Chunks field - assuming it's a comma-separated string or array format
	seqStr := strings.Trim(records[18], "[]\"")  // Sequence_Chunks (index 18)
	var seqArray interface{}
	if seqStr != "" {
		// Handle different sequence chunk formats
		seqParts := strings.Split(seqStr, ",")
		for i := range seqParts {
			seqParts[i] = strings.TrimSpace(strings.Trim(seqParts[i], "\"'"))
		}
		// Use pq.Array for proper PostgreSQL array handling
		seqArray = pq.Array(seqParts)
	} else {
		// Empty array for PostgreSQL
		seqArray = pq.Array([]string{})
	}

	query := `
        INSERT INTO proteins (
            ID, NAME, GENE, TAXO, CC, LENGTH, DOMAIN, FAMILY,
            BIO_PROCESS, FUNCTION, MW, SEQ, N_INTERACTORS, PI,
            NC_7_4, HYDROPHOBICITY_GRAVY, D_RANK, L_RANK, F_RANK
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        ON CONFLICT (ID) DO UPDATE SET
            NAME = EXCLUDED.NAME,
            GENE = EXCLUDED.GENE,
            TAXO = EXCLUDED.TAXO,
            CC = EXCLUDED.CC,
            LENGTH = EXCLUDED.LENGTH,
            DOMAIN = EXCLUDED.DOMAIN,
            FAMILY = EXCLUDED.FAMILY,
            BIO_PROCESS = EXCLUDED.BIO_PROCESS,
            FUNCTION = EXCLUDED.FUNCTION,
            MW = EXCLUDED.MW,
            SEQ = EXCLUDED.SEQ,
            N_INTERACTORS = EXCLUDED.N_INTERACTORS,
            PI = EXCLUDED.PI,
            NC_7_4 = EXCLUDED.NC_7_4,
            HYDROPHOBICITY_GRAVY = EXCLUDED.HYDROPHOBICITY_GRAVY,
            D_RANK = EXCLUDED.D_RANK,
            L_RANK = EXCLUDED.L_RANK,
            F_RANK = EXCLUDED.F_RANK,
            UPDATED = CURRENT_TIMESTAMP
    `

	_, err := db.Exec(query,
		nullString(records[0]), // ID
		nullString(records[1]), // NAME
		nullString(records[2]), // GENE (Gene name)
		nullString(records[3]), // TAXO (Taxonomic lineage)
		nullString(records[4]), // CC (Cellular components)
		length,                 // LENGTH
		nullString(records[5]), // DOMAIN
		nullString(records[6]), // FAMILY
		nullString(records[7]), // BIO_PROCESS (Biological process)
		nullString(records[8]), // FUNCTION
		mw,                     // MW (Molecular weight)
		seqArray,               // SEQ (Sequence_Chunks)
		nInteractors,           // N_INTERACTORS (Number of interactors)
		pi,                     // PI (pI)
		nc74,                   // NC_7_4 (Net_Charge_7_4)
		hydrophobicity,         // HYDROPHOBICITY_GRAVY
		dRank,                  // D_RANK (Depth_Rank)
		lRank,                  // L_RANK (Last_Rank)
		fRank,                  // F_RANK (First_Rank)
	)

	return err
}

// Helper functions to handle NULL values
func nullString(s string) interface{} {
	s = strings.TrimSpace(s)
	if s == "" || s == "NULL" || s == "null" {
		return nil
	}
	return s
}

func parseNullInt(s string) interface{} {
	s = strings.TrimSpace(s)
	if s == "" || s == "NULL" || s == "null" {
		return nil
	}
	val, err := strconv.Atoi(s)
	if err != nil {
		return nil
	}
	return val
}

func parseNullFloat(s string) interface{} {
	s = strings.TrimSpace(s)
	if s == "" || s == "NULL" || s == "null" {
		return nil
	}
	val, err := strconv.ParseFloat(s, 64)
	if err != nil {
		return nil
	}
	return val
}

// ExtractAndInsertGenes extracts unique gene names from dataset and inserts them into genes table
func ExtractAndInsertGenes(db *sql.DB, ch <-chan []string) error {
	geneSet := make(map[string]bool)

	// Collect unique gene names from the data stream
	for rec := range ch {
		if len(rec) > 2 && rec[2] != "" && rec[2] != "NULL" && rec[2] != "null" {
			geneName := strings.TrimSpace(rec[2])
			if geneName != "" {
				geneSet[geneName] = true
			}
		}
	}

	// Insert unique genes into genes table
	query := `INSERT INTO genes (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`
	for geneName := range geneSet {
		if _, err := db.Exec(query, geneName); err != nil {
			fmt.Printf("Error inserting gene %s: %v\n", geneName, err)
		}
	}

	fmt.Printf("Extracted and inserted %d unique genes\n", len(geneSet))
	return nil
}

// ExtractAndInsertProteinFamilies extracts unique protein families from dataset and inserts them into protein_families table
func ExtractAndInsertProteinFamilies(db *sql.DB, ch <-chan []string) error {
	familySet := make(map[string]bool)

	// Collect unique family names from the data stream
	for rec := range ch {
		if len(rec) > 6 && rec[6] != "" && rec[6] != "NULL" && rec[6] != "null" {
			familyName := strings.TrimSpace(rec[6])
			if familyName != "" {
				familySet[familyName] = true
			}
		}
	}

	// Insert unique families into protein_families table
	query := `INSERT INTO protein_families (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`
	for familyName := range familySet {
		if _, err := db.Exec(query, familyName); err != nil {
			fmt.Printf("Error inserting protein family %s: %v\n", familyName, err)
		}
	}

	fmt.Printf("Extracted and inserted %d unique protein families\n", len(familySet))
	return nil
}

// ProcessCompleteDataset processes the entire dataset and extracts data for all tables
func ProcessCompleteDataset(db *sql.DB, filePath string) error {
	fmt.Println("Starting complete dataset processing...")

	// First pass: Extract genes and protein families
	fmt.Println("First pass: Extracting genes and protein families...")

	// Read data for genes extraction
	genesCh := make(chan []string, 100)
	readDataFile(filePath, genesCh)
	if err := ExtractAndInsertGenes(db, genesCh); err != nil {
		return fmt.Errorf("failed to extract genes: %w", err)
	}

	// Read data for protein families extraction
	familiesCh := make(chan []string, 100)
	readDataFile(filePath, familiesCh)
	if err := ExtractAndInsertProteinFamilies(db, familiesCh); err != nil {
		return fmt.Errorf("failed to extract protein families: %w", err)
	}

	// Second pass: Insert all protein data
	fmt.Println("Second pass: Inserting protein data...")
	proteinsCh := make(chan []string, 100)
	readDataFile(filePath, proteinsCh)
	split_and_fill(db, proteinsCh)

	fmt.Println("Complete dataset processing finished successfully")
	return nil
}

// LoadProteinsFromCSV is a convenience function to orchestrate the loading
func LoadProteinsFromCSV(db *sql.DB, filePath string) error {
	ch := make(chan []string, 100) // Buffered channel for better performance

	readDataFile(filePath, ch)
	split_and_fill(db, ch)

	fmt.Println("Data loading completed")
	return nil
}
