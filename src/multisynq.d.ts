declare var Multisynq: {
  Model: any;
  View: any;
  Session: {
    join(config: {
      apiKey: string;
      appId: string;
      model: any;
      view?: any;
      name: string;
      password?: string;
      autostart?: boolean;
    }): Promise<{
      id: string;
      identity: string;
      model: any;
      view?: any;
      identities: string[];
    }>;
  };
  App: {
    makeWidgetDock(): void;
    autoSession(): string;
    autoPassword(): string;
  };
};

declare global {
  interface Window {
    Multisynq: typeof Multisynq;
  }
}
