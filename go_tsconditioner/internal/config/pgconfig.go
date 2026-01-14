package config

import (
	"errors"
	"fmt"
	"strings"
)

type PGConfig struct {
	PGHost     string `json:"PGHOST"`
	PGPort     int    `json:"PGPORT"`
	PGUser     string `json:"PGUSER"`
	PGPassword string `json:"PGPASSWORD"`
	PGDatabase string `json:"PGDATABASE"`
	PGSSLMode  string `json:"PGSSLMODE"`
}

func (c PGConfig) Validate() error {
	if strings.TrimSpace(c.PGHost) == "" {
		return errors.New("PGHOST is required")
	}
	if c.PGPort <= 0 || c.PGPort > 65535 {
		return fmt.Errorf("PGPORT must be 1..65535, got %d", c.PGPort)
	}
	if strings.TrimSpace(c.PGUser) == "" {
		return errors.New("PGUSER is required")
	}
	if strings.TrimSpace(c.PGPassword) == "" {
		return errors.New("PGPASSWORD is required")
	}
	if strings.TrimSpace(c.PGDatabase) == "" {
		return errors.New("PGDATABASE is required")
	}
	if strings.TrimSpace(c.PGSSLMode) == "" {
		return errors.New("PGSSLMODE is required")
	}
	return nil
}
