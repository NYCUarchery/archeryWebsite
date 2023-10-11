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
            "name": "NYCUArchery",
            "url": "https://github.com/NYCUarchery"
        },
        "license": {
            "name": "no license yet"
        },
        "version": "{{.Version}}"
    },
    "host": "{{.Host}}",
    "basePath": "{{.BasePath}}",
    "paths": {
        "/data/gameinfo": {
            "post": {
                "description": "Post one new GameInfo data with new id, and return the new GameInfo data",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "GameInfo"
                ],
                "summary": "Create one GameInfo",
                "parameters": [
                    {
                        "description": "GaeInfo",
                        "name": "GameInfo",
                        "in": "body",
                        "required": true,
                        "schema": {
                            "type": "string"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "OK",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "400": {
                        "description": "Bad Request",
                        "schema": {
                            "type": "string"
                        }
                    }
                }
            }
        },
        "/data/gameinfo/whole/{id}": {
            "put": {
                "description": "Put whole new GameInfo and overwrite with the id",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "GameInfo"
                ],
                "summary": "update one GameInfo",
                "parameters": [
                    {
                        "type": "string",
                        "description": "GameInfo ID",
                        "name": "id",
                        "in": "path",
                        "required": true
                    },
                    {
                        "description": "GameInfo",
                        "name": "GameInfo",
                        "in": "body",
                        "required": true,
                        "schema": {
                            "type": "string"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "OK",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "400": {
                        "description": "Bad Request",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "404": {
                        "description": "Not Found",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "500": {
                        "description": "Internal Server Error",
                        "schema": {
                            "type": "string"
                        }
                    }
                }
            }
        },
        "/data/gameinfo/{id}": {
            "get": {
                "description": "Get one GameInfo by id",
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "GameInfo"
                ],
                "summary": "Show one GameInfo",
                "parameters": [
                    {
                        "type": "integer",
                        "description": "GameInfo ID",
                        "name": "id",
                        "in": "path",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "OK",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "400": {
                        "description": "Bad Request",
                        "schema": {
                            "type": "string"
                        }
                    }
                }
            },
            "delete": {
                "description": "delete one GameInfo by id",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "GameInfo"
                ],
                "summary": "delete one GameInfo",
                "parameters": [
                    {
                        "type": "string",
                        "description": "GameInfo ID",
                        "name": "id",
                        "in": "path",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "OK",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "400": {
                        "description": "Bad Request",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "404": {
                        "description": "Not Found",
                        "schema": {
                            "type": "string"
                        }
                    }
                }
            }
        },
        "/data/groupinfo": {
            "post": {
                "description": "Post one new GroupInfo data with new id, and return the new GroupInfo data",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "GroupInfo"
                ],
                "summary": "Create one GroupInfo",
                "parameters": [
                    {
                        "description": "LaneData",
                        "name": "GroupInfo",
                        "in": "body",
                        "required": true,
                        "schema": {
                            "type": "string"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "OK",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "400": {
                        "description": "Bad Request",
                        "schema": {
                            "type": "string"
                        }
                    }
                }
            }
        },
        "/data/groupinfo/whole/{id}": {
            "put": {
                "description": "Put whole new GroupInfo and overwrite with the id",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "GroupInfo"
                ],
                "summary": "update one GroupInfo",
                "parameters": [
                    {
                        "type": "string",
                        "description": "GroupInfo ID",
                        "name": "id",
                        "in": "path",
                        "required": true
                    },
                    {
                        "description": "GroupInfo",
                        "name": "GroupInfo",
                        "in": "body",
                        "required": true,
                        "schema": {
                            "type": "string"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "OK",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "400": {
                        "description": "Bad Request",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "404": {
                        "description": "Not Found",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "500": {
                        "description": "Internal Server Error",
                        "schema": {
                            "type": "string"
                        }
                    }
                }
            }
        },
        "/data/groupinfo/{id}": {
            "get": {
                "description": "Get one GroupInfo by id",
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "GroupInfo"
                ],
                "summary": "Show one GroupInfo",
                "parameters": [
                    {
                        "type": "integer",
                        "description": "LaneInfo ID",
                        "name": "id",
                        "in": "path",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "OK",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "400": {
                        "description": "Bad Request",
                        "schema": {
                            "type": "string"
                        }
                    }
                }
            },
            "delete": {
                "description": "delete one GroupInfo by id",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "GroupInfo"
                ],
                "summary": "delete one GroupInfo",
                "parameters": [
                    {
                        "type": "string",
                        "description": "GroupInfo ID",
                        "name": "id",
                        "in": "path",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "OK",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "400": {
                        "description": "Bad Request",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "404": {
                        "description": "Not Found",
                        "schema": {
                            "type": "string"
                        }
                    }
                }
            }
        },
        "/data/laneinfo": {
            "post": {
                "description": "Post one new LaneInfo data with new id, and return the new LaneInfo data",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "LaneInfo"
                ],
                "summary": "Create one LaneInfo",
                "parameters": [
                    {
                        "description": "LaneData",
                        "name": "LaneData",
                        "in": "body",
                        "required": true,
                        "schema": {
                            "type": "string"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "OK",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "400": {
                        "description": "Bad Request",
                        "schema": {
                            "type": "string"
                        }
                    }
                }
            }
        },
        "/data/laneinfo/confirm/{id}/{stageindex}/{userindex}/{confirm}": {
            "put": {
                "description": "Put one LaneInfo confirm by index and id",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "LaneInfo"
                ],
                "summary": "update one LaneInfo confirmation",
                "parameters": [
                    {
                        "type": "string",
                        "description": "LaneInfo ID",
                        "name": "id",
                        "in": "path",
                        "required": true
                    },
                    {
                        "type": "string",
                        "description": "LaneInfo stage index",
                        "name": "stageindex",
                        "in": "path",
                        "required": true
                    },
                    {
                        "type": "string",
                        "description": "LaneInfo user index of the stage",
                        "name": "userindex",
                        "in": "path",
                        "required": true
                    },
                    {
                        "type": "string",
                        "description": "confirmation of the user",
                        "name": "confirm",
                        "in": "path",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "OK",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "400": {
                        "description": "Bad Request",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "404": {
                        "description": "Not Found",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "500": {
                        "description": "Internal Server Error",
                        "schema": {
                            "type": "string"
                        }
                    }
                }
            }
        },
        "/data/laneinfo/score/{id}/{stageindex}/{userindex}/{arrowindex}/{score}": {
            "put": {
                "description": "Put one LaneInfo score by index and id",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "LaneInfo"
                ],
                "summary": "update one LaneInfo Score",
                "parameters": [
                    {
                        "type": "string",
                        "description": "LaneInfo ID",
                        "name": "id",
                        "in": "path",
                        "required": true
                    },
                    {
                        "type": "string",
                        "description": "LaneInfo stage index",
                        "name": "stageindex",
                        "in": "path",
                        "required": true
                    },
                    {
                        "type": "string",
                        "description": "LaneInfo user index of the stage",
                        "name": "userindex",
                        "in": "path",
                        "required": true
                    },
                    {
                        "type": "string",
                        "description": "LaneInfo arrow index of the user",
                        "name": "arrowindex",
                        "in": "path",
                        "required": true
                    },
                    {
                        "type": "string",
                        "description": "score of the arrow",
                        "name": "score",
                        "in": "path",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "OK",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "400": {
                        "description": "Bad Request",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "404": {
                        "description": "Not Found",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "500": {
                        "description": "Internal Server Error",
                        "schema": {
                            "type": "string"
                        }
                    }
                }
            }
        },
        "/data/laneinfo/whole/{id}": {
            "put": {
                "description": "Put whole new LaneInfo and overwrite with the id",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "LaneInfo"
                ],
                "summary": "update one LaneInfo",
                "parameters": [
                    {
                        "type": "string",
                        "description": "LaneInfo ID",
                        "name": "id",
                        "in": "path",
                        "required": true
                    },
                    {
                        "description": "LaneData",
                        "name": "LaneData",
                        "in": "body",
                        "required": true,
                        "schema": {
                            "type": "string"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "OK",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "400": {
                        "description": "Bad Request",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "404": {
                        "description": "Not Found",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "500": {
                        "description": "Internal Server Error",
                        "schema": {
                            "type": "string"
                        }
                    }
                }
            }
        },
        "/data/laneinfo/{id}": {
            "get": {
                "description": "Get one LaneInfo by id",
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "LaneInfo"
                ],
                "summary": "Show one LaneInfo",
                "parameters": [
                    {
                        "type": "integer",
                        "description": "LaneInfo ID",
                        "name": "id",
                        "in": "path",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "OK",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "400": {
                        "description": "Bad Request",
                        "schema": {
                            "type": "string"
                        }
                    }
                }
            },
            "delete": {
                "description": "delete one LaneInfo by id",
                "consumes": [
                    "application/json"
                ],
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "LaneInfo"
                ],
                "summary": "delete one LaneInfo",
                "parameters": [
                    {
                        "type": "string",
                        "description": "LaneInfo ID",
                        "name": "id",
                        "in": "path",
                        "required": true
                    }
                ],
                "responses": {
                    "200": {
                        "description": "OK",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "400": {
                        "description": "Bad Request",
                        "schema": {
                            "type": "string"
                        }
                    },
                    "404": {
                        "description": "Not Found",
                        "schema": {
                            "type": "string"
                        }
                    }
                }
            }
        },
        "/swagger/doc.json": {
            "get": {
                "description": "get Api docs in json",
                "produces": [
                    "application/json"
                ],
                "tags": [
                    "docs"
                ],
                "summary": "Show Api Docs in json",
                "responses": {
                    "200": {
                        "description": "OK",
                        "schema": {
                            "type": "string"
                        }
                    }
                }
            }
        },
        "/views/home": {
            "get": {
                "description": "show home page",
                "tags": [
                    "views"
                ],
                "summary": "Show home page",
                "responses": {
                    "200": {
                        "description": "OK",
                        "schema": {
                            "type": "string"
                        }
                    }
                }
            }
        }
    }
}`

// SwaggerInfo holds exported Swagger Info so clients can modify it
var SwaggerInfo = &swag.Spec{
	Version:          "1.0",
	Host:             "localhost:8080",
	BasePath:         "",
	Schemes:          []string{},
	Title:            "Gin swagger",
	Description:      "Gin swagger",
	InfoInstanceName: "swagger",
	SwaggerTemplate:  docTemplate,
	LeftDelim:        "{{",
	RightDelim:       "}}",
}

func init() {
	swag.Register(SwaggerInfo.InstanceName(), SwaggerInfo)
}
