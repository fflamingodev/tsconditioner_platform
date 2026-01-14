package types

import "time"

type BulkSimulRequest struct {
	Name          string         `json:"name"`
	Start         string         `json:"start" binding:"required"`
	PeriodSeconds int64          `json:"periodSeconds" binding:"required"`
	N             int            `json:"n" binding:"required"`
	Mean          *float64       `json:"mean" binding:"required"`   // 0 autorisé
	StdDev        *float64       `json:"stdDev" binding:"required"` // 0 autorisé
	Jitter        *time.Duration `json:"jitter"`                    // optionnel, défaut 0
}
type PolishingRequest struct {
	MemId       uint64  `json:"memId" binding:"required"`
	Reduce      bool    `json:"reduce"`
	FreqSeconds int64   `json:"freqSeconds"`
	Agg         string  `json:"agg"` // "average", "maximum", ...
	Method1     string  `json:"method1"`
	Min1        float64 `json:"min1"`
	Max1        float64 `json:"max1"`
	Percent1    float64 `json:"percent1"`
	Lvl1        float64 `json:"lvl1"`
	Method2     string  `json:"method2"`
	Min2        float64 `json:"min2"`
	Max2        float64 `json:"max2"`
	Percent2    float64 `json:"percent2"`
	Lvl2        float64 `json:"lvl2"`
	Interp      string  `json:"interp"`
}
type OneDeviceOneDatasourceRequest struct {
	Device     string    `json:"device" binding:"required"`
	DataSource string    `json:"datasource"` // optionnel
	From       time.Time `json:"from"`
	To         time.Time `json:"to"`
	Limit      int       `json:"limit"`
}
