package dboperations

import (
	"context"
	"database/sql"
	"math"

	"github.com/jmoiron/sqlx"
	"go_tsconditioner/internal/timeseries"
)

// DBTimeSeriesMeta contient tout ce qui doit aller dans la table timeseries,
// en plus de ce qui est déjà dans timeseries.TimeSeries (Name, MemId).
type DBTimeSeriesMeta struct {
	Device      string
	Serial      sql.NullString
	Datasource  string
	FreqSeconds sql.NullInt64
	Agg         sql.NullString

	Method1  sql.NullString
	Min1     sql.NullFloat64
	Max1     sql.NullFloat64
	Percent1 sql.NullFloat64
	Lvl1     sql.NullFloat64
	Method2  sql.NullString
	Min2     sql.NullFloat64
	Max2     sql.NullFloat64
	Percent2 sql.NullFloat64
	Lvl2     sql.NullFloat64
	Interp   sql.NullString
}

// SaveTimeSeries insère une TimeSeries dans la table timeseries,
// puis toutes ses observations dans dataunits, dans une transaction.
// Elle renvoie l'ID de la ligne timeseries créée.
func SaveTimeSeries(
	ctx context.Context,
	db *sqlx.DB,
	ts *timeseries.TimeSeries,
	meta DBTimeSeriesMeta,
) (int64, error) {
	// 1) Démarrer une transaction
	tx, err := db.BeginTxx(ctx, &sql.TxOptions{})
	if err != nil {
		return 0, err
	}

	defer func() {
		// Si on sort avec une erreur sans avoir fait Commit, on rollback.
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	// 2) Insérer dans timeseries et récupérer l'id
	var tsID int64

	// IMPORTANT : adapter la liste des colonnes si tu ajoutes/enlèves des champs
	insertTsSQL := `
        INSERT INTO timeseries (
            name,
            device,
            serial,
            datasource,
            freq_seconds,
            agg,
            method1,
            min1,
            max1,
            percent1,
            lvl1,
            method2,
            min2,
            max2,
            percent2,
            lvl2,
            interp
        )
        VALUES (
            $1,  -- name
            $2,  -- device
            $3,  -- serial
            $4,  -- datasource
            $5,  -- freq_seconds
            $6,  -- agg
            $7,  -- method1
            $8,  -- min1
            $9, -- max1
            $10, -- percent1
            $11, -- lvl1
            $12, -- method2
            $13, -- min2
            $14, -- max2
            $15, -- percent2
            $16, -- lvl2
            $17  -- interp
        )
        RETURNING id;
    `
	err = tx.QueryRowContext(
		ctx,
		insertTsSQL,
		ts.Name,
		meta.Device,
		meta.Serial,
		meta.Datasource,
		meta.FreqSeconds,
		meta.Agg,
		meta.Method1,
		meta.Min1,
		meta.Max1,
		meta.Percent1,
		meta.Lvl1,
		meta.Method2,
		meta.Min2,
		meta.Max2,
		meta.Percent2,
		meta.Lvl2,
		meta.Interp,
	).Scan(&tsID)
	if err != nil {
		return 0, err
	}

	// 3) Préparer l'insert pour dataunits
	insertDuSQL := `
        INSERT INTO dataunits (
            timeseries_id,
            chron,
            meas,
            status
        ) VALUES ($1, $2, $3, $4);
    `

	stmt, err := tx.PrepareContext(ctx, insertDuSQL)
	if err != nil {
		return 0, err
	}
	defer stmt.Close()

	// 4) Boucler sur les DataUnit
	for _, du := range ts.DataSeries {
		// Meas peut être NaN, et tu veux probablement que ce soit NULL en DB
		var meas *float64
		if !math.IsNaN(du.Meas) {
			meas = &du.Meas
		} else {
			meas = nil // => NULL en DB
		}

		// StatusCode est un uint8 ; on le cast vers SMALLINT
		status := int16(du.Status)

		if _, err = stmt.ExecContext(ctx, tsID, du.Chron, meas, status); err != nil {
			return 0, err
		}
	}

	// 5) Commit si tout s’est bien passé
	if err = tx.Commit(); err != nil {
		return 0, err
	}

	return tsID, nil
}
