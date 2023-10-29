package translate

import (
	"net/http"

	"github.com/gin-gonic/gin"
)



func GetHTML(c *gin.Context) {
	c.HTML(http.StatusOK, "index.html", nil)
}
