import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';

interface Props {
  exerciseId: string;
  stepIndex: number;
}

export default function ExerciseAnimation({ exerciseId, stepIndex }: Props) {
  const rot    = useRef(new Animated.Value(0)).current;
  const transY = useRef(new Animated.Value(0)).current;
  const transX = useRef(new Animated.Value(0)).current;
  const scale  = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    rot.setValue(0);
    transY.setValue(0);
    transX.setValue(0);
    scale.setValue(1);

    const key = `${exerciseId}_${stepIndex}`;

    // Stop all previous animations
    rot.stopAnimation();
    transY.stopAnimation();
    transX.stopAnimation();
    scale.stopAnimation();

    switch (key) {
      // ── Shoulder Release ──
      case 'shoulder-release_0': // Roll shoulders backward
        Animated.loop(
          Animated.sequence([
            Animated.timing(rot, { toValue: 1, duration: 600, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
            Animated.timing(rot, { toValue: 0, duration: 600, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          ])
        ).start();
        break;

      case 'shoulder-release_1': // Right ear to right shoulder
        Animated.loop(
          Animated.sequence([
            Animated.timing(transX, { toValue: 20, duration: 800, useNativeDriver: true }),
            Animated.delay(500),
            Animated.timing(transX, { toValue: 0, duration: 600, useNativeDriver: true }),
            Animated.delay(300),
          ])
        ).start();
        break;

      case 'shoulder-release_3': // Left ear to left shoulder
        Animated.loop(
          Animated.sequence([
            Animated.timing(transX, { toValue: -20, duration: 800, useNativeDriver: true }),
            Animated.delay(500),
            Animated.timing(transX, { toValue: 0, duration: 600, useNativeDriver: true }),
            Animated.delay(300),
          ])
        ).start();
        break;

      // ── 4-7-8 Breathing ──
      case '478-breathing_0':
      case '478-breathing_1':
      case '478-breathing_4':
      case '478-breathing_7': // Inhale — expand
        Animated.loop(
          Animated.sequence([
            Animated.timing(scale, { toValue: 1.3, duration: 1200, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
            Animated.timing(scale, { toValue: 1.0, duration: 800, useNativeDriver: true }),
            Animated.delay(200),
          ])
        ).start();
        break;

      case '478-breathing_2':
      case '478-breathing_5':
      case '478-breathing_8': // Hold — pulse gently
        Animated.loop(
          Animated.sequence([
            Animated.timing(scale, { toValue: 1.25, duration: 300, useNativeDriver: true }),
            Animated.timing(scale, { toValue: 1.2, duration: 300, useNativeDriver: true }),
          ])
        ).start();
        break;

      case '478-breathing_3':
      case '478-breathing_6':
      case '478-breathing_9': // Exhale — contract
        Animated.loop(
          Animated.sequence([
            Animated.timing(scale, { toValue: 0.7, duration: 1600, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
            Animated.timing(scale, { toValue: 1.0, duration: 400, useNativeDriver: true }),
            Animated.delay(200),
          ])
        ).start();
        break;

      // ── Box Breathing ──
      case 'box-breathing_1': // Inhale
        Animated.loop(
          Animated.sequence([
            Animated.timing(scale, { toValue: 1.4, duration: 4000, useNativeDriver: true, easing: Easing.linear }),
            Animated.delay(200),
          ])
        ).start();
        break;

      case 'box-breathing_2': // Hold top
        Animated.loop(
          Animated.sequence([
            Animated.timing(opacity, { toValue: 0.6, duration: 500, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 1.0, duration: 500, useNativeDriver: true }),
          ])
        ).start();
        break;

      case 'box-breathing_3':
      case 'box-breathing_7':
      case 'box-breathing_11': // Exhale
        Animated.loop(
          Animated.sequence([
            Animated.timing(scale, { toValue: 0.65, duration: 4000, useNativeDriver: true, easing: Easing.linear }),
            Animated.delay(200),
          ])
        ).start();
        break;

      // ── Belly Breathing ──
      case 'belly-breathing_1':
      case 'belly-breathing_3': // Inhale belly rises
        Animated.loop(
          Animated.sequence([
            Animated.timing(transY, { toValue: -8, duration: 1000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
            Animated.timing(transY, { toValue: 0,  duration: 1000, useNativeDriver: true }),
          ])
        ).start();
        break;

      case 'belly-breathing_2':
      case 'belly-breathing_4': // Exhale belly falls
        Animated.loop(
          Animated.sequence([
            Animated.timing(transY, { toValue: 8,  duration: 1000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
            Animated.timing(transY, { toValue: 0,  duration: 1000, useNativeDriver: true }),
          ])
        ).start();
        break;

      // ── Jaw Release ──
      case 'jaw-release_3': // Jaw drops open
        Animated.loop(
          Animated.sequence([
            Animated.timing(transY, { toValue: 12, duration: 800, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
            Animated.delay(600),
            Animated.timing(transY, { toValue: 0,  duration: 600, useNativeDriver: true }),
            Animated.delay(400),
          ])
        ).start();
        break;

      default:
        // Gentle pulse for any unspecified step
        Animated.loop(
          Animated.sequence([
            Animated.timing(scale, { toValue: 1.05, duration: 800, useNativeDriver: true }),
            Animated.timing(scale, { toValue: 0.98, duration: 800, useNativeDriver: true }),
          ])
        ).start();
    }

    return () => {
      rot.stopAnimation();
      transY.stopAnimation();
      transX.stopAnimation();
      scale.stopAnimation();
      opacity.stopAnimation();
    };
  }, [exerciseId, stepIndex]);

  const spin = rot.interpolate({ inputRange: [0, 1], outputRange: ['-30deg', '30deg'] });

  const renderFigure = () => {
    const isBreathing = exerciseId.includes('breathing');
    const isJaw       = exerciseId.includes('jaw');
    const isShoulder  = exerciseId.includes('shoulder');

    if (isBreathing) {
      // Breathing circle — expands and contracts
      return (
        <Animated.View style={{
          width: 80, height: 80, borderRadius: 40,
          borderWidth: 3, borderColor: '#C1560A',
          backgroundColor: '#FFF3E0',
          alignItems: 'center', justifyContent: 'center',
          transform: [{ scale }],
          opacity,
        }}>
          <View style={{
            width: 50, height: 50, borderRadius: 25,
            backgroundColor: '#C1560A', opacity: 0.3,
          }} />
        </Animated.View>
      );
    }

    if (isJaw) {
      // Face with animated jaw
      return (
        <View style={{ alignItems: 'center' }}>
          {/* Head */}
          <View style={{
            width: 60, height: 70, borderRadius: 30,
            backgroundColor: '#F5E8D0', borderWidth: 2,
            borderColor: '#C1560A', overflow: 'hidden',
            alignItems: 'center',
          }}>
            {/* Eyes */}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 18 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#1A0E06' }} />
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#1A0E06' }} />
            </View>
            {/* Animated jaw/mouth */}
            <Animated.View style={{
              width: 30, height: 16, borderBottomLeftRadius: 10,
              borderBottomRightRadius: 10,
              backgroundColor: '#C1560A',
              marginTop: 6,
              transform: [{ translateY: transY }],
            }} />
          </View>
        </View>
      );
    }

    // Default — stick figure with animated parts
    return (
      <View style={{ alignItems: 'center' }}>
        {/* Head */}
        <Animated.View style={{
          width: 36, height: 36, borderRadius: 18,
          backgroundColor: '#F5E8D0', borderWidth: 2,
          borderColor: '#C1560A', marginBottom: 2,
          transform: isShoulder ? [{ translateX: transX }] : [{ scale }],
        }} />
        {/* Body */}
        <View style={{ width: 3, height: 44, backgroundColor: '#C1560A', borderRadius: 2 }} />
        {/* Arms */}
        <Animated.View style={{
          position: 'absolute', top: 46,
          flexDirection: 'row', width: 100,
          justifyContent: 'space-between',
          transform: isShoulder
            ? [{ rotate: spin }]
            : [{ translateY: transY }],
        }}>
          <View style={{
            width: 36, height: 3, backgroundColor: '#C1560A',
            borderRadius: 2, marginTop: 0,
            transform: [{ rotate: '30deg' }],
          }} />
          <View style={{
            width: 36, height: 3, backgroundColor: '#C1560A',
            borderRadius: 2,
            transform: [{ rotate: '-30deg' }],
          }} />
        </Animated.View>
        {/* Legs */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 2 }}>
          <View style={{
            width: 3, height: 36, backgroundColor: '#C1560A',
            borderRadius: 2, transform: [{ rotate: '10deg' }],
          }} />
          <View style={{
            width: 3, height: 36, backgroundColor: '#C1560A',
            borderRadius: 2, transform: [{ rotate: '-10deg' }],
          }} />
        </View>
      </View>
    );
  };

  return (
    <View style={{
      height: 140, backgroundColor: '#FFF8F0',
      borderRadius: 16, alignItems: 'center',
      justifyContent: 'center', marginBottom: 16,
      borderWidth: 0.5, borderColor: '#F0C878',
    }}>
      {renderFigure()}
    </View>
  );
}