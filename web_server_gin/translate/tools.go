package translate

import (
	"strconv"

	"github.com/gin-gonic/gin"
)

func convert2int(c *gin.Context, name string) int {
	dataStr := c.Param(name)
	data, _ := strconv.Atoi(dataStr)

	return data
}

func convert2bool(c *gin.Context, name string) bool {
	dataStr := c.Param(name)

	data, _ := strconv.ParseBool(dataStr)
	return data
}
