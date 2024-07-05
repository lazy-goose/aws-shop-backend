import {
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
  Callback,
  Context,
  SQSHandler,
} from "aws-lambda";
import merge from "deepmerge";
import { apiGatewayProxyEvent } from "../../mock/events.data";

export const createInvokeEvent = <
  Handler extends (...args: any) => any,
  Result = ReturnType<Handler>,
  Event = Parameters<Handler>[0]
>(
  mergeEvent = {} as Event,
  mergeContext = {} as Context,
  defaultCallback = (() => {}) as Callback
) => {
  return (handler: Handler) => {
    return (
      event = {} as Partial<Event>,
      context = {} as Partial<Context>,
      callback = (() => {}) as Callback
    ) => {
      return handler(
        merge(mergeEvent, event) as Event,
        merge(mergeContext, context) as Context,
        (callback || defaultCallback) as Callback
      ) as Result;
    };
  };
};

export const invokeGatewayProxyEvent = createInvokeEvent<
  APIGatewayProxyHandlerV2,
  Promise<APIGatewayProxyStructuredResultV2>
>(apiGatewayProxyEvent);

export const invokeSqsEvent = createInvokeEvent<SQSHandler>();
