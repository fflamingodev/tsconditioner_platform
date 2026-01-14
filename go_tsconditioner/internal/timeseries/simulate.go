package timeseries

import (
	"math/rand"
	"time"
)

func BulkSimul(
	name string,
	from time.Time,
	period time.Duration,
	samplesize int,
	mean float64,
	stdDev float64,
	jitter time.Duration, // écart-type du jitter
) TimeSeries {
	ts := TimeSeries{Name: name}
	t := from

	// Un seul générateur de nombres aléatoires
	r := rand.New(rand.NewSource(time.Now().UnixNano()))

	for i := 0; i < samplesize; i++ {
		// jitter gaussien autour de 0, avec σ = jitter
		jitterFactor := r.NormFloat64()                            // N(0, 1)
		jitterDur := time.Duration(jitterFactor * float64(jitter)) // en ns, car jitter est déjà un Duration

		interval := period + jitterDur
		if interval < 0 {
			// on évite de remonter dans le temps
			interval = 0
		}

		t = t.Add(interval)

		value := r.NormFloat64()*stdDev + mean

		du := DataUnit{
			Chron:  t,
			Meas:   value,
			Status: StSimulated,
		}
		ts.AddDataUnit(du)
	}

	return ts
}
