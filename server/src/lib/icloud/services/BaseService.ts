/**
 * Base service class for all iCloud services
 */

import type { ICloud } from '../ICloud';
import type { WebServices } from '../types/session';
import { getHostFromWebservice, buildUrl } from '../utils/helpers';
import { ICloudError } from '../errors/ICloudError';

export abstract class BaseService {
  protected readonly client: ICloud;

  constructor(client: ICloud) {
    this.client = client;
  }

  /**
   * Get the hostname for a specific webservice
   */
  protected getHost(serviceName: keyof WebServices): string {
    const service = this.client.account?.webservices[serviceName];
    if (!service) {
      throw new ICloudError(
        `Service ${serviceName} is not available`,
        'SERVICE_UNAVAILABLE'
      );
    }
    return getHostFromWebservice(service);
  }

  /**
   * Get the full URL for a specific webservice endpoint
   */
  protected getServiceUrl(serviceName: keyof WebServices, path: string): string {
    const host = this.getHost(serviceName);
    return `https://${host}${path}`;
  }

  /**
   * Get default query parameters for requests
   */
  protected getDefaultParams(): Record<string, string> {
    const { clientSettings } = this.client;
    const dsid = this.client.account?.dsInfo.dsid;

    return {
      clientBuildNumber: clientSettings.clientBuildNumber,
      clientId: clientSettings.clientId,
      clientMasteringNumber: clientSettings.clientMasteringNumber,
      ...(dsid && { dsid }),
    };
  }

  /**
   * Build URL with default and custom parameters
   */
  protected buildServiceUrl(
    serviceName: keyof WebServices,
    path: string,
    additionalParams?: Record<string, string | number | boolean | undefined>
  ): string {
    const baseUrl = this.getServiceUrl(serviceName, path);
    return buildUrl(baseUrl, {
      ...this.getDefaultParams(),
      ...additionalParams,
    });
  }

  /**
   * Make an authenticated GET request to a service
   */
  protected async get<T>(
    serviceName: keyof WebServices,
    path: string,
    params?: Record<string, string | number | boolean | undefined>
  ): Promise<T> {
    const url = this.getServiceUrl(serviceName, path);
    const response = await this.client.http.get<T>(url, {
      params: {
        ...this.getDefaultParams(),
        ...params,
      },
    });
    return response.data;
  }

  /**
   * Make an authenticated POST request to a service
   */
  protected async post<T>(
    serviceName: keyof WebServices,
    path: string,
    body?: unknown,
    params?: Record<string, string | number | boolean | undefined>
  ): Promise<T> {
    const url = this.getServiceUrl(serviceName, path);
    const response = await this.client.http.post<T>(url, body, {
      params: {
        ...this.getDefaultParams(),
        ...params,
      },
    });
    return response.data;
  }

  /**
   * Make an authenticated PUT request to a service
   */
  protected async put<T>(
    serviceName: keyof WebServices,
    path: string,
    body?: unknown,
    params?: Record<string, string | number | boolean | undefined>
  ): Promise<T> {
    const url = this.getServiceUrl(serviceName, path);
    const response = await this.client.http.put<T>(url, body, {
      params: {
        ...this.getDefaultParams(),
        ...params,
      },
    });
    return response.data;
  }

  /**
   * Make an authenticated DELETE request to a service
   */
  protected async delete<T>(
    serviceName: keyof WebServices,
    path: string,
    params?: Record<string, string | number | boolean | undefined>
  ): Promise<T> {
    const url = this.getServiceUrl(serviceName, path);
    const response = await this.client.http.delete<T>(url, {
      params: {
        ...this.getDefaultParams(),
        ...params,
      },
    });
    return response.data;
  }

  /**
   * Check if the service is available
   */
  public isAvailable(): boolean {
    return this.getServiceConfig()?.status === 'active';
  }

  /**
   * Get the service configuration
   * Override in subclasses to specify the service name
   */
  protected abstract getServiceConfig(): { url: string; status: string } | undefined;
}
