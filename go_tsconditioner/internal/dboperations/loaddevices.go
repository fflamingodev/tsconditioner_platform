package dboperations

import (
	"fmt"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"go_tsconditioner/internal/types"
	"log"
	_ "modernc.org/sqlite"
	"sort"
)

type deviceDatasourceRow struct {
	Device     uuid.UUID `db:"device"`
	Serial     string    `db:"serial"` // ✅ NON nullable
	DataSource string    `db:"datasource"`
}

func LoadDevicesWithDataSourcesRemote(remoteDB *sqlx.DB) ([]types.Device, error) {

	// 1) Charger depuis Telemetry (PostgreSQL)
	const selectQ = `
		SELECT DISTINCT device, serial, datasource
		FROM "Telemetry"
		WHERE device IS NOT NULL
		  AND datasource IS NOT NULL
		  AND time >= now() - interval '1 day'
		ORDER BY device, datasource;
	`

	var rows []deviceDatasourceRow
	if err := remoteDB.Select(&rows, selectQ); err != nil {
		log.Printf("❌ Erreur SELECT in Telemetry (LoadDevicesWithDataSourcesRemote): %v", err)
		return nil, err
	}

	// 2) Ouvrir la DB SQLite fichier
	sqlitePath := "alldatasources.sqlite"
	dsn := fmt.Sprintf("file:%s?_busy_timeout=5000&_journal_mode=WAL", sqlitePath)

	sqliteDB, err := sqlx.Open("sqlite", dsn)
	if err != nil {
		return nil, fmt.Errorf("open sqlite db (%s): %w", sqlitePath, err)
	}
	defer sqliteDB.Close()

	// Optionnel mais recommandé : ping
	if err := sqliteDB.Ping(); err != nil {
		return nil, fmt.Errorf("ping sqlite db (%s): %w", err)
	}

	// 4) Transaction SQLite
	tx, err := sqliteDB.Beginx()
	if err != nil {
		return nil, fmt.Errorf("begin sqlite transaction: %w", err)
	}
	committed := false
	defer func() {
		if !committed {
			_ = tx.Rollback()
		}
	}()

	// 5) Vider datasources
	if _, err := tx.Exec(`DELETE FROM datasources`); err != nil {
		return nil, fmt.Errorf("delete datasources (sqlite): %w", err)
	}

	// 6) Repeupler livedevices
	// SQLite: placeholders "?" (sqlx les gère très bien)
	const insertQ = `
		INSERT INTO datasources (device, serial, datasource)
		VALUES (?, ?, ?)
	`

	stmt, err := tx.Preparex(insertQ)
	if err != nil {
		return nil, fmt.Errorf("prepare insert (sqlite): %w", err)
	}
	defer stmt.Close()

	for _, r := range rows {
		// device est un uuid.UUID -> on le stocke en TEXT
		if _, err := stmt.Exec(r.Device.String(), r.Serial, r.DataSource); err != nil {
			return nil, fmt.Errorf(
				"insert livedevices (device=%s, datasource=%s): %w",
				r.Device, r.DataSource, err,
			)
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("commit sqlite transaction: %w", err)
	}
	committed = true

	log.Printf("✅ datasources refreshed in sqlite (%d rows) -> %s", len(rows), sqlitePath)

	// 7) Construire la sortie []types.Device (inchangé)
	byDevice := make(map[uuid.UUID]*types.Device, len(rows))
	seenDS := make(map[uuid.UUID]map[string]struct{}, len(rows))

	for _, r := range rows {
		dev, ok := byDevice[r.Device]
		if !ok {
			dev = &types.Device{
				DeviceID:    r.Device,
				DeviceName:  r.Serial,
				DataSources: []types.DataSource{},
			}
			byDevice[r.Device] = dev
			seenDS[r.Device] = make(map[string]struct{})
		}

		if _, exists := seenDS[r.Device][r.DataSource]; !exists {
			dev.DataSources = append(dev.DataSources, types.DataSource{Name: r.DataSource})
			seenDS[r.Device][r.DataSource] = struct{}{}
		}
	}

	out := make([]types.Device, 0, len(byDevice))
	for _, d := range byDevice {
		sort.Slice(d.DataSources, func(i, j int) bool {
			return d.DataSources[i].Name < d.DataSources[j].Name
		})
		out = append(out, *d)
	}

	sort.Slice(out, func(i, j int) bool {
		return out[i].DeviceID.String() < out[j].DeviceID.String()
	})

	return out, nil
}

// La fonction OUVRE elle-même alldatasources.sqlite puis appelle la logique
func LoadDevicesWithDataSourcesLocal(sqlitePath string) ([]types.Device, error) {

	const driverName = "sqlite"

	db, err := sqlx.Open(driverName, sqlitePath)
	if err != nil {
		return nil, fmt.Errorf("open sqlite db %q: %w", sqlitePath, err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("ping sqlite db %q: %w", sqlitePath, err)
	}

	const q = `
		SELECT DISTINCT device, serial, datasource
		FROM datasources
		WHERE device IS NOT NULL
		  AND datasource IS NOT NULL
		ORDER BY device, datasource;
	`

	var rows []deviceDatasourceRow
	if err := db.Select(&rows, q); err != nil {
		log.Printf("❌ Erreur SELECT in datasources (LoadDevicesWithDataSourcesFromAllDataSourcesDB): %v", err)
		return nil, err
	}

	byDevice := make(map[uuid.UUID]*types.Device, len(rows))
	seenDS := make(map[uuid.UUID]map[string]struct{}, len(rows))

	for _, r := range rows {
		dev, ok := byDevice[r.Device]
		if !ok {
			dev = &types.Device{
				DeviceID:    r.Device,
				DeviceName:  r.Serial,
				DataSources: []types.DataSource{},
			}
			byDevice[r.Device] = dev
			seenDS[r.Device] = make(map[string]struct{})
		}

		if _, exists := seenDS[r.Device][r.DataSource]; !exists {
			dev.DataSources = append(dev.DataSources, types.DataSource{Name: r.DataSource})
			seenDS[r.Device][r.DataSource] = struct{}{}
		}
	}

	out := make([]types.Device, 0, len(byDevice))
	for _, d := range byDevice {
		sort.Slice(d.DataSources, func(i, j int) bool {
			return d.DataSources[i].Name < d.DataSources[j].Name
		})
		out = append(out, *d)
	}

	sort.Slice(out, func(i, j int) bool {
		return out[i].DeviceID.String() < out[j].DeviceID.String()
	})

	return out, nil
}
func LoadDevicesWithDataSourcesLocalOld(db *sqlx.DB) ([]types.Device, error) {
	var q string
	q = `
			SELECT DISTINCT device, serial, datasource
			FROM "livedevices"
			ORDER BY device, datasource;
		`
	var rows []deviceDatasourceRow
	if err := db.Select(&rows, q); err != nil {
		log.Printf("❌ Erreur SELECT in Telemetry (LoadDevicesWithDataSourcesLocal): %v", err)
		return nil, err
	}

	byDevice := make(map[uuid.UUID]*types.Device, len(rows))
	seenDS := make(map[uuid.UUID]map[string]struct{}, len(rows))

	for _, r := range rows {
		dev, ok := byDevice[r.Device]
		if !ok {
			dev = &types.Device{
				DeviceID:    r.Device,
				DeviceName:  r.Serial,
				DataSources: []types.DataSource{},
			}
			byDevice[r.Device] = dev
			seenDS[r.Device] = make(map[string]struct{})
		}

		if _, exists := seenDS[r.Device][r.DataSource]; !exists {
			dev.DataSources = append(dev.DataSources, types.DataSource{
				Name: r.DataSource,
			})
			seenDS[r.Device][r.DataSource] = struct{}{}
		}
	}

	// map → slice + tri
	out := make([]types.Device, 0, len(byDevice))
	for _, d := range byDevice {
		sort.Slice(d.DataSources, func(i, j int) bool {
			return d.DataSources[i].Name < d.DataSources[j].Name
		})
		out = append(out, *d)
	}

	sort.Slice(out, func(i, j int) bool {
		return out[i].DeviceID.String() < out[j].DeviceID.String()
	})

	return out, nil
}

func LoadDevicesWithDataSourcesRemoteOld(remoteDB *sqlx.DB, localDB *sqlx.DB) ([]types.Device, error) {

	// 1) Charger depuis Telemetry
	const selectQ = `
		SELECT DISTINCT device, serial, datasource
		FROM "Telemetry"
		WHERE device IS NOT NULL
			AND datasource IS NOT NULL
			AND time >= now() - interval '1 day'
		ORDER BY device, datasource;
	`

	var rows []deviceDatasourceRow
	if err := remoteDB.Select(&rows, selectQ); err != nil {
		log.Printf("❌ Erreur SELECT in Telemetry (LoadDevicesWithDataSourcesRemote): %v", err)
		return nil, err
	}

	// 2) Transaction pour livedevices
	tx, err := localDB.Beginx()
	if err != nil {
		return nil, fmt.Errorf("begin transaction: %w", err)
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	// 3) Vider livedevices
	if _, err = tx.Exec(`DELETE FROM "datasources"`); err != nil {
		return nil, fmt.Errorf("delete livedevices: %w", err)
	}

	// 4) Repeupler livedevices
	const insertQ = `
		INSERT INTO "datasources" (device, serial, datasource)
		VALUES ($1, $2, $3)
	`

	for _, r := range rows {
		if _, err = tx.Exec(insertQ, r.Device, r.Serial, r.DataSource); err != nil {
			return nil, fmt.Errorf(
				"insert livedevices (device=%s, datasource=%s): %w",
				r.Device, r.DataSource, err,
			)
		}
	}

	if err = tx.Commit(); err != nil {
		return nil, fmt.Errorf("commit transaction: %w", err)
	}

	log.Printf("✅ livedevices refreshed (%d rows)", len(rows))

	// 5) Construire la sortie []types.Device (à partir de rows)
	byDevice := make(map[uuid.UUID]*types.Device, len(rows))
	seenDS := make(map[uuid.UUID]map[string]struct{}, len(rows))

	for _, r := range rows {
		dev, ok := byDevice[r.Device]
		if !ok {
			dev = &types.Device{
				DeviceID:    r.Device,
				DeviceName:  r.Serial,
				DataSources: []types.DataSource{},
			}
			byDevice[r.Device] = dev
			seenDS[r.Device] = make(map[string]struct{})
		}

		if _, exists := seenDS[r.Device][r.DataSource]; !exists {
			dev.DataSources = append(dev.DataSources, types.DataSource{
				Name: r.DataSource,
			})
			seenDS[r.Device][r.DataSource] = struct{}{}
		}
	}

	// 6) map → slice + tri
	out := make([]types.Device, 0, len(byDevice))
	for _, d := range byDevice {
		sort.Slice(d.DataSources, func(i, j int) bool {
			return d.DataSources[i].Name < d.DataSources[j].Name
		})
		out = append(out, *d)
	}

	sort.Slice(out, func(i, j int) bool {
		return out[i].DeviceID.String() < out[j].DeviceID.String()
	})

	return out, nil
}
