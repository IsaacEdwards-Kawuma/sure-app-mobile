/**
 * True when device has no network connectivity (offline).
 * Uses a simple stub so no native netinfo module is required.
 * To enable real offline detection, add @react-native-community/netinfo and use NetInfo.addEventListener.
 */
export function useOffline(): boolean {
  return false;
}
