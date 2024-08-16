FROM golang:1.22.5-alpine AS build

WORKDIR /src

COPY ./go.mod ./go.sum ./
RUN go mod download

COPY *.go ./

RUN CGO_ENABLED=0 GOOS=linux go build -o /app .


FROM alpine:3.20.2

COPY --from=build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=build /app /app

EXPOSE 4005

ENTRYPOINT ["/app"]
