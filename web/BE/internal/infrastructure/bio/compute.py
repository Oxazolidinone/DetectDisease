import sys, json
from Bio.SeqUtils.ProtParam import ProteinAnalysis

seq = sys.argv[1]

a = ProteinAnalysis(seq)

res = {
    "pI": a.isoelectric_point(),
    "gravy": a.gravy(),
    # "nc74": a.charge_at_pH(7.4),
}

print(json.dumps(res))
