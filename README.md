# Protein Data Mining and Analysis System

A comprehensive Go-based system for protein data extraction, analysis, and disease prediction.

## Project Structure

```
.
├── web/                           # Web API service
│   ├── internal/
│   │   ├── api/                   # HTTP routes and middleware
│   │   ├── domain/
│   │   │   ├── entities/          # Domain models (Protein, Disease, Cluster)
│   │   │   ├── repositories/      # Repository interfaces
│   │   │   └── services/          # Domain services
│   │   ├── dto/                   # Data Transfer Objects
│   │   ├── infrastructure/
│   │   │   ├── config/            # Configuration and DI container
│   │   │   ├── database/          # Database connection and migrations
│   │   │   ├── external/          # External service integrations
│   │   │   └── persistance/       # Repository implementations
│   │   ├── interfaces/
│   │   │   └── handlers/          # HTTP handlers
│   │   └── usecases/              # Application use cases
│   ├── main.go                    # Application entry point
│   └── Dockerfile                 # Web service container
├── pkg/                           # Shared packages
│   ├── scraper/                   # UniProt data scraping
│   ├── extractor/                 # Protein ID extraction from FASTA
│   ├── common/                    # Common utilities (errors, logger, utils)
│   └── database/                  # Database utilities (query builder)
├── ml/                            # Machine Learning service
│   └── app.py                     # Python Flask ML API
├── sql/                           # Database initialization
│   └── init.sql                   # Database schema and sample data
├── docker-compose.yml             # Development environment
├── go.mod                         # Go dependencies
└── README.md                      # This file
```

## Features

### Web API Service
- **Protein Management**: CRUD operations for protein data
- **Search & Filter**: Advanced protein search with organism filtering
- **Comparison**: Protein sequence comparison and similarity analysis
- **Disease Prediction**: ML-based disease association prediction
- **Clustering**: Protein clustering and similarity grouping

### Data Mining Components
- **UniProt Scraper**: Web scraping with browser automation
- **FASTA Extractor**: Extract protein IDs from FASTA files
- **Database Integration**: PostgreSQL with full-text search

### Machine Learning
- **Sequence Alignment**: Pairwise sequence alignment
- **Similarity Calculation**: Sequence similarity scoring
- **Disease Prediction**: Mock ML models for disease association

## Prerequisites

- Go 1.21+
- Docker and Docker Compose
- Python 3.11+ (for ML service)

## Quick Start

1. **Clone and navigate to project**:
```bash
cd KhaiThacDuLieuVaUngDung
```

2. **Start all services**:
```bash
docker-compose up -d
```

3. **Verify services are running**:
```bash
# Check web API
curl http://localhost:8080/api/v1/proteins

# Check ML service
curl http://localhost:5000/health

# Access database admin
open http://localhost:5050  # PgAdmin (admin@protein.com / admin123)
```

## API Endpoints

### Protein Management
```
GET    /api/v1/proteins           # List proteins
POST   /api/v1/proteins           # Create protein
GET    /api/v1/proteins/:id       # Get protein by ID
PUT    /api/v1/proteins/:id       # Update protein
DELETE /api/v1/proteins/:id       # Delete protein
```

### Advanced Operations
```
POST   /api/v1/proteins/search    # Search proteins
POST   /api/v1/proteins/compare   # Compare proteins
POST   /api/v1/proteins/predict   # Predict diseases
```

### Example Requests

**Create Protein**:
```bash
curl -X POST http://localhost:8080/api/v1/proteins \
  -H "Content-Type: application/json" \
  -d '{
    "uniprot_id": "P12345",
    "name": "Example Protein",
    "organism": "Homo sapiens",
    "sequence": "MKLLILGLVLALQIAEGVGQQPAAQPCCDVPELEPPGADHKGSCGVSIPGKLGVKQKQDGQPVPAIDTSQVLYYLGGTDAKPPVQLPRQEISLLPPADFNKYLLLPTRQGSGSSNLHKVLLPSLPSQAMDDLK",
    "length": 120,
    "molecular_weight": 13.5,
    "function_description": "Example protein function",
    "subcellular_location": "Cytoplasm"
  }'
```

**Search Proteins**:
```bash
curl -X POST http://localhost:8080/api/v1/proteins/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "insulin",
    "organism": "Homo sapiens",
    "limit": 10,
    "offset": 0
  }'
```

**Compare Proteins**:
```bash
curl -X POST http://localhost:8080/api/v1/proteins/compare \
  -H "Content-Type: application/json" \
  -d '{
    "protein_ids": [1, 2]
  }'
```

## Environment Variables

### Web Service
```env
SERVER_HOST=0.0.0.0
SERVER_PORT=8080
GIN_MODE=debug

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=protein_db
DB_SSL_MODE=disable

ML_BASE_URL=http://localhost:5000
ML_TIMEOUT=30
```

## Database Schema

### Key Tables
- **proteins**: Core protein data with sequences
- **diseases**: Disease information and OMIM IDs
- **protein_disease_associations**: Links proteins to diseases
- **clusters**: Protein clustering information
- **protein_clusters**: Protein cluster memberships

### Features
- Full-text search with trigram indexes
- Automatic timestamp updates
- Foreign key constraints
- Performance optimized indexes

## Development

### Run Locally (without Docker)

1. **Start PostgreSQL**:
```bash
docker run -d --name postgres \
  -e POSTGRES_DB=protein_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 postgres:15-alpine
```

2. **Run database migrations**:
```bash
psql -h localhost -U postgres -d protein_db -f sql/init.sql
```

3. **Start ML service**:
```bash
cd ml
pip install flask numpy scipy scikit-learn biopython
python app.py
```

4. **Start web service**:
```bash
cd web
go run main.go
```

### Data Scraping

**Scrape UniProt data**:
```go
import "go-crawler/pkg/scraper"

scraper := scraper.NewUniProtScraper("https://www.uniprot.org/uniprot")
err := scraper.ScrapeProteinData(ctx, "P04637", "./data")
```

**Extract FASTA IDs**:
```go
import "go-crawler/pkg/extractor"

extractor := extractor.NewProteinExtractor()
err := extractor.ExtractIDs("proteins.fasta", "protein_ids.csv")
```

## Production Deployment

1. **Set production environment variables**
2. **Use production-ready PostgreSQL**
3. **Configure proper logging and monitoring**
4. **Set up reverse proxy (nginx)**
5. **Enable SSL/TLS**

## Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Submit pull request

## License

This project is for educational and research purposes.