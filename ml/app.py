#!/usr/bin/env python3

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
from pathlib import Path
from Bio import Align
from Bio.SeqUtils.ProtParam import ProteinAnalysis
import logging

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
logging.basicConfig(level=logging.INFO)

# Model paths
MODELS_DIR = Path(__file__).parent.parent / "models"
BEST_MODEL_PATH = MODELS_DIR / "lightgbm_best.pkl"
TOKENIZER_PATH = MODELS_DIR / "tokenizer.pkl"
MLB_PATH = MODELS_DIR / "mlb.pkl"

class ProteinMLService:
    def __init__(self):
        self.aligner = Align.PairwiseAligner()
        self.aligner.match_score = 2
        self.aligner.mismatch_score = -1
        self.aligner.open_gap_score = -2
        self.aligner.extend_gap_score = -0.5

        # Load ML models
        self.model = None
        self.tokenizer = None
        self.mlb = None
        self.current_model = "lightgbm_best"
        self.load_models()

    def load_specific_model(self, model_name):
        """Load a specific model by name"""
        model_path = MODELS_DIR / f"{model_name}.pkl"

        try:
            if model_path.exists():
                logging.info(f"Loading specific model: {model_name}")
                self.model = joblib.load(model_path)
                self.current_model = model_name
                logging.info(f"✓ Model {model_name} loaded successfully")
                return True
            else:
                logging.warning(f"Model {model_name} not found at {model_path}")
                return False
        except Exception as e:
            logging.error(f"Error loading model {model_name}: {e}")
            return False

    def load_models(self):
        try:
            if BEST_MODEL_PATH.exists():
                logging.info(f"Loading model from: {BEST_MODEL_PATH}")
                self.model = joblib.load(BEST_MODEL_PATH)
                self.current_model = "lightgbm_best"
                logging.info("✓ Model loaded successfully")
            else:
                logging.warning(f"Best model not found at {BEST_MODEL_PATH}")
                alternatives = [
                    MODELS_DIR / "xgboost.pkl",
                    MODELS_DIR / "random_forest.pkl",
                    MODELS_DIR / "lightgbm.pkl"
                ]
                for alt_path in alternatives:
                    if alt_path.exists():
                        logging.info(f"Loading alternative model from: {alt_path}")
                        self.model = joblib.load(alt_path)
                        logging.info("✓ Alternative model loaded successfully")
                        break

            # Skip tokenizer - use k-mer encoding instead
            logging.info("Using k-mer feature extraction (tokenizer skipped)")

            # Load MultiLabelBinarizer (for decoding predictions)
            if MLB_PATH.exists():
                logging.info(f"Loading label encoder from: {MLB_PATH}")
                self.mlb = joblib.load(MLB_PATH)
                logging.info("✓ Label encoder loaded successfully")
                logging.info(f"  Total protein function classes: {len(self.mlb.classes_)}")
            else:
                logging.warning(f"Label encoder not found at {MLB_PATH}")

            logging.info("=" * 60)
            if self.model and self.mlb:
                logging.info("Models loaded successfully!")
            else:
                logging.warning("Models incomplete - predictions may be limited")
            logging.info("=" * 60)

        except Exception as e:
            logging.error(f"ERROR loading models: {str(e)}")
            logging.warning("Continuing with limited functionality")

    def preprocess_sequence(self, sequence):
        cleaned_sequence = sequence.replace('\n', '').replace('\r', '').replace(' ', '')

        # Remove FASTA header if present
        if '>' in cleaned_sequence:
            lines = cleaned_sequence.split('>')
            cleaned_sequence = ''.join([line.split('\n', 1)[-1] if '\n' in line else line for line in lines if line])

        cleaned_sequence = cleaned_sequence.upper().strip()

        # Use k-mer encoding (3-mer)
        k = 3
        kmers = [cleaned_sequence[i:i+k] for i in range(len(cleaned_sequence) - k + 1)]
        unique_kmers = set(kmers)
        feature_vector = np.zeros(1000)

        for i, kmer in enumerate(list(unique_kmers)[:1000]):
            feature_vector[i] = kmers.count(kmer)

        return feature_vector.reshape(1, -1)

    def calculate_similarity(self, seq1, seq2):
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
        """Predict protein functions (not diseases - naming is legacy)"""
        predictions = []

        # Try using the loaded ML model
        if self.model is not None and self.mlb is not None:
            try:
                features = self.preprocess_sequence(sequence)

                # Make prediction
                if hasattr(self.model, 'predict_proba'):
                    predictions_proba = self.model.predict_proba(features)
                    predictions_binary = self.model.predict(features)
                else:
                    predictions_binary = self.model.predict(features)
                    predictions_proba = None

                # Decode predictions using MLB
                if isinstance(predictions_proba, list):
                    # Handle multi-output format (list of arrays)
                    for i, class_name in enumerate(self.mlb.classes_):
                        if i < len(predictions_proba):
                            proba = predictions_proba[i][0][1] if len(predictions_proba[i][0]) > 1 else predictions_proba[i][0][0]
                            if predictions_binary[0][i] == 1 or proba > 0.3:
                                predictions.append({
                                    'disease': str(class_name),  # Legacy field name - actually protein function
                                    'confidence': float(proba),
                                    'evidence': 'ML model prediction'
                                })
                else:
                    # Binary predictions
                    for i, class_name in enumerate(self.mlb.classes_):
                        if i < len(predictions_binary[0]) and predictions_binary[0][i] == 1:
                            # Get probability if available
                            if predictions_proba is not None and i < predictions_proba.shape[1]:
                                proba = float(predictions_proba[0][i])
                            else:
                                proba = 0.85
                            
                            predictions.append({
                                'disease': str(class_name),  # Legacy field name - actually protein function
                                'confidence': proba,
                                'evidence': 'ML model prediction'
                            })

                predictions.sort(key=lambda x: x['confidence'], reverse=True)
                logging.info(f"Predicted {len(predictions)} protein functions for sequence")
                return predictions[:20]

            except Exception as e:
                logging.error(f"ML prediction error: {e}", exc_info=True)
                return [{
                    'disease': 'Prediction Error',
                    'confidence': 0.0,
                    'evidence': f'Model error: {str(e)}'
                }]
        else:
            # No model available
            return [{
                'disease': 'Model Not Available',
                'confidence': 0.0,
                'evidence': 'ML model or label encoder not loaded'
            }]

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

        # Get model selection (optional)
        model_name = data.get('model', 'lightgbm_best')

        # Load specific model if requested
        if model_name and model_name != 'default':
            ml_service.load_specific_model(model_name)

        predictions = ml_service.predict_disease(sequence)

        return jsonify({
            'predictions': predictions,
            'sequence_length': len(sequence),
            'model_used': getattr(ml_service, 'current_model', 'unknown')
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

@app.route('/calculate-properties', methods=['POST'])
def calculate_properties():
    """Calculate protein properties using BioPython ProteinAnalysis"""
    try:
        data = request.get_json()
        if not data or 'sequence' not in data:
            return jsonify({'error': 'Missing sequence parameter'}), 400

        sequence = data['sequence'].strip()
        if not sequence:
            return jsonify({'error': 'Empty sequence'}), 400

        # Clean sequence - remove FASTA header if present
        cleaned_sequence = sequence.replace('\n', '').replace('\r', '').replace(' ', '')
        if '>' in cleaned_sequence:
            lines = cleaned_sequence.split('>')
            cleaned_sequence = ''.join([line.split('\n', 1)[-1] if '\n' in line else line for line in lines if line])
        cleaned_sequence = cleaned_sequence.upper().strip()

        # Use BioPython ProteinAnalysis
        try:
            analyzed_seq = ProteinAnalysis(cleaned_sequence)
            
            properties = {
                'length': len(cleaned_sequence),
                'molecular_weight': round(analyzed_seq.molecular_weight(), 2),
                'aromaticity': round(analyzed_seq.aromaticity(), 4),
                'instability_index': round(analyzed_seq.instability_index(), 2),
                'isoelectric_point': round(analyzed_seq.isoelectric_point(), 2),
                'gravy': round(analyzed_seq.gravy(), 4),
                'secondary_structure_fraction': analyzed_seq.secondary_structure_fraction(),
            }
            
            # Get amino acid composition
            aa_percent = analyzed_seq.get_amino_acids_percent()
            properties['amino_acid_percent'] = {k: round(v, 4) for k, v in aa_percent.items()}
            
            logging.info(f"Calculated properties for sequence of length {properties['length']}")
            return jsonify(properties)
            
        except Exception as e:
            logging.error(f"BioPython analysis error: {e}")
            return jsonify({'error': f'Invalid protein sequence: {str(e)}'}), 400

    except Exception as e:
        logging.error(f"Error in calculate_properties: {e}")
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)