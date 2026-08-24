package routers

import (
	"testing"

	"github.com/gin-gonic/gin"
)

func TestControlRoutesAreRegistered(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	AddApiRouter(router.Group("/api"))

	routes := make(map[string]bool)
	for _, route := range router.Routes() {
		routes[route.Method+" "+route.Path] = true
	}

	for _, route := range []string{
		"PATCH /api/competition/current-phase/:id",
		"PATCH /api/competition/current-phase/plus/:id",
		"PATCH /api/competition/current-phase/minus/:id",
		"PATCH /api/elimination/progress/:id",
		"PATCH /api/elimination/currentstage/plus/:id",
		"PATCH /api/elimination/currentstage/minus/:id",
		"PATCH /api/elimination/currentend/plus/:id",
		"PATCH /api/elimination/currentend/minus/:id",
	} {
		if !routes[route] {
			t.Errorf("missing control route %s", route)
		}
	}
}
