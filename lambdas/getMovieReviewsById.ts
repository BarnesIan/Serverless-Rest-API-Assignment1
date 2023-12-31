import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand,QueryCommandInput  } from "@aws-sdk/lib-dynamodb";
import Ajv from "ajv";
import schema from "../shared/types.schema.json";

const ajv = new Ajv();


const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => { 
  try {
    const isValidQueryParams = ajv.compile(
      schema.definitions["MovieReviewQueryParams"] || {}
    );
    console.log("Event: ", event);
    const parameters  = event?.pathParameters;
    const movieId = parameters?.movieId ? parseInt(parameters.movieId) : undefined;
    const minRating = event?.queryStringParameters?.minRating;

    if (!movieId) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "Invalid movie Id" }),
      };
    }

    let commandInput: QueryCommandInput = {
      TableName: process.env.TABLE_NAME,
      KeyConditionExpression: "movieId = :m",
      ExpressionAttributeValues: {
        ":m": movieId,
      },
    };

    if (minRating !== undefined) {
      commandInput = {
        ...commandInput,
        FilterExpression: "rating >= :r",
        ExpressionAttributeValues: {
          ...commandInput.ExpressionAttributeValues,
          ":r": parseFloat(minRating),
        },
      };
    }
    const commandOutput = await ddbDocClient.send(
      new QueryCommand(commandInput)
      );


    // Return Response
    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        data: commandOutput.Items,
      }),
    };
  } catch (error: any) {
    console.log(JSON.stringify(error));
    return {
      statusCode: 500,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ error }),
    };
  }
};

function createDDbDocClient() {
  const ddbClient = new DynamoDBClient({ region: process.env.REGION });
  const marshallOptions = {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  };
  const unmarshallOptions = {
    wrapNumbers: false,
  };
  const translateConfig = { marshallOptions, unmarshallOptions };
  return DynamoDBDocumentClient.from(ddbClient, translateConfig);
}