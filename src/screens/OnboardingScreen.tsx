import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
  Alert, Animated, Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { profileAPI } from '../services/api';

const { width } = Dimensions.get('window');
const ORANGE = '#F5A623';
const CREAM = '#F2EFE8';
const DARK_CREAM = '#E8E3D8';
const DARK = '#1F2937';
const TOTAL_STEPS = 5;

const INTENTIONS = [
  { id: 'self', icon: '🔮', title: 'Understanding myself better', desc: 'Know your patterns, strengths and blind spots' },
  { id: 'career', icon: '💼', title: 'Career clarity', desc: 'Timing, decisions and finding your direction' },
  { id: 'love', icon: '💗', title: 'Love & relationships', desc: 'Connection, communication and compatibility' },
  { id: 'stress', icon: '🌊', title: 'Managing stress & anxiety', desc: 'Emotional support and grounding exercises' },
  { id: 'spiritual', icon: '✦', title: 'Spiritual growth', desc: 'Deeper meaning, purpose and awareness' },
  { id: 'all', icon: '🌟', title: 'All of the above', desc: 'Let Tara guide you across everything' },
];

const FEELINGS = [
  { id: 'good', icon: '😊', title: 'Pretty good, just curious' },
  { id: 'tough', icon: '🌧', title: 'Going through a tough time' },
  { id: 'stuck', icon: '🌀', title: 'Feeling stuck or lost' },
  { id: 'direction', icon: '🧭', title: 'Looking for direction' },
];

const FREQUENCIES = [
  { id: 'daily', icon: '☀', title: 'Every morning', desc: 'Start each day with guidance' },
  { id: 'few', icon: '✦', title: 'A few times a week', desc: 'When I have time to reflect' },
  { id: 'needed', icon: '🌙', title: 'When I need it', desc: 'I will check in on my own' },
];

export default function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [timeOfBirth, setTimeOfBirth] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [preference, setPreference] = useState<'astral' | 'vedic' | 'both'>('both');
  const [selectedIntentions, setSelectedIntentions] = useState<string[]>([]);
  const [selectedFeeling, setSelectedFeeling] = useState('');
  const [selectedFrequency, setSelectedFrequency] = useState('');
  const [loading, setLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const fadeTransition = (callback: () => void) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
      callback();
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    });
  };

  const goNext = () => fadeTransition(() => setStep(s => s + 1));
  const goBack = () => fadeTransition(() => setStep(s => s - 1));

  const toggleIntention = (id: string) => {
    if (id === 'all') { setSelectedIntentions(['all']); return; }
    setSelectedIntentions(prev => {
      const without = prev.filter(i => i !== 'all');
      return without.includes(id) ? without.filter(i => i !== id) : [...without, id];
    });
  };

  const handleComplete = async () => {
    if (!fullName || !dateOfBirth || !timeOfBirth || !placeOfBirth) {
      Alert.alert('Missing info', 'Please fill in all fields');
      setStep(1);
      return;
    }
    setLoading(true);
    try {
      await profileAPI.createBirthProfile({ fullName, dateOfBirth, timeOfBirth, placeOfBirth });
      await AsyncStorage.setItem('hasProfile', 'true');
      await AsyncStorage.setItem('preference', preference);
      await AsyncStorage.setItem('intentions', JSON.stringify(selectedIntentions));
      await AsyncStorage.setItem('feeling', selectedFeeling);
      await AsyncStorage.setItem('frequency', selectedFrequency);
      onComplete();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Could not save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const progress = step / TOTAL_STEPS;

  return (
    <View style={s.container}>
      {/* Progress bar */}
      <View style={s.progressWrap}>
        <View style={s.progressBg}>
          <Animated.View style={[s.progressFill, { width: `${progress * 100}%` as any }]} />
        </View>
        <Text style={s.stepCount}>{step} of {TOTAL_STEPS}</Text>
      </View>

      <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* STEP 1 — Birth details */}
          {step === 1 && (
            <View style={s.stepWrap}>
              <Text style={s.wordmark}>Tara</Text>
              <Text style={s.stepTitle}>Your birth details</Text>
              <Text style={s.stepDesc}>
                Tara uses your exact birth details to generate your personal astrology chart and daily guidance.
              </Text>

              <Text style={s.label}>Full name</Text>
              <TextInput style={s.input} value={fullName} onChangeText={setFullName}
                placeholder="Your name" placeholderTextColor="#9CA3AF" />

              <Text style={s.label}>Date of birth</Text>
              <TextInput style={s.input} value={dateOfBirth} onChangeText={setDateOfBirth}
                placeholder="YYYY-MM-DD" placeholderTextColor="#9CA3AF" />

              <Text style={s.label}>Time of birth</Text>
              <TextInput style={s.input} value={timeOfBirth} onChangeText={setTimeOfBirth}
                placeholder="HH:MM (24hr format)" placeholderTextColor="#9CA3AF" />

              <Text style={s.label}>Place of birth</Text>
              <TextInput style={s.input} value={placeOfBirth} onChangeText={setPlaceOfBirth}
                placeholder="City, Country" placeholderTextColor="#9CA3AF" />

              <TouchableOpacity
                style={[s.primaryBtn, (!fullName || !dateOfBirth || !timeOfBirth || !placeOfBirth) && s.primaryBtnDisabled]}
                onPress={goNext}
                disabled={!fullName || !dateOfBirth || !timeOfBirth || !placeOfBirth}
              >
                <Text style={s.primaryBtnText}>Continue →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2 — Astrology preference */}
          {step === 2 && (
            <View style={s.stepWrap}>
              <Text style={s.stepEmoji}>✦</Text>
              <Text style={s.stepTitle}>Your astrology{'\n'}preference</Text>
              <Text style={s.stepDesc}>Choose which tradition resonates with you. You can switch anytime.</Text>

              {([
                { id: 'astral', icon: '☀', title: 'Astral', desc: 'Western astrology — Sun, Moon, Rising signs' },
                { id: 'vedic', icon: 'ॐ', title: 'Vedic', desc: 'Indian astrology — Rashi, Nakshatra, Lagna' },
                { id: 'both', icon: '🌟', title: 'Both (recommended)', desc: 'See both Astral and Vedic guidance together' },
              ] as const).map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[s.optionCard, preference === p.id && s.optionCardActive]}
                  onPress={() => setPreference(p.id)}
                >
                  <Text style={s.optionIcon}>{p.icon}</Text>
                  <View style={s.optionBody}>
                    <Text style={[s.optionTitle, preference === p.id && { color: ORANGE }]}>{p.title}</Text>
                    <Text style={s.optionDesc}>{p.desc}</Text>
                  </View>
                  <View style={[s.radio, preference === p.id && s.radioActive]}>
                    {preference === p.id && <View style={s.radioDot} />}
                  </View>
                </TouchableOpacity>
              ))}

              <TouchableOpacity style={s.primaryBtn} onPress={goNext}>
                <Text style={s.primaryBtnText}>Continue →</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.backBtn} onPress={goBack}>
                <Text style={s.backBtnText}>← Back</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 3 — Intentions */}
          {step === 3 && (
            <View style={s.stepWrap}>
              <Text style={s.stepEmoji}>🔮</Text>
              <Text style={s.stepTitle}>What are you{'\n'}looking for?</Text>
              <Text style={s.stepDesc}>Select all that apply. Tara will personalize your experience around these.</Text>

              {INTENTIONS.map((item) => {
                const selected = selectedIntentions.includes(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[s.optionCard, selected && s.optionCardActive]}
                    onPress={() => toggleIntention(item.id)}
                  >
                    <Text style={s.optionIcon}>{item.icon}</Text>
                    <View style={s.optionBody}>
                      <Text style={[s.optionTitle, selected && { color: ORANGE }]}>{item.title}</Text>
                      <Text style={s.optionDesc}>{item.desc}</Text>
                    </View>
                    <View style={[s.checkbox, selected && s.checkboxActive]}>
                      {selected && <Text style={s.checkmark}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={[s.primaryBtn, selectedIntentions.length === 0 && s.primaryBtnDisabled]}
                onPress={goNext}
                disabled={selectedIntentions.length === 0}
              >
                <Text style={s.primaryBtnText}>Continue →</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.backBtn} onPress={goBack}>
                <Text style={s.backBtnText}>← Back</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 4 — How are you feeling */}
          {step === 4 && (
            <View style={s.stepWrap}>
              <Text style={s.stepEmoji}>🌊</Text>
              <Text style={s.stepTitle}>How are you{'\n'}feeling lately?</Text>
              <Text style={s.stepDesc}>This helps Tara set the right tone for your first week.</Text>

              {FEELINGS.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[s.feelingCard, selectedFeeling === item.id && s.feelingCardActive]}
                  onPress={() => setSelectedFeeling(item.id)}
                >
                  <Text style={s.feelingIcon}>{item.icon}</Text>
                  <Text style={[s.feelingTitle, selectedFeeling === item.id && { color: ORANGE, fontWeight: '700' }]}>
                    {item.title}
                  </Text>
                  <View style={[s.radio, selectedFeeling === item.id && s.radioActive]}>
                    {selectedFeeling === item.id && <View style={s.radioDot} />}
                  </View>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={[s.primaryBtn, !selectedFeeling && s.primaryBtnDisabled]}
                onPress={goNext}
                disabled={!selectedFeeling}
              >
                <Text style={s.primaryBtnText}>Continue →</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.backBtn} onPress={goBack}>
                <Text style={s.backBtnText}>← Back</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 5 — Frequency + Generate */}
          {step === 5 && (
            <View style={s.stepWrap}>
              <Text style={s.stepEmoji}>☀</Text>
              <Text style={s.stepTitle}>How often do you{'\n'}want guidance?</Text>
              <Text style={s.stepDesc}>You can always change this in your settings.</Text>

              {FREQUENCIES.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[s.optionCard, selectedFrequency === item.id && s.optionCardActive]}
                  onPress={() => setSelectedFrequency(item.id)}
                >
                  <Text style={s.optionIcon}>{item.icon}</Text>
                  <View style={s.optionBody}>
                    <Text style={[s.optionTitle, selectedFrequency === item.id && { color: ORANGE }]}>{item.title}</Text>
                    <Text style={s.optionDesc}>{item.desc}</Text>
                  </View>
                  <View style={[s.radio, selectedFrequency === item.id && s.radioActive]}>
                    {selectedFrequency === item.id && <View style={s.radioDot} />}
                  </View>
                </TouchableOpacity>
              ))}

              {/* Summary */}
              {selectedFrequency && (
                <View style={s.summaryCard}>
                  <Text style={s.summaryLabel}>YOUR TARA PROFILE</Text>
                  <Text style={s.summaryName}>{fullName} ✦</Text>
                  <Text style={s.summaryDetail}>Born {dateOfBirth} · {placeOfBirth}</Text>
                  <Text style={s.summaryDetail}>Preference: {preference === 'both' ? 'Astral + Vedic' : preference}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[s.primaryBtn, (!selectedFrequency || loading) && s.primaryBtnDisabled]}
                onPress={handleComplete}
                disabled={!selectedFrequency || loading}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.primaryBtnText}>Generate my chart ✦</Text>
                }
              </TouchableOpacity>
              <TouchableOpacity style={s.backBtn} onPress={goBack}>
                <Text style={s.backBtnText}>← Back</Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  progressWrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 56, paddingBottom: 8, gap: 12 },
  progressBg: { flex: 1, height: 4, backgroundColor: DARK_CREAM, borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: ORANGE, borderRadius: 2 },
  stepCount: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  stepWrap: { paddingTop: 24 },
  wordmark: { fontSize: 28, fontWeight: '500', color: DARK, letterSpacing: 6, marginBottom: 32, fontStyle: 'italic' },
  stepEmoji: { fontSize: 40, marginBottom: 16 },
  stepTitle: { fontSize: 30, fontWeight: '900', color: DARK, lineHeight: 36, marginBottom: 10 },
  stepDesc: { fontSize: 14, color: '#6B7280', lineHeight: 22, marginBottom: 28 },
  label: { fontSize: 12, color: '#9CA3AF', fontWeight: '600', letterSpacing: 0.5, marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: DARK_CREAM,
    borderRadius: 14, padding: 14, fontSize: 15, color: DARK,
  },
  optionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 16, padding: 14,
    marginBottom: 10, borderWidth: 1.5, borderColor: DARK_CREAM,
  },
  optionCardActive: { borderColor: ORANGE, backgroundColor: '#FFF3E0' },
  optionIcon: { fontSize: 24, width: 36, textAlign: 'center' },
  optionBody: { flex: 1 },
  optionTitle: { fontSize: 14, fontWeight: '600', color: DARK, marginBottom: 2 },
  optionDesc: { fontSize: 12, color: '#9CA3AF', lineHeight: 17 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: DARK_CREAM, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: ORANGE },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: ORANGE },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: DARK_CREAM, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { borderColor: ORANGE, backgroundColor: ORANGE },
  checkmark: { fontSize: 12, color: '#fff', fontWeight: '700' },
  feelingCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    marginBottom: 10, borderWidth: 1.5, borderColor: DARK_CREAM,
  },
  feelingCardActive: { borderColor: ORANGE, backgroundColor: '#FFF3E0' },
  feelingIcon: { fontSize: 24 },
  feelingTitle: { flex: 1, fontSize: 15, color: DARK },
  summaryCard: { backgroundColor: DARK, borderRadius: 20, padding: 20, marginTop: 8, marginBottom: 4 },
  summaryLabel: { fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, marginBottom: 8 },
  summaryName: { fontSize: 20, fontWeight: '900', color: '#fff', marginBottom: 6 },
  summaryDetail: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 2 },
  primaryBtn: { backgroundColor: DARK, borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 20 },
  primaryBtnDisabled: { backgroundColor: DARK_CREAM },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  backBtn: { alignItems: 'center', marginTop: 14, padding: 8 },
  backBtnText: { fontSize: 13, color: '#9CA3AF' },
});
