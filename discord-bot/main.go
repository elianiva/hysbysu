package main

import (
	"hysbysu_discord_bot/dto"
	"log"
	"net/http"
	"os"
	"os/signal"

	"github.com/gofiber/fiber/v2"

	_ "github.com/joho/godotenv/autoload"
)

func main() {

	apiSecret := os.Getenv("NOTIFICATION_API_SECRET")
	if len(apiSecret) < 1 {
		log.Fatal("NOTIFICATION_API_SECRET can't be empty!")
	}

	discordToken := os.Getenv("DISCORD_TOKEN")
	if len(discordToken) < 1 {
		log.Fatal("DISCORD_TOKEN can't be empty!")
	}

	discordChannelId := os.Getenv("DISCORD_CHANNEL_ID")
	if len(discordChannelId) < 1 {
		log.Fatal("DISCORD_CHANNEL_ID can't be empty!")
	}

	bot, err := NewDiscordBot(discordToken, discordChannelId)
	if err != nil {
		log.Fatalf("failed to initialise discord bot, reason: %v", err)
	}

	app := fiber.New()
	app.Get("/", checkHealthHandler)

	api := app.Group("/api", apiSecretMiddleware(apiSecret))
	api.Post("/send-info", sendInfoHandler(bot))
	api.Post("/send-error", sendErrorHandler(bot))
	api.Post("/send-notification", sendNotificationHandler(bot))

	exitSignal := make(chan os.Signal, 1)
	signal.Notify(exitSignal, os.Interrupt)

	go func() {
		log.Println("Starting http server...")
		err := app.Listen(":3000")
		if err != nil {
			log.Fatal(err)
		}
	}()

	<-exitSignal
}

func checkHealthHandler(ctx *fiber.Ctx) error {
	return ctx.JSON(dto.HealthcheckResponse{
		Message: "OK",
	})
}

func apiSecretMiddleware(apiSecret string) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		apiKey := ctx.Get("X-Api-Key", "")
		if apiKey == "" {
			err := ctx.Status(http.StatusUnauthorized).JSON(dto.UnauthorisedResponse{
				Message: "Please provide an API key through the X-Api-Key header",
			})
			if err != nil {
				return err
			}
			return nil
		}

		if apiKey != apiSecret {
			err := ctx.Status(http.StatusUnauthorized).JSON(dto.UnauthorisedResponse{
				Message: "Invalid API key was provided",
			})
			if err != nil {
				return err
			}
			return nil
		}

		return ctx.Next()
	}
}

func sendInfoHandler(bot *discordBot) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		payload := new(dto.SendInformationRequest)
		err := ctx.BodyParser(payload)
		if err != nil {
			err := ctx.Status(http.StatusInternalServerError).JSON(dto.SendInformationResponse{
				Message: "failed to decode the payload",
			})
			if err != nil {
				return err
			}
			return nil
		}

		err = bot.SendInfo(payload.Message)
		if err != nil {
			err := ctx.Status(http.StatusInternalServerError).JSON(dto.SendInformationResponse{
				Message: "failed to send the information",
			})
			if err != nil {
				return err
			}
			return nil
		}

		err = ctx.JSON(dto.SendInformationResponse{
			Message: "information has been sent successfully",
		})
		if err != nil {
			return err
		}

		return nil
	}
}

func sendErrorHandler(bot *discordBot) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		payload := new(dto.SendErrorRequest)
		err := ctx.BodyParser(payload)
		if err != nil {
			err := ctx.Status(http.StatusInternalServerError).JSON(dto.SendErrorResponse{
				Message: "failed to decode the payload",
			})
			if err != nil {
				return err
			}
			return nil
		}

		err = bot.SendError(payload.Message)
		if err != nil {
			err := ctx.Status(http.StatusInternalServerError).JSON(dto.SendErrorResponse{
				Message: "failed to send the error message",
			})
			if err != nil {
				return err
			}
			return nil
		}

		err = ctx.JSON(dto.SendErrorResponse{
			Message: "error message has been sent successfully",
		})
		if err != nil {
			return err
		}

		return nil
	}
}

func sendNotificationHandler(bot *discordBot) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		payload := new(dto.SendNotificationRequest)
		err := ctx.BodyParser(payload)
		if err != nil {
			err := ctx.Status(http.StatusInternalServerError).JSON(dto.SendNotificationResponse{
				Message: "failed to decode the payload",
			})
			if err != nil {
				return err
			}
			return nil
		}

		err = bot.SendNotification(payload.Subject)
		if err != nil {
			err := ctx.Status(http.StatusInternalServerError).JSON(dto.SendNotificationResponse{
				Message: "failed to send the notification",
			})
			if err != nil {
				return err
			}
			return nil
		}

		err = ctx.JSON(dto.SendNotificationResponse{
			Message: "notification has been sent successfully",
		})
		if err != nil {
			return err
		}

		return nil
	}
}
