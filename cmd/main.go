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

	done := make(chan struct{}, 1)
	errorChannel := make(chan error, 1)

	for {
		log.Println("scraping...")
		scraper.Scrape(config, client, done, errorChannel)
		log.Println("done scraping!")

		if err := <-errorChannel; err != nil {
			log.Fatalf("failed to scrape. reason: %v", err)
		}

		<-done
	}
}
