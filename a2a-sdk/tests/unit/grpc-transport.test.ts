/**
 * Unit tests for gRPC transport.
 */

import { GrpcTransport } from '../../src/transports/grpc-transport';
import type { AgentCard, Message, Task, Role } from '../../src/types';
import { TaskState } from '../../src/types';
import { Role } from '../../src/types';

// Mock @grpc/grpc-js
jest.mock('@grpc/grpc-js', () => ({
  Channel: jest.fn(),
  ChannelCredentials: {
    createInsecure: jest.fn(() => ({}) as any),
    createSsl: jest.fn(() => ({}) as any),
  },
  Server: jest.fn(),
  ServerCredentials: {
    createInsecure: jest.fn(() => ({} as any)),
  },
}));

describe('GrpcTransport', () => {
  let mockChannel: any;
  let mockClient: any;
  let agentCard: AgentCard;

  beforeEach(() => {
    // Create mock channel
    mockChannel = {
      close: jest.fn(),
    };

    // Create mock client
    mockClient = {
      sendMessage: jest.fn(),
      sendStreamingMessage: jest.fn(),
      getTask: jest.fn(),
      cancelTask: jest.fn(),
      taskSubscription: jest.fn(),
      getAgentCard: jest.fn(),
      createTaskPushNotificationConfig: jest.fn(),
      getTaskPushNotificationConfig: jest.fn(),
    };

    agentCard = {
      name: 'Test Agent',
      version: '1.0.0',
      capabilities: {
        streaming: true,
        push_notifications: false,
        extensions: [],
      },
      protocol_version: '1.0',
      supports_authenticated_extended_card: false,
    };
  });

  describe('create', () => {
    it('should create a transport with channel factory', () => {
      const mockChannelFactory = jest.fn(() => mockChannel);
      const config = {
        grpcChannelFactory: mockChannelFactory,
      };

      const transport = GrpcTransport.create(
        agentCard,
        'localhost:50051',
        config,
      );

      expect(mockChannelFactory).toHaveBeenCalledWith('localhost:50051');
      expect(transport).toBeInstanceOf(GrpcTransport);
    });

    it('should throw error when channel factory is not provided', () => {
      const config = {};

      expect(() => {
        GrpcTransport.create(agentCard, 'localhost:50051', config);
      }).toThrow('grpc_channel_factory is required when using gRPC');
    });
  });

  describe('sendMessage', () => {
    it('should send a non-streaming message', async () => {
      const transport = new GrpcTransport(mockChannel, agentCard);
      (transport as any).stub = mockClient;

      const message: Message = {
        message_id: 'msg-123',
        role: 'user' as Role,
        parts: [
          {
            root: {
              text: 'Hello',
            },
          },
        ],
      };

      const task: Task = {
        id: 'task-123',
        context_id: 'ctx-123',
        status: {
          state: 'completed',
          message: {
            message_id: 'msg-456',
            role: 'agent' as Role,
            parts: [{ root: { text: 'Hi' } }],
          },
        },
        artifacts: [],
        history: [message],
        metadata: {},
      };

      mockClient.sendMessage.mockImplementation((req, metadata, callback) => {
        callback(null, {
          hasTask: () => true,
          getTask: () => ({
            getId: () => task.id,
            getContextId: () => task.context_id,
            getStatus: () => ({
              getState: () => TaskState.TASK_STATE_COMPLETED,
              getUpdate: () => null,
            }),
            getArtifactsList: () => [],
            getHistoryList: () => [],
            getMetadata: () => null,
          }),
          hasMsg: () => false,
        });
      });

      const response = await transport.sendMessage({
        message,
      });

      expect(response).toBeDefined();
      expect(mockClient.sendMessage).toHaveBeenCalled();
    });

    it('should handle errors when sending message', async () => {
      const transport = new GrpcTransport(mockChannel, agentCard);
      (transport as any).stub = mockClient;

      const message: Message = {
        message_id: 'msg-123',
        role: 'user' as Role,
        parts: [
          {
            root: {
              text: 'Hello',
            },
          },
        ],
      };

      mockClient.sendMessage.mockImplementation((req, metadata, callback) => {
        callback(new Error('Network error'), null);
      });

      await expect(
        transport.sendMessage({ message })
      ).rejects.toThrow('Network error');
    });
  });

  describe('getTask', () => {
    it('should retrieve a task', async () => {
      const transport = new GrpcTransport(mockChannel, agentCard);
      (transport as any).stub = mockClient;

      const task: Task = {
        id: 'task-123',
        context_id: 'ctx-123',
        status: {
          state: 'working',
          message: {
            message_id: 'msg-456',
            role: 'agent' as Role,
            parts: [{ root: { text: 'Processing' } }],
          },
        },
        artifacts: [],
        history: [],
        metadata: {},
      };

      mockClient.getTask.mockImplementation((req, metadata, callback) => {
        callback(null, {
          getId: () => task.id,
          getContextId: () => task.context_id,
          getStatus: () => ({
            getState: () => TaskState.TASK_STATE_WORKING,
            getUpdate: () => null,
          }),
          getArtifactsList: () => [],
          getHistoryList: () => [],
          getMetadata: () => null,
        });
      });

      const response = await transport.getTask({
        id: 'task-123',
      });

      expect(response).toBeDefined();
      expect(response.id).toBe('task-123');
      expect(mockClient.getTask).toHaveBeenCalled();
    });
  });

  describe('cancelTask', () => {
    it('should cancel a task', async () => {
      const transport = new GrpcTransport(mockChannel, agentCard);
      (transport as any).stub = mockClient;

      const task: Task = {
        id: 'task-123',
        context_id: 'ctx-123',
        status: {
          state: 'canceled',
          message: {
            message_id: 'msg-456',
            role: 'agent' as Role,
            parts: [{ root: { text: 'Canceled' } }],
          },
        },
        artifacts: [],
        history: [],
        metadata: {},
      };

      mockClient.cancelTask.mockImplementation((req, metadata, callback) => {
        callback(null, {
          getId: () => task.id,
          getContextId: () => task.context_id,
          getStatus: () => ({
            getState: () => TaskState.TASK_STATE_CANCELLED,
            getUpdate: () => null,
          }),
          getArtifactsList: () => [],
          getHistoryList: () => [],
          getMetadata: () => null,
        });
      });

      const response = await transport.cancelTask({
        id: 'task-123',
      });

      expect(response).toBeDefined();
      expect(response.status.state).toBe('canceled');
      expect(mockClient.cancelTask).toHaveBeenCalled();
    });
  });

  describe('getCard', () => {
    it('should get agent card', async () => {
      const transport = new GrpcTransport(mockChannel, agentCard);
      (transport as any).stub = mockClient;

      mockClient.getAgentCard.mockImplementation((req, metadata, callback) => {
        callback(null, {
          getName: () => agentCard.name,
          getDescription: () => '',
          getVersion: () => agentCard.version,
          getUrl: () => '',
          getDocumentationUrl: () => '',
          hasProvider: () => false,
          getCapabilities: () => ({
            getStreaming: () => true,
            getPushNotifications: () => false,
            getExtensionsList: () => [],
          }),
          getDefaultInputModesList: () => [],
          getDefaultOutputModesList: () => [],
          getSkillsList: () => [],
          getSecurityList: () => [],
          getSupportsAuthenticatedExtendedCard: () => false,
          getPreferredTransport: () => '',
          getProtocolVersion: () => '1.0',
          getAdditionalInterfacesList: () => [],
          getSignaturesList: () => [],
        });
      });

      const card = await transport.getCard();

      expect(card).toBeDefined();
      expect(card.name).toBe('Test Agent');
      expect(mockClient.getAgentCard).toHaveBeenCalled();
    });
  });

  describe('close', () => {
    it('should close the channel', async () => {
      const transport = new GrpcTransport(mockChannel, agentCard);

      await transport.close();

      expect(mockChannel.close).toHaveBeenCalled();
    });
  });
});
