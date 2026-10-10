/** Símbolo da marca (quadrado índigo + marca de feito), igual em todas as telas. */
import Ionicons from '@expo/vector-icons/Ionicons';
import { View } from 'react-native';

import { BRAND } from '@/theme/brand';

export function BrandMark({ size = 32, inverted }: { size?: number; inverted?: boolean }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.24,
        backgroundColor: inverted ? BRAND.onBrand : BRAND.indigo,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name="checkmark" size={size * 0.62} color={inverted ? BRAND.indigo : BRAND.onBrand} />
    </View>
  );
}
