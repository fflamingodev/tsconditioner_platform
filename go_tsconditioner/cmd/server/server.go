package main

import (
	"fmt"
	"go_tsconditioner/internal/config"
	"io/fs"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"

	"go_tsconditioner/internal/auth"
	"go_tsconditioner/internal/authswitch"
	"go_tsconditioner/internal/dboperations"
	"go_tsconditioner/internal/routeshandlers"
	staticreact "go_tsconditioner/ui/static-react"
)

func main() {
	gin.SetMode(gin.ReleaseMode)
	router := gin.Default()

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://localhost:5174", "https://www.usefulrisk.com", "https://usefulrisk.com", "http://localhost:8080"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// -------------------- EMBED REACT DIST --------------------
	const spaBaseURL = "/webtimeseries"
	sub, err := fs.Sub(staticreact.TimeSeriesDist, "timeseries-dist")
	if err != nil {
		log.Fatalf("fs.Sub(embed) failed: %v", err)
	}
	spaFS := http.FS(sub)

	// /webtimeseries -> /webtimeseries/
	router.GET(spaBaseURL, func(c *gin.Context) {
		c.Redirect(http.StatusMovedPermanently, spaBaseURL+"/")
	})

	// Sert le dist (assets, favicon, etc.) sous /webtimeseries/*
	router.StaticFS(spaBaseURL, spaFS)

	// Fallback SPA : si /webtimeseries/* n'est pas un fichier existant, renvoyer index.html
	router.NoRoute(func(c *gin.Context) {
		if strings.HasPrefix(c.Request.URL.Path, spaBaseURL) {
			f, err := spaFS.Open("index.html")
			if err != nil {
				c.String(http.StatusInternalServerError, "index.html introuvable dans le binaire")
				return
			}
			defer f.Close()

			stat, err := f.Stat()
			if err != nil {
				c.String(http.StatusInternalServerError, "index.html illisible")
				return
			}

			c.DataFromReader(http.StatusOK, stat.Size(), "text/html; charset=utf-8", f, nil)
			return
		}
		c.AbortWithStatus(http.StatusNotFound)
	})

	// -------------------- CONFIG FILES (EXTERNES) ---------------------------

	localpg, err := config.LoadConfigGeneric[config.PGConfig](
		"",                  // filename (vide -> prend le défaut)
		"config_local.json", // defaultFilename
		true,                // strict: DisallowUnknownFields
	)

	localpgconn, err := dboperations.ConnectDB(&localpg)
	if err != nil {
		log.Fatalf("Erreur de connexion DB: %v", err)
	}
	defer localpgconn.Close()

	remotepg, err := config.LoadConfigGeneric[config.PGConfig](
		"",                   // filename (vide -> prend le défaut)
		"config_remote.json", // defaultFilename
		true,                 // strict: DisallowUnknownFields
	)
	start := time.Now().UTC()
	remotepgconn, err := dboperations.ConnectDB(&remotepg)
	if err != nil {
		log.Fatalf("Erreur de connexion DB: %v", err)
	}
	defer remotepgconn.Close()

	devices, err := dboperations.LoadDevicesWithDataSourcesLocal("../../data/alldatasources.sqlite")
	if err != nil {
		log.Fatalf("Impossible de charger la liste des devices au démarrage: %v", err)
	}
	// Routes publiques
	router.GET("/timeseries/homecards/:page", routeshandlers.HomeCards())
	router.POST(spaBaseURL+"timeseries/bulksimul", routeshandlers.BulkSimulator)

	// -------------------------- AUTH (optionnelle) --------------------------

	enabled := authswitch.Enabled()

	var verifier *auth.Verifier
	if enabled {
		kc, err := config.LoadConfigGeneric[config.Keycloak](
			"config_keycloak.json",
			"config_keycloak.json",
			true,
		)
		if err != nil {
			log.Fatalf("❌ Impossible de charger config_keycloak.json: %v", err)
		}

		v, err := auth.NewVerifier(auth.Config{
			Issuer:   kc.Issuer,
			JwksURL:  kc.JwksURL,
			Audience: kc.Audience,
			ClientID: kc.ClientID,
		})
		if err != nil {
			log.Fatalf("❌ verifier init failed: %v", err)
		}
		verifier = v
	}

	// -------------------------- ROUTES API ----------------------------------

	// Ces routes doivent exister dans tous les cas.
	restricted := router.Group("/timeseries")

	// Si auth activée : on met RequireAuth sur tout /timeseries/*
	if enabled {
		restricted.Use(verifier.RequireAuth())
	}

	// READ group : ouvert en noauth, protégé par rôles en auth
	read := restricted.Group("")
	if enabled {
		read.Use(verifier.RequireRoles("readonly", "readwrite"))
	}

	read.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"ok":      true,
			"scope":   "restricted",
			"message": "accès autorisé",
			"time":    time.Now().UTC(),
		})
	})

	read.GET("/report/latest", routeshandlers.LastSeenPoints_json(remotepgconn))
	read.POST("/polishing", routeshandlers.Polishing)
	read.POST("/remotedata", routeshandlers.OneDeviceOneDataSource(remotepgconn))
	read.POST("/getdatasources", routeshandlers.ListDataSources(remotepgconn))
	read.GET("/getdevices", func(c *gin.Context) { c.JSON(http.StatusOK, devices) })
	read.GET("/today/:device", routeshandlers.TodayContainer(remotepgconn, &devices))
	read.GET("/refreshdevices", routeshandlers.RefreshDevicesDB(remotepgconn))

	// WRITE group : ouvert en noauth, protégé readwrite en auth
	write := restricted.Group("")
	if enabled {
		write.Use(verifier.RequireRoles("readwrite"))
	}
	elapsed := time.Since(start)
	log.Printf("⏱️ Temps écoulé depuis start : %v", elapsed)

	fmt.Println("Go server 9006 est en cours de lancement...")
	if err := router.Run(":9006"); err != nil {
		log.Println(err)
	}
}
