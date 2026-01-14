package config

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// Si ta config sait se valider, elle peut implémenter ça.
type Validator interface {
	Validate() error
}

// LoadConfigGeneric applique la stratégie “cascade” :
//  1. si filename est absolu -> utiliser tel quel
//  2. sinon, essayer à côté de l'exe : <exeDir>/<filename>
//  3. sinon, essayer dans le working directory : <cwd>/<filename>
//  4. sinon, retourner une erreur détaillée
//
// - defaultFilename est utilisé si filename est vide/whitespace.
// - strict=true active DisallowUnknownFields().
// - Si T implémente Validator, Validate() est appelé après decode.
func LoadConfigGeneric[T any](filename, defaultFilename string, strict bool) (T, error) {
	var cfg T

	filename = strings.TrimSpace(filename)
	if filename == "" {
		filename = strings.TrimSpace(defaultFilename)
		if filename == "" {
			return cfg, errors.New("config filename is empty and no defaultFilename provided")
		}
	}

	candidates, meta, err := candidatePaths(filename)
	if err != nil {
		return cfg, err
	}

	var tries []triedPath

	for _, p := range candidates {
		b, readErr := os.ReadFile(p)
		if readErr != nil {
			tries = append(tries, triedPath{Label: labelFor(meta, p), Path: p, Err: readErr})
			continue
		}

		dec := json.NewDecoder(strings.NewReader(string(b)))
		if strict {
			dec.DisallowUnknownFields()
		}

		if err := dec.Decode(&cfg); err != nil {
			var zero T
			return zero, fmt.Errorf("parse json %q: %w", p, err)
		}

		// Validation optionnelle si T implémente Validator
		if v, ok := any(cfg).(Validator); ok {
			if err := v.Validate(); err != nil {
				var zero T
				return zero, fmt.Errorf("invalid config %q: %w", p, err)
			}
		}

		return cfg, nil
	}

	var zero T
	return zero, fmt.Errorf(
		"config file %q not found/readable.\nexe=%q\nexeDir=%q\ncwd=%q\ntried:\n%s",
		filename,
		meta.ExePath,
		meta.ExeDir,
		meta.Cwd,
		formatTries(tries),
	)
}

type triedPath struct {
	Label string
	Path  string
	Err   error
}

type pathMeta struct {
	ExePath string
	ExeDir  string
	Cwd     string
}

func candidatePaths(filename string) ([]string, pathMeta, error) {
	var meta pathMeta

	exe, err := os.Executable()
	if err != nil {
		return nil, meta, fmt.Errorf("os.Executable: %w", err)
	}
	meta.ExePath = exe
	meta.ExeDir = filepath.Dir(exe)

	cwd, err := os.Getwd()
	if err != nil {
		return nil, meta, fmt.Errorf("os.Getwd: %w", err)
	}
	meta.Cwd = cwd

	// 1) Absolu : une seule tentative
	if filepath.IsAbs(filename) {
		return []string{filepath.Clean(filename)}, meta, nil
	}

	// 2) ExeDir, puis 3) Cwd
	pExe := filepath.Join(meta.ExeDir, filename)
	pCwd := filepath.Join(meta.Cwd, filename)

	// Évite doublons si exeDir == cwd
	if samePath(pExe, pCwd) {
		return []string{pExe}, meta, nil
	}
	return []string{pExe, pCwd}, meta, nil
}

func samePath(a, b string) bool {
	aa := filepath.Clean(a)
	bb := filepath.Clean(b)
	// Sur macOS/Linux c'est suffisant. (Sur Windows, on pourrait normaliser casse/volume.)
	return aa == bb
}

func labelFor(meta pathMeta, p string) string {
	if strings.HasPrefix(filepath.Clean(p), filepath.Clean(meta.ExeDir)+string(os.PathSeparator)) ||
		filepath.Clean(p) == filepath.Clean(filepath.Join(meta.ExeDir, filepath.Base(p))) {
		return "exeDir"
	}
	if strings.HasPrefix(filepath.Clean(p), filepath.Clean(meta.Cwd)+string(os.PathSeparator)) ||
		filepath.Clean(p) == filepath.Clean(filepath.Join(meta.Cwd, filepath.Base(p))) {
		return "cwd"
	}
	if filepath.IsAbs(p) {
		return "absolute"
	}
	return "candidate"
}

func formatTries(tries []triedPath) string {
	if len(tries) == 0 {
		return "  (none)\n"
	}
	var sb strings.Builder
	for _, t := range tries {
		sb.WriteString("  - ")
		sb.WriteString(t.Label)
		sb.WriteString(": ")
		sb.WriteString(t.Path)
		if t.Err != nil {
			sb.WriteString(" (")
			sb.WriteString(t.Err.Error())
			sb.WriteString(")")
		}
		sb.WriteString("\n")
	}
	return sb.String()
}
