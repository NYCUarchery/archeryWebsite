package main

import (
	"backend/internal/config"
	"backend/internal/migration"
	"context"
	"database/sql"
	"flag"
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	mysqlDriver "github.com/go-sql-driver/mysql"
)

func main() {
	root := flag.NewFlagSet("migrate", flag.ExitOnError)
	envFile := root.String("env-file", "", "optional dotenv file")
	root.Parse(os.Args[1:])
	args := root.Args()
	if len(args) == 0 {
		usage()
		os.Exit(2)
	}
	app, err := config.Load(*envFile)
	if err != nil {
		log.Fatal(err)
	}
	if err := validateDatabase(app.Database); err != nil {
		log.Fatal(err)
	}
	db, err := openDB(app.Database)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()
	switch args[0] {
	case "version":
		if len(args) != 1 {
			usage()
			os.Exit(2)
		}
		state, err := migration.ReadVersion(ctx, db)
		if err != nil {
			log.Fatal(err)
		}
		if !state.Managed {
			fmt.Println("unmanaged")
			return
		}
		if state.Empty {
			fmt.Println("unversioned (empty migration metadata)")
			return
		}
		fmt.Printf("version %d dirty=%t\n", state.Version, state.Dirty)
	case "baseline":
		if len(args) != 1 {
			log.Fatal("usage: migrate [--env-file FILE] baseline")
		}
		if err := migration.Baseline(ctx, db); err != nil {
			log.Fatal(err)
		}
		fmt.Println("recorded baseline version 1")
	case "up":
		fs := flag.NewFlagSet("up", flag.ExitOnError)
		to := fs.Uint("to", 0, "target version; default latest")
		statementTimeout := fs.Duration("statement-timeout", migration.DefaultStatementTimeout, "maximum duration for each migration SQL file")
		_ = fs.Parse(args[1:])
		if fs.NArg() != 0 {
			log.Fatal("usage: migrate [--env-file FILE] up [--to N] [--statement-timeout DURATION]")
		}
		if *statementTimeout <= 0 {
			log.Fatal("statement timeout must be positive")
		}
		if err := migration.UpWithTimeout(context.Background(), db, uint(*to), *statementTimeout); err != nil {
			log.Fatal(err)
		}
		fmt.Println("migration complete")
	default:
		usage()
		os.Exit(2)
	}
}

func validateDatabase(cfg config.Database) error {
	for key, value := range map[string]string{"MYSQL_HOST": cfg.Host, "MYSQL_DATABASE": cfg.Name, "MYSQL_USER": cfg.User, "MYSQL_PASSWORD": cfg.Password} {
		if value == "" {
			return fmt.Errorf("%s is required", key)
		}
	}
	return nil
}

func openDB(cfg config.Database) (*sql.DB, error) {
	dsn := buildDSN(cfg)
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, err
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := db.PingContext(ctx); err != nil {
		db.Close()
		return nil, err
	}
	return db, nil
}

func buildDSN(cfg config.Database) string {
	dsn := mysqlDriver.NewConfig()
	dsn.User, dsn.Passwd, dsn.Net, dsn.Addr, dsn.DBName = cfg.User, cfg.Password, "tcp", cfg.Host+":"+strconv.Itoa(cfg.Port), cfg.Name
	dsn.Params = map[string]string{"charset": "utf8mb4"}
	dsn.MultiStatements = true
	dsn.TLSConfig = "skip-verify"
	dsn.Timeout = 10 * time.Second
	return dsn.FormatDSN()
}

func usage() {
	fmt.Fprintln(os.Stderr, "usage: migrate [--env-file FILE] version|baseline|up [--to N] [--statement-timeout DURATION]")
}
