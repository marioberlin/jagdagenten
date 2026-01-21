/**
 * Find My Service for iCloud Find My API
 */

import { BaseService } from './BaseService';
import type {
  Device,
  Friend,
  Item,
  FindMyListResponse,
  FindMyFriendsResponse,
  FindMyItemsResponse,
  ServerContext,
  PlaySoundInput,
  LostModeInput,
  LocationRefreshResponse,
  SendMessageInput,
  RemoteLockInput,
  ShareLocationInput,
  FindMyQueryOptions,
} from '../types/findmy';
import { ICloudError } from '../errors/ICloudError';

export class FindMyService extends BaseService {
  private devices: Device[] = [];
  private friends: Friend[] = [];
  private items: Item[] = [];
  private _serverContext?: ServerContext;
  private initialized = false;

  get serverContext(): ServerContext | undefined {
    return this._serverContext;
  }

  protected getServiceConfig() {
    return this.client.account?.webservices.findme;
  }

  /**
   * Initialize Find My service and get all data
   */
  async startup(): Promise<{
    devices: Device[];
    friends: Friend[];
    items: Item[];
  }> {
    await Promise.all([
      this.refreshDevices(),
      this.refreshFriends(),
      this.refreshItems(),
    ]);

    this.initialized = true;

    return {
      devices: this.devices,
      friends: this.friends,
      items: this.items,
    };
  }

  /**
   * Refresh and get all devices
   */
  async refreshDevices(): Promise<Device[]> {
    const response = await this.post<FindMyListResponse>(
      'findme',
      '/fmipservice/client/web/refreshClient',
      {
        clientContext: {
          fmly: true,
          shouldLocate: true,
          selectedDevice: 'all',
          deviceListVersion: 1,
        },
      }
    );

    this.devices = response.content || [];
    this._serverContext = response.serverContext;

    return this.devices;
  }

  /**
   * Get all devices
   */
  async listDevices(options: FindMyQueryOptions = {}): Promise<Device[]> {
    if (!this.initialized || options.refreshLocations) {
      await this.refreshDevices();
    }
    return this.devices;
  }

  /**
   * Get a specific device
   */
  async getDevice(deviceId: string): Promise<Device | null> {
    const devices = await this.listDevices();
    return devices.find(d => d.id === deviceId) || null;
  }

  /**
   * Refresh location for a specific device
   */
  async refreshDeviceLocation(deviceId: string): Promise<Device | null> {
    const response = await this.post<LocationRefreshResponse>(
      'findme',
      '/fmipservice/client/web/refreshClient',
      {
        clientContext: {
          fmly: true,
          shouldLocate: true,
          selectedDevice: deviceId,
          deviceListVersion: 1,
        },
      }
    );

    // Update local cache
    if (response.device) {
      const index = this.devices.findIndex(d => d.id === deviceId);
      if (index !== -1) {
        this.devices[index] = response.device;
      }
      return response.device;
    }

    return null;
  }

  /**
   * Play sound on a device
   */
  async playSound(input: PlaySoundInput): Promise<void> {
    await this.post(
      'findme',
      '/fmipservice/client/web/playSound',
      {
        device: input.deviceId,
        subject: input.subject || 'Find My iPhone Alert',
      }
    );
  }

  /**
   * Enable or disable lost mode
   */
  async setLostMode(input: LostModeInput): Promise<void> {
    if (input.enable) {
      await this.post(
        'findme',
        '/fmipservice/client/web/lostDevice',
        {
          device: input.deviceId,
          lostModeEnabled: true,
          ownerNbr: input.phoneNumber,
          text: input.text || 'This device has been lost. Please call the owner.',
          emailUpdates: input.emailUpdates ?? true,
        }
      );
    } else {
      await this.post(
        'findme',
        '/fmipservice/client/web/lostDevice',
        {
          device: input.deviceId,
          lostModeEnabled: false,
          stopLostMode: true,
        }
      );
    }
  }

  /**
   * Send a message to a device
   */
  async sendMessage(input: SendMessageInput): Promise<void> {
    await this.post(
      'findme',
      '/fmipservice/client/web/sendMessage',
      {
        device: input.deviceId,
        subject: input.subject,
        text: input.text,
        sound: input.sound ?? true,
      }
    );
  }

  /**
   * Remote lock a device
   */
  async remoteLock(input: RemoteLockInput): Promise<void> {
    const device = await this.getDevice(input.deviceId);
    if (!device) {
      throw new ICloudError('Device not found', 'NOT_FOUND');
    }

    if (!device.lostModeCapable) {
      throw new ICloudError('Device does not support remote lock', 'INVALID_REQUEST');
    }

    await this.post(
      'findme',
      '/fmipservice/client/web/lockDevice',
      {
        device: input.deviceId,
        passcode: input.passcode,
        ownerNbr: input.ownerNbr,
        text: input.text,
      }
    );
  }

  /**
   * Remote wipe a device
   */
  async remoteWipe(deviceId: string): Promise<void> {
    const device = await this.getDevice(deviceId);
    if (!device) {
      throw new ICloudError('Device not found', 'NOT_FOUND');
    }

    if (!device.canWipeAfterLock) {
      throw new ICloudError('Device does not support remote wipe', 'INVALID_REQUEST');
    }

    await this.post(
      'findme',
      '/fmipservice/client/web/wipeDevice',
      {
        device: deviceId,
      }
    );
  }

  /**
   * Get devices with low battery
   */
  async getLowBatteryDevices(threshold: number = 20): Promise<Device[]> {
    const devices = await this.listDevices();
    return devices.filter(d => d.batteryLevel * 100 < threshold);
  }

  /**
   * Get offline devices
   */
  async getOfflineDevices(): Promise<Device[]> {
    const devices = await this.listDevices();
    return devices.filter(d => !d.locationEnabled || !d.location);
  }

  // Friends / Family Sharing

  /**
   * Refresh friends list
   */
  async refreshFriends(): Promise<Friend[]> {
    try {
      const response = await this.get<FindMyFriendsResponse>(
        'fmf',
        '/fmipservice/friends'
      );

      this.friends = [
        ...(response.friends || []),
        ...(response.following || []),
      ];

      return this.friends;
    } catch (error) {
      // FMF may not be available
      this.friends = [];
      return [];
    }
  }

  /**
   * Get all friends
   */
  async listFriends(): Promise<Friend[]> {
    if (!this.initialized) {
      await this.refreshFriends();
    }
    return this.friends;
  }

  /**
   * Get a specific friend
   */
  async getFriend(friendId: string): Promise<Friend | null> {
    const friends = await this.listFriends();
    return friends.find(f => f.id === friendId) || null;
  }

  /**
   * Share location with someone
   */
  async shareLocation(input: ShareLocationInput): Promise<void> {
    await this.post(
      'fmf',
      '/fmipservice/friends/invite',
      {
        email: input.email,
        duration: input.duration,
        label: input.label,
      }
    );
  }

  /**
   * Stop sharing location with someone
   */
  async stopSharingLocation(friendId: string): Promise<void> {
    await this.post(
      'fmf',
      '/fmipservice/friends/remove',
      {
        friendId,
      }
    );
  }

  // Items (AirTags, etc.)

  /**
   * Refresh items list
   */
  async refreshItems(): Promise<Item[]> {
    try {
      const response = await this.post<FindMyItemsResponse>(
        'findme',
        '/fmipservice/client/web/findItems',
        {}
      );

      this.items = response.items || response.rawItems || [];
      return this.items;
    } catch (error) {
      // Items may not be available
      this.items = [];
      return [];
    }
  }

  /**
   * Get all items
   */
  async listItems(): Promise<Item[]> {
    if (!this.initialized) {
      await this.refreshItems();
    }
    return this.items;
  }

  /**
   * Get a specific item
   */
  async getItem(itemId: string): Promise<Item | null> {
    const items = await this.listItems();
    return items.find(i => i.id === itemId) || null;
  }

  /**
   * Play sound on an item
   */
  async playItemSound(itemId: string): Promise<void> {
    await this.post(
      'findme',
      '/fmipservice/client/web/playItemSound',
      {
        itemId,
      }
    );
  }

  /**
   * Enable lost mode on an item
   */
  async setItemLostMode(
    itemId: string,
    enable: boolean,
    message?: string,
    phoneNumber?: string
  ): Promise<void> {
    await this.post(
      'findme',
      '/fmipservice/client/web/itemLostMode',
      {
        itemId,
        enabled: enable,
        message,
        phoneNumber,
      }
    );
  }

  // Utility methods

  /**
   * Get all locatable entities (devices, friends, items)
   */
  async getAllLocations(): Promise<{
    devices: Device[];
    friends: Friend[];
    items: Item[];
  }> {
    await Promise.all([
      this.refreshDevices(),
      this.refreshFriends(),
      this.refreshItems(),
    ]);

    return {
      devices: this.devices,
      friends: this.friends,
      items: this.items,
    };
  }

  /**
   * Get the current user's device
   */
  async getThisDevice(): Promise<Device | null> {
    const devices = await this.listDevices();
    return devices.find(d => d.thisDevice) || null;
  }

  /**
   * Get family devices
   */
  async getFamilyDevices(): Promise<Device[]> {
    const devices = await this.listDevices();
    return devices.filter(d => d.fmlyShare);
  }

  /**
   * Check if any device is being located
   */
  async isLocating(): Promise<boolean> {
    const devices = await this.listDevices();
    return devices.some(d => d.isLocating);
  }

  /**
   * Get device location as a simple object
   */
  getSimpleLocation(device: Device): {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: Date;
  } | null {
    if (!device.location) return null;

    return {
      latitude: device.location.latitude,
      longitude: device.location.longitude,
      accuracy: device.location.horizontalAccuracy,
      timestamp: new Date(device.location.timeStamp),
    };
  }

  /**
   * Calculate distance between two devices (in meters)
   */
  calculateDistance(device1: Device, device2: Device): number | null {
    if (!device1.location || !device2.location) return null;

    return this.haversineDistance(
      device1.location.latitude,
      device1.location.longitude,
      device2.location.latitude,
      device2.location.longitude
    );
  }

  private haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) *
        Math.cos(phi2) *
        Math.sin(deltaLambda / 2) *
        Math.sin(deltaLambda / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}
