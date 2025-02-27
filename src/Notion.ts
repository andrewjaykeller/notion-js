import {
  Observable,
  BehaviorSubject,
  throwError,
  of,
  from
} from "rxjs";
import { map, share, switchMap } from "rxjs/operators";
import {
  ApiClient,
  credentialWithLink,
  createUser,
  SERVER_TIMESTAMP
} from "./api/index";
import { NotionOptions } from "./types/options";
import { Training } from "./types/training";
import { SkillInstance } from "./types/skill";
import {
  Credentials,
  EmailAndPassword,
  CustomToken
} from "./types/credentials";
import { Settings, ChangeSettings } from "./types/settings";
import { SignalQuality } from "./types/signalQuality";
import { Kinesis } from "./types/kinesis";
import { Calm } from "./types/calm";
import { Focus } from "./types/focus";
import { getLabels } from "./utils/subscription";
import { Subscription } from "./types/subscriptions";
import {
  BrainwavesLabel,
  Epoch,
  PowerByBand,
  PSD
} from "./types/brainwaves";
import { Accelerometer } from "./types/accelerometer";
import { DeviceInfo } from "./types/deviceInfo";
import { DeviceStatus } from "./types/status";
import { Action } from "./types/actions";
import { HapticEffects } from "./types/hapticEffects";
import * as errors from "./utils/errors";
import * as platform from "./utils/platform";
import * as hapticEffects from "./utils/hapticEffects";
import {
  validateOAuthScopeForFunctionName,
  validateOAuthScopeForAction
} from "./utils/oauth";
import { createOAuthURL } from "./api/https/createOAuthURL";
import { getOAuthToken } from "./api/https/getOAuthToken";
import {
  OAuthConfig,
  OAuthQuery,
  OAuthQueryResult,
  OAuthRemoveResponse
} from "./types/oauth";
import { UserClaims } from "./types/user";
import { isNode } from "./utils/is-node";
import { getMetric } from "./utils/metrics";
import { Experiment } from "./types/experiment";
import { TransferDeviceOptions } from "./utils/transferDevice";

const defaultOptions = {
  timesync: false,
  autoSelectDevice: true,
  emulator: false,
  emulatorHost: "localhost",
  emulatorAuthPort: 9099,
  emulatorDatabasePort: 9000,
  emulatorFunctionsPort: 5001,
  emulatorFirestorePort: 8080,
  emulatorOptions: {}
};

/**
 * Example
 * ```typescript
 * import { Notion } from "@neurosity/notion";
 *
 * const notion = new Notion();
 * ```
 */
export class Notion {
  /**
   * @hidden
   */
  protected options: NotionOptions;

  /**
   * @hidden
   */
  protected api: ApiClient;

  /**
   * @internal
   */
  private _localModeSubject: BehaviorSubject<boolean> =
    new BehaviorSubject(false);

  /**
   *
   * @hidden
   */
  static credentialWithLink = credentialWithLink;

  /**
   *
   * @hidden
   */
  static createUser = createUser;

  /**
   *
   * @hidden
   */
  static SERVER_TIMESTAMP = SERVER_TIMESTAMP;

  /**
   * Creates new instance of Notion
   * 
   * ```typescript
   * const notion = new Notion();
   * ```

   * @param options
   */
  constructor(options: NotionOptions = {}) {
    this.options = Object.freeze({
      ...defaultOptions,
      ...options
    });

    this.api = new ApiClient(this.options);
  }

  /**
   *
   * @hidden
   */
  private _getMetricDependencies() {
    return {
      options: this.options,
      api: this.api,
      onDeviceChange: this.onDeviceChange.bind(this),
      isLocalMode: this.isLocalMode.bind(this),
      socketUrl: this.socketUrl.bind(this),
      status: this.status.bind(this)
    };
  }

  /**
   * Starts user session
   *
   * ```typescript
   * await notion.login({
   *   email: "...",
   *   password: "..."
   * });
   * ```
   *
   * @param credentials
   */
  public async login(credentials: Credentials): Promise<void> {
    return await this.api.login(credentials);
  }

  /**
   * Ends user session
   *
   * ```typescript
   * await notion.logout();
   * // session has ended
   * ```
   *
   */
  public async logout(): Promise<void> {
    return await this.api.logout();
  }

  /**
   * @internal
   * Not user facing.
   */
  public __getApp() {
    return this.api.__getApp();
  }

  /**
   * Subscribe to auth state changes
   *
   * Streams the state of the auth session. If user has logged in, the user object will be set. When logged out, the user object will be null.
   *
   * ```typescript
   * notion.onAuthStateChanged().subscribe((user) => {
   *   console.log(user);
   * });
   * ```
   */
  public onAuthStateChanged(): Observable<any> {
    return this.api.onAuthStateChanged();
  }

  /**
   * @internal
   * Not user facing yet
   */
  public addDevice(deviceId: string): Promise<void> {
    const [hasOAuthError, OAuthError] =
      validateOAuthScopeForFunctionName(
        this.api.userClaims,
        "addDevice"
      );

    if (hasOAuthError) {
      return Promise.reject(OAuthError);
    }

    return this.api.addDevice(deviceId);
  }

  /**
   * @internal
   * Not user facing yet
   */
  public removeDevice(deviceId: string): Promise<void> {
    const [hasOAuthError, OAuthError] =
      validateOAuthScopeForFunctionName(
        this.api.userClaims,
        "removeDevice"
      );

    if (hasOAuthError) {
      return Promise.reject(OAuthError);
    }

    return this.api.removeDevice(deviceId);
  }

  /**
   * @internal
   * Not user facing yet
   */
  public transferDevice(options: TransferDeviceOptions): Promise<void> {
    const [hasOAuthError, OAuthError] =
      validateOAuthScopeForFunctionName(
        this.api.userClaims,
        "transferDevice"
      );

    if (hasOAuthError) {
      return Promise.reject(OAuthError);
    }

    return this.api.transferDevice(options);
  }

  /**
   * @internal
   * Not user facing yet
   */
  public onUserDevicesChange(): Observable<DeviceInfo[]> {
    const [hasOAuthError, OAuthError] =
      validateOAuthScopeForFunctionName(
        this.api.userClaims,
        "onUserDevicesChange"
      );

    if (hasOAuthError) {
      return throwError(OAuthError);
    }

    return this.api.onUserDevicesChange();
  }

  /**
   * @internal
   * Not user facing yet
   */
  public onUserClaimsChange(): Observable<UserClaims> {
    return this.api.onUserClaimsChange();
  }

  /**
   * Get user devices
   *
   * Returns a list of devices claimed by the user authenticated.
   *
   * ```typescript
   * const devices = await notion.getDevices();
   * console.log(devices);
   * ```
   */
  public async getDevices(): Promise<DeviceInfo[]> {
    return await this.api.getDevices();
  }

  /**
   * Select Device
   *
   * Rarely necessary, but useful when the user owns multiple devices.
   *
   * A common use case for manually selecting a device is when you wish to build a device dropdown a user can select from, instead of collecting the Device Id from the user ahead of time.
   *
   * The 3 steps to manually selecting a device are:
   *
   * - Set `autoSelectDevice` to false when instantiating `Notion`.
   * - Authenticate with your Neurosity account to access your devices by calling the `notion.login(...)` function.
   * - Call the `notion.selectDevice(...)` function with a device selector function.
   *
   * ```typescript
   * const devices = await notion.selectDevice((devices) =>
   *   devices.find((device) => device.deviceNickname === "Notion-A1B")
   * );
   *
   * console.log(devices);
   * ```
   *
   * > If you own multiple devices, and don't pass `autoSelectDevice`, then the first device on the list will be automatically selected.
   *
   * For more info, check out the "Device Selection" guide.
   */
  public async selectDevice(
    deviceSelector: (devices: DeviceInfo[]) => DeviceInfo
  ): Promise<DeviceInfo> {
    const [hasOAuthError, OAuthError] =
      validateOAuthScopeForFunctionName(
        this.api.userClaims,
        "selectDevice"
      );

    if (hasOAuthError) {
      return Promise.reject(OAuthError);
    }

    return await this.api.selectDevice(deviceSelector);
  }

  /**
   * Get selected device
   *
   * ```typescript
   * const selectedDevice = await notion.getSelectedDevice();
   * console.log(selectedDevice);
   * ```
   */

  public async getSelectedDevice(): Promise<DeviceInfo> {
    const [hasOAuthError, OAuthError] =
      validateOAuthScopeForFunctionName(
        this.api.userClaims,
        "getSelectedDevice"
      );

    if (hasOAuthError) {
      return Promise.reject(OAuthError);
    }

    return await this.api.getSelectedDevice();
  }

  /**
   * ```typescript
   * const info = await notion.getInfo();
   * ```
   */
  public async getInfo(): Promise<DeviceInfo> {
    if (!this.api.didSelectDevice()) {
      return Promise.reject(errors.mustSelectDevice);
    }

    const [hasOAuthError, OAuthError] =
      validateOAuthScopeForFunctionName(this.api.userClaims, "getInfo");

    if (hasOAuthError) {
      return Promise.reject(OAuthError);
    }

    return await this.api.getInfo();
  }

  /**
   * Observes Local Mode changes
   *
   * ```typescript
   * notion.isLocalMode().subscribe(isLocalMode => {
   *  console.log(isLocalMode);
   * });
   * ```
   */
  public isLocalMode(): Observable<boolean> {
    return this._localModeSubject.asObservable().pipe(share());
  }

  /**
   * Observes selected device
   *
   * ```typescript
   * notion.onDeviceChange().subscribe(device => {
   *  console.log(device);
   * });
   * ```
   */
  public onDeviceChange(): Observable<DeviceInfo> {
    const [hasOAuthError, OAuthError] =
      validateOAuthScopeForFunctionName(
        this.api.userClaims,
        "onDeviceChange"
      );

    if (hasOAuthError) {
      return throwError(OAuthError);
    }

    return this.api.onDeviceChange();
  }

  /**
   * Enables/disables local mode
   *
   * With local mode, device metrics like brainwaves, calm, focus, etc will stream
   * via your local WiFi network and not the default cloud server.
   *
   * Local Mode is disabled by default, to enable it:
   *
   * ```typescript
   * await notion.enableLocalMode(true);
   * ```
   *
   * To disable it:
   *
   * ```typescript
   * await notion.enableLocalMode(false);
   * ```
   *
   * Keep in mind:
   *  - Activity Logging will <em>not work</em> while this setting is enabled.
   *  - Your Notion must be connected to the same WiFi network as this device to establish communication.
   *  - An internet connection is still needed to authenticate, get device status and add metric subscriptions.
   *  - This setting is not global and needs to be set for every Notion app you wish to affect.
   */
  public async enableLocalMode(
    shouldEnable: boolean
  ): Promise<boolean> {
    if (typeof shouldEnable !== "boolean") {
      return Promise.reject(
        new TypeError("enableLocalMode can only accept a boolean")
      );
    }

    if (!shouldEnable) {
      this._localModeSubject.next(shouldEnable);
      return shouldEnable;
    }

    const [localModeSupported, error] = await this.api
      .onceNamespace("context/socketUrl")
      .then((socketUrl) => {
        if (!socketUrl) {
          const error = `${errors.prefix}Your device's OS does not support localMode. Try updating to the latest OS.`;
          return [false, new Error(error)];
        }
        return [true, null];
      })
      .catch((error) => [false, error]);

    if (!localModeSupported) {
      return Promise.reject(error);
    }

    this._localModeSubject.next(shouldEnable);

    return shouldEnable;
  }

  /**
   * Ends database connection
   *
   * ```typescript
   * await notion.disconnect();
   * ```
   */
  public async disconnect(): Promise<void> {
    return await this.api.disconnect();
  }

  /**
   * @internal
   * Not user facing
   */
  protected socketUrl(): Observable<string> {
    const { onDeviceSocketUrl } = this.options;

    if (onDeviceSocketUrl) {
      return of(onDeviceSocketUrl);
    }

    return this.api.observeNamespace("context/socketUrl");
  }

  /**
   * @internal
   * Not user facing
   */
  private dispatchAction(action: Action): Promise<Action> {
    if (!this.api.didSelectDevice()) {
      return Promise.reject(errors.mustSelectDevice);
    }

    const [hasOAuthError, OAuthError] = validateOAuthScopeForAction(
      this.api.userClaims,
      action
    );

    if (hasOAuthError) {
      return Promise.reject(OAuthError);
    }

    return this.api.actions.dispatch(action);
  }

  /**
   * Injects an EEG marker to data stream
   *
   * ```typescript
   * notion.addMarker("eyes-closed");
   *
   * // later...
   *
   * notion.addMarker("eyes-open");
   * ```
   *
   * @param label Name the label to inject
   */
  public addMarker(label: string): Promise<Action> {
    if (!this.api.didSelectDevice()) {
      throw errors.mustSelectDevice;
    }

    if (!label) {
      throw new Error(
        `${errors.prefix}A label is required for addMarker`
      );
    }

    return this.dispatchAction({
      command: "marker",
      action: "add",
      message: {
        label,
        timestamp: this.api.timestamp
      }
    });
  }

  /**
   * Queue haptic motor commands
   *
   * To queue haptic P7 only,
   * ```typescript
   * await notion.haptics({
   *   P7: ["tripleClick100"]
   * });
   * ```
   *
   * To queue both motors at the same time
   * ```typescript
   * await notion.haptics({
   *   P7: [notion.getHapticEffects().strongClick100],
   *   P8: [notion.getHapticEffects().strongClick100]
   * });
   * ```
   *
   * You can queue different commands to the motors too
   * ```typescript
   * const effects = notion.getHapticEffects();
   * await notion.haptics({
   *   P7: [effects.transitionRampUpLongSmooth1_0_to_100,
   *         effects.transitionRampDownLongSmooth1_100_to_0],
   *   P8: [effects.strongClick100]
   * });
   * ```
   *
   * @param effects Effects to queue. The key of the object passed should be the location of the motor
   *  to queue. Each key can be an array of up to 7 commands. There is no haptic support on model
   *  version 1, Notion DK1. The Haptic motor's location is positioned in reference to the 10-10 EEG
   *  system used to label the channels of the Crown's EEG sensors. Notion 2 and Crown have haptics
   *  at P7 and P8. A list of haptic commands can be found on ./utils/hapticCodes.ts - there
   *  are about 127 of them!
   */
  public async haptics(effects: any): Promise<any> {
    const metric = "haptics";
    if (!this.api.didSelectDevice()) {
      return Promise.reject(errors.mustSelectDevice);
    }

    const modelVersion = (await this.getSelectedDevice()).modelVersion;
    const supportsHaptics = platform.supportsHaptics(modelVersion);

    if (!supportsHaptics) {
      return Promise.reject(
        errors.metricNotSupportedByModel(metric, modelVersion)
      );
    }

    const newPlatformHapticRequest =
      platform.getPlatformHapticMotors(modelVersion);

    for (const key in effects) {
      if (!Object.keys(newPlatformHapticRequest).includes(key)) {
        return Promise.reject(
          errors.locationNotFound(key, modelVersion)
        );
      }
      const singleMotorEffects: string[] = effects[key];
      const maxItems = 7;
      if (singleMotorEffects.length > maxItems) {
        return Promise.reject(errors.exceededMaxItems(maxItems));
      }
      newPlatformHapticRequest[key] = singleMotorEffects;
    }

    return this.dispatchAction({
      command: metric,
      action: "queue",
      responseRequired: true,
      responseTimeout: 1000,
      message: { effects: newPlatformHapticRequest }
    });
  }

  /**
   * ```typescript
   * const effects = notion.getHapticEffects();
   * ```
   */
  public getHapticEffects(): HapticEffects {
    return hapticEffects;
  }

  /**
   * Observes accelerometer data
   * Supported by Notion 2 and the Crown.
   *
   * ```typescript
   * notion.accelerometer().subscribe(accelerometer => {
   *   console.log(accelerometer);
   * });
   *
   * // { acceleration: ..., inclination: ..., orientation: ..., pitch: ..., roll: ..., x: ..., y: ..., z: ... }
   * ```
   *
   * @returns Observable of accelerometer metric events
   */
  public accelerometer(): Observable<Accelerometer> {
    const metric = "accelerometer";

    const [hasOAuthError, OAuthError] =
      validateOAuthScopeForFunctionName(this.api.userClaims, metric);

    if (hasOAuthError) {
      return throwError(OAuthError);
    }

    return from(this.getSelectedDevice()).pipe(
      switchMap((selectedDevice) => {
        const modelVersion =
          selectedDevice?.modelVersion || platform.MODEL_VERSION_1;
        const supportsAccel = platform.supportsAccel(modelVersion);

        if (!supportsAccel) {
          return throwError(
            errors.metricNotSupportedByModel(metric, modelVersion)
          );
        }

        return getMetric(this._getMetricDependencies(), {
          metric,
          labels: getLabels(metric),
          atomic: true
        });
      })
    );
  }

  /**
   * The `raw` brainwaves parameter emits epochs of 16 samples for Crown and 25 for Notion 1 and 2.
   *
   * Example
   * ```typescript
   * notion.brainwaves("raw").subscribe(brainwaves => {
   *   console.log(brainwaves);
   * });
   * ```
   *
   * Raw Unfiltered - The `rawUnfiltered` brainwaves parameter emits epochs of 16 samples for Crown and 25 for Notion 1 and 2. 

   * Example
   * ```typescript
   * notion.brainwaves("rawUnfiltered").subscribe(brainwaves => {
   *   console.log(brainwaves);
   * });
   * ```
   *
   * Power By Band - The `powerByBand` brainwaves parameter emits epochs 4 times a second. Every frequency label (e.g. beta) contains an average power value per channel.
   * 
   * Example
   * ```typescript
   * notion.brainwaves("powerByBand").subscribe(brainwaves => {
   *   console.log(brainwaves);
   * });
   * ```
   *
   * Power Spectral Density (PSD) - The `psd` brainwaves parameter emits epochs 4 times a second. Every frequency label (e.g. alpha) contains the computed FFT (Fast Fourier transform) value per channel (see the `psd` property), as well as the frequency ranges (see the `freqs` property).
   * 
   * Example
   * ```typescript
   * notion.brainwaves("psd").subscribe(brainwaves => {
   *   console.log(brainwaves);
   * });
   * ```
   *
   * @param labels Name of metric properties to filter by
   * @returns Observable of brainwaves metric events
   */
  public brainwaves(
    label: BrainwavesLabel,
    ...otherLabels: BrainwavesLabel[]
  ): Observable<Epoch | PowerByBand | PSD> {
    const [hasOAuthError, OAuthError] =
      validateOAuthScopeForFunctionName(
        this.api.userClaims,
        "brainwaves"
      );

    if (hasOAuthError) {
      return throwError(OAuthError);
    }

    return getMetric(this._getMetricDependencies(), {
      metric: "brainwaves",
      labels: label ? [label, ...otherLabels] : [],
      atomic: false
    });
  }

  /**
   * Example
   * ```typescript
   * notion.calm().subscribe(calm => {
   *   console.log(calm.probability);
   * });
   *
   * // 0.45
   * // 0.47
   * // 0.53
   * // 0.51
   * // ...
   * ```
   *
   * @returns Observable of calm events - awareness/calm alias
   */
  public calm(): Observable<Calm> {
    const [hasOAuthError, OAuthError] =
      validateOAuthScopeForFunctionName(this.api.userClaims, "calm");

    if (hasOAuthError) {
      return throwError(OAuthError);
    }

    return getMetric(this._getMetricDependencies(), {
      metric: "awareness",
      labels: ["calm"],
      atomic: false
    });
  }

  /**
   * Observes signal quality data where each property is the name
   * of the channel and the value includes the standard deviation and
   * a status set by the device
   *
   * ```typescript
   * notion.signalQuality().subscribe(signalQuality => {
   *   console.log(signalQuality);
   * });
   *
   * // { FC6: { standardDeviation: 3.5, status: "good" }, C3: {...}, ... }
   * ```
   *
   * @returns Observable of signalQuality metric events
   */
  public signalQuality(): Observable<SignalQuality> {
    const metric = "signalQuality";

    const [hasOAuthError, OAuthError] =
      validateOAuthScopeForFunctionName(this.api.userClaims, metric);

    if (hasOAuthError) {
      return throwError(OAuthError);
    }

    return getMetric(this._getMetricDependencies(), {
      metric,
      labels: getLabels(metric),
      atomic: true
    });
  }

  /**
   * Observes last state of `settings` and all subsequent `settings` changes
   *
   * ```typescript
   * notion.settings().subscribe(settings => {
   *   console.log(settings.lsl);
   * });
   *
   * // true
   * // ...
   * ```
   *
   * @returns Observable of `settings` metric events
   */
  public settings(): Observable<Settings> {
    const [hasOAuthError, OAuthError] =
      validateOAuthScopeForFunctionName(
        this.api.userClaims,
        "settings"
      );

    if (hasOAuthError) {
      return throwError(OAuthError);
    }

    return this.api.observeNamespace("settings");
  }

  /**
   * Example
   * ```typescript
   * notion.focus().subscribe(focus => {
   *   console.log(focus.probability);
   * });
   *
   * // 0.56
   * // 0.46
   * // 0.31
   * // 0.39
   * // ...
   * ```
   *
   * @returns Observable of focus events - awareness/focus alias
   */
  public focus(): Observable<Focus> {
    const [hasOAuthError, OAuthError] =
      validateOAuthScopeForFunctionName(this.api.userClaims, "focus");

    if (hasOAuthError) {
      return throwError(OAuthError);
    }

    return getMetric(this._getMetricDependencies(), {
      metric: "awareness",
      labels: ["focus"],
      atomic: false
    });
  }

  /**
   * @param labels Name of metric properties to filter by
   * @returns Observable of kinesis metric events
   */
  public kinesis(
    label: string,
    ...otherLabels: string[]
  ): Observable<Kinesis> {
    const metric = "kinesis";

    const [hasOAuthError, OAuthError] =
      validateOAuthScopeForFunctionName(this.api.userClaims, metric);

    if (hasOAuthError) {
      return throwError(OAuthError);
    }

    return getMetric(this._getMetricDependencies(), {
      metric,
      labels: label ? [label, ...otherLabels] : [],
      atomic: false
    });
  }

  /**
   * @param labels Name of metric properties to filter by
   * @returns Observable of predictions metric events
   */
  public predictions(
    label: string,
    ...otherLabels: string[]
  ): Observable<any> {
    const metric = "predictions";

    const [hasOAuthError, OAuthError] =
      validateOAuthScopeForFunctionName(this.api.userClaims, metric);

    if (hasOAuthError) {
      return throwError(OAuthError);
    }

    return getMetric(this._getMetricDependencies(), {
      metric,
      labels: label ? [label, ...otherLabels] : [],
      atomic: false
    });
  }

  /**
   * Observes last state of `status` and all subsequent `status` changes
   *
   * ```typescript
   * notion.status().subscribe(status => {
   *   console.log(status.state);
   * });
   *
   * // "online"
   * // ...
   * ```
   *
   * @returns Observable of `status` metric events
   */
  public status(): Observable<DeviceStatus> {
    const [hasOAuthError, OAuthError] =
      validateOAuthScopeForFunctionName(this.api.userClaims, "status");

    if (hasOAuthError) {
      return throwError(OAuthError);
    }

    return this.api.status();
  }

  /**
   * @internal
   * Not user facing yet
   *
   * Changes device settings programmatically. These settings can be
   * also changed from the developer console under device settings.
   *
   * Available settings [[ChangeSettings]]
   *
   * Example
   * ```typescript
   * notion.changeSettings({
   *   lsl: true
   * });
   * ```
   */
  public changeSettings(settings: ChangeSettings): Promise<void> {
    if (!this.api.didSelectDevice()) {
      return Promise.reject(errors.mustSelectDevice);
    }

    const [hasOAuthError, OAuthError] =
      validateOAuthScopeForFunctionName(
        this.api.userClaims,
        "changeSettings"
      );

    if (hasOAuthError) {
      return Promise.reject(OAuthError);
    }

    return this.api.changeSettings(settings);
  }

  /**
   *
   * ```typescript
   * notion.training.record({
   *   metric: "kinesis",
   *   label: "push"
   * });
   *
   * notion.training.stop({
   *   metric: "kinesis",
   *   label: "push"
   * });
   * ```
   *
   * @returns Training methods
   */
  public get training(): Training {
    return {
      /**
       * Records a training for a metric/label pair
       * @category Training
       */
      record: (training) => {
        if (!this.api.didSelectDevice()) {
          throw errors.mustSelectDevice;
        }

        const userId =
          this.api.user && "uid" in this.api.user
            ? this.api.user.uid
            : null;
        const message = {
          fit: false,
          baseline: false,
          timestamp: this.api.timestamp,
          ...training,
          userId
        };
        this.api.actions.dispatch({
          command: "training",
          action: "record",
          message
        });
      },
      /**
       * Stops the training for a metric/label pair
       * @category Training
       */
      stop: (training) => {
        if (!this.api.didSelectDevice()) {
          throw errors.mustSelectDevice;
        }

        this.api.actions.dispatch({
          command: "training",
          action: "stop",
          message: {
            ...training
          }
        });
      },
      /**
       * Stops all trainings
       * @category Training
       */
      stopAll: () => {
        if (!this.api.didSelectDevice()) {
          throw errors.mustSelectDevice;
        }

        this.api.actions.dispatch({
          command: "training",
          action: "stopAll",
          message: {}
        });
      }
    };
  }

  /**
   * @internal
   * Proof of Concept for disconnecting db
   */
  public goOffline(): void {
    this.api.goOffline();
  }

  /**
   * @internal
   * Proof of Concept for resuming db connection
   */
  public goOnline(): void {
    this.api.goOnline();
  }

  /**
   * @internal
   * Not user facing yet
   *
   * Creates user account and automatically signs in with same credentials
   *
   * @param emailAndPasswordObject
   * @returns user credential
   */
  public createAccount(credentials: EmailAndPassword) {
    return this.api.createAccount(credentials);
  }

  /**
   * @internal
   * Not user facing yet
   *
   * Removes all devices from an account and then deletes the account
   */
  public deleteAccount() {
    return this.api.deleteAccount();
  }

  /**
   * @internal
   * Not user facing yet
   *
   * Creates custom token (JWT) to use to login with `{ customToken }`.
   *
   * @returns custom token
   */
  public createCustomToken(): Promise<CustomToken> {
    return this.api.createCustomToken();
  }

  /**
   * @internal
   * Not user facing yet
   *
   * Gets the offset between the device's clock and the client's clock
   * Requires option.timesync to be true
   *
   * @returns timesyncOffset
   */
  public getTimesyncOffset(): number {
    if (!this.options.timesync) {
      console.warn(
        `getTimesyncOffset() requires options.timesync to be true.`
      );
    }

    return this.options.timesync ? this.api.getTimesyncOffset() : 0;
  }

  /**
   * Create OAuth URL
   * 💡 OAuth requires developers to register their apps with Neurosity
   * [Read full OAuth guide](/docs/oauth)
   *
   * Creates client-specific OAuth URL. This is the first step of the OAuth workflow. Use this function to create a URL you can use to redirect users to the Neurosity sign-in page.
   * 💡 This function is designed to only run on the server side for security reasons, as it requires your client secret.
   *
   * ```typescript
   * const { Notion } = require("@neurosity/notion");
   *
   * const notion = new Notion({
   *   autoSelectDevice: false
   * });
   *
   * exports.handler = async function (event) {
   *   return notion
   *     .createOAuthURL({
   *       clientId: process.env.NEUROSITY_OAUTH_CLIENT_ID,
   *       clientSecret: process.env.NEUROSITY_OAUTH_CLIENT_SECRET,
   *       redirectUri: process.env.NEUROSITY_OAUTH_CLIENT_REDIRECT_URI,
   *       responseType: "token",
   *       state: Math.random().toString().split(".")[1],
   *       scope: [
   *         "read:devices-info",
   *         "read:devices-status",
   *         "read:signal-quality",
   *         "read:brainwaves"
   *       ]
   *     })
   *     .then((url) => ({
   *       statusCode: 200,
   *       body: JSON.stringify({ url })
   *     }))
   *     .catch((error) => ({
   *       statusCode: 400,
   *       body: JSON.stringify(error.response.data)
   *     }));
   * };
   * ```
   * @returns custom token
   */
  public createOAuthURL(config: OAuthConfig): Promise<string> {
    if (!isNode) {
      return Promise.reject(
        new Error(
          `${errors.prefix}the createOAuthURL method must be used on the server side (node.js) for security reasons.`
        )
      );
    }

    return createOAuthURL(config, this.options);
  }

  /**
   * Get OAuth Token
   * 💡 OAuth requires developers to register their apps with Neurosity
   * [Read full OAuth guide](/docs/oauth)
   *
   * Gets client-specific OAuth token for a given userId.
   *
   * 💡 This function is designed to only run on the server side for security reasons, as it requires your client secret.
   * Here's an example of a cloud function that receives a `userId` via query params and loads the client id and client secret securely via environment variables.
   *
   *
   * ```typescript
   * const { Notion } = require("@neurosity/notion");
   *
   * const notion = new Notion({
   *   autoSelectDevice: false
   * });
   *
   * exports.handler = async function (event) {
   *   const userId = event.queryStringParameters?.userId;
   *
   *   return notion
   *     .getOAuthToken({
   *       clientId: process.env.NEUROSITY_OAUTH_CLIENT_ID,
   *       clientSecret: process.env.NEUROSITY_OAUTH_CLIENT_SECRET,
   *       userId
   *     })
   *     .then((token) => ({
   *       statusCode: 200,
   *       body: JSON.stringify(token)
   *     }))
   *     .catch((error) => ({
   *       statusCode: 200,
   *       body: JSON.stringify(error.response.data)
   *     }));
   * };
   * ```
   * @returns custom token
   */
  public getOAuthToken(query: OAuthQuery): Promise<OAuthQueryResult> {
    if (!isNode) {
      return Promise.reject(
        new Error(
          `${errors.prefix}the getOAuthToken method must be used on the server side (node.js) for security reasons.`
        )
      );
    }

    return getOAuthToken(query, this.options);
  }

  /**
   * Remove OAuth Access
   * 💡 OAuth requires developers to register their apps with Neurosity
   * [Read full OAuth guide](/docs/oauth)
   *
   * Removes client-specific OAuth token for a given userId. Requires SDK to be signed in with OAuth custom token.
   *
   * ```typescript
   * await notion.removeOAuthAccess().catch((error) => {
   *   // handle error here...
   * });
   * ```
   * @returns custom token
   */
  public removeOAuthAccess(): Promise<OAuthRemoveResponse> {
    return this.api.removeOAuthAccess();
  }

  /**
   * @internal
   * Proof of Concept for Skills - Not user facing yet
   *
   * Accesses a skill by Bundle ID. Additionally, allows to observe
   * and push skill metrics
   *
   * @param bundleId Bundle ID of skill
   * @returns Skill instance
   */
  public async skill(bundleId: string): Promise<SkillInstance> {
    if (!this.api.didSelectDevice()) {
      return Promise.reject(errors.mustSelectDevice);
    }

    const skillData = await this.api.skills.get(bundleId);

    if (skillData === null) {
      return Promise.reject(
        new Error(
          `${errors.prefix}Access denied for: ${bundleId}. Make sure the skill is installed.`
        )
      );
    }

    return {
      metric: (label: string) => {
        const metricName = `skill~${skillData.id}~${label}`;
        const subscription = new Observable((observer) => {
          const subscription: Subscription = this.api.metrics.subscribe(
            {
              metric: metricName,
              labels: [label],
              atomic: true
            }
          );

          const listener = this.api.metrics.on(
            subscription,
            (...data: any) => {
              observer.next(...data);
            }
          );

          return () => {
            this.api.metrics.unsubscribe(subscription, listener);
          };
        }).pipe(map((metric) => metric[label]));

        Object.defineProperty(subscription, "next", {
          value: (metricValue: { [label: string]: any }): void => {
            this.api.metrics.next(metricName, {
              [label]: metricValue
            });
          }
        });

        return subscription;
      }
    };
  }

  /**
   * Observes and returns a list of all Kinesis `experiments` and all subsequent experiment changes.
   * Here's an example of how to get a list of all Kinesis labels that have been trained:
   *
   * ```typescript
   *
   * const getUniqueLabels = (experiments) => {
   *   const labels = experiments.flatMap((experiment) => experiment.labels);
   *   // only return unique labels
   *   return [...new Set(labels)];
   * }
   *
   * notion.onUserExperiments().subscribe((experiments) => {
   *   console.log(experiments);
   *   console.log("labels", getUniqueLabels(experiments));
   * });
   *
   * // [{ id: '...', deviceId: '...', labels: [ 'drop' ], name: 'Lightgray cheetah', timestamp: 1577908381552, totalTrials: 16, userId: '...' }]
   * // ["drop", "lift", "push"]
   * ```
   *
   * @returns Observable of `experiments` events
   */
  public onUserExperiments(): Observable<Experiment[]> {
    return this.api.onUserExperiments();
  }

  /**
   * Deletes a specific experiment provided an experiment ID
   *
   * ```typescript
   * await notion.deleteUserExperiment(experiment.id);
   * ```
   *
   * @param experimentId The ID of the Experiment
   * @returns void
   */
  public deleteUserExperiment(experimentId: string): Promise<void> {
    return this.api.deleteUserExperiment(experimentId);
  }
}
