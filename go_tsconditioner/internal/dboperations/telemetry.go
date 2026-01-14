package dboperations

import (
	"fmt"
	"github.com/google/uuid"
	"go_tsconditioner/internal/timeseries"
	"math"
	"time"
)

type Telemetry struct {
	Id           uuid.UUID
	Time         time.Time
	Device       uuid.UUID
	Value        float64
	Datasource   string
	State        string
	Manufacturer string
	Model        string
	Serial       string
}

// mappe la colonne State (string) de Telemetry vers ton StatusCode
func mapStateToStatusCode(state string) timeseries.StatusCode {
	switch state {
	case "OK", "Ok", "ok":
		return timeseries.StOK
	case "MISSING", "Missing", "missing":
		return timeseries.StMissing
	case "OUTLIER", "Outlier", "outlier":
		return timeseries.StOutlier
	case "INVALID", "Invalid", "invalid":
		return timeseries.StInvalid
	case "REJECTED", "Rejected", "rejected":
		return timeseries.StRejected
	case "SIMULATED", "Simulated", "simulated":
		return timeseries.StSimulated
	default:
		// à adapter selon tes besoins
		return timeseries.StInvalid
	}
}

// Transforme les lignes Telemetry en un TimeSeries
func TelemetryRowsToTimeSeries(rows []Telemetry) (*timeseries.TimeSeries, error) {
	if len(rows) == 0 {
		return nil, fmt.Errorf("aucune ligne telemetry fournie")
	}

	// ⚠️ Ta requête est ORDER BY time DESC
	// Pour une série temporelle, on préfère souvent l’ordre chronologique ASC.
	// On va donc inverser l’ordre en construisant DataSeries.
	n := len(rows)
	data := make([]timeseries.DataUnit, n)

	for i := 0; i < n; i++ {
		r := rows[n-1-i] // on renverse -> index 0 = plus ancien

		data[i] = timeseries.DataUnit{
			Chron:  r.Time,
			Meas:   r.Value,
			Status: mapStateToStatusCode(r.State),
			// Dchron / Dmeas sont remplis juste après dans une deuxième passe
		}
	}

	// Deuxième passe : calcul de Dchron (Δ temps) et Dmeas (Δ valeur)
	for i := range data {
		if i == 0 {
			data[i].Dchron = 0
			data[i].Dmeas = math.NaN() // pas de variation pour le premier point
			continue
		}
		prev := data[i-1]
		curr := data[i]

		data[i].Dchron = curr.Chron.Sub(prev.Chron) // time.Duration
		data[i].Dmeas = curr.Meas - prev.Meas       // float64
	}

	// On utilise la première ligne comme méta pour Name / Comment.
	first := rows[0]

	// 👉 Ici, j’utilise le Device comme "nom" de la TimeSeries.
	// Si tu veux vraiment le Id de Telemetry, remplace par first.Id.String().
	name := first.Device.String()

	comment := fmt.Sprintf(
		"device=%s; datasource=%s; manufacturer=%s; model=%s; serial=%s; state(colonne)=%s",
		first.Device.String(),
		first.Datasource,
		first.Manufacturer,
		first.Model,
		first.Serial,
		first.State, // juste pour trace
	)

	ts := &timeseries.TimeSeries{
		// MemId sera typiquement rempli plus tard via ton store en mémoire
		MemId:      0,
		Name:       name,
		Comment:    comment,
		DataSeries: data,
		// BasicStats: laissé à zéro ; tu pourras recalculer avec ta fonction interne
	}

	// Si tu as une méthode pour recalculer les stats, c’est ici :
	// ts.RecomputeStats()

	return ts, nil
}
