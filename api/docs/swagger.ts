import swaggerJSDoc, { Options } from "swagger-jsdoc";

const options: Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Profile Intelligence Service",
      version: "1.0.0",
      description:
        "Enriches names via Genderize, Agify, and Nationalize. Persists results in MySQL.",
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: "Local",
      },
    ],
    paths: {
      "/api/profiles": {
        post: {
          tags: ["Profiles"],
          summary: "Create a profile",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateProfileRequest" },
              },
            },
          },
          responses: {
            "201": { description: "Created or already exists" },
            "400": { description: "Missing or empty name" },
            "422": { description: "Name is not a string" },
            "502": { description: "External API error" },
          },
        },
        get: {
          tags: ["Profiles"],
          summary: "List profiles",
          parameters: [
            { in: "query", name: "gender", schema: { type: "string" } },
            { in: "query", name: "country_id", schema: { type: "string" } },
            {
              in: "query",
              name: "age_group",
              schema: {
                type: "string",
                enum: ["child", "teenager", "adult", "senior"],
              },
            },
          ],
          responses: { "200": { description: "List of profiles" } },
        },
      },
      "/api/profiles/{id}": {
        get: {
          tags: ["Profiles"],
          summary: "Get profile by ID",
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": { description: "Profile found" },
            "404": { description: "Not found" },
          },
        },
        delete: {
          tags: ["Profiles"],
          summary: "Delete profile",
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "204": { description: "Deleted" },
            "404": { description: "Not found" },
          },
        },
      },
    },
    components: {
      schemas: {
        CreateProfileRequest: {
          type: "object",
          required: ["name"],
          properties: { name: { type: "string", example: "ella" } },
        },
        ProfileFull: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            gender: { type: "string" },
            gender_probability: { type: "number" },
            sample_size: { type: "integer" },
            age: { type: "integer" },
            age_group: {
              type: "string",
              enum: ["child", "teenager", "adult", "senior"],
            },
            country_id: { type: "string", nullable: true },
            country_probability: { type: "number", nullable: true },
            created_at: { type: "string", format: "date-time" },
          },
        },
        ProfileListItem: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            gender: { type: "string" },
            age: { type: "integer" },
            age_group: { type: "string" },
            country_id: { type: "string", nullable: true },
          },
        },
        Error: {
          type: "object",
          properties: {
            status: { type: "string", example: "error" },
            message: { type: "string" },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJSDoc(options);