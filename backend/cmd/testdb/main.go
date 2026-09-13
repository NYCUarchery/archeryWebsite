// testdb manages a disposable database assigned by scripts/test.sh. It is not
// a development or production database administration command.
package main

import (
	"backend/internal/database"
	"flag"
	"fmt"
	"log"
	"os"
)

func main() {
	reset := flag.NewFlagSet("reset", flag.ContinueOnError)
	reset.SetOutput(os.Stderr)
	fixture := reset.String("fixture", "", "empty, legacy, or accounts")

	if len(os.Args) < 2 || os.Args[1] != "reset" {
		usage()
		os.Exit(2)
	}
	if err := reset.Parse(os.Args[2:]); err != nil {
		os.Exit(2)
	}
	if *fixture == "" || reset.NArg() != 0 {
		log.Print("reset requires --fixture empty|legacy|accounts")
		os.Exit(2)
	}
	if err := database.ResetTestDatabase(*fixture); err != nil {
		log.Printf("testdb reset: %v", err)
		os.Exit(1)
	}
	fmt.Printf("reset complete (%s)\n", *fixture)
}

func usage() {
	fmt.Fprintln(os.Stderr, "usage: testdb reset --fixture empty|legacy|accounts")
}
