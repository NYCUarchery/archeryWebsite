package database

import (
	"encoding/json"
	"strings"
	"testing"
)

func TestMatchResultOmitsUnknownPlayerSetID(t *testing.T) {
	pending, err := json.Marshal(MatchResult{MatchId: 1})
	if err != nil {
		t.Fatal(err)
	}
	if strings.Contains(string(pending), "player_set_id") {
		t.Fatalf("pending result exposes player_set_id: %s", pending)
	}

	playerSetID := uint(9)
	assigned, err := json.Marshal(MatchResult{MatchId: 1, PlayerSetId: &playerSetID})
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(string(assigned), "\"player_set_id\":9") {
		t.Fatalf("assigned result omits player_set_id: %s", assigned)
	}
}
