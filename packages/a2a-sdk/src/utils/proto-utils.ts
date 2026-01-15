/**
 * Utilities for converting between TypeScript types and protobuf types.
 */

import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import {
  Message as PbMessage,
  Part as PbPart,
  FilePart as PbFilePart,
  DataPart as PbDataPart,
  Role,
  Task as PbTask,
  TaskStatus as PbTaskStatus,
  TaskState,
  Artifact as PbArtifact,
  TaskStatusUpdateEvent as PbTaskStatusUpdateEvent,
  TaskArtifactUpdateEvent as PbTaskArtifactUpdateEvent,
  SendMessageRequest as PbSendMessageRequest,
  SendMessageConfiguration as PbSendMessageConfiguration,
  SendMessageResponse as PbSendMessageResponse,
  StreamResponse as PbStreamResponse,
  GetTaskRequest as PbGetTaskRequest,
  CancelTaskRequest as PbCancelTaskRequest,
  TaskSubscriptionRequest as PbTaskSubscriptionRequest,
  GetAgentCardRequest as PbGetAgentCardRequest,
  GetTaskPushNotificationConfigRequest as PbGetTaskPushNotificationConfigRequest,
  CreateTaskPushNotificationConfigRequest as PbCreateTaskPushNotificationConfigRequest,
  TaskPushNotificationConfig as PbTaskPushNotificationConfig,
  PushNotificationConfig as PbPushNotificationConfig,
  AuthenticationInfo as PbAuthenticationInfo,
  AgentCard as PbAgentCard,
  AgentProvider as PbAgentProvider,
  AgentCapabilities as PbAgentCapabilities,
  AgentExtension as PbAgentExtension,
  Security as PbSecurity,
  SecurityScheme as PbSecurityScheme,
  APIKeySecurityScheme as PbAPIKeySecurityScheme,
  HTTPAuthSecurityScheme as PbHTTPAuthSecurityScheme,
  OAuth2SecurityScheme as PbOAuth2SecurityScheme,
  OAuthFlows as PbOAuthFlows,
  AuthorizationCodeOAuthFlow as PbAuthorizationCodeOAuthFlow,
  ClientCredentialsOAuthFlow as PbClientCredentialsOAuthFlow,
  ImplicitOAuthFlow as PbImplicitOAuthFlow,
  PasswordOAuthFlow as PbPasswordOAuthFlow,
  MutualTlsSecurityScheme as PbMutualTlsSecurityScheme,
  OpenIdConnectSecurityScheme as PbOpenIdConnectSecurityScheme,
  AgentSkill as PbAgentSkill,
  AgentInterface as PbAgentInterface,
  AgentCardSignature as PbAgentCardSignature,
} from '../../proto/a2a_pb';

import type {
  Message,
  Part,
  FileWithUri,
  FileWithBytes,
  Role as RoleType,
  Task,
  TaskStatus,
  TaskState as TaskStateType,
  Artifact,
  TaskStatusUpdateEvent,
  TaskArtifactUpdateEvent,
  MessageSendParams,
  MessageSendConfiguration,
  TaskQueryParams,
  TaskIdParams,
  GetTaskPushNotificationConfigParams,
  TaskPushNotificationConfig,
  PushNotificationConfig,
  PushNotificationAuthenticationInfo,
  AgentCard,
  AgentProvider,
  AgentCapabilities,
  AgentExtension,
  Security,
  SecurityScheme,
  APIKeySecurityScheme,
  HTTPAuthSecurityScheme,
  OAuth2SecurityScheme,
  OAuthFlows,
  AuthorizationCodeOAuthFlow,
  ClientCredentialsOAuthFlow,
  ImplicitOAuthFlow,
  PasswordOAuthFlow,
  MutualTLSSecurityScheme,
  OpenIdConnectSecurityScheme,
  AgentSkill,
  AgentInterface,
  AgentCardSignature,
  StreamEvent,
} from '../types/index.js';

// Regex patterns for matching
const TASK_NAME_MATCH = /tasks\/([^/]+)/;
const TASK_PUSH_CONFIG_NAME_MATCH = /tasks\/([^/]+)\/pushNotificationConfigs\/([^/]+)/;

/**
 * Converts a JavaScript object to a protobuf Struct.
 */
export function objectToStruct(obj: Record<string, any>): Struct {
  const struct = new Struct();
  if (obj && typeof obj === 'object') {
    const fields: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      fields[key] = value;
    }
    struct.setFields(fields);
  }
  return struct;
}

/**
 * Converts a protobuf Struct to a JavaScript object.
 */
export function structToObject(struct?: Struct | null): Record<string, any> {
  if (!struct || !struct.getFieldsMap()) {
    return {};
  }
  return struct.toJavaScript() as Record<string, any>;
}

export class ToProto {
  static message(message?: Message | null): PbMessage | null {
    if (!message) {
      return null;
    }

    const pbMessage = new PbMessage();
    pbMessage.setMessageId(message.message_id);
    pbMessage.setContent(message.parts.map((p) => this.part(p)));
    pbMessage.setContextId(message.context_id || '');
    pbMessage.setTaskId(message.task_id || '');
    pbMessage.setRole(this.role(message.role));
    pbMessage.setMetadata(this.metadata(message.metadata));
    pbMessage.setExtensionsList(message.extensions || []);
    return pbMessage;
  }

  static metadata(metadata?: Record<string, any> | null): Struct | null {
    if (!metadata) {
      return null;
    }
    return objectToStruct(metadata);
  }

  static part(part: Part): PbPart {
    const pbPart = new PbPart();
    pbPart.setMetadata(this.metadata(part.metadata));

    if ('text' in part.root) {
      pbPart.setText(part.root.text);
    } else if ('file' in part.root) {
      pbPart.setFile(this.file(part.root.file));
    } else if ('data' in part.root) {
      pbPart.setData(this.data(part.root.data));
    }

    return pbPart;
  }

  static data(data: Record<string, any>): PbDataPart {
    const pbData = new PbDataPart();
    pbData.setData(objectToStruct(data));
    return pbData;
  }

  static file(file: FileWithUri | FileWithBytes): PbFilePart {
    const pbFile = new PbFilePart();
    pbFile.setMimeType(file.mime_type || '');
    pbFile.setName(file.name || '');

    if ('uri' in file) {
      pbFile.setFileWithUri(file.uri);
    } else {
      pbFile.setFileWithBytes(Buffer.from(file.bytes, 'utf-8'));
    }

    return pbFile;
  }

  static task(task: Task): PbTask {
    const pbTask = new PbTask();
    pbTask.setId(task.id);
    pbTask.setContextId(task.context_id);
    pbTask.setStatus(this.taskStatus(task.status));
    pbTask.setArtifactsList(task.artifacts?.map((a) => this.artifact(a)) || []);
    pbTask.setHistoryList(task.history?.map((h) => this.message(h)) || []);
    pbTask.setMetadata(this.metadata(task.metadata));
    return pbTask;
  }

  static taskStatus(status: TaskStatus): PbTaskStatus {
    const pbStatus = new PbTaskStatus();
    pbStatus.setState(this.taskState(status.state));
    pbStatus.setUpdate(this.message(status.message));
    return pbStatus;
  }

  static taskState(state: TaskStateType): TaskState {
    switch (state) {
      case 'submitted':
        return TaskState.TASK_STATE_SUBMITTED;
      case 'working':
        return TaskState.TASK_STATE_WORKING;
      case 'completed':
        return TaskState.TASK_STATE_COMPLETED;
      case 'canceled':
        return TaskState.TASK_STATE_CANCELLED;
      case 'failed':
        return TaskState.TASK_STATE_FAILED;
      case 'input_required':
        return TaskState.TASK_STATE_INPUT_REQUIRED;
      case 'auth_required':
        return TaskState.TASK_STATE_AUTH_REQUIRED;
      default:
        return TaskState.TASK_STATE_UNSPECIFIED;
    }
  }

  static artifact(artifact: Artifact): PbArtifact {
    const pbArtifact = new PbArtifact();
    pbArtifact.setArtifactId(artifact.artifact_id);
    pbArtifact.setName(artifact.name || '');
    pbArtifact.setDescription(artifact.description || '');
    pbArtifact.setPartsList(artifact.parts.map((p) => this.part(p)));
    pbArtifact.setMetadata(this.metadata(artifact.metadata));
    pbArtifact.setExtensionsList(artifact.extensions || []);
    return pbArtifact;
  }

  static taskStatusUpdateEvent(event: TaskStatusUpdateEvent): PbTaskStatusUpdateEvent {
    const pbEvent = new PbTaskStatusUpdateEvent();
    pbEvent.setTaskId(event.task_id);
    pbEvent.setContextId(event.context_id);
    pbEvent.setStatus(this.taskStatus(event.status));
    pbEvent.setMetadata(this.metadata(event.metadata));
    pbEvent.setFinal(event.final || false);
    return pbEvent;
  }

  static taskArtifactUpdateEvent(event: TaskArtifactUpdateEvent): PbTaskArtifactUpdateEvent {
    const pbEvent = new PbTaskArtifactUpdateEvent();
    pbEvent.setTaskId(event.task_id);
    pbEvent.setContextId(event.context_id);
    pbEvent.setArtifact(this.artifact(event.artifact));
    pbEvent.setMetadata(this.metadata(event.metadata));
    pbEvent.setAppend(event.append || false);
    pbEvent.setLastChunk(event.last_chunk || false);
    return pbEvent;
  }

  static messageSendConfiguration(config?: MessageSendConfiguration | null): PbSendMessageConfiguration {
    const pbConfig = new PbSendMessageConfiguration();
    if (config?.accepted_output_modes) {
      pbConfig.setAcceptedOutputModesList(config.accepted_output_modes);
    }
    if (config?.push_notification_config) {
      pbConfig.setPushNotification(this.pushNotificationConfig(config.push_notification_config));
    }
    if (config?.history_length !== undefined) {
      pbConfig.setHistoryLength(config.history_length);
    }
    if (config?.blocking) {
      pbConfig.setBlocking(config.blocking);
    }
    return pbConfig;
  }

  static pushNotificationConfig(config: PushNotificationConfig): PbPushNotificationConfig {
    const pbConfig = new PbPushNotificationConfig();
    pbConfig.setId(config.id || '');
    pbConfig.setUrl(config.url);
    pbConfig.setToken(config.token || '');
    if (config.authentication) {
      pbConfig.setAuthentication(this.authenticationInfo(config.authentication));
    }
    return pbConfig;
  }

  static authenticationInfo(info: PushNotificationAuthenticationInfo): PbAuthenticationInfo {
    const pbInfo = new PbAuthenticationInfo();
    pbInfo.setSchemesList(info.schemes);
    pbInfo.setCredentials(info.credentials || '');
    return pbInfo;
  }

  static streamResponse(event: StreamEvent): PbStreamResponse {
    const pbResponse = new PbStreamResponse();

    if ('message_id' in event) {
      pbResponse.setMsg(this.message(event));
    } else if ('id' in event && 'status' in event) {
      pbResponse.setTask(this.task(event));
    } else if ('task_id' in event && 'status' in event && 'state' in event.status) {
      pbResponse.setStatusUpdate(this.taskStatusUpdateEvent(event));
    } else if ('task_id' in event && 'artifact_id' in event) {
      pbResponse.setArtifactUpdate(this.taskArtifactUpdateEvent(event));
    }

    return pbResponse;
  }

  static taskOrMessage(event: Task | Message): PbSendMessageResponse {
    const pbResponse = new PbSendMessageResponse();
    if ('message_id' in event) {
      pbResponse.setMsg(this.message(event));
    } else {
      pbResponse.setTask(this.task(event));
    }
    return pbResponse;
  }

  static taskPushNotificationConfig(config: TaskPushNotificationConfig): PbTaskPushNotificationConfig {
    const pbConfig = new PbTaskPushNotificationConfig();
    pbConfig.setName(`tasks/${config.task_id}/pushNotificationConfigs/${config.push_notification_config.id}`);
    pbConfig.setPushNotificationConfig(this.pushNotificationConfig(config.push_notification_config));
    return pbConfig;
  }

  static agentCard(card: AgentCard): PbAgentCard {
    const pbCard = new PbAgentCard();
    pbCard.setName(card.name);
    pbCard.setDescription(card.description || '');
    pbCard.setUrl(card.url || '');
    pbCard.setVersion(card.version || '');
    pbCard.setDocumentationUrl(card.documentation_url || '');
    if (card.provider) {
      pbCard.setProvider(this.provider(card.provider));
    }
    pbCard.setCapabilities(this.capabilities(card.capabilities));
    pbCard.setDefaultInputModesList(card.default_input_modes || []);
    pbCard.setDefaultOutputModesList(card.default_output_modes || []);
    pbCard.setSkillsList(card.skills?.map((s) => this.skill(s)) || []);
    pbCard.setSecurityList(this.security(card.security) || []);
    pbCard.setSupportsAuthenticatedExtendedCard(!!card.supports_authenticated_extended_card);
    pbCard.setPreferredTransport(card.preferred_transport || '');
    pbCard.setProtocolVersion(card.protocol_version || '');
    pbCard.setAdditionalInterfacesList(card.additional_interfaces?.map((i) => this.agentInterface(i)) || []);
    pbCard.setSignaturesList(card.signatures?.map((s) => this.agentCardSignature(s)) || []);
    return pbCard;
  }

  static agentCardSignature(signature: AgentCardSignature): PbAgentCardSignature {
    const pbSig = new PbAgentCardSignature();
    pbSig.setProtected(signature.protected);
    pbSig.setSignature(signature.signature);
    pbSig.setHeader(this.metadata(signature.header || {}));
    return pbSig;
  }

  static agentInterface(interface: AgentInterface): PbAgentInterface {
    const pbInterface = new PbAgentInterface();
    pbInterface.setTransport(interface.transport);
    pbInterface.setUrl(interface.url);
    return pbInterface;
  }

  static capabilities(capabilities: AgentCapabilities): PbAgentCapabilities {
    const pbCaps = new PbAgentCapabilities();
    pbCaps.setStreaming(!!capabilities.streaming);
    pbCaps.setPushNotifications(!!capabilities.push_notifications);
    pbCaps.setExtensionsList(capabilities.extensions?.map((e) => this.agentExtension(e)) || []);
    return pbCaps;
  }

  static agentExtension(extension: AgentExtension): PbAgentExtension {
    const pbExt = new PbAgentExtension();
    pbExt.setUri(extension.uri);
    pbExt.setDescription(extension.description || '');
    pbExt.setParams(this.metadata(extension.params || {}));
    pbExt.setRequired(!!extension.required);
    return pbExt;
  }

  static provider(provider: AgentProvider): PbAgentProvider {
    const pbProvider = new PbAgentProvider();
    pbProvider.setOrganization(provider.organization);
    pbProvider.setUrl(provider.url);
    return pbProvider;
  }

  static security(security?: Security | null): Array<PbSecurity> | null {
    if (!security) {
      return null;
    }
    // Security is a list of dictionaries in the Python version
    return [];
  }

  static role(role: RoleType): Role {
    switch (role) {
      case 'user':
        return Role.ROLE_USER;
      case 'agent':
        return Role.ROLE_AGENT;
      default:
        return Role.ROLE_UNSPECIFIED;
    }
  }

  static skill(skill: AgentSkill): PbAgentSkill {
    const pbSkill = new PbAgentSkill();
    pbSkill.setId(skill.id);
    pbSkill.setName(skill.name);
    pbSkill.setDescription(skill.description || '');
    pbSkill.setTagsList(skill.tags || []);
    pbSkill.setExamplesList(skill.examples || []);
    pbSkill.setInputModesList(skill.input_modes || []);
    pbSkill.setOutputModesList(skill.output_modes || []);
    return pbSkill;
  }
}

export class FromProto {
  static message(pbMessage: PbMessage): Message {
    return {
      message_id: pbMessage.getMessageId(),
      parts: pbMessage.getContentList().map((p) => this.part(p)),
      context_id: pbMessage.getContextId() || undefined,
      task_id: pbMessage.getTaskId() || undefined,
      role: this.role(pbMessage.getRole()),
      metadata: this.metadata(pbMessage.getMetadata()),
      extensions: pbMessage.getExtensionsList().length > 0 ? pbMessage.getExtensionsList() : undefined,
    };
  }

  static metadata(metadata?: Struct | null): Record<string, any> {
    return structToObject(metadata);
  }

  static part(pbPart: PbPart): Part {
    const metadata = this.metadata(pbPart.getMetadata());

    if (pbPart.hasText()) {
      return {
        root: {
          text: pbPart.getText(),
          metadata,
        },
      };
    }

    if (pbPart.hasFile()) {
      return {
        root: {
          file: this.file(pbPart.getFile()!),
          metadata,
        },
      };
    }

    if (pbPart.hasData()) {
      return {
        root: {
          data: this.data(pbPart.getData()!),
          metadata,
        },
      };
    }

    throw new Error(`Unsupported part type`);
  }

  static data(pbData: PbDataPart): Record<string, any> {
    return structToObject(pbData.getData());
  }

  static file(pbFile: PbFilePart): FileWithUri | FileWithBytes {
    const common = {
      mime_type: pbFile.getMimeType() || undefined,
      name: pbFile.getName() || undefined,
    };

    if (pbFile.hasFileWithUri()) {
      return {
        uri: pbFile.getFileWithUri(),
        ...common,
      };
    }

    return {
      bytes: pbFile.getFileWithBytes().toString('utf-8'),
      ...common,
    };
  }

  static taskOrMessage(pbResponse: PbSendMessageResponse): Task | Message {
    if (pbResponse.hasMsg()) {
      return this.message(pbResponse.getMsg()!);
    }
    return this.task(pbResponse.getTask()!);
  }

  static task(pbTask: PbTask): Task {
    return {
      id: pbTask.getId(),
      context_id: pbTask.getContextId(),
      status: this.taskStatus(pbTask.getStatus()!),
      artifacts: pbTask.getArtifactsList().map((a) => this.artifact(a)),
      history: pbTask.getHistoryList().map((h) => this.message(h)),
      metadata: this.metadata(pbTask.getMetadata()),
    };
  }

  static taskStatus(pbStatus: PbTaskStatus): TaskStatus {
    return {
      state: this.taskState(pbStatus.getState()),
      message: this.message(pbStatus.getUpdate()!),
    };
  }

  static taskState(state: TaskState): TaskStateType {
    switch (state) {
      case TaskState.TASK_STATE_SUBMITTED:
        return 'submitted';
      case TaskState.TASK_STATE_WORKING:
        return 'working';
      case TaskState.TASK_STATE_COMPLETED:
        return 'completed';
      case TaskState.TASK_STATE_CANCELLED:
        return 'canceled';
      case TaskState.TASK_STATE_FAILED:
        return 'failed';
      case TaskState.TASK_STATE_INPUT_REQUIRED:
        return 'input_required';
      case TaskState.TASK_STATE_AUTH_REQUIRED:
        return 'auth_required';
      default:
        return 'unknown';
    }
  }

  static artifact(pbArtifact: PbArtifact): Artifact {
    return {
      artifact_id: pbArtifact.getArtifactId(),
      name: pbArtifact.getName() || '',
      description: pbArtifact.getDescription() || '',
      parts: pbArtifact.getPartsList().map((p) => this.part(p)),
      metadata: this.metadata(pbArtifact.getMetadata()),
      extensions: pbArtifact.getExtensionsList().length > 0 ? pbArtifact.getExtensionsList() : undefined,
    };
  }

  static taskStatusUpdateEvent(pbEvent: PbTaskStatusUpdateEvent): TaskStatusUpdateEvent {
    return {
      task_id: pbEvent.getTaskId(),
      context_id: pbEvent.getContextId(),
      status: this.taskStatus(pbEvent.getStatus()!),
      metadata: this.metadata(pbEvent.getMetadata()),
      final: pbEvent.getFinal(),
    };
  }

  static taskArtifactUpdateEvent(pbEvent: PbTaskArtifactUpdateEvent): TaskArtifactUpdateEvent {
    return {
      task_id: pbEvent.getTaskId(),
      context_id: pbEvent.getContextId(),
      artifact: this.artifact(pbEvent.getArtifact()!),
      metadata: this.metadata(pbEvent.getMetadata()),
      append: pbEvent.getAppend(),
      last_chunk: pbEvent.getLastChunk(),
    };
  }

  static messageSendConfiguration(pbConfig: PbSendMessageConfiguration): MessageSendConfiguration {
    return {
      accepted_output_modes: pbConfig.getAcceptedOutputModesList().length > 0
        ? pbConfig.getAcceptedOutputModesList()
        : undefined,
      push_notification_config: pbConfig.hasPushNotification()
        ? this.pushNotificationConfig(pbConfig.getPushNotification()!)
        : undefined,
      history_length: pbConfig.getHistoryLength() || undefined,
      blocking: pbConfig.getBlocking() || undefined,
    };
  }

  static messageSendParams(pbRequest: PbSendMessageRequest): MessageSendParams {
    return {
      configuration: this.messageSendConfiguration(pbRequest.getConfiguration()!),
      message: this.message(pbRequest.getRequest()!),
      metadata: this.metadata(pbRequest.getMetadata()),
    };
  }

  static taskIdParams(pbRequest: PbCancelTaskRequest | PbTaskSubscriptionRequest | PbGetTaskPushNotificationConfigRequest): TaskIdParams {
    let match: RegExpMatchArray | null;

    if (pbRequest instanceof PbGetTaskPushNotificationConfigRequest) {
      match = pbRequest.getName().match(TASK_PUSH_CONFIG_NAME_MATCH);
      if (!match) {
        throw new Error(`Invalid task resource name: ${pbRequest.getName()}`);
      }
      return { id: match[1] };
    }

    match = pbRequest.getName().match(TASK_NAME_MATCH);
    if (!match) {
      throw new Error(`Invalid task resource name: ${pbRequest.getName()}`);
    }
    return { id: match[1] };
  }

  static taskQueryParams(pbRequest: PbGetTaskRequest): TaskQueryParams {
    const match = pbRequest.getName().match(TASK_NAME_MATCH);
    if (!match) {
      throw new Error(`Invalid task resource name: ${pbRequest.getName()}`);
    }
    return {
      id: match[1],
      history_length: pbRequest.getHistoryLength() || undefined,
      metadata: undefined,
    };
  }

  static pushNotificationConfig(pbConfig: PbPushNotificationConfig): PushNotificationConfig {
    return {
      id: pbConfig.getId(),
      url: pbConfig.getUrl(),
      token: pbConfig.getToken(),
      authentication: pbConfig.hasAuthentication()
        ? this.authenticationInfo(pbConfig.getAuthentication()!)
        : undefined,
    };
  }

  static authenticationInfo(pbInfo: PbAuthenticationInfo): PushNotificationAuthenticationInfo {
    return {
      schemes: pbInfo.getSchemesList(),
      credentials: pbInfo.getCredentials(),
    };
  }

  static taskPushNotificationConfig(pbConfig: PbTaskPushNotificationConfig): TaskPushNotificationConfig {
    const match = pbConfig.getName().match(TASK_PUSH_CONFIG_NAME_MATCH);
    if (!match) {
      throw new Error(`Invalid TaskPushNotificationConfig resource name: ${pbConfig.getName()}`);
    }

    return {
      task_id: match[1],
      push_notification_config: this.pushNotificationConfig(pbConfig.getPushNotificationConfig()!),
    };
  }

  static agentCard(pbCard: PbAgentCard): AgentCard {
    return {
      name: pbCard.getName(),
      description: pbCard.getDescription() || '',
      url: pbCard.getUrl() || '',
      version: pbCard.getVersion() || '',
      documentation_url: pbCard.getDocumentationUrl() || '',
      provider: pbCard.hasProvider() ? this.provider(pbCard.getProvider()!) : undefined,
      capabilities: this.capabilities(pbCard.getCapabilities()!),
      default_input_modes: pbCard.getDefaultInputModesList(),
      default_output_modes: pbCard.getDefaultOutputModesList(),
      skills: pbCard.getSkillsList().map((s) => this.skill(s)),
      security: pbCard.getSecurityList().length > 0 ? [] : undefined,
      security_schemes: pbCard.getSecuritySchemesMap().toObject() as any,
      supports_authenticated_extended_card: pbCard.getSupportsAuthenticatedExtendedCard(),
      preferred_transport: pbCard.getPreferredTransport() || '',
      protocol_version: pbCard.getProtocolVersion() || '',
      additional_interfaces: pbCard.getAdditionalInterfacesList().map((i) => this.agentInterface(i)),
      signatures: pbCard.getSignaturesList().map((s) => this.agentCardSignature(s)),
    };
  }

  static agentCardSignature(pbSig: PbAgentCardSignature): AgentCardSignature {
    return {
      protected: pbSig.getProtected(),
      signature: pbSig.getSignature(),
      header: this.metadata(pbSig.getHeader()),
    };
  }

  static agentInterface(pbInterface: PbAgentInterface): AgentInterface {
    return {
      transport: pbInterface.getTransport(),
      url: pbInterface.getUrl(),
    };
  }

  static capabilities(pbCaps: PbAgentCapabilities): AgentCapabilities {
    return {
      streaming: pbCaps.getStreaming(),
      push_notifications: pbCaps.getPushNotifications(),
      extensions: pbCaps.getExtensionsList().map((e) => this.agentExtension(e)),
    };
  }

  static agentExtension(pbExt: PbAgentExtension): AgentExtension {
    return {
      uri: pbExt.getUri(),
      description: pbExt.getDescription(),
      params: this.metadata(pbExt.getParams()),
      required: pbExt.getRequired(),
    };
  }

  static provider(pbProvider: PbAgentProvider): AgentProvider {
    return {
      organization: pbProvider.getOrganization(),
      url: pbProvider.getUrl(),
    };
  }

  static streamResponse(pbResponse: PbStreamResponse): StreamEvent {
    if (pbResponse.hasMsg()) {
      return this.message(pbResponse.getMsg()!);
    }
    if (pbResponse.hasTask()) {
      return this.task(pbResponse.getTask()!);
    }
    if (pbResponse.hasStatusUpdate()) {
      return this.taskStatusUpdateEvent(pbResponse.getStatusUpdate()!);
    }
    if (pbResponse.hasArtifactUpdate()) {
      return this.taskArtifactUpdateEvent(pbResponse.getArtifactUpdate()!);
    }
    throw new Error('Unsupported StreamResponse type');
  }

  static skill(pbSkill: PbAgentSkill): AgentSkill {
    return {
      id: pbSkill.getId(),
      name: pbSkill.getName(),
      description: pbSkill.getDescription(),
      tags: pbSkill.getTagsList(),
      examples: pbSkill.getExamplesList(),
      input_modes: pbSkill.getInputModesList(),
      output_modes: pbSkill.getOutputModesList(),
    };
  }

  static role(role: Role): RoleType {
    switch (role) {
      case Role.ROLE_USER:
        return 'user';
      case Role.ROLE_AGENT:
        return 'agent';
      default:
        return 'agent';
    }
  }
}
