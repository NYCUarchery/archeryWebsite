// Package docs Code generated by swaggo/swag. DO NOT EDIT
package docs

import "github.com/swaggo/swag"

const docTemplate = `{
    "schemes": {{ marshal .Schemes }},
    "swagger": "2.0",
    "info": {
        "description": "{{escape .Description}}",
        "title": "{{.Title}}",
        "contact": {
            "name": "NYCU archery",
            "url": "https://github.com/NYCUarchery",
            "email": "???"
        },
        "license": {
            "name": "Apache 2.0",
            "url": "http://www.apache.org/licenses/LICENSE-2.0.html"
        },
        "version": "{{.Version}}"
    },
    "host": "{{.Host}}",
    "basePath": "{{.BasePath}}",
    "paths": {
        "/competitioin/": {
            "post": {
                "description": "create a competition and set the person as the host",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "competitioin"
                ],
                "summary": "create a competition",
                "parameters": [
                    {
                        "type": "string",
                        "description": "competition name",
                        "name": "name",
                        "in": "formData",
                        "required": true
                    },
                    {
                        "type": "string",
                        "description": "date",
                        "name": "date",
                        "in": "formData",
                        "required": true
                    },
                    {
                        "type": "string",
                        "description": "a list of categories",
                        "name": "categories",
                        "in": "formData",
                        "required": true
                    },
                    {
                        "type": "string",
                        "description": "overview",
                        "name": "overview",
                        "in": "formData"
                    },
                    {
                        "type": "string",
                        "description": "organization",
                        "name": "organization",
                        "in": "formData"
                    },
                    {
                        "type": "string",
                        "description": "Scoreboard URL",
                        "name": "scoreboardURL",
                        "in": "formData"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "success",
                        "schema": {
                            "$ref": "#/definitions/model.CompResponse"
                        }
                    },
                    "400": {
                        "description": "competition name exists | cannot parse date string | invalid info",
                        "schema": {
                            "$ref": "#/definitions/model.Response"
                        }
                    },
                    "500": {
                        "description": "DB error",
                        "schema": {
                            "$ref": "#/definitions/model.Response"
                        }
                    }
                }
            }
        },
        "/competitioin/{id}": {
            "get": {
                "description": "get info, categories, participants of the competition",
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "competitioin"
                ],
                "summary": "get information of the competition",
                "parameters": [
                    {
                        "type": "integer",
                        "description": "competition id",
                        "name": "id",
                        "in": "path",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "success",
                        "schema": {
                            "$ref": "#/definitions/model.CompInfoResponse"
                        }
                    },
                    "400": {
                        "description": "empty/invalid competition id",
                        "schema": {
                            "$ref": "#/definitions/model.Response"
                        }
                    },
                    "404": {
                        "description": "no competition found",
                        "schema": {
                            "$ref": "#/definitions/model.Response"
                        }
                    }
                }
            }
        },
        "/participant/": {
            "post": {
                "description": "add a particpant to the competition",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "participant"
                ],
                "summary": "join in a competition",
                "parameters": [
                    {
                        "type": "integer",
                        "description": "competition id",
                        "name": "competitionID",
                        "in": "formData",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "success",
                        "schema": {
                            "$ref": "#/definitions/model.Response"
                        }
                    },
                    "400": {
                        "description": "no user/competition found",
                        "schema": {
                            "$ref": "#/definitions/model.Response"
                        }
                    }
                }
            }
        },
        "/session": {
            "post": {
                "description": "get a session",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "session"
                ],
                "summary": "login",
                "parameters": [
                    {
                        "type": "string",
                        "description": "user's name",
                        "name": "username",
                        "in": "formData",
                        "required": true
                    },
                    {
                        "type": "string",
                        "description": "password",
                        "name": "password",
                        "in": "formData",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "success | has loginned",
                        "schema": {
                            "$ref": "#/definitions/model.Response"
                        }
                    },
                    "404": {
                        "description": "wrong username or password",
                        "schema": {
                            "$ref": "#/definitions/model.Response"
                        }
                    }
                }
            },
            "delete": {
                "description": "delete the session",
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "session"
                ],
                "summary": "logout",
                "responses": {
                    "200": {
                        "description": "success",
                        "schema": {
                            "$ref": "#/definitions/model.Response"
                        }
                    }
                }
            }
        },
        "/user": {
            "post": {
                "description": "add a user to db",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "user"
                ],
                "summary": "register a user",
                "parameters": [
                    {
                        "type": "string",
                        "description": "user's name",
                        "name": "username",
                        "in": "formData",
                        "required": true
                    },
                    {
                        "type": "string",
                        "description": "password",
                        "name": "password",
                        "in": "formData",
                        "required": true
                    },
                    {
                        "type": "string",
                        "description": "overview",
                        "name": "overview",
                        "in": "formData"
                    },
                    {
                        "type": "string",
                        "description": "organization",
                        "name": "organization",
                        "in": "formData"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "success",
                        "schema": {
                            "$ref": "#/definitions/model.Response"
                        }
                    },
                    "400": {
                        "description": "username exists",
                        "schema": {
                            "$ref": "#/definitions/model.Response"
                        }
                    },
                    "500": {
                        "description": "db error",
                        "schema": {
                            "$ref": "#/definitions/model.Response"
                        }
                    }
                }
            }
        },
        "/user/me": {
            "get": {
                "description": "get my uid in the session",
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "user"
                ],
                "summary": "get my uid",
                "responses": {
                    "200": {
                        "description": "success",
                        "schema": {
                            "$ref": "#/definitions/model.UIDResponse"
                        }
                    }
                }
            }
        },
        "/user/{id}": {
            "get": {
                "description": "modify username, password, overview, and organization",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "user"
                ],
                "summary": "modify user's information",
                "parameters": [
                    {
                        "type": "string",
                        "description": "user's id",
                        "name": "id",
                        "in": "path",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "success",
                        "schema": {
                            "$ref": "#/definitions/model.Response"
                        }
                    },
                    "400": {
                        "description": "invalid user id",
                        "schema": {
                            "$ref": "#/definitions/model.Response"
                        }
                    },
                    "404": {
                        "description": "no user found",
                        "schema": {
                            "$ref": "#/definitions/model.Response"
                        }
                    }
                }
            },
            "put": {
                "description": "modify username, password, overview, and organization",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "user"
                ],
                "summary": "modify user's information",
                "parameters": [
                    {
                        "type": "string",
                        "description": "user's id",
                        "name": "id",
                        "in": "path",
                        "required": true
                    },
                    {
                        "type": "string",
                        "description": "modified user's name",
                        "name": "username",
                        "in": "formData",
                        "required": true
                    },
                    {
                        "type": "string",
                        "description": "original password",
                        "name": "oriPassword",
                        "in": "formData",
                        "required": true
                    },
                    {
                        "type": "string",
                        "description": "modified password",
                        "name": "modPassword",
                        "in": "formData"
                    },
                    {
                        "type": "string",
                        "description": "modified overview",
                        "name": "overview",
                        "in": "formData"
                    },
                    {
                        "type": "string",
                        "description": "modified organization",
                        "name": "organization",
                        "in": "formData"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "success",
                        "schema": {
                            "$ref": "#/definitions/model.Response"
                        }
                    },
                    "400": {
                        "description": "empty/invalid user id | invalid modified information",
                        "schema": {
                            "$ref": "#/definitions/model.Response"
                        }
                    },
                    "403": {
                        "description": "cannot change other's info | wrong original password",
                        "schema": {
                            "$ref": "#/definitions/model.Response"
                        }
                    }
                }
            }
        }
    },
    "definitions": {
        "model.CompInfoResponse": {
            "type": "object",
            "properties": {
                "categories": {
                    "type": "string",
                    "example": "[{des: "
                },
                "date": {
                    "type": "string",
                    "example": "2006-01-02T15:04:05+08:00"
                },
                "hostID": {
                    "type": "string",
                    "example": "87"
                },
                "name": {
                    "type": "string",
                    "example": "competition name"
                },
                "overview": {
                    "type": "string",
                    "example": "overview"
                },
                "participants": {
                    "type": "string",
                    "example": "[1, 2, 3, 87]"
                },
                "result": {
                    "type": "string",
                    "example": "result description"
                },
                "scoreboardURL": {
                    "type": "string",
                    "example": "Scoreboard URL"
                }
            }
        },
        "model.CompResponse": {
            "type": "object",
            "properties": {
                "compID": {
                    "type": "integer",
                    "example": 87
                },
                "result": {
                    "type": "string",
                    "example": "result description"
                }
            }
        },
        "model.Response": {
            "type": "object",
            "properties": {
                "result": {
                    "type": "string",
                    "example": "result description"
                }
            }
        },
        "model.UIDResponse": {
            "type": "object",
            "properties": {
                "uid": {
                    "type": "string",
                    "example": "your uid"
                }
            }
        }
    }
}`

// SwaggerInfo holds exported Swagger Info so clients can modify it
var SwaggerInfo = &swag.Spec{
	Version:          "1.0",
	Host:             "localhost:8080",
	BasePath:         "/api/",
	Schemes:          []string{},
	Title:            "Archery backend API",
	Description:      "A gin server",
	InfoInstanceName: "swagger",
	SwaggerTemplate:  docTemplate,
	LeftDelim:        "{{",
	RightDelim:       "}}",
}

func init() {
	swag.Register(SwaggerInfo.InstanceName(), SwaggerInfo)
}
