package timeseries

import (
	"log"
	"math"
	"time"
)

func (ts *TimeSeries) Regularize(freq time.Duration, agg AggFunc, tolerance int) TimeSeries {

	var out TimeSeries
	if len(ts.DataSeries) == 0 {
		return out
	}

	// tri chronologique (au cas où)
	ts.SortChronAsc()

	// point de départ aligné
	datemin := ts.DataSeries[0].Chron
	start := RoundedStartTimeII(datemin, freq)
	if datemin.Equal(start) {
		// assure une première fenêtre couvrant le premier point
		start = datemin.Add(-freq)
	}

	// fin de fenêtre courante (bord supérieur inclus dans tes tests)
	windowEnd := start.Add(freq)

	i := 0
	for {
		// 1) Collecter les points dans la fenêtre courante [prevEnd, windowEnd]
		sum := 0.0
		var local []float64
		local = nil

		for i < len(ts.DataSeries) && !ts.DataSeries[i].Chron.After(windowEnd) {
			sum += ts.DataSeries[i].Meas
			local = append(local, ts.DataSeries[i].Meas)
			i++
		}

		// 2) Sortie pour la fenêtre courante
		if len(local) > 0 {
			var du DataUnit
			du.Chron = windowEnd
			du.Meas = agg(local)
			out.AddDataUnit(du)
		}

		// 3) Avancer aux fenêtres suivantes.
		// S'il n'y a plus de données à venir, on s'arrête (pas de NaN de traîne).
		if i >= len(ts.DataSeries) {
			break
		}

		// Tant que le prochain point est au-delà de la *fenêtre suivante* (avec tolérance),
		// insérer des NaN et continuer d’avancer.
		for {
			nextEnd := windowEnd.Add(freq)
			nextEndTol := windowEnd.Add(freq)

			// si le prochain point tombe *dans* la prochaine fenêtre (<= nextEndTol), on passe à cette fenêtre
			if !ts.DataSeries[i].Chron.After(nextEndTol) {
				windowEnd = nextEnd
				break
			}

			// sinon, la fenêtre est vide -> NaN
			du := DataUnit{Chron: nextEnd, Meas: math.NaN()}
			out.AddDataUnit(du)

			// avancer encore d'une fenêtre et re-tester
			windowEnd = nextEnd
		}
	}

	return out
}
func (ts *TimeSeries) Reduce() TimeSeries {
	var out TimeSeries
	if len(ts.DataSeries) == 0 {
		return out
	}
	ts.SortChronAsc()
	for i := 0; i < len(ts.DataSeries); i++ {
		if ts.DataSeries[i].Dmeas != 0.000000000 {
			out.AddDataUnit(ts.DataSeries[i])
		}
	}
	if len(out.DataSeries) == 0 {
		out.AddDataUnit(ts.DataSeries[len(ts.DataSeries)-1])
	}
	return out
}

// Truncate a datetime to the closest beginning of time frequence but below. Ancillary to resampling methods.
func RoundedStartTime(timetoround time.Time, afreqq int, aper string) time.Time {
	roundedtime := time.Now()
	switch aper {
	case "m":
		roundedtime = timetoround.Truncate(time.Minute * time.Duration(afreqq))
	case "s":
		roundedtime = timetoround.Truncate(time.Second * time.Duration(afreqq))
	case "h":
		roundedtime = timetoround.Truncate(time.Hour * time.Duration(afreqq))
	case "d":
		roundedtime = timetoround.AddDate(0, 0, -afreqq)
	default:
		roundedtime = timetoround
	}
	return roundedtime
}

func RoundedStartTimeII(timetoround time.Time, per time.Duration) time.Time {
	roundedtime := time.Now()
	roundedtime = timetoround.Truncate(per)
	return roundedtime
}

// Add duration to a given date. The parameter is a string consisting of an integer and one letter ("s" for seconds, "m" for minute, "h" for hour).
// same function than time.Add.
func AddDuration(start time.Time, freq int, per string) time.Time {
	switch per {
	case "s":
		return start.Add(time.Second * time.Duration(freq))
	case "m":
		return start.Add(time.Minute * time.Duration(freq))
	case "h":
		return start.Add(time.Hour * time.Duration(freq))
	default:
		return start
	}
}

// AddDurationTol add a duration plus a tolerance. Tolerance is an int. If the period is in seconds, tolerance is expressed
// in Millisecond. If the period is in Minutes, the tolerance is expressed in Seconds. If the period is in Hours, tolerance
// is expressed in Minutes. So if the regularisation is 30 minutes with a 3 minutes tolerance, 3 minutes should be expressed
// as 180
func AddDurationTol(start time.Time, freq int, per string, tolerance int) time.Time {
	switch per {
	case "s":
		return start.Add(time.Millisecond * time.Duration(freq*1000+tolerance))
	case "m":
		return start.Add(time.Second * time.Duration(freq*60+tolerance))
	case "h":
		return start.Add(time.Minute * time.Duration(freq*60+tolerance))
	default:
		return start
	}
}

// Computation of minimum and maximum without help of external library
func Bounds(xs []float64) (min float64, max float64) {
	if len(xs) == 0.00000000 {
		return 0.0, 0.0 //math.NaN(), math.NaN()
	}
	min, max = xs[0], xs[0]
	for _, x := range xs {
		if x < min {
			min = x
		}
		if x > max {
			max = x
		}
	}
	return
}
func (ts *TimeSeries) HourlyAvg() (hr [24]float64) {
	//tr:=ts.OldRegularize(24,"h","avg",0)
	var hrtemp [24]float64
	var lentemp [24]float64
	for _, val := range ts.DataSeries {
		hrtemp[val.Chron.Hour()] += val.Meas
		lentemp[val.Chron.Hour()] += 1.0
	}
	for key, val := range hrtemp {
		hr[key] = val / lentemp[key]
	}
	return hr
}

// OldRegularize returns a new time series sampled on a fixed interval grid
// defined by period and anchor. Input samples that fall inside each bucket
// are condensed according to agg (e.g., AggMean, AggSum, AggLast). Buckets
// with no valid samples are then post-processed using fill.
//
// The anchor defines the phase of the grid: bucket boundaries are aligned to
// anchor + k*period (for integer k). Typical choices: the start-of-series,
// midnight in a specific location, or Unix epoch aligned to period.
//
// Rules:
//   - Requires strictly increasing Chron (no duplicates). See Align/Dedup.
//   - Only points with Status=StOK contribute to aggregation.
//   - Outliers (StOutlier) are included unless removed upstream.
//   - Missing/invalid points are ignored by the aggregator.
//   - The resulting series is strictly regular and labeled with bucket end
//     (or start) timestamps depending on implementation details.
//
// Errors:
//   - ErrZeroPeriod if period <= 0.
//   - ErrUnsorted if input is not strictly increasing.
//   - ErrAnchorOutOfRange in rare, extreme-domain cases.
func (ts *TimeSeries) OldRegularize(freq int, per string, meth string, tolerance int) TimeSeries {
	// normalisation de l’unité
	switch per {
	case "Seconds", "sec", "s":
		per = "s"
	case "Minutes", "min", "m":
		per = "m"
	case "Hours", "h":
		per = "h"
	default:
		log.Fatal("period not accepted")
	}

	var out TimeSeries
	if len(ts.DataSeries) == 0 {
		return out
	}

	// tri chronologique (au cas où)
	ts.SortChronAsc()

	// point de départ aligné
	datemin := ts.DataSeries[0].Chron
	start := RoundedStartTime(datemin, freq, per)
	if datemin.Equal(start) {
		// assure une première fenêtre couvrant le premier point
		start = AddDuration(datemin, -freq, per)
	}

	// fin de fenêtre courante (bord supérieur inclus dans tes tests)
	windowEnd := AddDurationTol(start, freq, per, 0)

	i := 0
	for {
		// 1) Collecter les points dans la fenêtre courante [prevEnd, windowEnd]
		sum := 0.0
		var local []float64
		local = nil

		for i < len(ts.DataSeries) && !ts.DataSeries[i].Chron.After(windowEnd) {
			sum += ts.DataSeries[i].Meas
			local = append(local, ts.DataSeries[i].Meas)
			i++
		}

		// 2) Sortie pour la fenêtre courante
		if len(local) > 0 {
			var du DataUnit
			du.Chron = windowEnd
			switch meth {
			case "Average", "average", "avg":
				du.Meas, _ = Mean(local)
			case "Maximum", "maximum", "max":
				_, maxv := Bounds(local)
				du.Meas = maxv
			case "Minimum", "minimum", "min":
				minv, _ := Bounds(local)
				du.Meas = minv
			case "Last", "last":
				du.Meas = local[len(local)-1]
			case "Sum", "sum":
				du.Meas = sum
			default:
				du.Meas = 0.0000000001
			}
			out.AddDataUnit(du)
		}

		// 3) Avancer aux fenêtres suivantes.
		// S'il n'y a plus de données à venir, on s'arrête (pas de NaN de traîne).
		if i >= len(ts.DataSeries) {
			break
		}

		// Tant que le prochain point est au-delà de la *fenêtre suivante* (avec tolérance),
		// insérer des NaN et continuer d’avancer.
		for {
			nextEnd := AddDurationTol(windowEnd, freq, per, 0)
			nextEndTol := AddDurationTol(windowEnd, freq, per, tolerance)

			// si le prochain point tombe *dans* la prochaine fenêtre (<= nextEndTol), on passe à cette fenêtre
			if !ts.DataSeries[i].Chron.After(nextEndTol) {
				windowEnd = nextEnd
				break
			}

			// sinon, la fenêtre est vide -> NaN
			du := DataUnit{Chron: nextEnd, Meas: math.NaN()}
			out.AddDataUnit(du)

			// avancer encore d'une fenêtre et re-tester
			windowEnd = nextEnd
		}
	}

	return out
}

// DownscaleMonthly regroupe la série par mois calendaires.
// - Première fenêtre : du 1er jour du mois du premier point à 00:00
// - Pour chaque mois, on calcule agg() sur les valeurs du mois
// - Le timestamp de sortie est mis au *dernier jour du mois* (fin de mois)
// - Les mois sans données produisent un point avec Meas = NaN
func (ts *TimeSeries) DownscaleMonthly(agg AggFunc) TimeSeries {
	var out TimeSeries
	if len(ts.DataSeries) == 0 {
		return out
	}

	// tri chronologique pour être sûr
	ts.SortChronAsc()

	first := ts.DataSeries[0].Chron
	last := ts.DataSeries[len(ts.DataSeries)-1].Chron

	// Début du premier mois : 1er à 00:00:00
	loc := first.Location()
	monthStart := time.Date(first.Year(), first.Month(), 1, 0, 0, 0, 0, loc)

	i := 0
	for !monthStart.After(last) {
		// Début du mois suivant
		nextMonthStart := monthStart.AddDate(0, 1, 0)

		// Collecter toutes les mesures du mois courant:
		// [monthStart, nextMonthStart)
		var local []float64

		for i < len(ts.DataSeries) &&
			!ts.DataSeries[i].Chron.Before(monthStart) &&
			ts.DataSeries[i].Chron.Before(nextMonthStart) {

			local = append(local, ts.DataSeries[i].Meas)
			i++
		}

		// Timestamp de sortie = dernier instant du mois
		monthEnd := nextMonthStart.Add(-time.Nanosecond)

		var du DataUnit
		du.Chron = monthEnd

		if len(local) > 0 {
			du.Meas = agg(local)
		} else {
			// mois vide -> NaN
			du.Meas = math.NaN()
		}

		out.AddDataUnit(du)

		// passer au mois suivant
		monthStart = nextMonthStart
	}

	return out
}

// DownscaleDaily regroupe la série par journées calendaires.
// - Première fenêtre : du début du jour (00:00:00) du premier point
// - Pour chaque jour, on calcule agg() sur les valeurs de ce jour
// - Le timestamp de sortie est mis au *dernier instant du jour* (fin de journée)
// - Les jours sans données produisent un point avec Meas = NaN
func (ts *TimeSeries) DownscaleDaily(agg AggFunc) TimeSeries {
	var out TimeSeries
	if len(ts.DataSeries) == 0 {
		return out
	}

	// tri chronologique pour être sûr
	ts.SortChronAsc()

	first := ts.DataSeries[0].Chron
	last := ts.DataSeries[len(ts.DataSeries)-1].Chron

	// Début du premier jour : 00:00:00
	loc := first.Location()
	dayStart := time.Date(first.Year(), first.Month(), first.Day(), 0, 0, 0, 0, loc)

	i := 0
	for !dayStart.After(last) {
		// Début du jour suivant
		nextDayStart := dayStart.AddDate(0, 0, 1)

		// Collecter toutes les mesures du jour courant:
		// [dayStart, nextDayStart)
		var local []float64

		for i < len(ts.DataSeries) &&
			!ts.DataSeries[i].Chron.Before(dayStart) &&
			ts.DataSeries[i].Chron.Before(nextDayStart) {

			local = append(local, ts.DataSeries[i].Meas)
			i++
		}

		// Timestamp de sortie = dernier instant du jour
		dayEnd := nextDayStart.Add(-time.Nanosecond)

		du := DataUnit{
			Chron: dayEnd,
		}

		if len(local) > 0 {
			du.Meas = agg(local)
		} else {
			// jour vide -> NaN
			du.Meas = math.NaN()
		}

		out.AddDataUnit(du)

		// passer au jour suivant
		dayStart = nextDayStart
	}

	return out
}

// DownscaleYearly regroupe la série par années calendaires.
// - Début : 1er janvier 00:00:00 de la première année trouvée
// - Une fenêtre = une année complète
// - Timestamp résultat = dernier instant de l'année (31/12 23:59:59.999999999)
// - Années sans données -> NaN
func (ts *TimeSeries) DownscaleYearly(agg AggFunc) TimeSeries {
	var out TimeSeries
	if len(ts.DataSeries) == 0 {
		return out
	}

	// Toujours trier pour éviter les surprises
	ts.SortChronAsc()

	first := ts.DataSeries[0].Chron
	last := ts.DataSeries[len(ts.DataSeries)-1].Chron

	loc := first.Location()

	// Début de la première année : 1 janvier 00:00:00
	yearStart := time.Date(first.Year(), 1, 1, 0, 0, 0, 0, loc)

	i := 0
	for !yearStart.After(last) {
		// Début de l'année suivante
		nextYearStart := yearStart.AddDate(1, 0, 0)

		// Collecter toutes les mesures de l'année :
		// [yearStart, nextYearStart)
		var local []float64
		for i < len(ts.DataSeries) &&
			!ts.DataSeries[i].Chron.Before(yearStart) &&
			ts.DataSeries[i].Chron.Before(nextYearStart) {

			local = append(local, ts.DataSeries[i].Meas)
			i++
		}

		// Dernier instant de l'année
		yearEnd := nextYearStart.Add(-time.Nanosecond)

		du := DataUnit{Chron: yearEnd}

		if len(local) > 0 {
			du.Meas = agg(local)
		} else {
			du.Meas = math.NaN()
		}

		out.AddDataUnit(du)

		// Avancer
		yearStart = nextYearStart
	}

	return out
}

// DownscaleWeekly regroupe la série par semaines calendaires "ISO-like" :
// - semaine = [lundi 00:00:00, lundi suivant 00:00:00)
// - début = lundi de la semaine contenant le premier point
// - timestamp de sortie = dernier instant de la semaine (dimanche 23:59:59.999999999)
// - semaines sans données -> Meas = NaN
func (ts *TimeSeries) DownscaleWeekly(agg AggFunc) TimeSeries {
	var out TimeSeries
	if len(ts.DataSeries) == 0 {
		return out
	}

	// tri chronologique pour être sûr
	ts.SortChronAsc()

	first := ts.DataSeries[0].Chron
	last := ts.DataSeries[len(ts.DataSeries)-1].Chron
	loc := first.Location()

	// On part du début de la journée du premier point
	firstDayStart := time.Date(first.Year(), first.Month(), first.Day(), 0, 0, 0, 0, loc)

	// Calcul du lundi de la semaine (style ISO) contenant firstDayStart
	// En Go : Sunday=0, Monday=1, ..., Saturday=6
	wd := firstDayStart.Weekday()
	offsetDays := (int(wd) + 6) % 7 // 0 si lundi, 1 si mardi, ..., 6 si dimanche
	weekStart := firstDayStart.AddDate(0, 0, -offsetDays)

	i := 0
	for !weekStart.After(last) {
		// Début de la semaine suivante
		nextWeekStart := weekStart.AddDate(0, 0, 7)

		// Collecter toutes les mesures de la semaine :
		// [weekStart, nextWeekStart)
		var local []float64
		for i < len(ts.DataSeries) &&
			!ts.DataSeries[i].Chron.Before(weekStart) &&
			ts.DataSeries[i].Chron.Before(nextWeekStart) {

			local = append(local, ts.DataSeries[i].Meas)
			i++
		}

		// Dernier instant de la semaine (dimanche 23:59:59.999999999)
		weekEnd := nextWeekStart.Add(-time.Nanosecond)

		du := DataUnit{Chron: weekEnd}
		if len(local) > 0 {
			du.Meas = agg(local)
		} else {
			du.Meas = math.NaN()
		}
		out.AddDataUnit(du)

		// semaine suivante
		weekStart = nextWeekStart
	}

	return out
}
