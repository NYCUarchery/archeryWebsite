# swagger advices
* link : https://github.com/swaggo/swag

## debug methods
* to show where is going wrong and run the server 
** $ swag init --parseDependency=true
** $ swag init -g main.go --parseDependency --output docs/

## others 
* swag formating comment : swag fmt

## templates of api
:::info api v1
// ListAccounts lists all existing accounts
//
//  @Summary      List accounts
//  @Description  get accounts
//  @Tags         accounts
//  @Accept       json
//  @Produce      json
//  @Param        q    query     string  false  "name search by q"  Format(email)
//  @Success      200  {array}   model.Account
//  @Failure      400  {object}  httputil.HTTPError
//  @Failure      404  {object}  httputil.HTTPError
//  @Failure      500  {object}  httputil.HTTPError
//  @Router       /accounts [get]
:::
:::info api v2 
// @Summary 說Hello
// @Id 1
// @Tags Hello
// @version 1.0
// @produce text/plain
// @Success 200 string string 成功後返回的值
// @Router /hello [get]
func GetHello(ctx *gin.Context) {...}
:::

:::info main 
// @title           Swagger Example API
// @version         1.0
// @description     This is a sample server celler server.
// @termsOfService  http://swagger.io/terms/

// @contact.name   API Support
// @contact.url    http://www.swagger.io/support
// @contact.email  support@swagger.io

// @license.name  Apache 2.0
// @license.url   http://www.apache.org/licenses/LICENSE-2.0.html

// @host      localhost:8080
// @BasePath  /api/v1

// @securityDefinitions.basic  BasicAuth

// @externalDocs.description  OpenAPI
// @externalDocs.url          https://swagger.io/resources/open-api/
:::