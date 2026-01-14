package timeseries

import (
	"math"
	"time"
)

type AggFunc func(local []float64) float64

func AggAverage(local []float64) float64 {
	m, _ := MeanSkipNaN(local)
	return m
}

func AggMaximum(local []float64) float64 {
	_, maxv := Bounds(local)
	return maxv
}

func AggMinimum(local []float64) float64 {
	minv, _ := Bounds(local)
	return minv
}

func AggLast(local []float64) float64 {
	return local[len(local)-1]
}

// AggOpen renvoie la première valeur (open) de la fenêtre.
func AggOpen(local []float64) float64 {
	return local[0]
}

// AggCountValid renvoie le nombre de valeurs non-NaN dans la fenêtre.
func AggCountValid(local []float64) float64 {
	count := 0
	for _, v := range local {
		if !math.IsNaN(v) {
			count++
		}
	}
	return float64(count)
}

// AggMedian renvoie la médiane des valeurs non-NaN de la fenêtre.
func AggMedian(local []float64) float64 {
	var clean []float64
	for _, v := range local {
		if !math.IsNaN(v) {
			clean = append(clean, v)
		}
	}

	if len(clean) == 0 {
		return math.NaN()
	}

	// copie avant appel à Median si Median trie en place
	tmp := make([]float64, len(clean))
	copy(tmp, clean)

	m, _ := Median(tmp)
	return m
}

// AggSlope calcule la pente d'une régression linéaire y = a + b x
// sur la fenêtre, avec x = 0, 1, ..., n-1.
// Les NaN sont ignorés. Si moins de 2 points valides, renvoie NaN.
func AggSlope(local []float64) float64 {
	n := len(local)
	if n < 2 {
		return math.NaN()
	}

	var (
		sumX  float64
		sumY  float64
		sumXY float64
		sumX2 float64
		count float64
	)

	for i, v := range local {
		if math.IsNaN(v) {
			continue
		}
		x := float64(i)
		y := v
		sumX += x
		sumY += y
		sumXY += x * y
		sumX2 += x * x
		count++
	}

	if count < 2 {
		return math.NaN()
	}

	// Formule de la pente b = (n Σxy − Σx Σy) / (n Σx² − (Σx)²)
	num := count*sumXY - sumX*sumY
	den := count*sumX2 - sumX*sumX
	if den == 0 {
		return math.NaN()
	}
	return num / den
}

// AggIntegral renvoie un agrégateur qui calcule l'aire simple
// somme(v) * freq.Seconds() (ou un autre dt si tu préfères).
// Les NaN sont ignorés.
func AggIntegral(freq time.Duration) AggFunc {
	dt := freq.Seconds()
	return func(local []float64) float64 {
		sum := 0.0
		for _, v := range local {
			if !math.IsNaN(v) {
				sum += v
			}
		}
		return sum * dt
	}
}

// AggIncrementalCounter renvoie une AggFunc qui, pour chaque fenêtre,
// retourne la consommation de cette fenêtre en calculant
// last(window) - last(window_précédente).
//
// Pour la première fenêtre, il y a plusieurs choix possibles :
// - retourner NaN (pas de conso mesurable)
// - retourner 0
// Ici je mets NaN pour signaler l'absence de base de comparaison.
func AggIncrementalCounter() AggFunc {
	var prevLast *float64 // nil tant qu'on n'a pas encore de fenêtre précédente

	return func(local []float64) float64 {
		if len(local) == 0 {
			return math.NaN()
		}

		curLast := local[len(local)-1]

		// première fenêtre : on initialise et on renvoie NaN
		if prevLast == nil {
			val := curLast
			prevLast = &val
			return math.NaN()
		}

		delta := curLast - *prevLast
		*prevLast = curLast
		return delta
	}
}
