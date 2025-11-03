#!/usr/bin/env python3
"""
Simple ML service for protein analysis
Provides basic similarity calculation and mock disease prediction
"""

from flask import Flask, request, jsonify
import numpy as np
from Bio import Align
from Bio.Seq import Seq
from Bio.SeqUtils.ProtParam import ProteinAnalysis
import logging

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

class ProteinMLService:
    def __init__(self):
        self.aligner = Align.PairwiseAligner()
        self.aligner.match_score = 2
        self.aligner.mismatch_score = -1
        self.aligner.open_gap_score = -2
        self.aligner.extend_gap_score = -0.5

        # Mock disease prediction models (in reality would be trained ML models)
        self.disease_patterns = {
            'Alzheimer Disease': ['GGGG', 'PPPP', 'AMYLOID'],
            'Diabetes Mellitus Type 2': ['INSULIN', 'GLUT', 'METAB'],
            'Cancer': ['P53', 'ONCOG', 'TUMOR'],
            'Cardiovascular Disease': ['CARDIO', 'VESSEL', 'HEART']
        }

    def calculate_similarity(self, seq1, seq2):
        """Calculate sequence similarity using alignment score"""
        try:
            alignments = self.aligner.align(seq1, seq2)
            best_alignment = max(alignments, key=lambda x: x.score)

            # Normalize score by length
            max_length = max(len(seq1), len(seq2))
            similarity = min(1.0, best_alignment.score / (max_length * 2))

            return max(0.0, similarity)
        except Exception as e:
            logging.error(f"Error calculating similarity: {e}")
            return 0.0

    def predict_disease(self, sequence):
        """Mock disease prediction based on simple pattern matching"""
        predictions = []
        sequence_upper = sequence.upper()

        try:
            # Calculate basic protein properties
            analysis = ProteinAnalysis(sequence)
            molecular_weight = analysis.molecular_weight()

            for disease, patterns in self.disease_patterns.items():
                score = 0.0
                evidence = []

                # Pattern matching
                for pattern in patterns:
                    if pattern in sequence_upper:
                        score += 0.2
                        evidence.append(f"Contains {pattern} motif")

                # Length-based scoring (mock)
                if disease == 'Alzheimer Disease' and len(sequence) > 300:
                    score += 0.1
                    evidence.append("Large protein associated with neurodegeneration")
                elif disease == 'Diabetes Mellitus Type 2' and 50 < len(sequence) < 200:
                    score += 0.1
                    evidence.append("Medium-sized protein in metabolic pathway")

                # Molecular weight-based scoring (mock)
                if molecular_weight > 50000 and disease == 'Cancer':
                    score += 0.1
                    evidence.append("High molecular weight associated with tumor suppression")

                # Add some randomness for demonstration
                score += np.random.uniform(0, 0.3)
                score = min(1.0, score)

                if score > 0.1:  # Only include if there's some indication
                    predictions.append({
                        'disease_name': disease,
                        'probability': round(score, 3),
                        'confidence_score': round(min(score * 1.2, 1.0), 3),
                        'evidence': '; '.join(evidence) if evidence else 'Statistical correlation'
                    })

        except Exception as e:
            logging.error(f"Error predicting disease: {e}")
            return []

        # Sort by probability
        predictions.sort(key=lambda x: x['probability'], reverse=True)
        return predictions[:5]  # Return top 5

    def align_sequences(self, seq1, seq2):
        """Perform sequence alignment"""
        try:
            alignments = self.aligner.align(seq1, seq2)
            best_alignment = max(alignments, key=lambda x: x.score)

            aligned_seqs = str(best_alignment).split('\n')

            return {
                'aligned_sequence1': aligned_seqs[0] if len(aligned_seqs) > 0 else seq1,
                'aligned_sequence2': aligned_seqs[2] if len(aligned_seqs) > 2 else seq2,
                'score': float(best_alignment.score),
                'length': len(aligned_seqs[0]) if len(aligned_seqs) > 0 else max(len(seq1), len(seq2))
            }
        except Exception as e:
            logging.error(f"Error aligning sequences: {e}")
            return {
                'aligned_sequence1': seq1,
                'aligned_sequence2': seq2,
                'score': 0.0,
                'length': max(len(seq1), len(seq2))
            }

# Initialize service
ml_service = ProteinMLService()

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'service': 'protein-ml'})

@app.route('/predict/disease', methods=['POST'])
def predict_disease():
    try:
        data = request.get_json()
        if not data or 'sequence' not in data:
            return jsonify({'error': 'Missing sequence parameter'}), 400

        sequence = data['sequence'].strip()
        if not sequence:
            return jsonify({'error': 'Empty sequence'}), 400

        predictions = ml_service.predict_disease(sequence)

        return jsonify({
            'predictions': predictions,
            'sequence_length': len(sequence)
        })

    except Exception as e:
        logging.error(f"Error in predict_disease: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/similarity', methods=['POST'])
def calculate_similarity():
    try:
        data = request.get_json()
        if not data or 'sequence1' not in data or 'sequence2' not in data:
            return jsonify({'error': 'Missing sequence1 or sequence2 parameters'}), 400

        seq1 = data['sequence1'].strip()
        seq2 = data['sequence2'].strip()

        if not seq1 or not seq2:
            return jsonify({'error': 'Empty sequences'}), 400

        similarity = ml_service.calculate_similarity(seq1, seq2)

        return jsonify({
            'similarity': similarity,
            'sequence1_length': len(seq1),
            'sequence2_length': len(seq2)
        })

    except Exception as e:
        logging.error(f"Error in calculate_similarity: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/align', methods=['POST'])
def align_sequences():
    try:
        data = request.get_json()
        if not data or 'sequence1' not in data or 'sequence2' not in data:
            return jsonify({'error': 'Missing sequence1 or sequence2 parameters'}), 400

        seq1 = data['sequence1'].strip()
        seq2 = data['sequence2'].strip()

        if not seq1 or not seq2:
            return jsonify({'error': 'Empty sequences'}), 400

        alignment = ml_service.align_sequences(seq1, seq2)

        return jsonify(alignment)

    except Exception as e:
        logging.error(f"Error in align_sequences: {e}")
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)