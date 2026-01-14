# VARIANTE AUTH

## 1) UI

cd tsconditioner_platform/vite-tsconditioner
npm run build:noauth

## 2) Serveur Go

cd tsconditioner_platform/go_tsconditioner
go build -tags noauth -o ../../tsconditioner_platform/dist/noauth/server ./cmd/server



# VARIANTE NOAUTH

## 1) UI

cd tsconditioner_platform/vite-tsconditioner
npm run build:noauth

## 2) Serveur Go

cd tsconditioner_platform/go_tsconditioner
go build -tags noauth -o ../../tsconditioner_platform/dist/noauth/server ./cmd/server

# BASH

cd tsconditioner_platform
chmod +x build.sh
./build.sh noauth
./build.sh auth

#PS1

cd tsconditioner_platform
.\build.ps1 -variant noauth
.\build.ps1 -variant auth