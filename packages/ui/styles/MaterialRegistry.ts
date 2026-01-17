/**
 * Glass Material Registry
 * 
 * A singleton registry for managing glass material definitions.
 * Allows runtime registration of new materials to extend the design system.
 */

// Type alias for Tailwind class strings
export type MaterialDefinition = string;

class MaterialRegistry {
    private materials: Map<string, MaterialDefinition> = new Map();
    private subscribers: Set<() => void> = new Set();

    constructor() {
        // Initialize with default materials to ensure they are always available
        // This avoids circular dependencies if we tried to import them from GlassContainer
        // Instead, GlassContainer will register its defaults or we initializes them here.
        // For simplicity, we just store what's registered.
    }

    /**
     * Register a new material or overwrite an existing one
     * @param name The unique name of the material
     * @param classes The Tailwind classes that define the material
     */
    register(name: string, classes: MaterialDefinition) {
        this.materials.set(name, classes);
        this.notify();
    }

    /**
     * Get a material definition by name
     * @param name The name of the material
     * @returns The Tailwind classes or undefined if not found
     */
    get(name: string): MaterialDefinition | undefined {
        return this.materials.get(name);
    }

    /**
     * Get all registered materials
     */
    getAll(): Record<string, MaterialDefinition> {
        return Object.fromEntries(this.materials);
    }

    /**
     * Subscribe to registry changes (useful for re-rendering if needed, 
     * though styling changes might not reactively update without context)
     */
    subscribe(callback: () => void) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    private notify() {
        this.subscribers.forEach(cb => cb());
    }
}

export const glassRegistry = new MaterialRegistry();
