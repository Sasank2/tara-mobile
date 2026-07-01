import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
  Animated,
} from 'react-native';
import { taraAPI, chartAPI } from '../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  role: 'user' | 'tara';
  text: string;
  planet?: string;
}

interface PlanetPosition {
  glyph: string;
  name: string;
  sign: string;
  degree: string;
}

interface LetterData {
  greeting: string;
  body1: string;
  body2: string;
  question: string;
  planet1: string;
  planet2: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

function todayLabel() {
  const d = new Date();
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

// ─── Animated typing dots ─────────────────────────────────────────────────────
function TypingDots() {
  const d0 = useRef(new Animated.Value(0.3)).current;
  const d1 = useRef(new Animated.Value(0.3)).current;
  const d2 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1,   duration: 380, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 380, useNativeDriver: true }),
        ])
      );
    const a0 = anim(d0, 0);
    const a1 = anim(d1, 160);
    const a2 = anim(d2, 320);
    a0.start(); a1.start(); a2.start();
    return () => { a0.stop(); a1.stop(); a2.stop(); };
  }, []);

  return (
    <View style={s.dotsRow}>
      {[d0, d1, d2].map((d, i) => (
        <Animated.View key={i} style={[s.dot, { opacity: d }]} />
      ))}
    </View>
  );
}

// ─── Daily Letter Component ───────────────────────────────────────────────────
function DailyLetter({
  letter, planets, onAskSomethingElse,
}: { letter: LetterData; planets: PlanetPosition[]; onAskSomethingElse: () => void }) {
  return (
    <View style={s.letterWrap}>
      <View style={s.letterPaper}>
        <View style={s.letterRule} />

        <View style={s.dateLine}>
          <Text style={s.dateText}>{todayLabel()}</Text>
          <Text style={s.skyText}>
            {(planets[0]?.glyph || '☀') + ' ' + (planets[0]?.sign?.slice(0,3).toUpperCase() || 'GEM')}
            {' · '}
            {(planets[1]?.glyph || '☽') + ' ' + (planets[1]?.sign?.slice(0,3).toUpperCase() || 'PIS')}
          </Text>
        </View>

        <Text style={s.greeting}>{letter.greeting}</Text>

        <Text style={s.bodyText}>
          {'Your '}
          <Text style={s.pillInline}>{letter.planet1}</Text>
          {' ' + letter.body1}
        </Text>

        <Text style={s.bodyText}>
          {'Meanwhile '}
          <Text style={s.pillInline}>{letter.planet2}</Text>
          {' ' + letter.body2}
        </Text>

        <View style={s.qPull}>
          <Text style={s.qPullText}>{letter.question}</Text>
        </View>

        <Text style={s.signOff}>
          {'with warmth, '}
          <Text style={s.signName}>Tara ✦</Text>
        </Text>
      </View>

      <TouchableOpacity style={s.askElseBtn} onPress={onAskSomethingElse}>
        <Text style={s.askElseText}>ASK SOMETHING ELSE</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AskTaraScreen({ navigation }: any) {
  const [reply, setReply]                   = useState('');
  const [messages, setMessages]             = useState<Message[]>([]);
  const [loading, setLoading]               = useState(false);
  const [letterLoading, setLetterLoading]   = useState(true);
  const [planets, setPlanets]               = useState<PlanetPosition[]>([]);
  const [letter, setLetter]                 = useState<LetterData | null>(null);
  const [showChat, setShowChat]             = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => { loadDailyLetter(); }, []);

  const loadDailyLetter = async () => {
    setLetterLoading(true);
    try {
      const chartRes = await chartAPI.getWesternChart();
      const chart    = chartRes.data?.data;

      setPlanets([
        { glyph: '☀', name: 'SUN',     sign: chart?.sunSign     || 'Gemini',  degree: chart?.sunDegree     || '14°' },
        { glyph: '☽', name: 'MOON',    sign: chart?.moonSign    || 'Pisces',  degree: chart?.moonDegree    || '22°' },
        { glyph: '♂', name: 'MARS',    sign: chart?.marsSign    || 'Scorpio', degree: chart?.marsDegree    || '8°'  },
        { glyph: '♃', name: 'JUPITER', sign: chart?.jupiterSign || 'Cancer',  degree: chart?.jupiterDegree || '3°'  },
      ]);

      // Try dedicated endpoint first
      try {
        const letterRes = await taraAPI.getDailyLetter();
        const d = letterRes?.data?.data;
        if (d?.greeting) { setLetter(d); return; }
      } catch { /* fall through */ }

      // Fallback: generate via chat
      const prompt = `You are Tara, a warm astrology guide. Write a personal morning letter to the user.
Respond ONLY with a raw JSON object — no markdown, no backticks, no extra text whatsoever.
Keys required: greeting, planet1, body1, planet2, body2, question
- greeting: "Dear friend," — warm and direct
- planet1: planet label with glyph in caps e.g. "☽ MOON IN PISCES"
- body1: one sentence continuing after "Your [planet1]" — poetic, intimate, NOT generic horoscope
- planet2: second planet label e.g. "♂ MARS IN SCORPIO"
- body2: one sentence continuing after "Meanwhile [planet2]" — poetic, personal
- question: one deeply personal question that arises from these two planets
User chart: Sun ${chart?.sunSign||'Gemini'}, Moon ${chart?.moonSign||'Pisces'}, Rising ${chart?.ascendant||'Leo'}, Mars ${chart?.marsSign||'Scorpio'}.
Keep tone: wise, warm, intimate. Never say "energy" or "universe". Never generic.`;

      const res   = await taraAPI.chat({ question: prompt });
      const raw   = res.data?.data?.shortAnswer || res.data?.data;
      const text  = typeof raw === 'string' ? raw : JSON.stringify(raw);
      const clean = text.replace(/```json|```/g, '').trim();
      setLetter(JSON.parse(clean));

    } catch {
      setLetter({
        greeting:  'Dear friend,',
        planet1:   '☽ MOON IN PISCES',
        body1:     'is pulling at something tender today — a feeling you\'ve been carrying that finally wants your attention.',
        planet2:   '♂ MARS IN SCORPIO',
        body2:     'is asking you to stop softening your edges for everyone else\'s comfort.',
        question:  'What would you do today if you stopped worrying about how it looks to others?',
      });
    } finally {
      setLetterLoading(false);
    }
  };

  const sendReply = async () => {
    if (!reply.trim()) return;
    const q = reply.trim();
    setReply('');
    setShowChat(true);
    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setLoading(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const res  = await taraAPI.chat({ question: q });
      const d    = res.data?.data;
      const text = d
        ? [d.shortAnswer, d.whyTaraSays].filter(Boolean).join('\n\n')
        : 'Let me sit with that for a moment.';
      setMessages(prev => [...prev, {
        role: 'tara',
        text,
        planet: d?.planetaryInsight || d?.planet || null,
      }]);
    } catch {
      setMessages(prev => [...prev, { role: 'tara', text: 'I am here with you. Try asking again.' }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── Header ── */}
      <View style={s.header}>
        <View>
          <Text style={s.headerEyebrow}>A LETTER FROM</Text>
          <Text style={s.headerName}>Tara</Text>
        </View>
        <View style={s.seal}><Text style={s.sealText}>✦</Text></View>
      </View>

      {/* ── Planet strip ── */}
      {planets.length > 0 && (
        <View style={s.planetStrip}>
          {planets.map((p, i) => (
            <React.Fragment key={p.name}>
              <View style={s.planetItem}>
                <Text style={s.planetGlyph}>{p.glyph}</Text>
                <Text style={s.planetSign}>{p.sign.slice(0,3).toUpperCase()}</Text>
                <Text style={s.planetDeg}>{p.degree}</Text>
              </View>
              {i < planets.length - 1 && <View style={s.planetSep} />}
            </React.Fragment>
          ))}
        </View>
      )}

      {/* ── Scroll area ── */}
      <ScrollView
        ref={scrollRef}
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 16 }}
      >
        {letterLoading ? (
          <View style={s.letterLoadingWrap}>
            <ActivityIndicator color="#C1560A" size="small" />
            <Text style={s.letterLoadingText}>Tara is writing to you...</Text>
          </View>
        ) : letter ? (
          <DailyLetter
            letter={letter}
            planets={planets}
            onAskSomethingElse={() => {
              setShowChat(true);
              setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
            }}
          />
        ) : null}

        {showChat && messages.map((m, i) =>
          m.role === 'user' ? (
            <View key={i} style={s.userMsgWrap}>
              <View style={s.userBubble}>
                <Text style={s.userBubbleText}>{m.text}</Text>
              </View>
            </View>
          ) : (
            <View key={i} style={s.taraMsgWrap}>
              <View style={s.taraBubble}>
                <View style={s.taraBubbleHeader}>
                  <View style={s.miniSeal}><Text style={s.miniSealText}>✦</Text></View>
                  <Text style={s.taraLabel}>TARA</Text>
                </View>
                <Text style={s.taraBubbleText}>{m.text}</Text>
                {m.planet ? <Text style={s.taraPlanetLabel}>{m.planet}</Text> : null}
              </View>
            </View>
          )
        )}

        {loading && (
          <View style={s.taraMsgWrap}>
            <View style={s.taraBubble}>
              <View style={s.taraBubbleHeader}>
                <View style={s.miniSeal}><Text style={s.miniSealText}>✦</Text></View>
                <Text style={s.taraLabel}>TARA</Text>
              </View>
              <TypingDots />
            </View>
          </View>
        )}

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* ── Input bar ── */}
      <View style={s.inputBar}>
        <TextInput
          style={s.input}
          value={reply}
          onChangeText={setReply}
          placeholder="Reply to Tara..."
          placeholderTextColor="#B89878"
          onSubmitEditing={sendReply}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[s.sendBtn, !reply.trim() && s.sendBtnDisabled]}
          onPress={sendReply}
          disabled={!reply.trim()}
        >
          <Text style={s.sendBtnText}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';

const s = StyleSheet.create({
  container:         { flex: 1, backgroundColor: '#F5EFE3' },

  // header
  header:            { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 14,
                       flexDirection: 'row', justifyContent: 'space-between',
                       alignItems: 'center', borderBottomWidth: 0.5, borderBottomColor: '#D8C8A8' },
  headerEyebrow:     { fontSize: 9, letterSpacing: 2, color: '#9A8060', marginBottom: 2 },
  headerName:        { fontSize: 22, fontWeight: '800', color: '#1A0E06', letterSpacing: -0.5 },
  seal:              { width: 40, height: 40, borderRadius: 20, backgroundColor: '#C1560A',
                       alignItems: 'center', justifyContent: 'center' },
  sealText:          { fontSize: 17, color: '#FAF6EE' },

  // planet strip
  planetStrip:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
                       backgroundColor: '#1A0E06', marginHorizontal: 20, marginTop: 14,
                       borderRadius: 14, paddingVertical: 12, paddingHorizontal: 8 },
  planetItem:        { alignItems: 'center', gap: 2 },
  planetGlyph:       { fontSize: 18, color: '#F5C87A' },
  planetSign:        { fontSize: 8, color: '#F5E8D0', letterSpacing: 0.5 },
  planetDeg:         { fontSize: 8, color: '#6A5040' },
  planetSep:         { width: 0.5, height: 28, backgroundColor: '#3A2010' },

  // scroll
  scroll:            { flex: 1 },

  // letter
  letterWrap:        { paddingHorizontal: 18, paddingBottom: 4 },
  letterPaper:       { backgroundColor: '#FFFDF7', borderRadius: 16, borderWidth: 0.5,
                       borderColor: '#D8C8A8', padding: 18, overflow: 'hidden' },
  letterRule:        { position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                       backgroundColor: '#C1560A', borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  dateLine:          { flexDirection: 'row', justifyContent: 'space-between',
                       marginBottom: 14, marginTop: 4 },
  dateText:          { fontSize: 10, color: '#9A8060', letterSpacing: 0.3 },
  skyText:           { fontSize: 10, color: '#C1560A', letterSpacing: 0.3 },
  greeting:          { fontSize: 14, fontStyle: 'italic', color: '#3A1A08',
                       marginBottom: 12, fontFamily: SERIF },
  bodyText:          { fontSize: 13, color: '#1A0E06', lineHeight: 21,
                       marginBottom: 10, fontFamily: SERIF },
  pillInline:        { fontSize: 10, fontWeight: '700', color: '#C1560A', letterSpacing: 0.5 },
  qPull:             { borderLeftWidth: 2, borderLeftColor: '#C1560A', paddingLeft: 12,
                       paddingVertical: 8, paddingRight: 8, marginVertical: 12,
                       backgroundColor: '#FFF3E0', borderTopRightRadius: 10,
                       borderBottomRightRadius: 10 },
  qPullText:         { fontSize: 13, fontStyle: 'italic', color: '#3A1A08',
                       lineHeight: 19, fontFamily: SERIF },
  signOff:           { fontSize: 13, fontStyle: 'italic', color: '#9A8060',
                       textAlign: 'right', marginTop: 8, fontFamily: SERIF },
  signName:          { color: '#C1560A', fontStyle: 'normal', fontWeight: '600' },
  askElseBtn:        { alignSelf: 'center', marginTop: 14, paddingBottom: 2,
                       borderBottomWidth: 0.5, borderBottomColor: '#C1560A' },
  askElseText:       { fontSize: 9, letterSpacing: 2, color: '#C1560A' },

  // letter loading
  letterLoadingWrap: { alignItems: 'center', paddingTop: 60, gap: 12 },
  letterLoadingText: { fontSize: 12, color: '#9A8060', fontStyle: 'italic', fontFamily: SERIF },

  // chat
  userMsgWrap:       { alignItems: 'flex-end', paddingHorizontal: 18,
                       marginBottom: 10, marginTop: 8 },
  userBubble:        { backgroundColor: '#C1560A', borderRadius: 16,
                       borderBottomRightRadius: 4, padding: 12, maxWidth: '80%' },
  userBubbleText:    { fontSize: 13, color: '#fff', lineHeight: 19,
                       fontFamily: SERIF, fontStyle: 'italic' },
  taraMsgWrap:       { alignItems: 'flex-start', paddingHorizontal: 18, marginBottom: 10 },
  taraBubble:        { backgroundColor: '#FFFDF7', borderRadius: 16, borderBottomLeftRadius: 4,
                       borderWidth: 0.5, borderColor: '#D8C8A8', padding: 14, maxWidth: '90%' },
  taraBubbleHeader:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  miniSeal:          { width: 22, height: 22, borderRadius: 11, backgroundColor: '#C1560A',
                       alignItems: 'center', justifyContent: 'center' },
  miniSealText:      { fontSize: 10, color: '#fff' },
  taraLabel:         { fontSize: 9, fontWeight: '700', color: '#C1560A', letterSpacing: 1.5 },
  taraBubbleText:    { fontSize: 13, color: '#1A0E06', lineHeight: 21, fontFamily: SERIF },
  taraPlanetLabel:   { fontSize: 9, color: '#9A8060', marginTop: 10, letterSpacing: 0.5 },

  // typing dots
  dotsRow:           { flexDirection: 'row', gap: 5, paddingVertical: 4 },
  dot:               { width: 7, height: 7, borderRadius: 4, backgroundColor: '#C1560A' },

  // input
  inputBar:          { flexDirection: 'row', gap: 10, padding: 12,
                       paddingBottom: Platform.OS === 'ios' ? 28 : 12,
                       backgroundColor: '#F5EFE3', borderTopWidth: 0.5,
                       borderTopColor: '#D8C8A8', alignItems: 'center' },
  input:             { flex: 1, backgroundColor: '#FFFDF7', borderRadius: 22,
                       paddingHorizontal: 16, paddingVertical: 10, fontSize: 13,
                       color: '#1A0E06', borderWidth: 0.5, borderColor: '#D8C8A8',
                       fontFamily: SERIF, fontStyle: 'italic' },
  sendBtn:           { width: 40, height: 40, borderRadius: 20, backgroundColor: '#C1560A',
                       alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled:   { backgroundColor: '#D8C8A8' },
  sendBtnText:       { fontSize: 17, color: '#fff', fontWeight: '700' },
});