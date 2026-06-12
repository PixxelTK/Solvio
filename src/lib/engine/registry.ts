import { MathModule } from './types';

const registry: Map<string, MathModule> = new Map();

export function registerModule(module: MathModule): void {
  registry.set(module.id, module);
}

export function getModule(id: string): MathModule | undefined {
  return registry.get(id);
}

export function getAllModules(): MathModule[] {
  return Array.from(registry.values());
}
