/**
 * NativeWind v4 type augmentation.
 * Adds `className` prop to all React Native core components.
 */
/* eslint-disable @typescript-eslint/no-unused-vars */
import 'react-native';

declare module 'react-native' {
  interface ViewProps {
    className?: string;
  }
  interface TextProps {
    className?: string;
  }
  interface ImageProps {
    className?: string;
  }
  interface ScrollViewProps {
    className?: string;
  }
  interface TextInputProps {
    className?: string;
  }
  interface TouchableOpacityProps {
    className?: string;
  }
  interface PressableProps {
    className?: string;
  }
  interface FlatListProps<_ItemT> {
    className?: string;
  }
  interface SectionListProps<_ItemT, _SectionT> {
    className?: string;
  }
  interface SafeAreaViewProps {
    className?: string;
  }
}
