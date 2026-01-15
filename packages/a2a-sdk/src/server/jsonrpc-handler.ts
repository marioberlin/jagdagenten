/**
 * JSON-RPC handler for A2A server
 * Maps incoming JSON-RPC requests to appropriate handler methods
 */

import {
  AgentCard,
  SendMessageRequest,
  SendMessageResponse,
  SendStreamingMessageRequest,
  SendStreamingMessageResponse,
  GetTaskRequest,
  GetTaskResponse,
  CancelTaskRequest,
  CancelTaskResponse,
  TaskResubscriptionRequest,
  TaskPushNotificationConfigRequest,
  TaskPushNotificationConfigResponse,
  GetAuthenticatedExtendedCardRequest,
  GetAuthenticatedExtendedCardResponse,
  JSONRPCErrorResponse,
  SendMessageSuccessResponse,
  SendStreamingMessageSuccessResponse,
  GetTaskSuccessResponse,
  CancelTaskSuccessResponse,
  GetTaskPushNotificationConfigRequest,
  SetTaskPushNotificationConfigRequest,
  ListTaskPushNotificationConfigRequest,
  DeleteTaskPushNotificationConfigRequest,
  GetTaskPushNotificationConfigSuccessResponse,
  SetTaskPushNotificationConfigSuccessResponse,
  ListTaskPushNotificationConfigSuccessResponse,
  DeleteTaskPushNotificationConfigSuccessResponse,
  GetAuthenticatedExtendedCardSuccessResponse,
  Task,
  Message,
  TaskArtifactUpdateEvent,
  TaskStatusUpdateEvent,
  InternalError,
  TaskNotFoundError,
} from '../types';
import { RequestHandler } from './request-handler';
import { ServerCallContext } from './context';
import { prepareResponseObject } from '../utils/response-helpers';
import { ServerError } from '../utils/errors';

/**
 * Maps incoming JSON-RPC requests to the appropriate request handler method
 */
export class JSONRPCHandler {
  private agentCard: AgentCard;
  private requestHandler: RequestHandler;
  private extendedAgentCard?: AgentCard;
  private extendedCardModifier?: (card: AgentCard, context: ServerCallContext) => AgentCard;
  private cardModifier?: (card: AgentCard) => AgentCard;

  constructor(
    agentCard: AgentCard,
    requestHandler: RequestHandler,
    extendedAgentCard?: AgentCard,
    extendedCardModifier?: (card: AgentCard, context: ServerCallContext) => AgentCard,
    cardModifier?: (card: AgentCard) => AgentCard
  ) {
    this.agentCard = agentCard;
    this.requestHandler = requestHandler;
    this.extendedAgentCard = extendedAgentCard;
    this.extendedCardModifier = extendedCardModifier;
    this.cardModifier = cardModifier;
  }

  /**
   * Handles the 'message/send' JSON-RPC method
   */
  async onMessageSend(
    request: SendMessageRequest,
    context?: ServerCallContext
  ): Promise<SendMessageResponse> {
    try {
      const taskOrMessage = await this.requestHandler.onMessageSend(
        request.params,
        context
      );

      return prepareResponseObject(
        request.id,
        taskOrMessage,
        [Task, Message],
        SendMessageSuccessResponse,
        SendMessageResponse
      );
    } catch (error) {
      const serverError = error instanceof ServerError ? error : new ServerError(error as Error);
      return {
        root: {
          id: request.id,
          error: serverError.error || new InternalError(),
        } as JSONRPCErrorResponse,
      };
    }
  }

  /**
   * Handles the 'message/stream' JSON-RPC method
   */
  async *onMessageSendStream(
    request: SendStreamingMessageRequest,
    context?: ServerCallContext
  ): AsyncIterable<SendStreamingMessageResponse> {
    try {
      // Validate streaming capability
      if (!this.agentCard.capabilities?.streaming) {
        throw new ServerError(new Error('Streaming is not supported by the agent'));
      }

      for await (const event of this.requestHandler.onMessageSendStream(
        request.params,
        context
      )) {
        yield prepareResponseObject(
          request.id,
          event,
          [Task, Message, TaskArtifactUpdateEvent, TaskStatusUpdateEvent],
          SendStreamingMessageSuccessResponse,
          SendStreamingMessageResponse
        );
      }
    } catch (error) {
      const serverError = error instanceof ServerError ? error : new ServerError(error as Error);
      yield {
        root: {
          id: request.id,
          error: serverError.error || new InternalError(),
        } as JSONRPCErrorResponse,
      };
    }
  }

  /**
   * Handles the 'tasks/cancel' JSON-RPC method
   */
  async onCancelTask(
    request: CancelTaskRequest,
    context?: ServerCallContext
  ): Promise<CancelTaskResponse> {
    try {
      const task = await this.requestHandler.onCancelTask(request.params, context);

      if (task) {
        return prepareResponseObject(
          request.id,
          task,
          [Task],
          CancelTaskSuccessResponse,
          CancelTaskResponse
        );
      }

      return {
        root: {
          id: request.id,
          error: new TaskNotFoundError(),
        } as JSONRPCErrorResponse,
      };
    } catch (error) {
      const serverError = error instanceof ServerError ? error : new ServerError(error as Error);
      return {
        root: {
          id: request.id,
          error: serverError.error || new InternalError(),
        } as JSONRPCErrorResponse,
      };
    }
  }

  /**
   * Handles the 'tasks/resubscribe' JSON-RPC method
   */
  async *onResubscribeToTask(
    request: TaskResubscriptionRequest,
    context?: ServerCallContext
  ): AsyncIterable<SendStreamingMessageResponse> {
    try {
      for await (const event of this.requestHandler.onResubscribeToTask(
        request.params,
        context
      )) {
        yield prepareResponseObject(
          request.id,
          event,
          [Task, Message, TaskArtifactUpdateEvent, TaskStatusUpdateEvent],
          SendStreamingMessageSuccessResponse,
          SendStreamingMessageResponse
        );
      }
    } catch (error) {
      const serverError = error instanceof ServerError ? error : new ServerError(error as Error);
      yield {
        root: {
          id: request.id,
          error: serverError.error || new InternalError(),
        } as JSONRPCErrorResponse,
      };
    }
  }

  /**
   * Handles the 'tasks/pushNotificationConfig/get' JSON-RPC method
   */
  async getPushNotificationConfig(
    request: GetTaskPushNotificationConfigRequest,
    context?: ServerCallContext
  ): Promise<TaskPushNotificationConfigResponse> {
    try {
      const config = await this.requestHandler.onGetTaskPushNotificationConfig(
        request.params,
        context
      );

      return prepareResponseObject(
        request.id,
        config,
        [TaskPushNotificationConfigRequest],
        GetTaskPushNotificationConfigSuccessResponse,
        TaskPushNotificationConfigResponse
      );
    } catch (error) {
      const serverError = error instanceof ServerError ? error : new ServerError(error as Error);
      return {
        root: {
          id: request.id,
          error: serverError.error || new InternalError(),
        } as JSONRPCErrorResponse,
      };
    }
  }

  /**
   * Handles the 'tasks/pushNotificationConfig/set' JSON-RPC method
   */
  async setPushNotificationConfig(
    request: SetTaskPushNotificationConfigRequest,
    context?: ServerCallContext
  ): Promise<TaskPushNotificationConfigResponse> {
    try {
      // Validate push notification capability
      if (!this.agentCard.capabilities?.push_notifications) {
        throw new ServerError(new Error('Push notifications are not supported by the agent'));
      }

      const config = await this.requestHandler.onSetTaskPushNotificationConfig(
        request.params,
        context
      );

      return prepareResponseObject(
        request.id,
        config,
        [TaskPushNotificationConfigRequest],
        SetTaskPushNotificationConfigSuccessResponse,
        TaskPushNotificationConfigResponse
      );
    } catch (error) {
      const serverError = error instanceof ServerError ? error : new ServerError(error as Error);
      return {
        root: {
          id: request.id,
          error: serverError.error || new InternalError(),
        } as JSONRPCErrorResponse,
      };
    }
  }

  /**
   * Handles the 'tasks/get' JSON-RPC method
   */
  async onGetTask(
    request: GetTaskRequest,
    context?: ServerCallContext
  ): Promise<GetTaskResponse> {
    try {
      const task = await this.requestHandler.onGetTask(request.params, context);

      if (task) {
        return prepareResponseObject(
          request.id,
          task,
          [Task],
          GetTaskSuccessResponse,
          GetTaskResponse
        );
      }

      return {
        root: {
          id: request.id,
          error: new TaskNotFoundError(),
        } as JSONRPCErrorResponse,
      };
    } catch (error) {
      const serverError = error instanceof ServerError ? error : new ServerError(error as Error);
      return {
        root: {
          id: request.id,
          error: serverError.error || new InternalError(),
        } as JSONRPCErrorResponse,
      };
    }
  }

  /**
   * Handles the 'tasks/pushNotificationConfig/list' JSON-RPC method
   */
  async listPushNotificationConfig(
    request: ListTaskPushNotificationConfigRequest,
    context?: ServerCallContext
  ): Promise<TaskPushNotificationConfigResponse> {
    try {
      const configs = await this.requestHandler.onListTaskPushNotificationConfig(
        request.params,
        context
      );

      return prepareResponseObject(
        request.id,
        configs,
        [Array],
        ListTaskPushNotificationConfigSuccessResponse,
        TaskPushNotificationConfigResponse
      );
    } catch (error) {
      const serverError = error instanceof ServerError ? error : new ServerError(error as Error);
      return {
        root: {
          id: request.id,
          error: serverError.error || new InternalError(),
        } as JSONRPCErrorResponse,
      };
    }
  }

  /**
   * Handles the 'tasks/pushNotificationConfig/delete' JSON-RPC method
   */
  async deletePushNotificationConfig(
    request: DeleteTaskPushNotificationConfigRequest,
    context?: ServerCallContext
  ): Promise<TaskPushNotificationConfigResponse> {
    try {
      await this.requestHandler.onDeleteTaskPushNotificationConfig(
        request.params,
        context
      );

      return {
        root: {
          id: request.id,
          result: null,
        } as DeleteTaskPushNotificationConfigSuccessResponse,
      };
    } catch (error) {
      const serverError = error instanceof ServerError ? error : new ServerError(error as Error);
      return {
        root: {
          id: request.id,
          error: serverError.error || new InternalError(),
        } as JSONRPCErrorResponse,
      };
    }
  }

  /**
   * Handles the 'agent/authenticatedExtendedCard' JSON-RPC method
   */
  async getAuthenticatedExtendedCard(
    request: GetAuthenticatedExtendedCardRequest,
    context?: ServerCallContext
  ): Promise<GetAuthenticatedExtendedCardResponse> {
    if (!this.agentCard.supports_authenticated_extended_card) {
      throw new ServerError(new Error('Authenticated card not supported'));
    }

    const baseCard = this.extendedAgentCard || this.agentCard;
    let cardToServe = baseCard;

    if (this.extendedCardModifier && context) {
      cardToServe = this.extendedCardModifier(baseCard, context);
    } else if (this.cardModifier) {
      cardToServe = this.cardModifier(baseCard);
    }

    return {
      root: {
        id: request.id,
        result: cardToServe,
      } as GetAuthenticatedExtendedCardSuccessResponse,
    };
  }
}
