package pkg

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	. "backend/internal/pkg"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	. "github.com/smartystreets/goconvey/convey"
)

func setmockRouterWithSession(t *testing.T) (*gin.Context, *gin.Engine, *httptest.ResponseRecorder) {
	writer := httptest.NewRecorder()
	context, server := gin.CreateTestContext(writer)
	server.Use(EnableCookieSessionMiddleware(SessionConfig{Key: "test-key"}))
	return context, server, writer
}

func TestEnableCookieSessionMiddleware(t *testing.T) {
	Convey("Test EnableCookieSessionMiddleware is really enable the session", t, func() {
		context, server, writer := setmockRouterWithSession(t)
		test_content := "test"
		server.GET("/test", func(c *gin.Context) {
			session := sessions.Default(c)
			session.Set("username", test_content)
			session.Save()
			content := session.Get("username")
			c.JSON(200, gin.H{"message": content})
		})
		req := httptest.NewRequestWithContext(context, http.MethodGet, "/test", nil)
		server.ServeHTTP(writer, req)
		So(writer.Code, ShouldEqual, 200)
		So(writer.Body.String(), ShouldEqual, fmt.Sprintf("{\"message\":\"%s\"}", test_content))
	})
}

func TestIsAuthenticated(t *testing.T) {
	Convey("Test IsAuthenticated check authenticated", t, func() {
		context, server, writer := setmockRouterWithSession(t)
		server.Use(func(c *gin.Context) {
			session := sessions.Default(c)
			session.Set("username", "test")
			session.Save()
			c.Next()
		})
		server.GET("/test", func(c *gin.Context) {
			if IsAuthenticated(c) {
				c.JSON(200, gin.H{"message": "authenticated"})
			} else {
				c.JSON(401, gin.H{"message": "not authenticated"})
			}
		})
		req := httptest.NewRequestWithContext(context, http.MethodGet, "/test", nil)
		server.ServeHTTP(writer, req)
		So(writer.Code, ShouldEqual, 200)
		So(writer.Body.String(), ShouldEqual, "{\"message\":\"authenticated\"}")
	})
	Convey("Test IsAuthenticated check not authenticated", t, func() {
		context, server, writer := setmockRouterWithSession(t)
		server.Use(func(c *gin.Context) {
			session := sessions.Default(c)
			session.Clear()
			session.Save()
			c.Next()
		})
		server.GET("/test", func(c *gin.Context) {
			if IsAuthenticated(c) {
				c.JSON(200, gin.H{"message": "authenticated"})
			} else {
				c.JSON(401, gin.H{"message": "not authenticated"})
			}
		})
		req := httptest.NewRequestWithContext(context, http.MethodGet, "/test", nil)
		server.ServeHTTP(writer, req)
		So(writer.Code, ShouldEqual, 401)
		So(writer.Body.String(), ShouldEqual, "{\"message\":\"not authenticated\"}")
	})
}

// AuthSessionMiddleware
// SaveAuthSession
// UpdateAuthSession
// ClearAuthSession
// QuerySession
