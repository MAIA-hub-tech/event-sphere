import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

export const stripeWebhook = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const body = JSON.parse(event.body || "{}");

  console.log("Stripe Webhook received:", body);

  return {
    statusCode: 200,
    body: JSON.stringify({ received: true }),
  };
};
