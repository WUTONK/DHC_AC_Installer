package main

import (
	"fmt"
	"log"
	"time"

	"github.com/woozymasta/a2s/pkg/a2s"
)

func main() {
	host := "65.108.176.35"
	port := 8082
	client, err := a2s.New(host, port)
	if err != nil {
		log.Fatalf("new client error: %v", err)
	}
	defer client.Close()

	client.SetBufferSize(2048)
	client.SetDeadlineTimeout(5)

	start := time.Now()
	info, err := client.GetInfo()
	elapsed := time.Since(start)
	if err != nil {
		log.Fatalf("A2S_INFO query failed after %v: %v", elapsed, err)
	}
	fmt.Printf("OK after %v\nName: %s\nGame: %s\nMap: %s\nPlayers: %d/%d\n", elapsed, info.Name, info.Game, info.Map, info.Players, info.MaxPlayers)
}
