import { SupabaseClient } from '@supabase/supabase-js';

export interface RouteRegistrar {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  handler: (req: Request, res: any) => Promise<Response>;
}

export interface ModuleConfig {
  id: string;
  name: string;
  description: string;
  version: string;
  isActive: boolean;
  isAddon: boolean;
  routes: RouteRegistrar[];
  setup?: (supabase: SupabaseClient) => Promise<void>;
}

class ModuleRegistry {
  private modules: Map<string, ModuleConfig> = new Map();

  register(config: ModuleConfig) {
    if (this.modules.has(config.id)) {
      console.warn(`Module ${config.id} is already registered. Overwriting.`);
    }
    this.modules.set(config.id, config);
    console.log(`Registered module: ${config.name} (${config.id})`);
  }

  getModule(id: string): ModuleConfig | undefined {
    return this.modules.get(id);
  }

  getAllModules(): ModuleConfig[] {
    return Array.from(this.modules.values());
  }

  getActiveModules(): ModuleConfig[] {
    return this.getAllModules().filter((m) => m.isActive);
  }

  getRoutes(): RouteRegistrar[] {
    const routes: RouteRegistrar[] = [];
    for (const module of this.getActiveModules()) {
      routes.push(...module.routes);
    }
    return routes;
  }
}

// Export singleton instance
export const Registry = new ModuleRegistry();
