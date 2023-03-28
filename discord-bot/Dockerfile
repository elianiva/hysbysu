FROM golang:1.19.2-alpine3.15 as build

WORKDIR /app

COPY go.mod go.sum ./

RUN go mod download -x

COPY . .

RUN CGO_ENABLED=0 go build -o bin/hysbysu .

FROM alpine:3.15

WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata

COPY --from=build /app/bin/hysbysu ./

EXPOSE 3000

ENTRYPOINT [ "/app/hysbysu" ]