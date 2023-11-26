import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import Ajv from "ajv";
import schema from "../shared/types.schema.json";

const ajv = new Ajv();
const isValidBodyParams = ajv.compile(schema.definitions["MovieReviewParams"] || {});

const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    // Print Event
    console.log("Event: ", event);
    const movieId = parseInt(event?.pathParameters?.movieId ?? "");
    const reviewerName = event?.pathParameters?.reviewerName;
    const body = event.body ? JSON.parse(event.body) : undefined;
    if (!body) {
      return {
        statusCode: 400,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ message: "Missing request body" }),
      };
    }
    if (!isValidBodyParams(body)) {
      return {
        statusCode: 400,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message: `Incorrect type. Must match Review schema`,
          schema: schema.definitions["MovieReviewParams"],
        }),
      };
    }

  

    if (!movieId || !reviewerName) {
      return {
        statusCode: 400,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ message: "Invalid movie Id or reviewer name in the request body" }),
      };
    }
    // Update the table details

    const updateInput = {
      TableName: process.env.TABLE_NAME,
      Key: {
        movieId: movieId,
        reviewerName: reviewerName,
      },
      UpdateExpression: "SET #rating = :rating, #content = :content, #reviewDate = :reviewDate",
      ExpressionAttributeNames: {
        "#rating": "rating",
        "#content": "content",
        "#reviewDate": "reviewDate",
      },
      ExpressionAttributeValues: {
        ":rating": body.rating,
        ":content": body.content,
        ":reviewDate": body.reviewDate,
      },
    };

    await ddbDocClient.send(new UpdateCommand(updateInput));

    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ message: "Movie Review updated successfully" }),
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