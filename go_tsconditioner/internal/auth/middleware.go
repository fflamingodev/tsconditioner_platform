package auth

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/MicahParks/keyfunc/v2"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type Config struct {
	Issuer   string
	JwksURL  string
	Audience string // optionnel si tu veux vérifier aud strictement
	ClientID string // pour lire resource_access[client].roles
}

type KeycloakClaims struct {
	jwt.RegisteredClaims

	RealmAccess struct {
		Roles []string `json:"roles"`
	} `json:"realm_access"`

	ResourceAccess map[string]struct {
		Roles []string `json:"roles"`
	} `json:"resource_access"`
}

type Verifier struct {
	cfg  Config
	jwks *keyfunc.JWKS
}

func NewVerifier(cfg Config) (*Verifier, error) {
	if cfg.Issuer == "" || cfg.JwksURL == "" {
		return nil, errors.New("missing KC config: issuer or jwks url")
	}

	jwks, err := keyfunc.Get(cfg.JwksURL, keyfunc.Options{
		RefreshInterval:   time.Hour,
		RefreshRateLimit:  time.Minute,
		RefreshTimeout:    10 * time.Second,
		RefreshUnknownKID: true,
	})
	if err != nil {
		return nil, err
	}

	return &Verifier{cfg: cfg, jwks: jwks}, nil
}

func (v *Verifier) RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		raw := c.GetHeader("Authorization")
		tokenStr, err := extractBearer(raw)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"ok": false, "error": "missing bearer token"})
			return
		}

		claims := &KeycloakClaims{}
		tok, err := jwt.ParseWithClaims(tokenStr, claims, v.jwks.Keyfunc,
			jwt.WithValidMethods([]string{"RS256", "RS384", "RS512", "ES256", "ES384", "ES512"}),
			jwt.WithIssuer(v.cfg.Issuer),
		)
		if err != nil || tok == nil || !tok.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"ok": false, "error": "invalid token"})
			return
		}

		// Vérification audience (si tu veux strict)
		if v.cfg.Audience != "" && !audContains(claims.Audience, v.cfg.Audience) {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"ok": false, "error": "bad audience"})
			return
		}

		roles := extractRoles(claims, v.cfg.ClientID)

		// Mise à disposition pour la suite
		c.Set("jwt_claims", claims)
		c.Set("roles", roles)

		c.Next()
	}
}

func (v *Verifier) RequireRoles(anyOf ...string) gin.HandlerFunc {
	required := make(map[string]struct{}, len(anyOf))
	for _, r := range anyOf {
		required[r] = struct{}{}
	}

	return func(c *gin.Context) {
		val, ok := c.Get("roles")
		if !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"ok": false, "error": "no roles in context"})
			return
		}
		roles, ok := val.([]string)
		if !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"ok": false, "error": "roles type mismatch"})
			return
		}

		if !hasAnyRole(roles, required) {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"ok": false, "error": "forbidden"})
			return
		}

		c.Next()
	}
}

func extractBearer(h string) (string, error) {
	if h == "" {
		return "", errors.New("empty")
	}
	parts := strings.SplitN(h, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return "", errors.New("not bearer")
	}
	return strings.TrimSpace(parts[1]), nil
}

func audContains(aud jwt.ClaimStrings, want string) bool {
	for _, a := range aud {
		if a == want {
			return true
		}
	}
	return false
}

func extractRoles(claims *KeycloakClaims, clientID string) []string {
	out := make([]string, 0, 16)

	// realm roles
	out = append(out, claims.RealmAccess.Roles...)

	// client roles
	if clientID != "" {
		if ra, ok := claims.ResourceAccess[clientID]; ok {
			out = append(out, ra.Roles...)
		}
	}

	// dédup simple
	seen := make(map[string]struct{}, len(out))
	dedup := out[:0]
	for _, r := range out {
		if r == "" {
			continue
		}
		if _, ok := seen[r]; ok {
			continue
		}
		seen[r] = struct{}{}
		dedup = append(dedup, r)
	}
	return dedup
}

func hasAnyRole(userRoles []string, required map[string]struct{}) bool {
	for _, r := range userRoles {
		if _, ok := required[r]; ok {
			return true
		}
	}
	return false
}
