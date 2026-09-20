package main

import (
	"testing"

	"github.com/gin-gonic/gin"
)

func TestSetupGinMode(t *testing.T) {
	previous := gin.Mode()
	t.Cleanup(func() { gin.SetMode(previous) })
	for environment, want := range map[string]string{
		"production":  gin.ReleaseMode,
		"development": gin.DebugMode,
		"test":        gin.TestMode,
	} {
		t.Run(environment, func(t *testing.T) {
			SetupGinMode(environment)
			if got := gin.Mode(); got != want {
				t.Fatalf("SetupGinMode(%q) = %q, want %q", environment, got, want)
			}
		})
	}
}
