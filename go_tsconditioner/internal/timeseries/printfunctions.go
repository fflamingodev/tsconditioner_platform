package timeseries

import (
	"fmt"
	"os"
	"text/tabwriter"
)

type Series interface {
	PrettyPrint()
}

func (tsc *TsContainer) PrettyPrint(what ...int) {
	for k, v := range tsc.Ts {
		if v != nil {
			fmt.Printf("Container: %v\n", tsc.Name)
			fmt.Println("-------------------------------------------------")
			fmt.Printf("TimeSeries: %v\n", k)
			v.PrintTsStats()
			v.PrettyPrint(what...)
		}
	}
}

// --- DataUnit pretty print helpers ---

// writeRow écrit uniquement la ligne de données pour un DataUnit
// dans le tabwriter passé en argument (pas d'entêtes).
func (du *DataUnit) writeRow(w *tabwriter.Writer) {
	fmt.Fprintf(w, "%v|\t%v|\t%v|\t%v|\t%v|\t%v|\t\n",
		formatFloat(du.Meas),      // Measurement
		du.Chron.Round(0),         // Chron
		formatFloat(du.Meas),      // Measure
		formatDuration(du.Dchron), // Dchron
		formatFloat(du.Dmeas),     // Dmeas
		du.Status,                 // Status (StatusCode.String() si Stringer)
	)
}

// PrettyPrint prints DataUnit as readable form to Terminal
func (du *DataUnit) PrettyPrint() {
	w := new(tabwriter.Writer)
	w.Init(os.Stdout, 5, 0, 3, ' ', tabwriter.AlignRight)

	// En-têtes
	fmt.Fprintf(w, "%s|\t%v|\t%v|\t%v|\t%v|\t%v\t\n",
		"Measurement", "Chron", "Measure", "Dchron", "Dmeas", "Status")
	fmt.Fprintln(w, "------------|\t--------------------------------------|\t----------|\t------------|\t------------|\t------------|\t")

	// Ligne de données
	du.writeRow(w)

	fmt.Fprintln(w)
	w.Flush()
}

// --- TimeSeries pretty print ---

// PrettyPrint prints a TimeSeries in a more ordered way in output terminal
// what ...int :
//   - 0 arg  -> tout
//   - 1 arg  -> de 0 à what[0]
//   - 2 args -> de what[0] à what[1]
func (ts *TimeSeries) PrettyPrint(what ...int) {
	fmt.Printf("Name       : %v\n", ts.Name)
	fmt.Printf("Time Series Identification: %v\n", ts.Comment)
	fmt.Println("----------------------------------------------------------------------------------------------------------------------")

	// Détermination du range [j, k)
	var j, k int
	switch len(what) {
	case 0:
		j = 0
		k = len(ts.DataSeries)
	case 1:
		j = 0
		k = what[0]
	case 2:
		j = what[0]
		k = what[1]
	default:
		j = 0
		k = len(ts.DataSeries)
	}

	if j < 0 {
		j = 0
	}
	if k > len(ts.DataSeries) {
		k = len(ts.DataSeries)
	}
	if j >= k || len(ts.DataSeries) == 0 {
		fmt.Println("(TimeSeries vide ou indices hors bornes)")
		return
	}

	w := new(tabwriter.Writer)
	w.Init(os.Stdout, 5, 0, 3, ' ', tabwriter.AlignRight)

	// Ici on ajoute une colonne "index" devant les colonnes du DataUnit
	fmt.Fprintf(w, "%v|\t%v|\t%v|\t%v|\t%v|\t%v|\t%v|\t\n",
		"index", "Measurement", "Chron", "Measure", "Dchron", "Dmeas", "Status")
	fmt.Fprintln(w, "-----|\t------------|\t--------------------------------------|\t----------|\t------------|\t------------|\t------------|\t")

	for i := j; i < k; i++ {
		du := &ts.DataSeries[i]
		// index + ligne du DataUnit
		fmt.Fprintf(w, "%d|\t", i)
		du.writeRow(w)
	}

	fmt.Fprintln(w)
	w.Flush()
}

// PrintTsStats prints TsStats struct in a readable way in output terminal
func (ts *TimeSeries) PrintTsStats() {
	fmt.Println("------------------------------------------")
	fmt.Println(ts.Name)
	fmt.Printf("Warning: %v Missing Data\n", ts.NbreOfNaN)
	w := new(tabwriter.Writer)
	w.Init(os.Stdout, 5, 0, 3, ' ', tabwriter.AlignRight)
	fmt.Fprintf(w, "Length| %v|\t\n", ts.Len)
	fmt.Fprintln(w, "\tChron|\tMeasure|\tDChron|\tDMeas|\t")
	fmt.Fprintln(w, "-\t-----------------\t------------\t------------\t------------\t")
	fmt.Fprintf(w, "Min|\t %v|\t%v|\t%v|\t%v|\t\n", ts.Chmin.Round(0), ts.Msmin, ts.DChmin, ts.DMsmin)
	fmt.Fprintf(w, "Max|\t %v|\t%v|\t%v|\t%v|\t\n", ts.Chmax.Round(0), ts.Msmax, ts.DChmax, ts.DMsmax)
	fmt.Fprintf(w, "Mean|\t %v|\t%v|\t%v|\t%v|\t\n", ts.Chmean, ts.Msmean, ts.DChmean, ts.DMsmean)
	fmt.Fprintf(w, "Median|\t %v|\t%v|\t%v|\t%v|\t\n", ts.Chmed, ts.Msmean, ts.DChmed, ts.DMsmed)
	fmt.Fprintf(w, "StdDev|\t %v|\t%v|\t%v|\t%v|\t\n", " ", ts.Msstd, ts.DChstd, ts.DMsstd)

	fmt.Fprintln(w)
	w.Flush()

}
func (ts *TimeSeries) PrettyPrintAll() {
	ts.PrettyPrint()
	ts.PrintTsStats()
}
