package dto

import "hysbysu_discord_bot/models"

type SendNotificationRequest struct {
	Subject models.Subject `json:"subject"`
}

type SendNotificationResponse struct {
	Message string `json:"message"`
}
