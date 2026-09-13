package routers

import (
	"net/http"
	"net/http/httptest"
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
		"GET /api/groupinfo/players/ranking/:groupId",
		"PATCH /api/groupinfo/players/ranking/:groupId",
		"POST /api/elimination/bracket/:id",
		"POST /api/elimination/stage/advance/:stageid",
		"POST /api/playerset/elimination/:eliminationid/auto",
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

func TestRestoreRouteIsAbsentInEveryGinMode(t *testing.T) {
	for _, mode := range []string{gin.DebugMode, gin.ReleaseMode, gin.TestMode} {
		t.Run(mode, func(t *testing.T) {
			gin.SetMode(mode)
			router := gin.New()
			AddApiRouter(router.Group("/api"))

			recorder := httptest.NewRecorder()
			router.ServeHTTP(recorder, httptest.NewRequest(http.MethodPut, "/api/test/restore", nil))
			if recorder.Code != http.StatusNotFound {
				t.Fatalf("restore route in %s returned %d, want 404", mode, recorder.Code)
			}
		})
	}
}
