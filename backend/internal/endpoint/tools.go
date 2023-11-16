package endpoint

import (
	"strconv"

	"github.com/gin-gonic/gin"
)

func convert2uint(c *gin.Context, name string) uint {
	dataStr := c.Param(name)
	data, err := strconv.Atoi(dataStr)
	if err != nil {
		return 0 // 或者返回適當的錯誤
	}
	if data < 0 {
		return 0
	}
	return uint(data)
}

func convert2int(c *gin.Context, name string) int {
	dataStr := c.Param(name)
	data, err := strconv.Atoi(dataStr)
	if err != nil {
		return 0 // 或者返回適當的錯誤
	}
	return data
}

func convert2bool(c *gin.Context, name string) bool {
	dataStr := c.Param(name)

	data, _ := strconv.ParseBool(dataStr)
	return data
}
