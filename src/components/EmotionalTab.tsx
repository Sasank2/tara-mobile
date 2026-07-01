import React, { useState, useEffect, useRef } from 'react';
import GuidedWriting from './GuidedWriting';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Animated, Modal,
} from 'react-native';

const MOOD_CATEGORIES = [
  { id: 'all', label: 'All', color: '#7C3AED' },
  { id: 'anxious', label: 'Anxious', color: '#EC4899' },
  { id: 'low', label: 'Low', color: '#3B82F6' },
  { id: 'stressed', label: 'Stressed', color: '#F59E0B' },
  { id: 'angry', label: 'Angry', color: '#EF4444' },
  { id: 'tired', label: 'Tired', color: '#6B7280' },
];

const EXERCISES = [
  {
    id: 'box',
    icon: '🫁',
    name: 'Box breathing',
    subtitle: 'Calms your nervous system instantly',
    duration: 120,
    category: ['anxious', 'stressed'],
    color: '#7C3AED',
    bg: '#F3F0FF',
    steps: ['Breathe in slowly', 'Hold your breath', 'Breathe out slowly', 'Hold empty'],
    stepDuration: 4,
    type: 'breathing',
  },
  {
    id: 'walk',
    icon: '🚶',
    name: 'Mindful walk',
    subtitle: 'Shifts your energy in 10 minutes',
    duration: 600,
    category: ['low', 'tired', 'stressed'],
    color: '#10B981',
    bg: '#ECFDF5',
    steps: ['Step outside', 'Walk slowly', 'Notice 5 things you see', 'Notice 3 sounds', 'Notice 1 smell'],
    stepDuration: 60,
    type: 'timer',
  },
  {
    id: 'write',
    icon: '✍️',
    name: 'Write it out',
    subtitle: 'Release emotional weight in 5 minutes',
    duration: 300,
    category: ['anxious', 'low', 'angry'],
    color: '#F59E0B',
    bg: '#FFFBEB',
    steps: ['How am I feeling right now?', 'What triggered this feeling?', 'What do I need right now?'],
    stepDuration: 60,
    type: 'prompts',
  },
  {
    id: 'water',
    icon: '💧',
    name: 'Grounding sip',
    subtitle: 'Instant calm in 1 minute',
    duration: 60,
    category: ['anxious', 'stressed', 'angry'],
    color: '#3B82F6',
    bg: '#EFF6FF',
    steps: ['Pour a full glass of water', 'Sit down comfortably', 'Take one slow sip', 'Feel the water', 'Breathe and repeat'],
    stepDuration: 10,
    type: 'timer',
  },
  {
    id: 'body',
    icon: '🧘',
    name: 'Body scan',
    subtitle: 'Release tension from head to toe',
    duration: 180,
    category: ['stressed', 'tired', 'anxious'],
    color: '#EC4899',
    bg: '#FDF2F8',
    steps: ['Close your eyes', 'Relax your forehead', 'Drop your shoulders', 'Unclench your jaw', 'Soften your belly', 'Relax your hands'],
    stepDuration: 20,
    type: 'timer',
  },
  {
    id: 'gratitude',
    icon: '🌟',
    name: 'Gratitude pause',
    subtitle: 'Shift perspective in 3 minutes',
    duration: 180,
    category: ['low', 'tired'],
    color: '#F59E0B',
    bg: '#FFFBEB',
    steps: ['Name 1 thing you are grateful for', 'Name 1 person who cares about you', 'Name 1 thing your body does for you'],
    stepDuration: 40,
    type: 'prompts',
  },
];

function ExerciseModal({ exercise, onClose }: { exercise: any; onClose: () => void }) {
  const [started, setStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(exercise.duration);
  const [stepTimeLeft, setStepTimeLeft] = useState(exercise.stepDuration);
  const [done, setDone] = useState(false);
  const breathAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<any>(null);

  useEffect(() => {
      if (exercise.type === 'breathing') {
        const breathLoop = Animated.loop(
          Animated.sequence([
            Animated.timing(breathAnim, { toValue: 1.5, duration: 4000, useNativeDriver: true }),
            Animated.delay(4000),
            Animated.timing(breathAnim, { toValue: 1, duration: 4000, useNativeDriver: true }),
            Animated.delay(4000),
          ])
        );
        breathLoop.start();
        return () => breathLoop.stop();
      }
  }, [started]);

  useEffect(() => {
    if (started && !done) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            setDone(true);
            return 0;
          }
          return t - 1;
        });
        setStepTimeLeft(t => {
          if (t <= 1) {
            setCurrentStep(s => (s + 1) % exercise.steps.length);
            return exercise.stepDuration;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [started, done]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const progress = 1 - timeLeft / exercise.duration;

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={[m.container, { backgroundColor: exercise.bg }]}>
        <TouchableOpacity style={m.closeBtn} onPress={onClose}>
          <Text style={m.closeBtnText}>✕</Text>
        </TouchableOpacity>

        <View style={m.header}>
          <Text style={m.exerciseIcon}>{exercise.icon}</Text>
          <Text style={[m.exerciseName, { color: exercise.color }]}>{exercise.name}</Text>
          <Text style={m.exerciseSubtitle}>{exercise.subtitle}</Text>
        </View>

        {!started && !done && (
          <View style={m.startSection}>
            <View style={[m.durationBadge, { backgroundColor: exercise.color + '20' }]}>
              <Text style={[m.durationText, { color: exercise.color }]}>
                {formatTime(exercise.duration)} · {exercise.steps.length} steps
              </Text>
            </View>
            <View style={m.stepsList}>
              {exercise.steps.map((step: string, i: number) => (
                <View key={i} style={m.stepPreview}>
                  <View style={[m.stepNum, { backgroundColor: exercise.color }]}>
                    <Text style={m.stepNumText}>{i + 1}</Text>
                  </View>
                  <Text style={m.stepPreviewText}>{step}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={[m.startBtn, { backgroundColor: exercise.color }]} onPress={() => setStarted(true)}>
              <Text style={m.startBtnText}>Begin ›</Text>
            </TouchableOpacity>
          </View>
        )}

        {started && !done && (
          <View style={m.activeSection}>
            {exercise.type === 'breathing' ? (
              <View style={m.breathCenter}>
                <Animated.View style={[m.breathCircle, { backgroundColor: exercise.color + '30', transform: [{ scale: breathAnim }] }]}>
                  <View style={[m.breathCircleInner, { backgroundColor: exercise.color + '60' }]}>
                    <Text style={m.breathLabel}>{exercise.steps[currentStep % exercise.steps.length]}</Text>
                  </View>
                </Animated.View>
              </View>
            ) : (
              <View style={m.stepActive}>
                <Text style={m.stepCount}>{currentStep + 1} / {exercise.steps.length}</Text>
                <Text style={[m.currentStepText, { color: exercise.color }]}>
                  {exercise.steps[Math.min(currentStep, exercise.steps.length - 1)]}
                </Text>
                <View style={m.stepProgressBar}>
                  <View style={[m.stepProgressFill, { backgroundColor: exercise.color, width: `${(1 - stepTimeLeft / exercise.stepDuration) * 100}%` }]} />
                </View>
              </View>
            )}

            {/* Timer */}
            <View style={m.timerRow}>
              <View style={m.timerCircle}>
                <Text style={[m.timerText, { color: exercise.color }]}>{formatTime(timeLeft)}</Text>
                <Text style={m.timerLabel}>remaining</Text>
              </View>
            </View>

            {/* Progress bar */}
            <View style={m.progressBar}>
              <View style={[m.progressFill, { backgroundColor: exercise.color, width: `${progress * 100}%` }]} />
            </View>
          </View>
        )}

        {done && (
          <View style={m.doneSection}>
            <Text style={m.doneEmoji}>🌟</Text>
            <Text style={[m.doneTitle, { color: exercise.color }]}>Well done!</Text>
            <Text style={m.doneSubtitle}>You completed {exercise.name}. How do you feel now?</Text>
            <View style={m.doneMoods}>
              {['Better', 'Calmer', 'Same', 'Need more'].map(mood => (
                <TouchableOpacity key={mood} style={[m.doneMoodBtn, { borderColor: exercise.color }]} onPress={onClose}>
                  <Text style={[m.doneMoodText, { color: exercise.color }]}>{mood}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

export default function EmotionalTab() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeExercise, setActiveExercise] = useState<any>(null);
  const [guidedWritingExercise, setGuidedWritingExercise] = useState<any>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const filtered = selectedCategory === 'all'
    ? EXERCISES
    : EXERCISES.filter(e => e.category.includes(selectedCategory));

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.sectionLabel}>EMOTIONAL SUPPORT</Text>
        <Text style={s.headerTitle}>How are you{'\n'}feeling right now?</Text>
        <Text style={s.headerSub}>Choose a category and start an exercise.</Text>
      </View>

      {/* Category chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 8 }}>
        {MOOD_CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[s.catChip, selectedCategory === cat.id && { backgroundColor: cat.color, borderColor: cat.color }]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Text style={[s.catChipText, selectedCategory === cat.id && { color: '#fff' }]}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Exercise cards */}
      <View style={s.exerciseGrid}>
        {filtered.map(ex => (
          <TouchableOpacity key={ex.id} style={[s.exCard, { backgroundColor: ex.bg }]} onPress={() => ex.type === 'prompts' ? setGuidedWritingExercise(ex) : setActiveExercise(ex)}>
            <View style={s.exCardTop}>
              <Text style={s.exIcon}>{ex.icon}</Text>
              <View style={[s.exDuration, { backgroundColor: ex.color + '20' }]}>
                <Text style={[s.exDurationText, { color: ex.color }]}>
                  {Math.floor(ex.duration / 60)} min
                </Text>
              </View>
            </View>
            <Text style={[s.exName, { color: ex.color }]}>{ex.name}</Text>
            <Text style={s.exSubtitle}>{ex.subtitle}</Text>
            <View style={[s.exStartBtn, { backgroundColor: ex.color }]}>
              <Text style={s.exStartBtnText}>Start ›</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Active exercise modal */}
      {guidedWritingExercise && (
        <GuidedWriting
          visible={!!guidedWritingExercise}
          exerciseId={guidedWritingExercise.id}
          exerciseName={guidedWritingExercise.name}
          color={guidedWritingExercise.color}
          bg={guidedWritingExercise.bg}
          onClose={() => setGuidedWritingExercise(null)}
        />
      )}
      {activeExercise && (
        <ExerciseModal exercise={activeExercise} onClose={() => setActiveExercise(null)} />
      )}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  sectionLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '700', letterSpacing: 0.8, marginBottom: 6 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#1F2937', lineHeight: 28, marginBottom: 4 },
  headerSub: { fontSize: 13, color: '#6B7280' },
  catChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E5E7EB' },
  catChipText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  exerciseGrid: { paddingHorizontal: 16, paddingTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  exCard: { width: '47%', borderRadius: 20, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  exCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  exIcon: { fontSize: 28 },
  exDuration: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  exDurationText: { fontSize: 10, fontWeight: '700' },
  exName: { fontSize: 14, fontWeight: '800', marginBottom: 4 },
  exSubtitle: { fontSize: 11, color: '#6B7280', lineHeight: 16, marginBottom: 12 },
  exStartBtn: { borderRadius: 10, padding: 8, alignItems: 'center' },
  exStartBtnText: { fontSize: 12, color: '#fff', fontWeight: '700' },
});

const m = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 40 },
  closeBtn: { alignSelf: 'flex-end', width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.08)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  closeBtnText: { fontSize: 14, color: '#374151' },
  header: { alignItems: 'center', marginBottom: 24 },
  exerciseIcon: { fontSize: 56, marginBottom: 8 },
  exerciseName: { fontSize: 24, fontWeight: '900', marginBottom: 4 },
  exerciseSubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  startSection: { flex: 1 },
  durationBadge: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 6, alignSelf: 'center', marginBottom: 20 },
  durationText: { fontSize: 13, fontWeight: '600' },
  stepsList: { gap: 10, marginBottom: 24 },
  stepPreview: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepNum: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontSize: 11, color: '#fff', fontWeight: '700' },
  stepPreviewText: { fontSize: 14, color: '#374151', flex: 1 },
  startBtn: { borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 'auto' as any },
  startBtnText: { fontSize: 16, color: '#fff', fontWeight: '800' },
  activeSection: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 },
  breathCenter: { alignItems: 'center', justifyContent: 'center', height: 220 },
  breathCircle: { width: 180, height: 180, borderRadius: 90, alignItems: 'center', justifyContent: 'center' },
  breathCircleInner: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', padding: 16 },
  breathLabel: { fontSize: 14, color: '#fff', fontWeight: '600', textAlign: 'center' },
  stepActive: { alignItems: 'center', width: '100%', gap: 12 },
  stepCount: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
  currentStepText: { fontSize: 22, fontWeight: '800', textAlign: 'center', lineHeight: 30 },
  stepProgressBar: { width: '100%', height: 4, backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 2 },
  stepProgressFill: { height: 4, borderRadius: 2 },
  timerRow: { alignItems: 'center' },
  timerCircle: { alignItems: 'center' },
  timerText: { fontSize: 36, fontWeight: '900' },
  timerLabel: { fontSize: 11, color: '#9CA3AF' },
  progressBar: { width: '100%', height: 6, backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 3 },
  progressFill: { height: 6, borderRadius: 3 },
  doneSection: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  doneEmoji: { fontSize: 64 },
  doneTitle: { fontSize: 28, fontWeight: '900' },
  doneSubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
  doneMoods: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 12 },
  doneMoodBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, backgroundColor: '#fff' },
  doneMoodText: { fontSize: 13, fontWeight: '600' },
});
