go test -coverprofile=coverage.out -cover -coverpkg=../endpoint/...,../database/...,../pkg/...,../response/...,../routers/... ../... ;
go tool cover -func=coverage.out ;
go tool cover -html=coverage.out ;
rm coverage.out ;