export interface AppConfig {
  storeName: string;
  hiddenSections: string[]; // ['Store', 'Sell', 'Repair', 'About']
}

export const DEFAULT_CONFIG: AppConfig = {
  storeName: 'iResell',
  hiddenSections: [],
};

export async function getAppConfig(): Promise<AppConfig> {
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const data = await res.json();
      return {
        ...DEFAULT_CONFIG,
        ...data,
        hiddenSections: data.hiddenSections || []
      } as AppConfig;
    }
    return DEFAULT_CONFIG;
  } catch (error) {
    console.error('getAppConfig error:', error);
    return DEFAULT_CONFIG;
  }
}

export async function updateAppConfig(config: AppConfig) {
  try {
    await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
  } catch (error) {
    console.error('updateAppConfig error:', error);
  }
}

export function subscribeToConfig(callback: (config: AppConfig) => void) {
  let isSubscribed = true;
  
  const poll = async () => {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        if (isSubscribed) {
          callback({
            ...DEFAULT_CONFIG,
            ...data,
            hiddenSections: data.hiddenSections || []
          });
        }
      }
    } catch (e) {
      if (isSubscribed) {
        callback(DEFAULT_CONFIG);
      }
    }
  };

  poll();
  const interval = setInterval(poll, 3000);

  return () => {
    isSubscribed = false;
    clearInterval(interval);
  };
}
