import React from 'react';
import ReactNative, { StyleSheet, type TextProps } from 'react-native';

// React Native 0.86 Text ignores defaultProps, so the export itself is wrapped.
const OriginalText = ReactNative.Text;

const styles = StyleSheet.create({
  base: {
    fontFamily: 'ui-rounded',
  },
});

const RoundedText = React.forwardRef<React.ComponentRef<typeof OriginalText>, TextProps>(
  function Text({ style, ...rest }, ref) {
    return <OriginalText {...rest} ref={ref} style={[styles.base, style]} />;
  },
);

Object.defineProperty(ReactNative, 'Text', {
  configurable: true,
  enumerable: true,
  get: () => RoundedText,
});
