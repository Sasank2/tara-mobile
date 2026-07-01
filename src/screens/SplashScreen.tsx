import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Dimensions,
  Animated, Easing,
} from 'react-native';
import Svg, {
  Circle, Polygon, Line, Defs, RadialGradient, Stop,
} from 'react-native-svg';

const { width, height } = Dimensions.get('window');

const STARS = [
  { x: 32, y: 48, r: 1.2, d: 2.1 }, { x: 68, y: 22, r: 0.8, d: 1.9 },
  { x: width - 52, y: 36, r: 1.3, d: 2.6 }, { x: width - 20, y: 62, r: 0.9, d: 2.0 },
  { x: width - 44, y: 14, r: 1.0, d: 1.8 }, { x: 16, y: 108, r: 0.8, d: 2.4 },
  { x: width - 18, y: 135, r: 1.1, d: 2.2 }, { x: 38, y: 165, r: 0.7, d: 1.7 },
  { x: width - 38, y: 182, r: 0.9, d: 2.8 }, { x: 12, y: 205, r: 1.2, d: 2.3 },
  { x: width - 14, y: 225, r: 0.7, d: 2.1 }, { x: 24, y: 285, r: 0.9, d: 2.5 },
  { x: width - 26, y: 315, r: 0.8, d: 1.9 }, { x: width / 2 - 60, y: 28, r: 0.8, d: 2.2 },
  { x: width / 2 + 50, y: 68, r: 0.9, d: 1.8 }, { x: width / 2, y: 42, r: 0.6, d: 2.0 },
  { x: 52, y: 82, r: 1.0, d: 2.3 }, { x: width - 60, y: 96, r: 0.8, d: 2.0 },
];

const WORD = 'Tara';

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const entranceAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const orbitAnim = useRef(new Animated.Value(0)).current;
  const taglineAnim = useRef(new Animated.Value(0)).current;
  const exitAnim = useRef(new Animated.Value(1)).current;
  const starAnims = useRef(STARS.map(() => new Animated.Value(0.3))).current;
  const letterAnims = useRef(WORD.split('').map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Chakra entrance: scale up with gentle overshoot
    Animated.spring(entranceAnim, {
      toValue: 1, friction: 6, tension: 40, useNativeDriver: true,
    }).start();

    // Continuous slow rotation of the whole mandala
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1, duration: 30000, easing: Easing.linear, useNativeDriver: true,
      })
    ).start();

    // Breathing pulse loop (starts after entrance settles)
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.97, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    }, 700);

    // Orbiting particle around the ring
    Animated.loop(
      Animated.timing(orbitAnim, {
        toValue: 1, duration: 4000, easing: Easing.linear, useNativeDriver: false,
      })
    ).start();

    // Stars twinkle
    starAnims.forEach((anim, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 1000 + i * 200, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.2, duration: 1000 + i * 200, useNativeDriver: true }),
        ])
      ).start();
    });

    // Letter-by-letter wordmark reveal
    Animated.stagger(90, letterAnims.map(anim =>
      Animated.timing(anim, { toValue: 1, duration: 400, delay: 500, useNativeDriver: true })
    )).start();

    // Tagline fade after letters
    Animated.timing(taglineAnim, {
      toValue: 1, duration: 500, delay: 500 + WORD.length * 90 + 150, useNativeDriver: true,
    }).start();

    // Exit: fade + scale out together, then finish
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(exitAnim, { toValue: 0, duration: 450, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      ]).start(() => onFinish());
    }, 3200);

    return () => clearTimeout(timer);
  }, []);

  const chakraSize = width * 0.62;
  const cx = chakraSize / 2;
  const cy = chakraSize / 2;
  const R = chakraSize * 0.46;

  const spin = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const orbitAngle = orbitAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 360] });

  return (
    <Animated.View style={[s.container, { opacity: exitAnim, transform: [{ scale: exitAnim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }] }]}>

      {/* Soft radial glow behind everything */}
      <View style={s.glowWrap}>
        <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id="glow" cx="50%" cy="42%" r="38%">
              <Stop offset="0%" stopColor="#F5A623" stopOpacity="0.16" />
              <Stop offset="60%" stopColor="#F5A623" stopOpacity="0.05" />
              <Stop offset="100%" stopColor="#F5A623" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={width / 2} cy={height * 0.42} r={width * 0.55} fill="url(#glow)" />
        </Svg>
      </View>

      {/* Twinkling stars */}
      {STARS.map((star, i) => (
        <Animated.View key={i} style={[s.star, {
          left: star.x, top: star.y,
          width: star.r * 2, height: star.r * 2, borderRadius: star.r,
          opacity: starAnims[i],
        }]} />
      ))}

      {/* 4-point sparkles */}
      {[
        { x: 48, y: 76 }, { x: width - 52, y: 94 },
        { x: 22, y: 320 }, { x: width - 28, y: 270 },
      ].map((sp, i) => (
        <Animated.View key={`sp-${i}`} style={[s.sparkle, { left: sp.x - 6, top: sp.y - 6, opacity: starAnims[i * 3 % STARS.length] }]}>
          <View style={s.sparkleLine} />
          <View style={[s.sparkleLine, { transform: [{ rotate: '90deg' }] }]} />
        </Animated.View>
      ))}

      {/* Anahata Heart Chakra */}
      <Animated.View style={[
        s.chakraWrap,
        {
          transform: [
            { scale: Animated.multiply(entranceAnim, pulseAnim) },
          ],
        },
      ]}>
        {/* Rotating outer rings + petals */}
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <Svg width={chakraSize} height={chakraSize} viewBox={`0 0 ${chakraSize} ${chakraSize}`}>
            <Circle cx={cx} cy={cy} r={R * 1.18} fill="none" stroke="rgba(245,166,35,0.10)" strokeWidth="1"/>
            <Circle cx={cx} cy={cy} r={R * 1.08} fill="none" stroke="rgba(245,166,35,0.16)" strokeWidth="0.8"/>
            <Circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(31,41,55,0.55)" strokeWidth="1.6"/>

            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i * 30 - 90) * (Math.PI / 180);
              const x1 = cx + Math.cos(angle) * R * 0.88;
              const y1 = cy + Math.sin(angle) * R * 0.88;
              const x2 = cx + Math.cos(angle) * R * 1.0;
              const y2 = cy + Math.sin(angle) * R * 1.0;
              return <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(245,166,35,0.65)" strokeWidth="1.3"/>;
            })}
          </Svg>
        </Animated.View>

        {/* Static inner mandala — triangles + center, layered on top */}
        <Svg width={chakraSize} height={chakraSize} viewBox={`0 0 ${chakraSize} ${chakraSize}`} style={StyleSheet.absoluteFill}>
          <Polygon
            points={`${cx},${cy - R * 0.72} ${cx + R * 0.62},${cy + R * 0.36} ${cx - R * 0.62},${cy + R * 0.36}`}
            fill="none" stroke="#1F2937" strokeWidth="1.8"
          />
          <Polygon
            points={`${cx},${cy + R * 0.72} ${cx - R * 0.62},${cy - R * 0.36} ${cx + R * 0.62},${cy - R * 0.36}`}
            fill="none" stroke="#1F2937" strokeWidth="1.8"
          />
          <Circle cx={cx} cy={cy} r={R * 0.28} fill="none" stroke="rgba(31,41,55,0.5)" strokeWidth="1.3"/>
          <Circle cx={cx} cy={cy} r={R * 0.07} fill="rgba(245,166,35,0.4)"/>
          <Circle cx={cx} cy={cy} r={R * 0.035} fill="#F5A623"/>
        </Svg>

        {/* Orbiting particle traveling around the outer ring */}
        <Animated.View
          style={[
            s.orbitDot,
            {
              left: cx - 2.5,
              top: cy - 2.5,
              transform: [
                { translateX: orbitAngle.interpolate({
                    inputRange: Array.from({ length: 37 }, (_, i) => i / 36),
                    outputRange: Array.from({ length: 37 }, (_, i) => Math.cos((i / 36) * 2 * Math.PI - Math.PI / 2) * R * 1.0),
                  }) },
                { translateY: orbitAngle.interpolate({
                    inputRange: Array.from({ length: 37 }, (_, i) => i / 36),
                    outputRange: Array.from({ length: 37 }, (_, i) => Math.sin((i / 36) * 2 * Math.PI - Math.PI / 2) * R * 1.0),
                  }) },
              ],
            },
          ]}
        />
      </Animated.View>

      {/* Wordmark — letter by letter */}
      <View style={s.textWrap}>
        <View style={s.wordmarkRow}>
          {WORD.split('').map((letter, i) => (
            <Animated.Text
              key={i}
              style={[
                s.wordmark,
                {
                  opacity: letterAnims[i],
                  transform: [{ translateY: letterAnims[i].interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
                },
              ]}
            >
              {letter}
            </Animated.Text>
          ))}
        </View>
        <Animated.Text style={[s.tagline, { opacity: taglineAnim }]}>
          your companion
        </Animated.Text>
      </View>

    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2EFE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowWrap: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  star: {
    position: 'absolute',
    backgroundColor: '#F5A623',
  },
  sparkle: {
    position: 'absolute',
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleLine: {
    position: 'absolute',
    width: 12,
    height: 1,
    backgroundColor: 'rgba(245,166,35,0.6)',
  },
  chakraWrap: {
    marginBottom: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitDot: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#F5A623',
  },
  textWrap: {
    alignItems: 'center',
    gap: 8,
  },
  wordmarkRow: {
    flexDirection: 'row',
  },
  wordmark: {
    fontSize: 34,
    fontWeight: '500',
    color: '#1F2937',
    letterSpacing: 8,
    fontStyle: 'italic',
  },
  tagline: {
    fontSize: 13,
    color: '#9CA3AF',
    letterSpacing: 2,
    fontStyle: 'italic',
  },
});
