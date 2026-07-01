 import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';
type MoonPhase  = 'new' | 'waxing' | 'full' | 'waning';

interface CycleData {
  lastPeriodStart: string;
  cycleLength: number;
  periodLength: number;
}

const CYCLE_PHASES: Record<CyclePhase, {
  label: string; emoji: string; days: string;
  color: string; bgColor: string; borderColor: string;
  description: string; moonPhase: MoonPhase;
}> = {
  menstrual:  {
    label: 'Menstrual',  emoji: '🌑', days: 'Days 1–5',
    color: '#993556', bgColor: '#FFF8FA', borderColor: '#F4C0D1',
    moonPhase: 'new',
    description: 'Rest and restore. Your body is releasing. Honor the slowdown — this is not weakness, it is wisdom.',
  },
  follicular: {
    label: 'Follicular', emoji: '🌒', days: 'Days 6–13',
    color: '#534AB7', bgColor: '#FAFAFE', borderColor: '#CEC8F4',
    moonPhase: 'waxing',
    description: 'Energy is building. Good time for new projects, social connection, and starting things.',
  },
  ovulation:  {
    label: 'Ovulation',  emoji: '🌕', days: 'Days 14–16',
    color: '#C1560A', bgColor: '#FFF8F0', borderColor: '#F0C878',
    moonPhase: 'full',
    description: 'Peak energy and communication. Your most magnetic days. Speak up, connect, create.',
  },
  luteal:     {
    label: 'Luteal',     emoji: '🌖', days: 'Days 17–28',
    color: '#0F6E56', bgColor: '#E1F5EE', borderColor: '#9FE1CB',
    moonPhase: 'waning',
    description: 'Turn inward. Good for completing tasks, deep work, and honest reflection.',
  },
};

const MOON_PHASES: Record<MoonPhase, {
  label: string; emoji: string;
  color: string; description: string;
}> = {
  new:    { label: 'New Moon',    emoji: '🌑', color: '#1A0E06', description: 'Plant intentions. Begin quietly. Rest.' },
  waxing: { label: 'Waxing Moon', emoji: '🌒', color: '#534AB7', description: 'Build momentum. Take action. Grow.' },
  full:   { label: 'Full Moon',   emoji: '🌕', color: '#C1560A', description: 'Release what no longer serves you.' },
  waning: { label: 'Waning Moon', emoji: '🌖', color: '#0F6E56', description: 'Reflect, complete, let go slowly.' },
};

// ── Moon phase calculation ─────────────────────────────────────────────────────
function getCurrentMoonPhase(): MoonPhase {
  const knownNewMoon = new Date('2024-01-11').getTime();
  const daysSince    = (Date.now() - knownNewMoon) / (1000 * 60 * 60 * 24);
  const cycleDay     = daysSince % 29.5;
  if (cycleDay < 7.4)  return 'new';
  if (cycleDay < 14.8) return 'waxing';
  if (cycleDay < 22.1) return 'full';
  return 'waning';
}

function getDaysUntilNextPhase(phase: MoonPhase): number {
  const knownNewMoon = new Date('2024-01-11').getTime();
  const daysSince    = (Date.now() - knownNewMoon) / (1000 * 60 * 60 * 24);
  const cycleDay     = daysSince % 29.5;
  const boundaries   = { new: 0, waxing: 7.4, full: 14.8, waning: 22.1 };
  const phaseOrder: MoonPhase[] = ['new', 'waxing', 'full', 'waning'];
  const idx          = phaseOrder.indexOf(phase);
  const nextBoundary = idx < 3 ? boundaries[phaseOrder[idx + 1]] : 29.5;
  return Math.max(1, Math.ceil(nextBoundary - cycleDay));
}

// ── Cycle calculations ────────────────────────────────────────────────────────
function getCycleInfo(data: CycleData): {
  phase: CyclePhase; dayOfCycle: number; daysUntilPeriod: number;
} {
  const start      = new Date(data.lastPeriodStart);
  const today      = new Date();
  const rawDay     = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const dayOfCycle = ((rawDay - 1) % data.cycleLength) + 1;

  let phase: CyclePhase;
  if (dayOfCycle <= data.periodLength) phase = 'menstrual';
  else if (dayOfCycle <= 13)           phase = 'follicular';
  else if (dayOfCycle <= 16)           phase = 'ovulation';
  else                                 phase = 'luteal';

  const daysUntilPeriod = data.cycleLength - dayOfCycle + 1;
  return { phase, dayOfCycle, daysUntilPeriod };
}

// ── Setup Modal ───────────────────────────────────────────────────────────────
function SetupModal({
  visible, onSave, onClose,
}: {
  visible: boolean;
  onSave: (data: CycleData) => void;
  onClose: () => void;
}) {
  const [cycleDay, setCycleDay]     = useState(14);
  const [cycleLen, setCycleLen]     = useState(28);
  const [periodLen, setPeriodLen]   = useState(5);

  const handleSave = () => {
    const d = new Date();
    d.setDate(d.getDate() - (cycleDay - 1));
    onSave({
      lastPeriodStart: d.toISOString().split('T')[0],
      cycleLength: cycleLen,
      periodLength: periodLen,
    });
  };

  const Row = ({ label, value, min, max, onChange }: {
    label: string; value: number; min: number; max: number;
    onChange: (v: number) => void;
  }) => (
    <View style={su.row}>
      <Text style={su.rowLabel}>{label}</Text>
      <View style={su.rowControls}>
        <TouchableOpacity
          style={su.controlBtn}
          onPress={() => onChange(Math.max(min, value - 1))}>
          <Text style={su.controlBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={su.controlVal}>{value}</Text>
        <TouchableOpacity
          style={su.controlBtn}
          onPress={() => onChange(Math.min(max, value + 1))}>
          <Text style={su.controlBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent
      onRequestClose={onClose}>
      <View style={su.overlay}>
        <View style={su.sheet}>
          <View style={su.handle} />
          <Text style={su.title}>Set up cycle tracking</Text>
          <Text style={su.sub}>
            Tara will sync your cycle with the Moon phases and offer personalised insights.
          </Text>

          <Row
            label="What day of your cycle are you on today?"
            value={cycleDay} min={1} max={35}
            onChange={setCycleDay}
          />
          <Row
            label="How long is your average cycle?"
            value={cycleLen} min={21} max={40}
            onChange={setCycleLen}
          />
          <Row
            label="How many days does your period last?"
            value={periodLen} min={2} max={10}
            onChange={setPeriodLen}
          />

          <TouchableOpacity style={su.saveBtn} onPress={handleSave}>
            <Text style={su.saveBtnText}>Save & sync with Moon ✦</Text>
          </TouchableOpacity>
          <TouchableOpacity style={su.cancelBtn} onPress={onClose}>
            <Text style={su.cancelBtnText}>Not now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const su = StyleSheet.create({
  overlay:        { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'flex-end' },
  sheet:          { backgroundColor:'#FAF7F2', borderTopLeftRadius:24,
                    borderTopRightRadius:24, padding:24,
                    paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  handle:         { width:36, height:4, backgroundColor:'#D8CEC0', borderRadius:2,
                    alignSelf:'center', marginBottom:20 },
  title:          { fontSize:22, fontWeight:'800', color:'#1A0E06', marginBottom:6 },
  sub:            { fontSize:13, color:'#9A8060', lineHeight:19,
                    fontStyle:'italic', marginBottom:24 },
  row:            { marginBottom:20 },
  rowLabel:       { fontSize:13, color:'#3A1A08', marginBottom:10, lineHeight:18 },
  rowControls:    { flexDirection:'row', alignItems:'center',
                    justifyContent:'center', gap:20 },
  controlBtn:     { width:44, height:44, borderRadius:12, backgroundColor:'#EDE8E0',
                    alignItems:'center', justifyContent:'center' },
  controlBtnText: { fontSize:22, color:'#5A4030', fontWeight:'500', lineHeight:26 },
  controlVal:     { fontSize:22, fontWeight:'800', color:'#1A0E06',
                    minWidth:60, textAlign:'center' },
  saveBtn:        { backgroundColor:'#D4537E', borderRadius:16, padding:16,
                    alignItems:'center', marginTop:8, marginBottom:10 },
  saveBtnText:    { fontSize:14, fontWeight:'700', color:'#fff' },
  cancelBtn:      { alignItems:'center', padding:8 },
  cancelBtnText:  { fontSize:13, color:'#9A8060' },
});

// ── Main Component ────────────────────────────────────────────────────────────
export default function LunarCycleTracker() {
  const [cycleData, setCycleData]   = useState<CycleData | null>(null);
  const [showSetup, setShowSetup]   = useState(false);
  const [loaded, setLoaded]         = useState(false);

  const moonPhase = getCurrentMoonPhase();
  const moonInfo  = MOON_PHASES[moonPhase];
  const daysToNext = getDaysUntilNextPhase(moonPhase);

  useEffect(() => { loadCycleData(); }, []);

  const loadCycleData = async () => {
    try {
      const saved = await AsyncStorage.getItem('cycle_data');
      if (saved) setCycleData(JSON.parse(saved));
    } catch {}
    setLoaded(true);
  };

  const handleSave = async (data: CycleData) => {
    try {
      await AsyncStorage.setItem('cycle_data', JSON.stringify(data));
      setCycleData(data);
    } catch {}
    setShowSetup(false);
  };

  if (!loaded) return null;

  // ── Moon-only view (no cycle data) ─────────────────────────────────────────
  if (!cycleData) return (
    <View style={lc.container}>
      <SetupModal
        visible={showSetup}
        onSave={handleSave}
        onClose={() => setShowSetup(false)}
      />

      {/* Moon phase card */}
      <View style={[lc.moonOnlyCard, {
        backgroundColor: moonInfo.color + '12',
        borderColor: moonInfo.color + '40',
      }]}>
        <Text style={lc.moonOnlyEmoji}>{moonInfo.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[lc.moonOnlyTitle, { color: moonInfo.color }]}>
            {moonInfo.label}
          </Text>
          <Text style={[lc.moonOnlyDesc, { color: moonInfo.color }]}>
            {moonInfo.description}
          </Text>
          <Text style={[lc.moonOnlyNext, { color: moonInfo.color }]}>
            Next phase in ~{daysToNext} days
          </Text>
        </View>
      </View>

      {/* Setup prompt */}
      <TouchableOpacity
        style={lc.setupPrompt}
        onPress={() => setShowSetup(true)}
        activeOpacity={0.85}>
        <View style={lc.setupPromptLeft}>
          <Text style={lc.setupPromptTitle}>🌸 Sync your cycle with the Moon</Text>
          <Text style={lc.setupPromptSub}>
            Tara spots patterns between your cycle and lunar phases
          </Text>
        </View>
        <Text style={lc.setupPromptArrow}>›</Text>
      </TouchableOpacity>
    </View>
  );

  // ── Full view (cycle + moon) ───────────────────────────────────────────────
  const { phase, dayOfCycle, daysUntilPeriod } = getCycleInfo(cycleData);
  const phaseInfo = CYCLE_PHASES[phase];
  const isSynced  = phaseInfo.moonPhase === moonPhase;

  return (
    <View style={lc.container}>
      <SetupModal
        visible={showSetup}
        onSave={handleSave}
        onClose={() => setShowSetup(false)}
      />

      {/* Sync badge */}
      {isSynced && (
        <View style={lc.syncBadge}>
          <Text style={lc.syncBadgeText}>
            ✦ Your cycle and Moon phase are aligned
          </Text>
        </View>
      )}

      {/* Two columns — cycle + moon */}
      <View style={lc.twoCol}>
        {/* Cycle card */}
        <View style={[lc.phaseCard, {
          backgroundColor: phaseInfo.bgColor,
          borderColor: phaseInfo.borderColor,
        }]}>
          <Text style={lc.phaseEmoji}>{phaseInfo.emoji}</Text>
          <Text style={[lc.phaseTitle, { color: phaseInfo.color }]}>
            {phaseInfo.label}
          </Text>
          <Text style={[lc.phaseDay, { color: phaseInfo.color }]}>
            Day {dayOfCycle}
          </Text>
          <Text style={[lc.phaseDays, { color: phaseInfo.color }]}>
            {phaseInfo.days}
          </Text>
          <Text style={lc.phaseFooter}>
            Period in {daysUntilPeriod}d
          </Text>
        </View>

        {/* Moon card */}
        <View style={[lc.phaseCard, {
          backgroundColor: moonInfo.color + '12',
          borderColor: moonInfo.color + '30',
        }]}>
          <Text style={lc.phaseEmoji}>{moonInfo.emoji}</Text>
          <Text style={[lc.phaseTitle, { color: moonInfo.color }]}>
            {moonInfo.label}
          </Text>
          <Text style={[lc.phaseDay, { color: moonInfo.color }]}>
            Tonight
          </Text>
          <Text style={[lc.phaseDays, { color: moonInfo.color }]}>
            ~{daysToNext} days left
          </Text>
          <Text style={lc.phaseFooter}>Current phase</Text>
        </View>
      </View>

      {/* Phase description */}
      <View style={[lc.descCard, { borderLeftColor: phaseInfo.color }]}>
        <Text style={[lc.descTitle, { color: phaseInfo.color }]}>
          {phaseInfo.label} phase
        </Text>
        <Text style={lc.descText}>{phaseInfo.description}</Text>
      </View>

      {/* Phase timeline */}
      <View style={lc.timeline}>
        {(Object.entries(CYCLE_PHASES) as [CyclePhase, typeof CYCLE_PHASES[CyclePhase]][])
          .map(([key, val]) => (
            <View key={key} style={[
              lc.timelineItem,
              phase === key && { backgroundColor: '#fff', borderRadius: 8, padding: 4 },
            ]}>
              <Text style={lc.timelineEmoji}>{val.emoji}</Text>
              <Text style={[
                lc.timelineLabel,
                phase === key && { color: val.color, fontWeight: '700' },
              ]}>
                {val.label.slice(0, 3)}
              </Text>
            </View>
          ))}
      </View>

      {/* Update button */}
      <TouchableOpacity
        style={lc.updateBtn}
        onPress={() => setShowSetup(true)}>
        <Text style={lc.updateBtnText}>Update cycle →</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const lc = StyleSheet.create({
  container:          { paddingVertical: 4 },

  // moon only
  moonOnlyCard:       { flexDirection: 'row', alignItems: 'flex-start', gap: 12,
                        borderRadius: 14, padding: 14, borderWidth: 0.5, marginBottom: 12 },
  moonOnlyEmoji:      { fontSize: 32 },
  moonOnlyTitle:      { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  moonOnlyDesc:       { fontSize: 12, lineHeight: 18, opacity: 0.85,
                        fontStyle: 'italic', marginBottom: 5 },
  moonOnlyNext:       { fontSize: 10, opacity: 0.6 },

  // setup prompt
  setupPrompt:        { flexDirection: 'row', alignItems: 'center',
                        backgroundColor: '#FFF8FA', borderRadius: 12, padding: 14,
                        borderWidth: 1, borderColor: '#F4C0D1' },
  setupPromptLeft:    { flex: 1 },
  setupPromptTitle:   { fontSize: 13, fontWeight: '600', color: '#993556', marginBottom: 3 },
  setupPromptSub:     { fontSize: 11, color: '#9A8060' },
  setupPromptArrow:   { fontSize: 18, color: '#D4537E' },

  // sync badge
  syncBadge:          { backgroundColor: '#E1F5EE', borderRadius: 10, padding: 8,
                        alignItems: 'center', marginBottom: 10,
                        borderWidth: 0.5, borderColor: '#9FE1CB' },
  syncBadgeText:      { fontSize: 11, color: '#0F6E56', fontWeight: '600' },

  // two col
  twoCol:             { flexDirection: 'row', gap: 8, marginBottom: 10 },
  phaseCard:          { flex: 1, borderRadius: 14, padding: 12,
                        borderWidth: 0.5, alignItems: 'center', gap: 3 },
  phaseEmoji:         { fontSize: 28 },
  phaseTitle:         { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  phaseDay:           { fontSize: 18, fontWeight: '800' },
  phaseDays:          { fontSize: 9, opacity: 0.7, textAlign: 'center' },
  phaseFooter:        { fontSize: 9, color: '#9A8060', marginTop: 2 },

  // description
  descCard:           { borderLeftWidth: 2, padding: 12, marginBottom: 10,
                        backgroundColor: '#FAF7F2',
                        borderTopRightRadius: 10, borderBottomRightRadius: 10 },
  descTitle:          { fontSize: 10, fontWeight: '700', letterSpacing: 0.5,
                        marginBottom: 5, textTransform: 'uppercase' },
  descText:           { fontSize: 12, color: '#5A4030', lineHeight: 18, fontStyle: 'italic' },

  // timeline
  timeline:           { flexDirection: 'row', justifyContent: 'space-between',
                        backgroundColor: '#E8E3D8', borderRadius: 10,
                        padding: 8, marginBottom: 10 },
  timelineItem:       { alignItems: 'center', gap: 3, flex: 1 },
  timelineEmoji:      { fontSize: 18 },
  timelineLabel:      { fontSize: 8, color: '#9A8060' },

  // update
  updateBtn:          { alignSelf: 'flex-end' },
  updateBtnText:      { fontSize: 11, color: '#C1560A', fontWeight: '600' },
});