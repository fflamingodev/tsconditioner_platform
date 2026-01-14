package dboperations

import (
	"fmt"
	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
	"go_tsconditioner/internal/config"
	"log"
	"time"
)

func ConnectDB(cfg *config.PGConfig) (*sqlx.DB, error) {

	// ✅ 3) Construire le DSN
	dsn := fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=disable connect_timeout=5",
		cfg.PGHost, cfg.PGPort, cfg.PGUser, cfg.PGPassword, cfg.PGDatabase,
	)

	// ✅ 4) Ouvrir la connexion
	db, err := sqlx.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("DB open échoué: %w", err)
	}

	// ✅ 5) Pool de connexions
	db.SetConnMaxLifetime(5 * time.Minute)
	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(5)

	// ✅ 6) Test de disponibilité
	if err := db.Ping(); err != nil {
		db.Close()
		return nil, fmt.Errorf("PostgreSQL INDISPONIBLE: %w", err)
	}

	log.Println("\033[34m✅ PostgreSQL prêt\033[0m")
	return db, nil
}
