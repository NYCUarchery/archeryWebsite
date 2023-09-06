## Setup
```console
$ go get github.com/gin-contrib/sessions
$ go get github.com/gin-contrib/sessions/cookie
$ go get gorm.io/gorm
```

## Secret File
### model Secret
- path: ./model/secret.go
```go
package model

const DBuser string = "db_username"
const DBpasswd string = "db_password"
const DBip string = "127.0.0.1"
const DBport string = "3306"
const DBname string = "db_name"
```

### pkg secret
- path: ./pkg/secret.go
```go
package pkg

const SessionKey = "session_key"
```