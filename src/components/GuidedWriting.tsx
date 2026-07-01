import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, TextInput, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, Animated,
} from 'react-native';

const ORANGE = '#F5A623';
const CREAM = '#F2EFE8';
const DARK_CREAM = '#E8E3D8';
const DARK = '#1F2937';

// Different prompts based on exercise mood
const MOOD_PROMPTS: Record<string, { prompts: string[]; color: string; icon: string }> = {
  write: {
    icon: '✍️',
    color: '#F59E0B',
    prompts: [
      'How am I feeling right now?',
      'What triggered this feeling?',
      'What do I need right now?',
    ],
  },
  gratitude: {
    icon: '🌟',
    color: '#F59E0B',
    prompts: [
      'What is one thing I am grateful for today?',
      'Who is one person who makes my life better?',
      'What is one thing my body does for me?',
    ],
  },
  anxious: {
    icon: '💭',
    color: '#EC4899',
    prompts: [
      'What thought keeps coming back to me right now?',
      'Is this thought based on fact or fear?',
      'What would I tell a friend feeling this way?',
    ],
  },
  low: {
    icon: '🌊',
    color: '#3B82F6',
    prompts: [
      'What is feeling heavy for me right now?',
      'When did I last feel like myself?',
      'What is one small thing that could help today?',
    ],
  },
  confused: {
    icon: '🔍',
    color: '#8B5CF6',
    prompts: [
      'What feels unclear or uncertain right now?',
      'What do I know for sure in this situation?',
      'What would clarity look like for me?',
    ],
  },
};

interface Props {
  visible: boolean;
  exerciseId: string;
  exerciseName: string;
  color: string;
  bg: string;
  onClose: () => void;
}

export default function GuidedWriting({ visible, exerciseId, exerciseName, color, bg, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>(['', '', '']);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [phase, setPhase] = useState<'writing' | 'loading' | 'response'>('writing');
  const [taraResponse, setTaraResponse] = useState('');
  const [suggestedExercise, setSuggestedExercise] = useState('');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const config = MOOD_PROMPTS[exerciseId] || MOOD_PROMPTS['write'];
  const prompts = config.prompts;

  const fadeTransition = (callback: () => void) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      callback();
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    });
  };

  const handleNext = () => {
    const newAnswers = [...answers];
    newAnswers[step] = currentAnswer;
    setAnswers(newAnswers);

    if (step < prompts.length - 1) {
      fadeTransition(() => {
        setStep(step + 1);
        setCurrentAnswer(newAnswers[step + 1] || '');
      });
    } else {
      // All answered — send to AI
      submitToTara(newAnswers);
    }
  };

  const handleBack = () => {
    const newAnswers = [...answers];
    newAnswers[step] = currentAnswer;
    setAnswers(newAnswers);
    fadeTransition(() => {
      setStep(step - 1);
      setCurrentAnswer(newAnswers[step - 1] || '');
    });
  };

  const submitToTara = async (finalAnswers: string[]) => {
    setPhase('loading');

    const prompt = `A user completed a guided writing exercise called "${exerciseName}". 
Here are their 3 reflections:
1. ${prompts[0]}: "${finalAnswers[0]}"
2. ${prompts[1]}: "${finalAnswers[1]}"  
3. ${prompts[2]}: "${finalAnswers[2]}"

As Tara, a warm spiritual wellness companion, provide:
1. A short empathetic reflection (2-3 sentences) acknowledging what they shared
2. One specific insight about what you noticed
3. One simple suggested next step or exercise (like box breathing, short walk, or drinking water slowly)

Keep it warm, personal, and under 100 words total. Do not use bullet points.`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 200,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await response.json();
      const text = data.content?.[0]?.text || 'Thank you for sharing. Your honesty with yourself takes courage. Take a slow breath and be gentle with yourself today.';
      setTaraResponse(text);

      // Extract suggested exercise from response
      if (text.toLowerCase().includes('breath')) setSuggestedExercise('Box breathing · 2 min');
      else if (text.toLowerCase().includes('walk')) setSuggestedExercise('Short walk · 10 min');
      else if (text.toLowerCase().includes('water')) setSuggestedExercise('Grounding sip · 1 min');
      else if (text.toLowerCase().includes('body')) setSuggestedExercise('Body scan · 3 min');
      else setSuggestedExercise('Box breathing · 2 min');

    } catch {
      setTaraResponse('Thank you for sharing. Your honesty with yourself takes real courage. Take a slow breath and be gentle with yourself today.');
      setSuggestedExercise('Box breathing · 2 min');
    }

    setPhase('response');
  };

  const handleClose = () => {
    setStep(0);
    setAnswers(['', '', '']);
    setCurrentAnswer('');
    setPhase('writing');
    setTaraResponse('');
    onClose();
  };

  const progress = (step + 1) / prompts.length;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView style={[s.container, { backgroundColor: bg }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.closeBtn} onPress={handleClose}>
            <Text style={s.closeBtnText}>✕</Text>
          </TouchableOpacity>
          {phase === 'writing' && (
            <View style={s.progressBar}>
              <View style={[s.progressFill, { backgroundColor: color, width: `${progress * 100}%` as any }]} />
            </View>
          )}
        </View>

        {phase === 'writing' && (
          <Animated.View style={[s.writingSection, { opacity: fadeAnim }]}>
            {/* Icon + step count */}
            <View style={s.stepHeader}>
              <Text style={s.stepIcon}>{config.icon}</Text>
              <View style={[s.stepBadge, { backgroundColor: color + '20' }]}>
                <Text style={[s.stepBadgeText, { color }]}>{step + 1} of {prompts.length}</Text>
              </View>
            </View>

            {/* Prompt */}
            <Text style={s.prompt}>{prompts[step]}</Text>
            <Text style={s.promptHint}>Write freely. There are no wrong answers.</Text>

            {/* Text input */}
            <TextInput
              style={[s.textArea, { borderColor: color + '40' }]}
              value={currentAnswer}
              onChangeText={setCurrentAnswer}
              placeholder="Start writing here..."
              placeholderTextColor="#9CA3AF"
              multiline
              autoFocus
              textAlignVertical="top"
            />

            {/* Navigation */}
            <View style={s.navRow}>
              {step > 0 && (
                <TouchableOpacity style={s.backBtn} onPress={handleBack}>
                  <Text style={s.backBtnText}>← Back</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[s.nextBtn, { backgroundColor: currentAnswer.trim() ? DARK : DARK_CREAM }, step === 0 && { flex: 1 }]}
                onPress={handleNext}
                disabled={!currentAnswer.trim()}
              >
                <Text style={[s.nextBtnText, { color: currentAnswer.trim() ? '#fff' : '#9CA3AF' }]}>
                  {step === prompts.length - 1 ? 'See Tara\'s response →' : 'Next →'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {phase === 'loading' && (
          <View style={s.loadingSection}>
            <View style={[s.taraAvatarLarge, { backgroundColor: DARK }]}>
              <Text style={s.taraAvatarLargeText}>✦</Text>
            </View>
            <Text style={s.loadingTitle}>Tara is reflecting...</Text>
            <Text style={s.loadingSubtitle}>Reading what you shared</Text>
            <ActivityIndicator color={color} size="large" style={{ marginTop: 20 }} />
          </View>
        )}

        {phase === 'response' && (
          <ScrollView style={s.responseSection} showsVerticalScrollIndicator={false}>
            {/* What you wrote */}
            <View style={s.answersCard}>
              <Text style={s.answersLabel}>What you shared</Text>
              {prompts.map((p, i) => (
                <View key={i} style={s.answerItem}>
                  <Text style={s.answerPrompt}>{p}</Text>
                  <Text style={s.answerText}>{answers[i]}</Text>
                </View>
              ))}
            </View>

            {/* Tara response */}
            <View style={[s.taraCard, { borderLeftColor: color }]}>
              <View style={s.taraCardHeader}>
                <View style={[s.taraAvatarSmall, { backgroundColor: DARK }]}>
                  <Text style={s.taraAvatarSmallText}>✦</Text>
                </View>
                <Text style={[s.taraCardLabel, { color }]}>Tara's reflection</Text>
              </View>
              <Text style={s.taraCardText}>{taraResponse}</Text>
            </View>

            {/* Suggested next */}
            {suggestedExercise && (
              <View style={[s.suggestedCard, { backgroundColor: color }]}>
                <Text style={s.suggestedLabel}>Suggested next</Text>
                <Text style={s.suggestedExercise}>{suggestedExercise}</Text>
              </View>
            )}

            {/* Buttons */}
            <TouchableOpacity style={s.saveBtn} onPress={handleClose}>
              <Text style={s.saveBtnText}>Save to journal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.doneBtn} onPress={handleClose}>
              <Text style={s.doneBtnText}>Done</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        )}

      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, paddingTop: 20 },
  header: { paddingHorizontal: 20, paddingBottom: 16, gap: 12 },
  closeBtn: { alignSelf: 'flex-end', width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.08)', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 14, color: '#374151' },
  progressBar: { height: 4, backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 2 },
  progressFill: { height: 4, borderRadius: 2 },
  writingSection: { flex: 1, paddingHorizontal: 20 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  stepIcon: { fontSize: 32 },
  stepBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  stepBadgeText: { fontSize: 12, fontWeight: '600' },
  prompt: { fontSize: 24, fontWeight: '900', color: DARK, lineHeight: 32, marginBottom: 8 },
  promptHint: { fontSize: 13, color: '#9CA3AF', marginBottom: 20 },
  textArea: { flex: 1, backgroundColor: '#fff', borderRadius: 20, padding: 16, fontSize: 15, color: DARK, borderWidth: 1.5, marginBottom: 16, minHeight: 180 },
  navRow: { flexDirection: 'row', gap: 10, paddingBottom: 20 },
  backBtn: { paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14, backgroundColor: DARK_CREAM },
  backBtnText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  nextBtn: { flex: 2, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  nextBtnText: { fontSize: 14, fontWeight: '700' },
  loadingSection: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 },
  taraAvatarLarge: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  taraAvatarLargeText: { fontSize: 28, color: '#fff' },
  loadingTitle: { fontSize: 22, fontWeight: '800', color: DARK },
  loadingSubtitle: { fontSize: 14, color: '#9CA3AF' },
  responseSection: { flex: 1, paddingHorizontal: 16 },
  answersCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  answersLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '700', letterSpacing: 0.8, marginBottom: 12 },
  answerItem: { marginBottom: 12, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: DARK_CREAM },
  answerPrompt: { fontSize: 11, color: '#9CA3AF', marginBottom: 4, fontStyle: 'italic' },
  answerText: { fontSize: 14, color: DARK, lineHeight: 20 },
  taraCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 12, borderLeftWidth: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  taraCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  taraAvatarSmall: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  taraAvatarSmallText: { fontSize: 12, color: '#fff' },
  taraCardLabel: { fontSize: 11, fontWeight: '700' },
  taraCardText: { fontSize: 14, color: '#374151', lineHeight: 22 },
  suggestedCard: { borderRadius: 16, padding: 14, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  suggestedLabel: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginBottom: 2 },
  suggestedExercise: { fontSize: 15, color: '#fff', fontWeight: '700' },
  saveBtn: { backgroundColor: DARK, borderRadius: 14, padding: 14, alignItems: 'center', marginBottom: 8 },
  saveBtnText: { fontSize: 14, color: '#fff', fontWeight: '700' },
  doneBtn: { borderRadius: 14, padding: 14, alignItems: 'center', backgroundColor: DARK_CREAM },
  doneBtnText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
});
