import { useWindowDimensions } from 'react-native';

import { WIDE_BREAKPOINT } from './tokens';

/** true em telas largas (computador/tablet deitado): usa menu lateral. */
export function useIsWide(): boolean {
  return useWindowDimensions().width >= WIDE_BREAKPOINT;
}
