export const prefix = "Neurosity SDK: ";
export const mustSelectDevice = new Error(
  `${prefix}A device must be selected. Make sure to call "notion.selectDevice()"`
);

export const metricNotSupportedByModel = (
  metric: string,
  modelVersion: string
) => {
  return new Error(
    `${prefix}${metric} not supported on model version ${modelVersion}. See docs.neurosity.co for more info.`
  );
};

export const actionNotSupportedByOSVersion = (
  metric: string, 
  action: string,
  osVersion: string
) => {
  return new Error(
    `${prefix}${metric}/${action} not supported on OS version ${osVersion}. See docs.neurosity.co for more info.`
  );
};

export const locationNotFound = (
  location: string,
  modelVersion: string
) => {
  return new Error(
    `${prefix}${location} location not supported on model version ${modelVersion}. Check spelling or see docs.neurosity.co for more info.`
  );
};

export const exceededMaxItems = (maxItems: number) => {
  return new Error(`${prefix}Maximum items in array is ${maxItems}`);
};
