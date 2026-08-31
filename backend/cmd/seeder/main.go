package main

import (
	"backend/internal/database"
	"backend/internal/endpoint"
	"backend/internal/seeder"
	"flag"
	"fmt"
	"log"
	"os"
)

func main() {
	const scenarioUsage = "registered, qualification_finished, elimination_finished, or all"
	var scenarioFlag string
	flag.StringVar(&scenarioFlag, "scenario", "all", scenarioUsage)
	flag.StringVar(&scenarioFlag, "s", "all", scenarioUsage+" (shorthand)")
	flag.Parse()
	requested, err := requestedScenarios(scenarioFlag)
	if err != nil {
		log.Print(err)
		flag.Usage()
		os.Exit(2)
	}

	mode := endpoint.GetConf("config/db.yaml").Mode
	if mode != "dev" && mode != "test" {
		log.Fatalf("refusing to seed mode %q; the fixed development accounts are only allowed in dev or test", mode)
	}
	// This command is separate from server startup, so normal operation cannot
	// seed. Its initializer never updates an existing Dictator user.
	database.DatabaseInitialForSeeder()

	for _, scenario := range requested {
		result, err := seeder.Seed(database.DB, scenario)
		if err != nil {
			log.Fatalf("seed %s: %v", scenario, err)
		}
		state := "already exists; left unchanged"
		if result.Created {
			state = "created"
		}
		fmt.Printf("%s: competition %d %s (%d items, %d archers)\n", scenario, result.CompetitionID, state, result.Items, result.Players)
	}
}

func requestedScenarios(value string) ([]seeder.Scenario, error) {
	if value == "all" {
		return seeder.AllScenarios(), nil
	}
	scenario, err := seeder.ParseScenario(value)
	if err != nil {
		return nil, err
	}
	return []seeder.Scenario{scenario}, nil
}
