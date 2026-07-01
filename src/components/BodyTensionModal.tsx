import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, ScrollView, Animated, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TERRA = '#C1560A';
const CREAM = '#FAF7F2';

const BODY_ZONES = [
  {
    id: 'head', label: 'Head', emoji: '🧠',
    techniques: [
      {
        name: '4-7-8 Breathing',
        description: 'Calms an overactive mind in under 2 minutes',
        duration: 60,
        steps: [
          { instruction: 'Close your eyes and exhale completely', duration: 4 },
          { instruction: 'Inhale through your nose for 4 counts', duration: 4 },
          { instruction: 'Hold your breath for 7 counts', duration: 7 },
          { instruction: 'Exhale completely through your mouth for 8 counts', duration: 8 },
          { instruction: 'Repeat — inhale for 4 counts', duration: 4 },
          { instruction: 'Hold for 7 counts', duration: 7 },
          { instruction: 'Exhale for 8 counts', duration: 8 },
          { instruction: 'Rest. Notice how your mind feels', duration: 10 },
        ],
      },
      {
        name: 'Temple Pressure',
        description: 'Acupressure to release head tension instantly',
        duration: 60,
        steps: [
          { instruction: 'Place both index fingers on your temples', duration: 5 },
          { instruction: 'Apply gentle circular pressure — clockwise', duration: 15 },
          { instruction: 'Pause. Take a slow breath in', duration: 5 },
          { instruction: 'Reverse — counter-clockwise gentle circles', duration: 15 },
          { instruction: 'Release hands. Let your jaw soften', duration: 10 },
          { instruction: 'Close your eyes and breathe normally', duration: 10 },
        ],
      },
    ],
  },
  {
    id: 'shoulders', label: 'Shoulders', emoji: '🤷',
    techniques: [
      {
        name: 'Shoulder Release',
        description: 'Melts shoulder and neck tension in 90 seconds',
        duration: 90,
        steps: [
          { instruction: 'Sit tall. Roll both shoulders backward — 5 slow circles', duration: 15 },
          { instruction: 'Bring your right ear to your right shoulder. Hold.', duration: 10 },
          { instruction: 'Slowly return to center', duration: 5 },
          { instruction: 'Bring your left ear to your left shoulder. Hold.', duration: 10 },
          { instruction: 'Interlace fingers behind your head. Open elbows wide.', duration: 10 },
          { instruction: 'Gently press head back into hands. Feel the stretch.', duration: 15 },
          { instruction: 'Release and shake out your arms', duration: 10 },
        ],
      },
      {
        name: 'Chest Opener',
        description: 'Reverses forward posture that causes shoulder pain',
        duration: 60,
        steps: [
          { instruction: 'Sit tall. Interlace fingers behind your back.', duration: 8 },
          { instruction: 'Squeeze shoulder blades together and lift chest', duration: 10 },
          { instruction: 'Hold this position and breathe slowly', duration: 15 },
          { instruction: 'On each exhale, squeeze a little more', duration: 12 },
          { instruction: 'Release and round shoulders forward', duration: 8 },
          { instruction: 'Return to neutral and notice the difference', duration: 7 },
        ],
      },
    ],
  },
  {
    id: 'chest', label: 'Chest', emoji: '💙',
    techniques: [
      {
        name: 'Box Breathing',
        description: 'The Navy SEAL technique for instant calm',
        duration: 80,
        steps: [
          { instruction: 'Sit comfortably. Exhale all air from your lungs.', duration: 4 },
          { instruction: 'Inhale slowly for 4 counts', duration: 4 },
          { instruction: 'Hold at the top for 4 counts', duration: 4 },
          { instruction: 'Exhale slowly for 4 counts', duration: 4 },
          { instruction: 'Hold empty for 4 counts', duration: 4 },
          { instruction: 'Repeat — Inhale for 4', duration: 4 },
          { instruction: 'Hold for 4', duration: 4 },
          { instruction: 'Exhale for 4', duration: 4 },
          { instruction: 'Hold empty for 4', duration: 4 },
          { instruction: 'Place one hand on your heart. Feel it steady.', duration: 10 },
          { instruction: 'You are safe. You are okay.', duration: 12 },
        ],
      },
      {
        name: 'Heart Opener',
        description: 'Opens the chest and releases stored emotion',
        duration: 75,
        steps: [
          { instruction: 'Sit and close your eyes.', duration: 8 },
          { instruction: 'Place right hand on heart, left hand on belly', duration: 6 },
          { instruction: 'Breathe into your chest — feel it rise', duration: 12 },
          { instruction: 'On exhale, let shoulders drop completely', duration: 10 },
          { instruction: 'Imagine warmth spreading from your chest outward', duration: 12 },
          { instruction: 'Breathe in: I am open. Breathe out: I release.', duration: 15 },
          { instruction: 'Stay here as long as you need', duration: 12 },
        ],
      },
    ],
  },
  {
    id: 'gut', label: 'Gut', emoji: '🌀',
    techniques: [
      {
        name: 'Belly Breathing',
        description: 'Activates your parasympathetic nervous system',
        duration: 90,
        steps: [
          { instruction: 'Place both hands on your belly.', duration: 8 },
          { instruction: 'Breathe in — feel belly push hands outward', duration: 6 },
          { instruction: 'Breathe out — feel belly fall inward', duration: 6 },
          { instruction: 'Continue this rhythm slowly', duration: 20 },
          { instruction: 'Make your exhale twice as long as your inhale', duration: 20 },
          { instruction: 'Notice the warmth in your belly. Let it soften.', duration: 15 },
        ],
      },
      {
        name: 'Spinal Twist',
        description: 'Releases gut tension through gentle rotation',
        duration: 60,
        steps: [
          { instruction: 'Sit tall with feet flat on floor', duration: 5 },
          { instruction: 'Inhale and lengthen your spine upward', duration: 5 },
          { instruction: 'Exhale and twist to the right', duration: 10 },
          { instruction: 'Hold and breathe. Deepen with each exhale.', duration: 12 },
          { instruction: 'Inhale back to center', duration: 5 },
          { instruction: 'Exhale and twist to the left', duration: 10 },
          { instruction: 'Hold and breathe. Release with each exhale.', duration: 13 },
        ],
      },
    ],
  },
  {
    id: 'back', label: 'Back', emoji: '🦴',
    techniques: [
      {
        name: 'Cat-Cow Stretch',
        description: 'The most effective back tension release',
        duration: 75,
        steps: [
          { instruction: 'Come to hands and knees', duration: 8 },
          { instruction: 'Inhale: drop belly, lift chest (Cow)', duration: 6 },
          { instruction: 'Exhale: round spine toward ceiling (Cat)', duration: 6 },
          { instruction: 'Continue slowly — follow your breath', duration: 20 },
          { instruction: 'Move as freely as your back needs', duration: 20 },
          { instruction: 'Return to neutral and rest', duration: 15 },
        ],
      },
      {
        name: "Child's Pose",
        description: 'Complete surrender for a tired back',
        duration: 60,
        steps: [
          { instruction: 'From kneeling, sit back toward your heels', duration: 6 },
          { instruction: 'Walk hands forward and lower forehead down', duration: 6 },
          { instruction: 'Let your arms rest forward', duration: 8 },
          { instruction: 'Breathe slowly into your back', duration: 15 },
          { instruction: 'Let gravity do the work.', duration: 15 },
          { instruction: 'Stay as long as you need.', duration: 10 },
        ],
      },
    ],
  },
  {
    id: 'jaw', label: 'Jaw', emoji: '😬',
    techniques: [
      {
        name: 'Jaw Release',
        description: 'Releases the most overlooked tension in the body',
        duration: 60,
        steps: [
          { instruction: 'Notice where your jaw is clenching.', duration: 8 },
          { instruction: 'Let your teeth part slightly.', duration: 8 },
          { instruction: 'Take a slow breath in through your nose', duration: 5 },
          { instruction: 'On exhale, let your jaw drop open. Sigh it out.', duration: 8 },
          { instruction: 'Massage the joint in front of your ears', duration: 12 },
          { instruction: 'Slowly open and close your mouth 5 times.', duration: 12 },
          { instruction: 'Return to soft, natural jaw.', duration: 7 },
        ],
      },
      {
        name: 'Face Yoga',
        description: 'Releases tension stored in facial muscles',
        duration: 45,
        steps: [
          { instruction: 'Make the biggest smile you can. Hold.', duration: 8 },
          { instruction: 'Scrunch your entire face tight', duration: 8 },
          { instruction: 'Release everything at once. Go completely slack.', duration: 8 },
          { instruction: 'Open mouth and eyes as wide as possible.', duration: 7 },
          { instruction: 'Release and let your face completely relax', duration: 7 },
          { instruction: 'Tap forehead, cheeks, and chin with fingertips', duration: 7 },
        ],
      },
    ],
  },
];

function GuidedExercise({ technique, onComplete, onBack }: {
  technique: any; onComplete: () => void; onBack: () => void;
}) {
  const [stepIdx, setStepIdx]   = useState(0);
  const [timeLeft, setTimeLeft] = useState(technique.steps[0].duration);
  const [running, setRunning]   = useState(false);
  const [done, setDone]         = useState(false);
  const anim    = useRef(new Animated.Value(1)).current;
  const timer   = useRef<any>(null);
  const animRef = useRef<any>(null);
  const step    = technique.steps[stepIdx];

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
    if (animRef.current) animRef.current.stop();
  }, []);

  useEffect(() => {
    setTimeLeft(step.duration);
    anim.setValue(1);
    setRunning(false);
    if (timer.current) clearInterval(timer.current);
    if (animRef.current) animRef.current.stop();
  }, [stepIdx]);

  const start = () => {
    setRunning(true);
    animRef.current = Animated.timing(anim, {
      toValue: 0, duration: step.duration * 1000, useNativeDriver: false,
    });
    animRef.current.start();
    timer.current = setInterval(() => {
      setTimeLeft((t: number) => {
        if (t <= 1) {
          clearInterval(timer.current);
          setRunning(false);
          if (stepIdx < technique.steps.length - 1) {
            setTimeout(() => setStepIdx(s => s + 1), 500);
          } else {
            setDone(true);
            onComplete();
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  if (done) return (
    <View style={{ padding: 32, alignItems: 'center' }}>
      <Text style={{ fontSize: 48, marginBottom: 12 }}>✦</Text>
      <Text style={{ fontSize: 22, fontWeight: '800', color: '#1A0E06', marginBottom: 6 }}>
        Exercise complete
      </Text>
      <Text style={{ fontSize: 14, color: '#9A8060', marginBottom: 24 }}>
        How do you feel now?
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {['Much better', 'Better', 'Same'].map(f => (
          <TouchableOpacity
            key={f}
            style={{ backgroundColor: '#E8E3D8', borderRadius: 12, padding: 10 }}
            onPress={() => {
              AsyncStorage.setItem(
                `body_relief_${new Date().toISOString().split('T')[0]}`,
                JSON.stringify({ technique: technique.name, feeling: f })
              );
              onBack();
            }}>
            <Text style={{ fontSize: 12, color: '#1F2937', fontWeight: '600' }}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={{ padding: 20 }}>
      <TouchableOpacity onPress={onBack} style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 13, color: '#9A8060' }}>← Back</Text>
      </TouchableOpacity>

      <Text style={{ fontSize: 20, fontWeight: '800', color: '#1A0E06', marginBottom: 16 }}>
        {technique.name}
      </Text>

      <View style={{ flexDirection: 'row', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
        {technique.steps.map((_: any, i: number) => (
          <View key={i} style={{
            width: 14, height: 4, borderRadius: 2,
            backgroundColor: i < stepIdx ? '#1D9E75' : i === stepIdx ? TERRA : '#E8E3D8',
          }} />
        ))}
      </View>

      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <View style={{
          width: 110, height: 110, borderRadius: 55,
          backgroundColor: '#FFF8F0', borderWidth: 2, borderColor: TERRA,
          alignItems: 'center', justifyContent: 'center', marginBottom: 12,
        }}>
          <Text style={{ fontSize: 40, fontWeight: '900', color: TERRA }}>{timeLeft}</Text>
          <Text style={{ fontSize: 11, color: '#9A8060' }}>sec</Text>
        </View>
        <View style={{
          width: '100%', height: 5, backgroundColor: '#E8E3D8',
          borderRadius: 3, overflow: 'hidden',
        }}>
          <Animated.View style={{
            height: 5, backgroundColor: TERRA, borderRadius: 3,
            width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          }} />
        </View>
      </View>

      <View style={{
        backgroundColor: CREAM, borderRadius: 16,
        padding: 18, marginBottom: 20, minHeight: 90,
      }}>
        <Text style={{ fontSize: 9, color: '#9A8060', letterSpacing: 1.5, marginBottom: 10 }}>
          STEP {stepIdx + 1} OF {technique.steps.length}
        </Text>
        <Text style={{
          fontSize: 17, color: '#1A0E06', lineHeight: 26, fontStyle: 'italic',
          fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        }}>
          {step.instruction}
        </Text>
      </View>

      {!running && (
        <TouchableOpacity
          style={{
            backgroundColor: TERRA, borderRadius: 16,
            padding: 16, alignItems: 'center',
          }}
          onPress={start}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>
            {stepIdx === 0 ? 'Begin' : 'Continue →'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function BodyTensionModal({ visible, onClose }: {
  visible: boolean; onClose: () => void;
}) {
  const [zone, setZone]           = useState<any>(null);
  const [technique, setTechnique] = useState<any>(null);

  const close = () => { setZone(null); setTechnique(null); onClose(); };

  return (
    <Modal visible={visible} animationType="slide" transparent
      statusBarTranslucent onRequestClose={close}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            {zone ? (
              <TouchableOpacity onPress={() => {
                if (technique) { setTechnique(null); }
                else { setZone(null); }
              }}>
                <Text style={styles.headerBack}>←</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 28 }} />
            )}
            <Text style={styles.headerTitle}>
              {technique ? technique.name : zone ? zone.label : 'Body check-in'}
            </Text>
            <TouchableOpacity style={styles.closeBtn} onPress={close}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}>

            {!zone && (
              <View style={{ padding: 20 }}>
                <Text style={styles.subtitle}>
                  Where are you holding tension today?
                </Text>
                <View style={{ gap: 10 }}>
                  {BODY_ZONES.map(z => (
                    <TouchableOpacity
                      key={z.id}
                      style={styles.zoneChip}
                      onPress={() => setZone(z)}
                      activeOpacity={0.75}>
                      <Text style={{ fontSize: 24, width: 32 }}>{z.emoji}</Text>
                      <Text style={styles.zoneLabel}>{z.label}</Text>
                      <Text style={{ fontSize: 18, color: TERRA }}>›</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {zone && !technique && (
              <View style={{ padding: 20 }}>
                <Text style={styles.subtitle}>
                  Choose a technique for {zone.label.toLowerCase()} tension
                </Text>
                {zone.techniques.map((tech: any, i: number) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.techCard}
                    onPress={() => setTechnique(tech)}
                    activeOpacity={0.8}>
                    <View style={{
                      flexDirection: 'row', justifyContent: 'space-between',
                      alignItems: 'center', marginBottom: 8,
                    }}>
                      <Text style={styles.techName}>{tech.name}</Text>
                      <View style={styles.techPill}>
                        <Text style={styles.techPillText}>
                          {Math.ceil(tech.duration / 60)} min
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.techDesc}>{tech.description}</Text>
                    <Text style={styles.techSteps}>
                      {tech.steps.length} guided steps →
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {technique && (
              <GuidedExercise
                technique={technique}
                onComplete={() => {
                  AsyncStorage.setItem(
                    `breathing_${new Date().toISOString().split('T')[0]}`,
                    JSON.stringify({ count: 1, technique: technique.name })
                  );
                }}
                onBack={() => setTechnique(null)}
              />
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: '#FAF7F2', borderTopLeftRadius: 28,
                  borderTopRightRadius: 28, height: '92%',
                  paddingBottom: Platform.OS === 'ios' ? 32 : 16 },
  handle:       { width: 36, height: 4, backgroundColor: '#D8CEC0', borderRadius: 2,
                  alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  header:       { flexDirection: 'row', justifyContent: 'space-between',
                  alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12,
                  borderBottomWidth: 0.5, borderBottomColor: '#E0D8CC' },
  headerBack:   { fontSize: 20, color: '#9A8060', width: 28 },
  headerTitle:  { fontSize: 15, fontWeight: '700', color: '#1A0E06',
                  flex: 1, textAlign: 'center' },
  closeBtn:     { width: 30, height: 30, borderRadius: 15, backgroundColor: '#EDE8E0',
                  alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 13, color: '#5A4030', fontWeight: '600' },
  subtitle:     { fontSize: 14, color: '#9A8060', fontStyle: 'italic',
                  marginBottom: 16, lineHeight: 20 },
  zoneChip:     { flexDirection: 'row', alignItems: 'center', gap: 12,
                  backgroundColor: '#fff', borderRadius: 14, padding: 14,
                  borderWidth: 0.5, borderColor: '#E0D8CC' },
  zoneLabel:    { flex: 1, fontSize: 14, color: '#1A0E06', fontWeight: '500' },
  techCard:     { backgroundColor: '#fff', borderRadius: 16, padding: 16,
                  marginBottom: 12, borderWidth: 0.5, borderColor: '#E0D8CC' },
  techName:     { fontSize: 16, fontWeight: '700', color: '#1A0E06', flex: 1 },
  techPill:     { backgroundColor: '#FFF3E0', borderRadius: 8, paddingHorizontal: 8,
                  paddingVertical: 3, borderWidth: 0.5, borderColor: '#F0C878' },
  techPillText: { fontSize: 10, color: '#C1560A', fontWeight: '600' },
  techDesc:     { fontSize: 12, color: '#9A8060', lineHeight: 18, marginBottom: 8 },
  techSteps:    { fontSize: 11, color: '#C1560A', fontWeight: '600', letterSpacing: 0.3 },
});