FROM golang:1.21

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

RUN go mod tidy
COPY . .
RUN go build -o main .

EXPOSE 8080
# ENTRYPOINT [ "sleep" , "infinity" ]
ENTRYPOINT ["./main"]