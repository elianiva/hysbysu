package dto

type SendInformationRequest struct {
	Message string `json:"message"`
}

type SendInformationResponse struct {
	Message string `json:"message"`
}
