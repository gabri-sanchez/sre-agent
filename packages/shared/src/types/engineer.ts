import type { Service } from "./error-event";

export interface Engineer {
  id: string;
  name: string;
  phone: string;
  email: string;
  services: Service[];
  isBackup: boolean;
  timezone: string;
}

export interface EngineerDirectory {
  [service: string]: {
    primary: Engineer;
    backup: Engineer;
  };
}
