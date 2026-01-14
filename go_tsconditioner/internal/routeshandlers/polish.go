package routeshandlers

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"go_tsconditioner/internal/store"
	"go_tsconditioner/internal/timeseries"
	"go_tsconditioner/internal/types"
	"net/http"
	"time"
)

func Polishing(c *gin.Context) {
	var req types.PolishingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	tsc := timeseries.TsContainer{
		Name:    "Polished by " + req.Method1 + " -> " + req.Method2 + " -> " + req.Agg + " @ " + time.Duration(req.FreqSeconds).String() + "s",
		Comment: "standard",
		Ts:      make(map[string]*timeseries.TimeSeries),
	}
	ts, ok := store.GlobalTsStore.Get(req.MemId)
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "time series not found"})
		return
	}
	ts.Sort_Deltas_Stats()
	workingTs := ts
	// ==================== ÉTAPE 1: REDUCTION =========== ====================
	if req.Reduce == true {
		tsreduced := workingTs.Reduce()
		tsreduced.Sort_Deltas_Stats()
		store.GlobalTsStore.Save(&tsreduced)
		tsc.Ts["Reduced"] = &tsreduced
		workingTs = &tsreduced
	}
	// ==================== ÉTAPE 2: CLEANING PRE-REGULARIZATION ====================
	if req.Method1 != "" && req.Method1 != "none" && req.Method1 != "None" {
		tsclean, tsreject := applyCleaning(workingTs, req.Method1, req.Min1, req.Max1, req.Percent1, req.Lvl1)

		tsclean.Sort_Deltas_Stats()
		tsreject.Sort_Deltas_Stats()

		store.GlobalTsStore.Save(&tsclean)
		store.GlobalTsStore.Save(&tsreject)

		tsc.Ts["Pre Reg Cleaned"] = &tsclean
		tsc.Ts["Pre Reg Rejected"] = &tsreject

		// La série nettoyée devient la série de travail pour l'étape suivante
		workingTs = &tsclean
	}
	// ==================== ÉTAPE 3: REGULARIZATION ====================
	var regularizedTs timeseries.TimeSeries
	//regularizationApplied := false

	if req.FreqSeconds > 0 && req.Agg != "" && req.Agg != "none" && req.Agg != "None" {
		freq := time.Duration(req.FreqSeconds) * time.Second
		agg, err := getAggFunc(req.Agg, freq)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		workingTs.Sort_Deltas_Stats()
		regularizedTs = workingTs.Regularize(freq, agg, 0)
		regularizedTs.Sort_Deltas_Stats()

		store.GlobalTsStore.Save(&regularizedTs)
		tsc.Ts["Regularized"] = &regularizedTs

		// La série régularisée devient la série de travail pour l'étape suivante
		workingTs = &regularizedTs
		//regularizationApplied = true
	}
	// ==================== ÉTAPE 4: CLEANING POST-REGULARIZATION ====================
	if req.Method2 != "" && req.Method2 != "none" && req.Method2 != "None" {
		// On ne peut faire de post-cleaning que si une régularisation a été appliquée
		/*if !regularizationApplied {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "post-regularization cleaning requires regularization to be performed",
			})
			return
		}

		*/

		tsclean, tsreject := applyCleaning(workingTs, req.Method2, req.Min2, req.Max2, req.Percent2, req.Lvl2)
		tsclean.Sort_Deltas_Stats()
		tsreject.Sort_Deltas_Stats()

		store.GlobalTsStore.Save(&tsclean)
		store.GlobalTsStore.Save(&tsreject)
		workingTs = &tsclean

		tsc.Ts["Post Reg Cleaned"] = &tsclean
		tsc.Ts["Post Reg Rejected"] = &tsreject
	}
	// ==================== ÉTAPE 4: INTERPOLATION POST-REGULARIZATION ====================
	if req.Interp != "" && req.Interp != "None" && req.Interp != "none" {
		// Logiquement, tu veux interpoler la série régularisée
		/*
			if !regularizationApplied {
				c.JSON(http.StatusBadRequest, gin.H{
					"error": "interpolation requires regularization to be performed",
				})
				return
			}
		*/
		method, err := getInterpMethod(req.Interp)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		workingTs.Interpolate(method)
		workingTs.Sort_Deltas_Stats()
	}

	c.JSON(http.StatusOK, tsc.ToJSON())
}

// applyCleaning applique la méthode de nettoyage spécifiée
func applyCleaning(ts *timeseries.TimeSeries, method string, min, max, percent, level float64) (timeseries.TimeSeries, timeseries.TimeSeries) {
	switch method {
	case "fixedOutbounds":
		return ts.RemoveOutbounds(&min, &max, "")
	case "outerPercentile":
		return ts.PercCleaning(percent)
	case "lowerPercentile":
		return ts.LowerPercCleaning(percent)
	case "upperPercentile":
		return ts.UpperPercCleaning(percent)
	case "zScore":
		return ts.ZscoreCleaning(level)
	case "peirce":
		return ts.PeirceOutlierRemoval()
	default:
		// Si méthode inconnue, retourner la série inchangée et une série vide de rejetés
		empty := timeseries.TimeSeries{
			Name:       ts.Name + " (no rejection)",
			DataSeries: []timeseries.DataUnit{},
		}
		return *ts, empty
	}
}

// getAggFunc retourne la fonction d'agrégation correspondante
func getAggFunc(aggName string, freq time.Duration) (timeseries.AggFunc, error) {
	switch aggName {
	case "average":
		return timeseries.AggAverage, nil
	case "maximum":
		return timeseries.AggMaximum, nil
	case "minimum":
		return timeseries.AggMinimum, nil
	case "last":
		return timeseries.AggLast, nil
	case "open":
		return timeseries.AggOpen, nil
	case "countValid":
		return timeseries.AggCountValid, nil
	case "median":
		return timeseries.AggMedian, nil
	case "slope":
		return timeseries.AggSlope, nil
	case "integral":
		return timeseries.AggIntegral(freq), nil
	case "incrementalCounter":
		return timeseries.AggIncrementalCounter(), nil
	default:
		return nil, fmt.Errorf("unknown aggregation function: %s", aggName)
	}
}

// getInterpMethod mappe le string venant du front vers l'InterpolationMethod
func getInterpMethod(name string) (timeseries.InterpolationMethod, error) {
	switch name {
	case "", "None", "none":
		return timeseries.InterpNone, nil
	case "Linear":
		return timeseries.InterpLinear, nil
	case "Nearest":
		return timeseries.InterpNearest, nil
	case "ForwardFill":
		return timeseries.InterpForwardFill, nil
	case "BackwardFill":
		return timeseries.InterpBackwardFill, nil
	case "LogLinear":
		return timeseries.InterpLogLinear, nil
	case "CubicSpline":
		return timeseries.InterpCubicSpline, nil
	case "MonotoneSpline":
		return timeseries.InterpMonotoneSpline, nil
	default:
		return timeseries.InterpNone, fmt.Errorf("unknown interpolation method: %s", name)
	}
}
