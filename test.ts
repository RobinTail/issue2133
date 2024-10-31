import { z } from "zod";
import {
  EndpointsFactory,
  ResultHandler,
  getMessageFromError,
  getStatusCodeFromError,
  createServer,
  createConfig,
} from "express-zod-api";

const resultHandler = new ResultHandler({
  positive: (output) =>
    z.object({
      status: z.literal("success"),
      data: output,
    }),
  negative: z.object({
    status: z.literal("error"),
    error: z.object({ message: z.string() }),
  }),
  handler: ({ error, input, output, response, logger, request }) => {
    if (!error) {
      response.status(200).json({ status: "success", data: output });
      return;
    }

    logger.debug(`A handled error occurred at ${request.path}: `, {
      error,
      input,
      output,
    });

    const statusCode = getStatusCodeFromError(error);
    response.status(statusCode).json({
      status: "error",
      error: { message: getMessageFromError(error) },
    });
  },
});

export const baseEndpointFactory = new EndpointsFactory(resultHandler);

export const retrieveAllVendors = baseEndpointFactory.build({
  method: "get",
  input: z.object({}),
  output: z.object({
    vendors: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        document: z.string(),
      }),
    ),
  }),
  handler: async () => ({
    vendors: [{ id: "123", name: "456", document: "789" }],
  }),
});

await createServer(
  createConfig({
    server: { listen: 8090 },
    cors: false,
    logger: { level: "debug" },
  }),
  { ret: retrieveAllVendors },
);
