type AuthPersistence = {
  hasHydrated: () => boolean;
  rehydrate: () => Promise<void> | void;
};

/** Finish persistence before mounting route guards, including failed/blocked storage. */
export async function completeAuthHydration(persistence?: AuthPersistence): Promise<void> {
  try {
    if (persistence && !persistence.hasHydrated()) {
      await persistence.rehydrate();
    }
  } catch {
    // Unavailable or corrupt storage leaves the store's unauthenticated state usable.
  }
}
