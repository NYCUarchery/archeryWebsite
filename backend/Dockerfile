FROM golang:1.23

RUN apt-get update && apt-get install -y sqlite3 libsqlite3-dev
WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

RUN export GIN_MODE=test

RUN go mod tidy
COPY . .
RUN go build -o main .

EXPOSE 80
# ENTRYPOINT [ "sleep" , "infinity" ]
ENTRYPOINT ["./main"]