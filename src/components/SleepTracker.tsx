import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

interface SleepDay {
  date: string;
  day: string;
  quality: number | null;  // 1-5
  hours: number | null;
  isToday: boolean;
}

const QUALITY_EMOJI = ['', '😫','😞','😐','😊','✨'];

function getLast7Days(): string[] {
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
}

export default function SleepTracker({ moonSign = 'Pisces' }: { moonSign?: string }) {
  const [sleepData, setSleepData] = useState<SleepDay[]>([]);
  const [avgHours, setAvgHours]   = useState<number | null>(null);
  const [avgQuality, setAvgQuality] = useState<number | null>(null);
  const [moonInsight, setMoonInsight] = useState<string>('');

  useEffect(() => { loadSleepData(); }, []);

  const loadSleepData = async () => {
    const days = getLast7Days();
    const data: SleepDay[] = [];
    const today = new Date().toISOString().split('T')[0];

    for (const date of days) {
      try {
        const saved = await AsyncStorage.getItem(`checkin_${date}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          data.push({
            date, isToday: date === today,
            day: DAY_LABELS[new Date(date).getDay()],
            quality: parsed.sleepQuality || null,
            hours: parsed.hoursSlept || null,
          });
        } else {
          data.push({
            date, isToday: date === today,
            day: DAY_LABELS[new Date(date).getDay()],
            quality: null, hours: null,
          });
        }
      } catch {
        data.push({
          date, isToday: date === today,
          day: DAY_LABELS[new Date(date).getDay()],
          quality: null, hours: null,
        });
      }
    }

    setSleepData(data);

    const scored = data.filter(d => d.quality !== null && d.hours !== null);
    if (scored.length > 0) {
      const aH = +(scored.reduce((s, d) => s + (d.hours ?? 0), 0) / scored.length).toFixed(1);
      const aQ = Math.round(scored.reduce((s, d) => s + (d.quality ?? 0), 0) / scored.length);
      setAvgHours(aH);
      setAvgQuality(aQ);

      const MOON_SLEEP_INSIGHTS: Record<string, string> = {
        Pisces:  'Moon in Pisces intensifies dreams. You may sleep longer but feel less rested.',
        Aries:   'Moon in Aries can disrupt sleep with restless energy. Try winding down 30min earlier.',
        Taurus:  'Moon in Taurus supports deep, restorative sleep. Good night ahead.',
        Gemini:  'Moon in Gemini brings a busy mind at night. Journal before bed to clear your thoughts.',
        Cancer:  'Moon in Cancer is emotionally deep — you may need more sleep than usual today.',
        Leo:     'Moon in Leo can bring vivid, dramatic dreams. Sleep quality tends to be lighter.',
        Virgo:   'Moon in Virgo supports routine. Stick to your usual sleep schedule tonight.',
        Libra:   'Moon in Libra brings balanced sleep when your environment is peaceful.',
        Scorpio: 'Moon in Scorpio deepens sleep but can bring intense dreams. Rest well.',
        Sagittarius: 'Moon in Sagittarius may make you want to stay up late. Set a firm bedtime.',
        Capricorn: 'Moon in Capricorn supports disciplined rest. Early to bed benefits you most.',
        Aquarius: 'Moon in Aquarius can overstimulate the mind. Avoid screens an hour before sleep.',
      };
      setMoonInsight(MOON_SLEEP_INSIGHTS[moonSign] || 'Track your sleep daily to see patterns emerge.');
    }
  };

  return (
    <View style={st.container}>
      {/* Sleep quality row */}
      <View style={st.dayRow}>
        {sleepData.map((day, i) => (
          <View key={day.date} style={st.dayCol}>
            <Text style={st.dayEmoji}>
              {day.quality !== null ? QUALITY_EMOJI[day.quality] : '–'}
            </Text>
            <Text style={[st.dayLabel, day.isToday && st.dayLabelToday]}>
              {day.isToday ? 'Today' : day.day}
            </Text>
            <Text style={[st.dayHours, day.hours !== null && { color: '#1F2937' }]}>
              {day.hours !== null ? `${day.hours}h` : '–'}
            </Text>
          </View>
        ))}
      </View>

      {/* Stats */}
      {avgHours !== null && (
        <View style={st.statsRow}>
          <View style={st.statCard}>
            <Text style={st.statNum}>{avgHours}h</Text>
            <Text style={st.statLbl}>Avg sleep</Text>
          </View>
          <View style={[st.statCard, { backgroundColor: '#FFF8F0', borderColor: '#F0C878', borderWidth: 0.5 }]}>
            <Text style={st.statNum}>{QUALITY_EMOJI[avgQuality ?? 3]}</Text>
            <Text style={st.statLbl}>Avg quality</Text>
          </View>
        </View>
      )}

      {/* Moon insight */}
      {moonInsight ? (
        <View style={st.moonCard}>
          <Text style={st.moonGlyph}>☽</Text>
          <View style={{ flex: 1 }}>
            <Text style={st.moonLabel}>MOON IN {moonSign.toUpperCase()} · TONIGHT</Text>
            <Text style={st.moonText}>{moonInsight}</Text>
          </View>
        </View>
      ) : (
        <View style={st.emptyState}>
          <Text style={st.emptyText}>Complete your morning check-in to track sleep quality</Text>
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  container:      { paddingVertical: 4 },
  dayRow:         { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  dayCol:         { alignItems: 'center', gap: 3 },
  dayEmoji:       { fontSize: 20 },
  dayLabel:       { fontSize: 8, color: '#9A8060' },
  dayLabelToday:  { color: '#F5A623', fontWeight: '700' },
  dayHours:       { fontSize: 9, color: '#9A8060', fontWeight: '600' },
  statsRow:       { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statCard:       { flex: 1, backgroundColor: '#E8E3D8', borderRadius: 10,
                    padding: 10, alignItems: 'center' },
  statNum:        { fontSize: 20, fontWeight: '800', color: '#1F2937' },
  statLbl:        { fontSize: 8, color: '#9A8060', marginTop: 2 },
  moonCard:       { backgroundColor: '#1A0E06', borderRadius: 12,
                    padding: 12, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  moonGlyph:      { fontSize: 20, color: '#F5C87A' },
  moonLabel:      { fontSize: 9, color: '#F5C87A', fontWeight: '700',
                    letterSpacing: 0.8, marginBottom: 4 },
  moonText:       { fontSize: 11, color: '#F5E8D0', lineHeight: 17 },
  emptyState:     { padding: 16, alignItems: 'center' },
  emptyText:      { fontSize: 12, color: '#9A8060', textAlign: 'center', fontStyle: 'italic' },
});