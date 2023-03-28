package dto

type SendErrorRequest struct {
	Message string `json:"message"`
}

type SendErrorResponse struct {
	Message string `json:"message"`
}
