// internal/config/public.go
package config

type PublicReactAuthConfig struct {
	AuthDisabled bool   `json:"authDisabled"`
	AppBasename  string `json:"appBasename"` // ex: "/webtimeseries/"
	KcBaseURL    string `json:"kcBaseUrl"`   // ex: "http://localhost:8080"
	KcRealm      string `json:"kcRealm"`     // ex: "timeseries"
	KcClientID   string `json:"kcClientId"`  // ex: "react-app"
}
