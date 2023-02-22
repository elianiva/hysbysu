package internal

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

type Config struct {
	SiakadUrl        string
	SlcUrl           string
	LmsUrl           string
	NIM              string
	Password         string
	CWD              string
	ScrapeInterval   time.Duration
	DiscordToken     string
	DiscordChannelId string
	TimeZone         *time.Location
	ServerPort       string
}

const (
	SIAKAD_URL         = "SIAKAD_URL"
	SLC_URL            = "SLC_URL"
	LMS_URL            = "LMS_URL"
	NIM                = "NIM"
	PASSWORD           = "PASSWORD"
	SCRAPE_INTERVAL    = "SCRAPE_INTERVAL"
	DISCORD_TOKEN      = "DISCORD_TOKEN"
	DISCORD_CHANNEL_ID = "DISCORD_CHANNEL_ID"
	SERVER_PORT        = "SERVER_PORT"
)

func LoadConfig() (config Config, err error) {
	siakadUrl := os.Getenv(SIAKAD_URL)
	if siakadUrl == "" {
		err = fmt.Errorf("please provide %s", SIAKAD_URL)
		return
	}

	slcUrl := os.Getenv(SLC_URL)
	if slcUrl == "" {
		err = fmt.Errorf("please provide %s", SLC_URL)
		return
	}

	lmsUrl := os.Getenv(LMS_URL)
	if lmsUrl == "" {
		err = fmt.Errorf("please provide %s", LMS_URL)
		return
	}

	nim := os.Getenv(NIM)
	if nim == "" {
		err = fmt.Errorf("please provide %s", NIM)
		return
	}

	password := os.Getenv(PASSWORD)
	if password == "" {
		err = fmt.Errorf("please provide %s", PASSWORD)
		return
	}

	cwd, err := os.Getwd()
	if err != nil {
		return
	}

	interval := os.Getenv(SCRAPE_INTERVAL)
	if interval == "" {
		err = fmt.Errorf("please provide %s", SCRAPE_INTERVAL)
		return
	}
	scrapeInterval, err := strconv.Atoi(interval)
	if err != nil {
		return
	}

	discordToken := os.Getenv(DISCORD_TOKEN)
	if discordToken == "" {
		err = fmt.Errorf("please provide %s", DISCORD_TOKEN)
		return
	}

	discordChannelId := os.Getenv(DISCORD_CHANNEL_ID)
	if discordChannelId == "" {
		err = fmt.Errorf("please provide %s", DISCORD_CHANNEL_ID)
		return
	}

	location := "Asia/Jakarta"
	timezone, err := time.LoadLocation(location)
	if err != nil {
		err = fmt.Errorf("failed to load timezone %s", location)
		return
	}

	serverPort := os.Getenv(SERVER_PORT)
	if serverPort == "" {
		serverPort = "4000"
	}

	config = Config{
		SiakadUrl:        siakadUrl,
		SlcUrl:           slcUrl,
		LmsUrl:           lmsUrl,
		NIM:              nim,
		Password:         password,
		CWD:              cwd,
		ScrapeInterval:   time.Duration(scrapeInterval) * time.Millisecond,
		DiscordToken:     discordToken,
		DiscordChannelId: discordChannelId,
		TimeZone:         timezone,
		ServerPort:       serverPort,
	}

	return
}
