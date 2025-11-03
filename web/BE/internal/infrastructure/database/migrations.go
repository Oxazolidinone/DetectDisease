package database

import (
	"fmt"
)

const (
	createProteinsTable = `
    CREATE TABLE IF NOT EXISTS proteins (
       ID VARCHAR(50) PRIMARY KEY,
       NAME VARCHAR(255) NOT NULL,
       GENE VARCHAR(50),
    	TAXO TEXT,
        CC TEXT,
       LENGTH INTEGER,
        DOMAIN TEXT,
        FAMILY TEXT,
        BIO_PROCESS TEXT,
        FUNCTION TEXT,
       MW DECIMAL(12,4), 
        SEQ TEXT[] NOT NULL,
       N_INTERACTORS INTEGER,
       PI DECIMAL(4,2),
       NC_7_4 DECIMAL(8,4),
        HYDROPHOBICITY_GRAVY DECIMAL(8,4),
       D_RANK INTEGER,
       L_RANK INTEGER,
       F_RANK INTEGER,
       CREATED TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       UPDATED TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`

	createGeneTable = `
    CREATE TABLE IF NOT EXISTS genes (
       id SERIAL PRIMARY KEY,
       name VARCHAR(255) UNIQUE NOT NULL
    );`

	createProteinFamiliesTable = `
    CREATE TABLE IF NOT EXISTS protein_families (
       id SERIAL PRIMARY KEY,
       name VARCHAR(255) UNIQUE NOT NULL
    );`

	createIndexes = `
    -- Indexes for proteins table
    CREATE INDEX IF NOT EXISTS idx_proteins_name ON proteins(NAME);
    CREATE INDEX IF NOT EXISTS idx_proteins_gene ON proteins(GENE);
    CREATE INDEX IF NOT EXISTS idx_proteins_family ON proteins(FAMILY);
    CREATE INDEX IF NOT EXISTS idx_proteins_length ON proteins(LENGTH);
    CREATE INDEX IF NOT EXISTS idx_proteins_mw ON proteins(MW);
    CREATE INDEX IF NOT EXISTS idx_proteins_n_interactors ON proteins(N_INTERACTORS);
    CREATE INDEX IF NOT EXISTS idx_proteins_pi ON proteins(PI);
    CREATE INDEX IF NOT EXISTS idx_proteins_d_rank ON proteins(D_RANK);
    CREATE INDEX IF NOT EXISTS idx_proteins_l_rank ON proteins(L_RANK);
    CREATE INDEX IF NOT EXISTS idx_proteins_f_rank ON proteins(F_RANK);
    CREATE INDEX IF NOT EXISTS idx_proteins_created ON proteins(CREATED);
    CREATE INDEX IF NOT EXISTS idx_proteins_updated ON proteins(UPDATED);
    
    -- Composite indexes for common query patterns
    CREATE INDEX IF NOT EXISTS idx_proteins_gene_family ON proteins(GENE, FAMILY);
    CREATE INDEX IF NOT EXISTS idx_proteins_family_length ON proteins(FAMILY, LENGTH);
    CREATE INDEX IF NOT EXISTS idx_proteins_mw_pi ON proteins(MW, PI);
    
    -- Full-text search indexes (if your database supports it)
    -- For PostgreSQL:
    -- CREATE INDEX IF NOT EXISTS idx_proteins_taxo_gin ON proteins USING gin(to_tsvector('english', TAXO));
    -- CREATE INDEX IF NOT EXISTS idx_proteins_function_gin ON proteins USING gin(to_tsvector('english', FUNCTION));
    
    -- Indexes for genes table
    CREATE INDEX IF NOT EXISTS idx_genes_name ON genes(name);
    
    -- Indexes for protein_families table
    -- name already has UNIQUE constraint which creates an index
    `
)

func RunMigrations(db *Database) error {
	migrations := []string{
		createProteinsTable,
		createGeneTable,
		createProteinFamiliesTable,
		createIndexes,
	}

	for i, migration := range migrations {
		if _, err := db.Conn.Exec(migration); err != nil {
			return fmt.Errorf("failed to execute migration %d: %w", i+1, err)
		}
	}

	return nil
}
