package timeseries

import (
	"fmt"
	"math"
	"time"
)

// NaDuration is a sentinel time.Duration value representing
// “Not-a-Duration” (NaD). It is used to mark derived durations
// that are undefined, for example when they come from missing
// or invalid timestamps.
//
// The concrete value is chosen as math.MinInt64 converted to
// time.Duration, which is extremely unlikely to appear as a
// legitimate duration in application code. Callers must treat
// NaDuration as “no valid duration available” and avoid using
// it in further numeric computations.
const NaDuration time.Duration = time.Duration(-9223372036854775808)

var NaNumber float64 = math.NaN()

// NaDate is a sentinel time.Time value representing
// “Not-a-Date” (NaD). It is simply the zero-value of time.Time,
// which is the idiomatic way in Go to express “no valid time”.
var NaDate = time.Time{}

// IsNaD reports whether t should be interpreted as “Not-a-Date”.
// It returns true when t is the zero-value of time.Time.
//
// This helper centralizes the semantic that a zero time is not
// a real timestamp in the time series, but a missing/undefined
// one. Using IsNaD instead of comparing t to NaDate directly
// makes the intent explicit and keeps the calling code readable.
func IsNaDate(t time.Time) bool {
	return t.IsZero()
}

// SafeSub subtracts b from a like a.Sub(b), but is aware of NaD.
// If either input is “Not-a-Date” (IsNaD(a) or IsNaD(b) is true),
// SafeSub returns NaDuration instead of an arbitrary duration.
//
// This “NaD propagation” is crucial in time-series code: once a
// timestamp is missing or undefined, any derived duration based
// on it must also be treated as missing. Propagating NaDuration
// prevents silently mixing invalid intervals into downstream
// statistics (averages, sums, regularization, etc.), and makes
// missingness explicit in the data flow.
func SafeSub(a, b time.Time) time.Duration {
	if IsNaDate(a) || IsNaDate(b) {
		return NaDuration
	}
	return a.Sub(b)
}
func formatDuration(d time.Duration) string {
	if d == NaDuration {
		return "NaDuration"
	}
	return d.String()
}
func formatFloat(f float64) string {
	if math.IsNaN(f) {
		return "NaN"
	}
	return fmt.Sprintf("%v", f)
}
