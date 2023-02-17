package main

import (
	"context"
	"hysbysu/internal"
	"hysbysu/presentation"
	"log"
	"os"
	"os/signal"
	"time"

	_ "github.com/joho/godotenv/autoload"
)

func main() {
	config, err := internal.LoadConfig()
	if err != nil {
		log.Fatalf("failed to load config. reason: %v", err)
	}

	client, err := internal.NewClient(config)
	if err != nil {
		log.Fatalf("failed to initialise a new http client. reason: %v", err)
	}

	collector := internal.NewCollector(config, client)
	bot, err := presentation.NewDiscordBot(config)
	if err != nil {
		log.Fatalf("failed to initialise a new discord bot client. reason: %v", err)
	}

	scraper := internal.NewScraper(config, client, collector, bot)

	server, err := presentation.NewServer(config)
	if err != nil {
		log.Fatalf("failed to initialise a new web server. reason: %v", err)
	}

	exitSignal := make(chan os.Signal, 1)
	signal.Notify(exitSignal, os.Interrupt)

	go func() {
		defer func() {
			err := recover()
			if err != nil {
				log.Printf("recovered: %v", err)
			}
		}()
		scraper.RunScraper()
	}()

	go func() {
		log.Println("starting http server...")
		if err := server.Start(); err != nil {
			log.Fatal(err)
		}
	}()

	<-exitSignal

	ctx, cancel := context.WithTimeout(context.Background(), time.Minute)
	defer cancel()

	log.Println("shutting down...")
	scraper.Shutdown(ctx)
	server.Shutdown(ctx)
}
