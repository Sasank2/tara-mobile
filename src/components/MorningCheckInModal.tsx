import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  ScrollView, Animated, Platform, Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SW } = Dimensions.get('window');
const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';

interface CheckInData {
  date: string;
  sleepQuality: number;
  hoursSlept: number;
  moods: string[];
  energyLevel: number;
  planetAnswer: string;
  score: number;
  scoreBreakdown: {
    sleep: number;
    mood: number;
    energy: number;
    astro: number;
  };
}

interface PlanetQuestion {
  planet: string;
  glyph: string;
  transit: string;
  question: string;
  options: string[];
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onComplete: (data: CheckInData) => void;
  userName?: string;
  todayPlanet?: PlanetQuestion;
}

const SLEEP_OPTIONS = [
  { emoji: '😫', label: 'Terrible', score: 6  },
  { emoji: '😞', label: 'Poor',     score: 12 },
  { emoji: '😐', label: 'Okay',     score: 18 },
  { emoji: '😊', label: 'Good',     score: 24 },
  { emoji: '✨', label: 'Great',    score: 30 },
];

const MOODS = [
  { emoji: '😊', label: 'Happy',     score: 10 },
  { emoji: '😌', label: 'Calm',      score: 9  },
  { emoji: '💪', label: 'Motivated', score: 10 },
  { emoji: '🙏', label: 'Grateful',  score: 9  },
  { emoji: '😐', label: 'Neutral',   score: 5  },
  { emoji: '😴', label: 'Tired',     score: 3  },
  { emoji: '😰', label: 'Anxious',   score: 2  },
  { emoji: '😢', label: 'Sad',       score: 2  },
  { emoji: '😕', label: 'Confused',  score: 3  },
];

const ENERGY_DESC: Record<number, string> = {
  1:  'Completely drained — rest is the priority',
  2:  'Very low — be gentle with yourself',
  3:  'Running on fumes — basics only today',
  4:  'Below average — slow and steady',
  5:  'Half tank — manageable with breaks',
  6:  'Steady — you\'ve got enough to work with',
  7:  'Pretty good — momentum is building',
  8:  'Energised — good day for important tasks',
  9:  'High energy — lean into it',
  10: 'Fully charged — peak performance day',
};

const FALLBACK_QUESTION: PlanetQuestion = {
  planet:   'Moon',
  glyph:    '☽',
  transit:  'Moon in transit',
  question: 'What is your intention for today?',
  options:  ['Rest & restore', 'Focus & produce', 'Connect with others', 'Just get through it'],
};

function getScoreInsight(score: number, planetTransit: string): string {
  if (score >= 80) return `Strong day ahead — ${planetTransit} is supporting your clarity and focus.`;
  if (score >= 65) return `Solid foundation — lean into what feels natural with ${planetTransit} in the sky.`;
  if (score >= 50) return `Take it one step at a time — ${planetTransit} asks for presence over pressure today.`;
  if (score >= 35) return `Go gently — ${planetTransit} supports rest and reflection more than output today.`;
  return `Rest first — your chart supports recovery today. Be kind to yourself.`;
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

// ── Animated score counter ────────────────────────────────────────────────────
function AnimatedScore({ target }: { target: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let current = 0;
    const step = Math.ceil(target / 40);
    const interval = setInterval(() => {
      current = Math.min(current + step, target);
      setDisplay(current);
      if (current >= target) clearInterval(interval);
    }, 20);
    return () => clearInterval(interval);
  }, [target]);
  return <Text style={sc.scoreBig}>{display}</Text>;
}

// ── Animated progress bar ─────────────────────────────────────────────────────
function ProgressBar({ score }: { score: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: score / 100,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [score]);
  return (
    <View style={sc.barTrack}>
      <Animated.View style={[sc.barFill, {
        width: anim.interpolate({ inputRange: [0,1], outputRange: ['0%','100%'] }),
      }]} />
    </View>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export default function MorningCheckInModal({
  visible, onClose, onComplete, userName = 'friend', todayPlanet,
}: Props) {
  const [step, setStep]                   = useState(1);
  const [sleepQuality, setSleepQuality]   = useState(0);
  const [hoursSlept, setHoursSlept]       = useState(7);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [energyLevel, setEnergyLevel]     = useState(6);
  const [planetAnswer, setPlanetAnswer]   = useState('');
  const [scoreData, setScoreData]         = useState<{
    total: number; sleep: number; mood: number; energy: number; astro: number;
  } | null>(null);

  const planetQ  = todayPlanet ?? FALLBACK_QUESTION;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const fadeToStep = (n: number) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      setStep(n);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  const toggleMood = (label: string) => {
    setSelectedMoods(prev =>
      prev.includes(label) ? prev.filter(m => m !== label) : [...prev, label]
    );
  };

  const calculateScore = () => {
    const sleepScore  = sleepQuality > 0 ? SLEEP_OPTIONS[sleepQuality - 1].score : 0;
    const moodScore   = Math.min(30,
      selectedMoods.reduce((sum, m) => {
        const mood = MOODS.find(mo => mo.label === m);
        return sum + (mood?.score ?? 5);
      }, 0)
    );
    const energyScore = Math.round((energyLevel / 10) * 25);
    const astroScore  = planetAnswer ? 10 : 5;
    const total       = Math.min(100, sleepScore + moodScore + energyScore + astroScore);

    const data = { total, sleep: sleepScore, mood: moodScore, energy: energyScore, astro: astroScore };
    setScoreData(data);
    fadeToStep(4);

    const checkIn: CheckInData = {
      date: todayStr(),
      sleepQuality,
      hoursSlept,
      moods: selectedMoods,
      energyLevel,
      planetAnswer,
      score: total,
      scoreBreakdown: { sleep: sleepScore, mood: moodScore, energy: energyScore, astro: astroScore },
    };
    AsyncStorage.setItem(`checkin_${todayStr()}`, JSON.stringify(checkIn));
    onComplete(checkIn);
  };

  const reset = () => {
    setStep(1);
    setSleepQuality(0);
    setHoursSlept(7);
    setSelectedMoods([]);
    setEnergyLevel(6);
    setPlanetAnswer('');
    setScoreData(null);
    fadeAnim.setValue(1);
  };

  const handleClose = () => { reset(); onClose(); };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={handleClose}>

      <View style={sc.overlay}>
        <View style={sc.sheet}>

          {/* Handle */}
          <View style={sc.handle} />

          {/* Header — dots + close */}
          <View style={sc.header}>
            <View style={sc.dots}>
              {[1,2,3,4].map(i => (
                <View key={i} style={[sc.dot, i <= step && sc.dotActive]} />
              ))}
            </View>
            {step < 4 && (
              <TouchableOpacity style={sc.closeBtn} onPress={handleClose}>
                <Text style={sc.closeBtnText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Animated content */}
          <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
            <ScrollView
              style={sc.scroll}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={sc.scrollContent}
              keyboardShouldPersistTaps="handled">

              {/* ── STEP 1: Sleep ── */}
              {step === 1 && (
                <View>
                  <Text style={sc.eyebrow}>STEP 1 OF 4</Text>
                  <Text style={sc.title}>How did you{'\n'}sleep, {userName}?</Text>
                  <Text style={sc.subtitle}>Be honest — Tara uses this</Text>

                  <View style={sc.astroPill}>
                    <Text style={sc.astroPillGlyph}>{planetQ.glyph}</Text>
                    <Text style={sc.astroPillText}>{planetQ.transit}</Text>
                  </View>

                  {/* Sleep quality cards */}
                  <View style={sc.sleepRow}>
                    {SLEEP_OPTIONS.map((opt, i) => (
                      <TouchableOpacity
                        key={opt.label}
                        style={[sc.sleepCard, sleepQuality === i+1 && sc.sleepCardActive]}
                        onPress={() => setSleepQuality(i+1)}
                        activeOpacity={0.75}>
                        <Text style={sc.sleepEmoji}>{opt.emoji}</Text>
                        <Text style={[sc.sleepLabel, sleepQuality === i+1 && sc.sleepLabelActive]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Hours slept */}
                  <View style={sc.hoursRow}>
                    <Text style={sc.hoursLabel}>Hours slept</Text>
                    <View style={sc.hoursBtns}>
                      <TouchableOpacity
                        style={sc.hoursBtn}
                        onPress={() => setHoursSlept(h => Math.max(3, +(h - 0.5).toFixed(1)))}>
                        <Text style={sc.hoursBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={sc.hoursVal}>{hoursSlept}h</Text>
                      <TouchableOpacity
                        style={sc.hoursBtn}
                        onPress={() => setHoursSlept(h => Math.min(12, +(h + 0.5).toFixed(1)))}>
                        <Text style={sc.hoursBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={sc.btnRow}>
                    <TouchableOpacity
                      style={[sc.btnNext, sleepQuality === 0 && sc.btnNextDisabled]}
                      onPress={() => sleepQuality > 0 && fadeToStep(2)}
                      disabled={sleepQuality === 0}>
                      <Text style={sc.btnNextText}>Next →</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* ── STEP 2: Mood ── */}
              {step === 2 && (
                <View>
                  <Text style={sc.eyebrow}>STEP 2 OF 4</Text>
                  <Text style={sc.title}>How are you{'\n'}feeling?</Text>
                  <Text style={sc.subtitle}>Pick everything that fits right now</Text>

                  <View style={sc.moodGrid}>
                    {MOODS.map(mood => (
                      <TouchableOpacity
                        key={mood.label}
                        style={[sc.moodChip, selectedMoods.includes(mood.label) && sc.moodChipActive]}
                        onPress={() => toggleMood(mood.label)}
                        activeOpacity={0.75}>
                        <Text style={sc.moodEmoji}>{mood.emoji}</Text>
                        <Text style={[sc.moodLabel, selectedMoods.includes(mood.label) && sc.moodLabelActive]}>
                          {mood.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={sc.btnRow}>
                    <TouchableOpacity style={sc.btnBack} onPress={() => fadeToStep(1)}>
                      <Text style={sc.btnBackText}>← Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[sc.btnNext, selectedMoods.length === 0 && sc.btnNextDisabled]}
                      onPress={() => selectedMoods.length > 0 && fadeToStep(3)}
                      disabled={selectedMoods.length === 0}>
                      <Text style={sc.btnNextText}>Next →</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* ── STEP 3: Energy + Planet Q ── */}
              {step === 3 && (
                <View>
                  <Text style={sc.eyebrow}>STEP 3 OF 4</Text>
                  <Text style={sc.title}>What's your{'\n'}energy?</Text>
                  <Text style={sc.subtitle}>Tap a dot to set your level</Text>

                  <View style={sc.energyWrap}>
                    <View style={sc.energyLabels}>
                      <Text style={sc.energyLbl}>Drained</Text>
                      <Text style={sc.energyLbl}>Buzzing</Text>
                    </View>

                    {/* Dot-based energy selector */}
                    <View style={sc.energyDots}>
                      {Array.from({ length: 10 }).map((_, i) => (
                        <TouchableOpacity
                          key={i}
                          style={[sc.energyDot, energyLevel >= i+1 && sc.energyDotActive]}
                          onPress={() => setEnergyLevel(i+1)}
                          activeOpacity={0.7}>
                          <View style={[sc.energyDotInner, energyLevel >= i+1 && sc.energyDotInnerActive]} />
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={sc.energyNum}>{energyLevel} / 10</Text>
                    <Text style={sc.energyDesc}>{ENERGY_DESC[energyLevel]}</Text>
                  </View>

                  {/* Planet question */}
                  <View style={sc.planetCard}>
                    <View style={sc.planetCardHead}>
                      <Text style={sc.planetCardGlyph}>{planetQ.glyph}</Text>
                      <Text style={sc.planetCardTransit}>{planetQ.transit.toUpperCase()} ASKS</Text>
                    </View>
                    <Text style={sc.planetCardQ}>{planetQ.question}</Text>
                    <View style={sc.planetChips}>
                      {planetQ.options.map(opt => (
                        <TouchableOpacity
                          key={opt}
                          style={[sc.planetChip, planetAnswer === opt && sc.planetChipActive]}
                          onPress={() => setPlanetAnswer(opt)}>
                          <Text style={[sc.planetChipText, planetAnswer === opt && sc.planetChipTextActive]}>
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={sc.btnRow}>
                    <TouchableOpacity style={sc.btnBack} onPress={() => fadeToStep(2)}>
                      <Text style={sc.btnBackText}>← Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={sc.btnNext} onPress={calculateScore}>
                      <Text style={sc.btnNextText}>See my score →</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* ── STEP 4: Score reveal ── */}
              {step === 4 && scoreData && (
                <View>
                  <Text style={sc.eyebrow}>YOUR COSMIC SCORE</Text>

                  <View style={sc.scoreReveal}>
                    <AnimatedScore target={scoreData.total} />
                    <Text style={sc.scoreLabel}>TODAY'S SCORE</Text>
                  </View>

                  <ProgressBar score={scoreData.total} />

                  {/* Breakdown */}
                  <View style={sc.breakdown}>
                    {[
                      { label: 'Sleep',  val: scoreData.sleep  },
                      { label: 'Mood',   val: scoreData.mood   },
                      { label: 'Energy', val: scoreData.energy },
                      { label: 'Astro',  val: scoreData.astro  },
                    ].map(item => (
                      <View key={item.label} style={sc.breakdownItem}>
                        <Text style={sc.breakdownNum}>{item.val}</Text>
                        <Text style={sc.breakdownLbl}>{item.label}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Mood summary */}
                  {selectedMoods.length > 0 && (
                    <View style={sc.moodSummary}>
                      <Text style={sc.moodSummaryLabel}>YOU'RE FEELING</Text>
                      <Text style={sc.moodSummaryText}>{selectedMoods.join(' · ')}</Text>
                    </View>
                  )}

                  {/* Tara insight */}
                  <View style={sc.insightCard}>
                    <View style={sc.insightHeader}>
                      <View style={sc.taraOrb}>
                        <Text style={sc.taraOrbText}>✦</Text>
                      </View>
                      <Text style={sc.insightLabel}>TARA</Text>
                    </View>
                    <Text style={sc.insightText}>
                      {getScoreInsight(scoreData.total, planetQ.transit)}
                    </Text>
                  </View>

                  <TouchableOpacity style={sc.btnDone} onPress={handleClose}>
                    <Text style={sc.btnDoneText}>Start my day ✦</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={{ height: 32 }} />
            </ScrollView>
          </Animated.View>

        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const sc = StyleSheet.create({
  overlay:              { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
                          justifyContent: 'flex-end' },
  sheet:                { backgroundColor: '#FAF7F2', borderTopLeftRadius: 28,
                          borderTopRightRadius: 28, height: '92%',
                          paddingBottom: Platform.OS === 'ios' ? 32 : 16 },
  handle:               { width: 36, height: 4, backgroundColor: '#D8CEC0',
                          borderRadius: 2, alignSelf: 'center',
                          marginTop: 10, marginBottom: 4 },
  scroll:               { flex: 1 },
  scrollContent:        { padding: 22, paddingTop: 8 },

  // header
  header:               { flexDirection: 'row', justifyContent: 'space-between',
                          alignItems: 'center', paddingHorizontal: 22, paddingVertical: 10 },
  dots:                 { flexDirection: 'row', gap: 5 },
  dot:                  { width: 22, height: 4, borderRadius: 2, backgroundColor: '#EDE8E0' },
  dotActive:            { backgroundColor: '#C1560A' },
  closeBtn:             { width: 32, height: 32, borderRadius: 16,
                          backgroundColor: '#EDE8E0', alignItems: 'center',
                          justifyContent: 'center' },
  closeBtnText:         { fontSize: 13, color: '#5A4030', fontWeight: '600' },

  // typography
  eyebrow:              { fontSize: 9, letterSpacing: 2, color: '#C1560A',
                          fontWeight: '700', marginBottom: 6 },
  title:                { fontSize: 26, fontWeight: '800', color: '#1A0E06',
                          letterSpacing: -0.5, lineHeight: 32, marginBottom: 4 },
  subtitle:             { fontSize: 12, color: '#9A8060', fontStyle: 'italic',
                          fontFamily: SERIF, marginBottom: 18 },

  // astro pill
  astroPill:            { backgroundColor: '#1A0E06', borderRadius: 10, padding: 10,
                          flexDirection: 'row', alignItems: 'center',
                          gap: 8, marginBottom: 20 },
  astroPillGlyph:       { fontSize: 16, color: '#F5C87A' },
  astroPillText:        { fontSize: 11, color: '#F5E8D0', flex: 1, lineHeight: 16 },

  // sleep
  sleepRow:             { flexDirection: 'row', gap: 6, marginBottom: 16 },
  sleepCard:            { flex: 1, borderRadius: 14, backgroundColor: '#EDE8E0',
                          alignItems: 'center', justifyContent: 'center',
                          paddingVertical: 12, borderWidth: 1.5,
                          borderColor: 'transparent' },
  sleepCardActive:      { backgroundColor: '#FFF3E0', borderColor: '#C1560A' },
  sleepEmoji:           { fontSize: 22, marginBottom: 4 },
  sleepLabel:           { fontSize: 8, color: '#9A8060', fontWeight: '600',
                          letterSpacing: 0.2 },
  sleepLabelActive:     { color: '#C1560A' },

  // hours
  hoursRow:             { flexDirection: 'row', alignItems: 'center',
                          backgroundColor: '#FFF8F0', borderRadius: 14,
                          padding: 14, borderWidth: 0.5, borderColor: '#F0C878',
                          marginBottom: 24 },
  hoursLabel:           { flex: 1, fontSize: 13, color: '#3A1A08', fontWeight: '500' },
  hoursBtns:            { flexDirection: 'row', alignItems: 'center', gap: 14 },
  hoursBtn:             { width: 36, height: 36, borderRadius: 10,
                          backgroundColor: '#EDE8E0', alignItems: 'center',
                          justifyContent: 'center' },
  hoursBtnText:         { fontSize: 20, color: '#5A4030', fontWeight: '500',
                          lineHeight: 22 },
  hoursVal:             { fontSize: 20, fontWeight: '700', color: '#1A0E06',
                          minWidth: 38, textAlign: 'center' },

  // mood
  moodGrid:             { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  moodChip:             { width: (SW - 44 - 16) / 3, borderRadius: 14,
                          backgroundColor: '#EDE8E0', alignItems: 'center',
                          paddingVertical: 12, borderWidth: 1.5,
                          borderColor: 'transparent' },
  moodChipActive:       { backgroundColor: '#FFF3E0', borderColor: '#C1560A' },
  moodEmoji:            { fontSize: 24, marginBottom: 5 },
  moodLabel:            { fontSize: 10, color: '#5A4030', fontWeight: '600' },
  moodLabelActive:      { color: '#C1560A' },

  // energy
  energyWrap:           { marginBottom: 18 },
  energyLabels:         { flexDirection: 'row', justifyContent: 'space-between',
                          marginBottom: 12 },
  energyLbl:            { fontSize: 10, color: '#9A8060' },
  energyDots:           { flexDirection: 'row', justifyContent: 'space-between',
                          marginBottom: 14, paddingHorizontal: 4 },
  energyDot:            { width: 28, height: 28, borderRadius: 14,
                          backgroundColor: '#EDE8E0', alignItems: 'center',
                          justifyContent: 'center' },
  energyDotActive:      { backgroundColor: '#FFF3E0' },
  energyDotInner:       { width: 12, height: 12, borderRadius: 6,
                          backgroundColor: '#D8CEC0' },
  energyDotInnerActive: { backgroundColor: '#C1560A' },
  energyNum:            { fontSize: 28, fontWeight: '800', color: '#1A0E06',
                          textAlign: 'center', marginBottom: 4 },
  energyDesc:           { fontSize: 12, color: '#9A8060', textAlign: 'center',
                          fontStyle: 'italic', fontFamily: SERIF, lineHeight: 18 },

  // planet card
  planetCard:           { backgroundColor: '#FFF8F0', borderRadius: 14,
                          padding: 14, borderWidth: 0.5, borderColor: '#F0C878',
                          marginBottom: 24 },
  planetCardHead:       { flexDirection: 'row', alignItems: 'center',
                          gap: 6, marginBottom: 8 },
  planetCardGlyph:      { fontSize: 16, color: '#C1560A' },
  planetCardTransit:    { fontSize: 9, color: '#C1560A', fontWeight: '700',
                          letterSpacing: 1 },
  planetCardQ:          { fontSize: 14, color: '#3A1A08', fontStyle: 'italic',
                          fontFamily: SERIF, lineHeight: 21, marginBottom: 12 },
  planetChips:          { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  planetChip:           { borderRadius: 12, paddingHorizontal: 13, paddingVertical: 7,
                          backgroundColor: '#FFF3E0', borderWidth: 0.5,
                          borderColor: '#F0C878' },
  planetChipActive:     { backgroundColor: '#C1560A', borderColor: '#C1560A' },
  planetChipText:       { fontSize: 11, color: '#854F0B', fontWeight: '500' },
  planetChipTextActive: { color: '#fff' },

  // score
  scoreReveal:          { alignItems: 'center', paddingVertical: 10 },
  scoreBig:             { fontSize: 88, fontWeight: '900', color: '#1A0E06',
                          lineHeight: 96, letterSpacing: -3 },
  scoreLabel:           { fontSize: 9, color: '#9A8060', letterSpacing: 2, marginTop: 2 },
  barTrack:             { height: 6, backgroundColor: '#EDE8E0', borderRadius: 3,
                          marginVertical: 16, overflow: 'hidden' },
  barFill:              { height: 6, backgroundColor: '#C1560A', borderRadius: 3 },
  breakdown:            { flexDirection: 'row', marginBottom: 18 },
  breakdownItem:        { flex: 1, alignItems: 'center' },
  breakdownNum:         { fontSize: 20, fontWeight: '700', color: '#1A0E06' },
  breakdownLbl:         { fontSize: 9, color: '#9A8060', marginTop: 3,
                          letterSpacing: 0.3 },

  // mood summary
  moodSummary:          { backgroundColor: '#EDE8E0', borderRadius: 12,
                          padding: 12, marginBottom: 14 },
  moodSummaryLabel:     { fontSize: 9, color: '#9A8060', letterSpacing: 1.5,
                          marginBottom: 4 },
  moodSummaryText:      { fontSize: 13, color: '#1A0E06', fontWeight: '500',
                          lineHeight: 20 },

  // insight card
  insightCard:          { backgroundColor: '#FFF8F0', borderRadius: 14,
                          padding: 14, borderWidth: 0.5, borderColor: '#F0C878',
                          marginBottom: 22 },
  insightHeader:        { flexDirection: 'row', alignItems: 'center',
                          gap: 6, marginBottom: 8 },
  taraOrb:              { width: 26, height: 26, borderRadius: 13,
                          backgroundColor: '#C1560A', alignItems: 'center',
                          justifyContent: 'center' },
  taraOrbText:          { fontSize: 12, color: '#fff' },
  insightLabel:         { fontSize: 9, color: '#C1560A', fontWeight: '700',
                          letterSpacing: 1.5 },
  insightText:          { fontSize: 13, color: '#3A1A08', fontStyle: 'italic',
                          fontFamily: SERIF, lineHeight: 21 },

  // buttons
  btnRow:               { flexDirection: 'row', gap: 8, marginTop: 4 },
  btnBack:              { flex: 1, paddingVertical: 14, borderRadius: 16,
                          backgroundColor: '#EDE8E0', alignItems: 'center' },
  btnBackText:          { fontSize: 13, fontWeight: '600', color: '#5A4030' },
  btnNext:              { flex: 2, paddingVertical: 14, borderRadius: 16,
                          backgroundColor: '#C1560A', alignItems: 'center' },
  btnNextDisabled:      { backgroundColor: '#D8C8B8' },
  btnNextText:          { fontSize: 13, fontWeight: '700', color: '#fff' },
  btnDone:              { paddingVertical: 16, borderRadius: 16,
                          backgroundColor: '#1A0E06', alignItems: 'center',
                          marginTop: 4 },
  btnDoneText:          { fontSize: 14, fontWeight: '700', color: '#FAF7F2',
                          letterSpacing: 0.5 },
});