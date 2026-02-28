# Stage 1: Build the binary
FROM golang:1.26-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o main .

# Stage 2: Run the binary
FROM alpine:latest
WORKDIR /root/

# Copy the binary
COPY --from=builder /app/main .

# COPY the views folder from the builder stage
COPY --from=builder /app/views ./views

CMD ["./main"]