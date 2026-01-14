package config

import (
	"errors"
	"strings"
)

type Keycloak struct {
	Issuer   string `json:"KC_ISSUER"`
	JwksURL  string `json:"KC_JWKS_URL"`
	Audience string `json:"KC_AUDIENCE"`
	ClientID string `json:"KC_CLIENT_ID"`
}

func (k Keycloak) Validate() error {
	if strings.TrimSpace(k.Issuer) == "" {
		return errors.New("KC_ISSUER is required")
	}
	if strings.TrimSpace(k.JwksURL) == "" {
		return errors.New("KC_JWKS_URL is required")
	}
	if strings.TrimSpace(k.Audience) == "" {
		return errors.New("KC_AUDIENCE is required")
	}
	// ClientID peut être optionnel selon ton usage, à toi de décider.
	return nil
}
