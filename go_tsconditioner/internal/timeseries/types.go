package timeseries

import (
	"fmt"
	"time"
)

// StatusCode classifies the validity of a single observation (a DataUnit).
// It allows algorithms to treat missing and anomalous data explicitly
// instead of silently propagating NaNs or zero-values.
//
// Typical semantics:
//   - StOK:       the observation is valid and should be used in stats.
//   - StMissing:  the observation is missing (e.g., Meas is NaN or absent).
//   - StOutlier:  the observation was flagged as an outlier by a detector.
//   - StInvalid:  the observation exists but must not be used (bad sensor,
//     parse error, unit mismatch, etc.).
type StatusCode uint8

// StOK, StMissing, StOutlier and StInvalid enumerate the canonical states
// an observation can be in. Consumers should prefer StatusCode over ad-hoc
// sentinels (like NaN-only) because it’s explicit and type-safe.
const (
	StOK       StatusCode = iota // default: valid
	StMissing                    // missing value (gap)
	StOutlier                    // flagged outlier
	StInvalid                    // present but unusable
	StRejected                   // Considered as outlier following process
	StSimulated
)

func (s StatusCode) String() string {
	switch s {
	case StOK:
		return "StOK"
	case StMissing:
		return "StMissing"
	case StOutlier:
		return "StOutlier"
	case StInvalid:
		return "StInvalid"
	case StRejected:
		return "StRejected"
	case StSimulated:
		return "StSimulated"
	default:
		// Pour les valeurs inattendues
		return fmt.Sprintf("StatusCode(%d)", uint8(s))
	}
}

// DataUnit represents a single timestamped measurement and its meta-state.
//
// Fields (typical usage):
//   - Chron:  the wall-clock timestamp of the observation.
//   - Meas:   the measured value. If Meas is not a float (or if NaN is used
//     to encode missingness), the Status should carry the ground truth.
//   - Dchron: optional time delta (e.g., since previous Chron) in nanoseconds.
//   - Dmeas:  optional delta of measurement (vs previous point).
//   - Status: the StatusCode describing validity.
//
// DataUnit is kept small and contiguous to allow efficient slices (no pointers
// for the hot path). Missing values can be represented by Status=StMissing and
// optionally Meas=math.NaN().
type DataUnit struct {
	Chron  time.Time
	Meas   float64
	Dchron time.Duration
	Dmeas  float64
	Status StatusCode
}

// TimeSeries is an ordered collection of DataUnit, typically sorted by Chron.
// The type is designed for correctness and traceability: each point carries
// its own StatusCode so that statistics and transforms can honor missing data
// and outliers without ad-hoc filtering.
//
// TimeSeries interoperates well with JSON/CSV/DB sources and can be converted
// to DTOs (see TimeSeriesJSON) for transport or storage.
type TimeSeries struct {
	MemId      uint64
	Name       string
	Comment    string
	DataSeries []DataUnit
	BasicStats
}

type DeltaTimeSeries struct {
	Name string
}

// BasicStats holds summary statistics for a series. All values must be defined
// in terms of valid observations only (Status=StOK), i.e., missing or invalid
// points are excluded from the aggregates.
//
// Field meaning (typical):
//   - Len:        count of valid observations used in stats (not total length).
//   - Chmin/Chmax: timestamps at which the min/max measurement occurred.
//   - ValAtChmin/ValAtChmax: the min/max measurement values.
//   - Chmed/Chmean/Chstd: representative timestamps (median/mean/“std anchor”).
//   - Msmin/Msmax/Msmean/Msmed/Msstd: scalar stats for measurement values.
//   - DChmin/DChmax/…: if present, summaries for time deltas (Dchron).
type BasicStats struct {
	Len        int
	Chmin      time.Time
	ValAtChmin float64
	Chmax      time.Time
	ValAtChmax float64
	Chmed      time.Time
	Chmean     time.Time
	Chstd      time.Time
	Msmin      float64
	ChAtMsmin  time.Time
	Msmax      float64
	ChAtMsmax  time.Time
	Msmean     float64
	Msmed      float64
	Msstd      float64
	DChmin     time.Duration
	ChAtDChmin time.Time
	DChmax     time.Duration
	ChAtDchmax time.Time
	DChmean    float64
	DChmed     float64
	DChstd     float64
	DMsmin     float64
	DMsmax     float64
	DMsmed     float64
	DMsmean    float64
	DMsstd     float64
	NbreOfNaN  int
}
type TsContainer struct {
	Name    string
	Comment string
	Ts      map[string]*TimeSeries
}

// NewDataUnit constructs a DataUnit from a timestamp and a value,
// assigning the provided StatusCode. It is a convenience helper that
// keeps construction explicit and consistent across the codebase.
// Warning:
//
//	A value of 0.0 for Meas is significant — it will not be treated as "unset".
//	This is important because Go initializes float fields to 0 by default.
//	If your data is missing or undefined, use math.NaN() explicitly.
func NewDataUnit(chr time.Time, meas float64) DataUnit {
	return DataUnit{
		Chron: chr,
		Meas:  meas,
	}
}

// NewDataUnitWithStatus creates a DataUnit with an explicit StatusCode.
func NewDataUnitWithStatus(chr time.Time, meas float64, status StatusCode) DataUnit {
	return DataUnit{
		Chron:  chr,
		Meas:   meas,
		Status: status,
	}
}
