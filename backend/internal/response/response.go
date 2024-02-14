package response

type ErrorResponse struct {
	Error string `json:"error" example:"error description"`
}

type DeleteSuccessResponse struct {
	Message string `json:"message" example:"Delete ID(1) : sth delete success"`
}

type DeleteFailedResponse struct {
	Message string `json:"message" example:"Delete ID(1) : sth delete failed"`
}

type ErrorReceiveDataResponse struct {
	Error string `json:"error" example:"bad request data ID(1): sth error"`
}

type ErrorReceiveDataFormatResponse struct {
	Error string `json:"error" example:"bad request data: sth error"`
}

type ErrorReceiveDataNilResponse struct {
	Error string `json:"error" example:"bad request data is nil ID(1): sth error"`
}

type ErrorIdResponse struct {
	Error string `json:"error" example:"invalid ID(1) : sth error"`
}

type ErrorInternalErrorResponse struct {
	Error string `json:"error" example:"sth need fix ID(1) : sth error"`
}
