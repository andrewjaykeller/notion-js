export interface DatasetStartMetadata {
  name: string;
  label: string;
  maxDuration: number;
  experimentId: string;
}

export interface DatasetMetadata {
  pin: number;
  sessionId?: string;
  name?: string;
}

export interface Dataset {
  start(metadata: DatasetStartMetadata): Promise<any>;
  complete(metadata: DatasetMetadata): Promise<string>;
  cancel(metadata: DatasetMetadata): Promise<any>;
}
