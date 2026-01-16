/**
 * JSON-RPC handler for A2A server (v1.0)
 * Maps incoming JSON-RPC requests to appropriate handler methods
 * Compliant with A2A Protocol v1.0 specification
 */

import type {
  AgentCard,
  JSONRPCRequest,
  JSONRPCResponse,
  MessageSendParams,
  JSONValue,
} from '../types/v1';

import {
  createErrorResponse,
  createSuccessResponse,
} from '../types/v1';

import type { RequestHandler } from './request-handler';
import type { ServerCallContext, TaskIdParams, TaskQueryParams, TaskPushNotificationConfigRequest } from './interfaces';

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
   * Handles the 'SendMessage' JSON-RPC method (v1.0)
   */
  async onSendMessage(
    request: JSONRPCRequest,
    context?: ServerCallContext
  ): Promise<JSONRPCResponse> {
    try {
      const params = request.params as unknown as MessageSendParams;
      const taskOrMessage = await this.requestHandler.onMessageSend(params, context);

      return createSuccessResponse(request.id, taskOrMessage as unknown as JSONValue);
    } catch (error) {
      return createErrorResponse(
        request.id,
        -32603,
        error instanceof Error ? error.message : 'Internal error'
      );
    }
  }

  /**
   * Handles the 'StreamMessage' JSON-RPC method (v1.0)
   */
  async *onStreamMessage(
    request: JSONRPCRequest,
    context?: ServerCallContext
  ): AsyncIterable<JSONRPCResponse> {
    try {
      // Validate streaming capability
      if (!this.agentCard.capabilities?.streaming) {
        yield createErrorResponse(request.id, -32004, 'Streaming is not supported by the agent');
        return;
      }

      const params = request.params as unknown as MessageSendParams;

      for await (const event of this.requestHandler.onMessageSendStream(params, context)) {
        yield createSuccessResponse(request.id, event as unknown as JSONValue);
      }
    } catch (error) {
      yield createErrorResponse(
        request.id,
        -32603,
        error instanceof Error ? error.message : 'Internal error'
      );
    }
  }

  /**
   * Handles the 'GetTask' JSON-RPC method (v1.0)
   */
  async onGetTask(
    request: JSONRPCRequest,
    context?: ServerCallContext
  ): Promise<JSONRPCResponse> {
    try {
      const params = request.params as unknown as TaskQueryParams;
      const task = await this.requestHandler.onGetTask(params, context);

      if (task) {
        return createSuccessResponse(request.id, task as unknown as JSONValue);
      }

      return createErrorResponse(request.id, -32001, 'Task not found');
    } catch (error) {
      return createErrorResponse(
        request.id,
        -32603,
        error instanceof Error ? error.message : 'Internal error'
      );
    }
  }

  /**
   * Handles the 'CancelTask' JSON-RPC method (v1.0)
   */
  async onCancelTask(
    request: JSONRPCRequest,
    context?: ServerCallContext
  ): Promise<JSONRPCResponse> {
    try {
      const params = request.params as unknown as TaskIdParams;
      const task = await this.requestHandler.onCancelTask(params, context);

      if (task) {
        return createSuccessResponse(request.id, task as unknown as JSONValue);
      }

      return createErrorResponse(request.id, -32001, 'Task not found');
    } catch (error) {
      return createErrorResponse(
        request.id,
        -32603,
        error instanceof Error ? error.message : 'Internal error'
      );
    }
  }

  /**
   * Handles the 'SubscribeToTask' JSON-RPC method (v1.0)
   */
  async *onSubscribeToTask(
    request: JSONRPCRequest,
    context?: ServerCallContext
  ): AsyncIterable<JSONRPCResponse> {
    try {
      const params = request.params as unknown as TaskIdParams;

      for await (const event of this.requestHandler.onResubscribeToTask(params, context)) {
        yield createSuccessResponse(request.id, event as unknown as JSONValue);
      }
    } catch (error) {
      yield createErrorResponse(
        request.id,
        -32603,
        error instanceof Error ? error.message : 'Internal error'
      );
    }
  }

  /**
   * Handles the 'GetTaskPushNotificationConfig' JSON-RPC method (v1.0)
   */
  async onGetPushNotificationConfig(
    request: JSONRPCRequest,
    context?: ServerCallContext
  ): Promise<JSONRPCResponse> {
    try {
      const params = request.params as unknown as TaskQueryParams;
      const config = await this.requestHandler.onGetTaskPushNotificationConfig(params, context);

      if (config) {
        return createSuccessResponse(request.id, config as unknown as JSONValue);
      }

      return createErrorResponse(request.id, -32001, 'Push notification config not found');
    } catch (error) {
      return createErrorResponse(
        request.id,
        -32603,
        error instanceof Error ? error.message : 'Internal error'
      );
    }
  }

  /**
   * Handles the 'SetTaskPushNotificationConfig' JSON-RPC method (v1.0)
   */
  async onSetPushNotificationConfig(
    request: JSONRPCRequest,
    context?: ServerCallContext
  ): Promise<JSONRPCResponse> {
    try {
      // Validate push notification capability
      if (!this.agentCard.capabilities?.pushNotifications) {
        return createErrorResponse(request.id, -32003, 'Push notifications are not supported by the agent');
      }

      const params = request.params as unknown as TaskPushNotificationConfigRequest;
      const config = await this.requestHandler.onSetTaskPushNotificationConfig(params, context);

      return createSuccessResponse(request.id, config as unknown as JSONValue);
    } catch (error) {
      return createErrorResponse(
        request.id,
        -32603,
        error instanceof Error ? error.message : 'Internal error'
      );
    }
  }

  /**
   * Handles the 'ListTaskPushNotificationConfig' JSON-RPC method (v1.0)
   */
  async onListPushNotificationConfig(
    request: JSONRPCRequest,
    context?: ServerCallContext
  ): Promise<JSONRPCResponse> {
    try {
      const params = request.params as unknown as TaskQueryParams;
      const configs = await this.requestHandler.onListTaskPushNotificationConfig(params, context);

      return createSuccessResponse(request.id, configs as unknown as JSONValue);
    } catch (error) {
      return createErrorResponse(
        request.id,
        -32603,
        error instanceof Error ? error.message : 'Internal error'
      );
    }
  }

  /**
   * Handles the 'DeleteTaskPushNotificationConfig' JSON-RPC method (v1.0)
   */
  async onDeletePushNotificationConfig(
    request: JSONRPCRequest,
    context?: ServerCallContext
  ): Promise<JSONRPCResponse> {
    try {
      const params = request.params as unknown as TaskIdParams;
      await this.requestHandler.onDeleteTaskPushNotificationConfig(params, context);

      return createSuccessResponse(request.id, null);
    } catch (error) {
      return createErrorResponse(
        request.id,
        -32603,
        error instanceof Error ? error.message : 'Internal error'
      );
    }
  }

  /**
   * Handles the 'GetExtendedAgentCard' JSON-RPC method (v1.0)
   */
  async onGetExtendedAgentCard(
    request: JSONRPCRequest,
    context?: ServerCallContext
  ): Promise<JSONRPCResponse> {
    if (!this.agentCard.capabilities?.extendedAgentCard) {
      return createErrorResponse(request.id, -32007, 'Extended agent card not configured');
    }

    const baseCard = this.extendedAgentCard || this.agentCard;
    let cardToServe = baseCard;

    if (this.extendedCardModifier && context) {
      cardToServe = this.extendedCardModifier(baseCard, context);
    } else if (this.cardModifier) {
      cardToServe = this.cardModifier(baseCard);
    }

    return createSuccessResponse(request.id, cardToServe as unknown as JSONValue);
  }

  // =========================================================================
  // Legacy method aliases (for backwards compatibility with old adapters)
  // =========================================================================

  /** @deprecated Use onSendMessage instead */
  async onMessageSend(
    request: JSONRPCRequest,
    context?: ServerCallContext
  ): Promise<JSONRPCResponse> {
    return this.onSendMessage(request, context);
  }

  /** @deprecated Use onStreamMessage instead */
  async *onMessageSendStream(
    request: JSONRPCRequest,
    context?: ServerCallContext
  ): AsyncIterable<JSONRPCResponse> {
    yield* this.onStreamMessage(request, context);
  }

  /** @deprecated Use onSubscribeToTask instead */
  async *onResubscribeToTask(
    request: JSONRPCRequest,
    context?: ServerCallContext
  ): AsyncIterable<JSONRPCResponse> {
    yield* this.onSubscribeToTask(request, context);
  }

  /** @deprecated Use onGetPushNotificationConfig instead */
  async getPushNotificationConfig(
    request: JSONRPCRequest,
    context?: ServerCallContext
  ): Promise<JSONRPCResponse> {
    return this.onGetPushNotificationConfig(request, context);
  }

  /** @deprecated Use onSetPushNotificationConfig instead */
  async setPushNotificationConfig(
    request: JSONRPCRequest,
    context?: ServerCallContext
  ): Promise<JSONRPCResponse> {
    return this.onSetPushNotificationConfig(request, context);
  }

  /** @deprecated Use onListPushNotificationConfig instead */
  async listPushNotificationConfig(
    request: JSONRPCRequest,
    context?: ServerCallContext
  ): Promise<JSONRPCResponse> {
    return this.onListPushNotificationConfig(request, context);
  }

  /** @deprecated Use onDeletePushNotificationConfig instead */
  async deletePushNotificationConfig(
    request: JSONRPCRequest,
    context?: ServerCallContext
  ): Promise<JSONRPCResponse> {
    return this.onDeletePushNotificationConfig(request, context);
  }

  /** @deprecated Use onGetExtendedAgentCard instead */
  async getAuthenticatedExtendedCard(
    request: JSONRPCRequest,
    context?: ServerCallContext
  ): Promise<JSONRPCResponse> {
    return this.onGetExtendedAgentCard(request, context);
  }
}
