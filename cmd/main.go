package main

import (
	"hysbysu/internal"
	"hysbysu/presentation"
	"log"

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

	doneCh := make(chan struct{}, 1)
	errorCh := make(chan error, 1)

	for {
		log.Println("scraping...")
		go scraper.Scrape(config, client, doneCh, errorCh)

		if err := <-errorCh; err != nil {
			log.Fatalf("failed to scrape. reason: %v", err)
		}

		<-doneCh
	}
}
