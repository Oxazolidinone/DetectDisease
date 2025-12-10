package pythonbiopy

import (
	"encoding/json"
	"os/exec"
)

type BioResult struct {
	PI    float64 `json:"pI"`
	Gravy float64 `json:"gravy"`
	// NC74  float64 `json:"nc74"`
}

func Compute(sequence string) (*BioResult, error) {
	cmd := exec.Command("python3", "compute.py", sequence)
	out, err := cmd.Output()
	if err != nil {
		return nil, err
	}

	var r BioResult
	json.Unmarshal(out, &r)
	return &r, nil
}
