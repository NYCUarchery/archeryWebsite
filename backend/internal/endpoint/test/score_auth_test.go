//go:build integration

package endpoint

import (
	"backend/internal/pkg"
	"bytes"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
)

func newScoreTestRouter(t *testing.T) *gin.Engine {
	t.Helper()
	router := gin.New()
	router.Use(pkg.EnableCookieSessionMiddleware(pkg.SessionConfig{Key: "score-integration-test-key"}))
	router.POST("/_test/session/:userID", func(context *gin.Context) {
		userID, err := strconv.ParseUint(context.Param("userID"), 10, 64)
		if err != nil || userID == 0 {
			context.Status(http.StatusBadRequest)
			return
		}
		session := sessions.Default(context)
		session.Set("userid", uint(userID))
		session.Set("username", "integration-score-user")
		if err := session.Save(); err != nil {
			context.Status(http.StatusInternalServerError)
			return
		}
		context.Status(http.StatusNoContent)
	})
	return router
}

func authenticatedScoreRequest(router *gin.Engine, userID uint, method, path string, body []byte) *http.Request {
	login := httptest.NewRecorder()
	router.ServeHTTP(login, httptest.NewRequest(http.MethodPost, "/_test/session/"+uintString(userID), nil))
	if login.Code != http.StatusNoContent || len(login.Result().Cookies()) != 1 {
		panic("test session setup failed")
	}
	request := httptest.NewRequest(method, path, bytes.NewReader(body))
	request.AddCookie(login.Result().Cookies()[0])
	return request
}

func uintString(value uint) string { return strconv.FormatUint(uint64(value), 10) }
func intString(value int) string   { return strconv.Itoa(value) }
