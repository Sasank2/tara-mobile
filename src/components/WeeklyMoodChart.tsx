import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SW } = Dimensions.get('window');

interface DayData {
  date: string;
  day: string;
  score: number | null;
  mood: string;
  moonSign?: string;
}

const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function getLast7Days(): string[] {
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
}

function getDayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return DAY_LABELS[d.getDay()];
}

function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().split('T')[0];
}

function getScoreColor(score: number): string {
  if (score >= 75) return '#1D9E75';
  if (score >= 55) return '#F5A623';
  if (score >= 35) return '#C1560A';
  return '#D4537E';
}

function getMoodEmoji(moods: string[]): string {
  if (!moods || moods.length === 0) return '😐';
  const positive = ['Happy','Calm','Motivated','Grateful'];
  const negative = ['Anxious','Sad','Low','Confused'];
  const hasPositive = moods.some(m => positive.includes(m));
  const hasNegative = moods.some(m => negative.includes(m));
  if (hasPositive && !hasNegative) return '😊';
  if (hasNegative && !hasPositive) return '😔';
  if (moods.includes('Tired')) return '😴';
  return '😐';
}

export default function WeeklyMoodChart() {
  const [weekData, setWeekData]   = useState<DayData[]>([]);
  const [avgScore, setAvgScore]   = useState<number | null>(null);
  const [bestDay, setBestDay]     = useState<string | null>(null);
  const [lowestDay, setLowestDay] = useState<string | null>(null);
  const [taraInsight, setTaraInsight] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

  useEffect(() => { loadWeekData(); }, []);

  const loadWeekData = async () => {
    const days = getLast7Days();
    const data: DayData[] = [];

    for (const date of days) {
      try {
        const saved = await AsyncStorage.getItem(`checkin_${date}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          data.push({
            date,
            day: getDayLabel(date),
            score: parsed.score,
            mood: getMoodEmoji(parsed.moods || []),
            moonSign: parsed.moonSign,
          });
        } else {
          data.push({ date, day: getDayLabel(date), score: null, mood: '–' });
        }
      } catch {
        data.push({ date, day: getDayLabel(date), score: null, mood: '–' });
      }
    }

    setWeekData(data);

    const scored = data.filter(d => d.score !== null);
    if (scored.length > 0) {
      const avg = Math.round(scored.reduce((s, d) => s + (d.score ?? 0), 0) / scored.length);
      setAvgScore(avg);

      const best  = scored.reduce((a, b) => (b.score ?? 0) > (a.score ?? 0) ? b : a);
      const worst = scored.reduce((a, b) => (b.score ?? 0) < (a.score ?? 0) ? b : a);
      setBestDay(best.day);
      setLowestDay(worst.day);

      // Generate Tara insight
      if (scored.length >= 3) {
        const lowDays = scored.filter(d => (d.score ?? 0) < 50);
        if (lowDays.length >= 2) {
          setTaraInsight(`Your energy dips on ${lowDays.map(d => d.day).join(' & ')} — Tara will check in earlier those days.`);
        } else if (avg >= 70) {
          setTaraInsight(`Strong week — your average score of ${avg} is well above baseline. Keep this rhythm.`);
        } else {
          setTaraInsight(`Your best day was ${best.day} with a score of ${best.score}. What made it different?`);
        }
      }
    }
  };

  const maxScore = Math.max(...weekData.map(d => d.score ?? 0), 1);

  return (
    <View style={wc.container}>
      {/* Bar chart */}
      <View style={wc.chartRow}>
        {weekData.map((day, i) => {
          const barH = day.score !== null ? Math.max((day.score / 100) * 64, 4) : 4;
          const color = day.score !== null ? getScoreColor(day.score) : '#E8E3D8';
          const today = isToday(day.date);
          return (
            <TouchableOpacity
              key={day.date}
              style={wc.barWrap}
              onPress={() => setSelectedDay(selectedDay?.date === day.date ? null : day)}
              activeOpacity={0.7}>
              <View style={wc.barTrack}>
                <View style={[wc.bar, {
                  height: barH,
                  backgroundColor: color,
                  borderWidth: today ? 1.5 : 0,
                  borderColor: today ? '#F5A623' : 'transparent',
                }]} />
              </View>
              {day.score !== null && (
                <Text style={[wc.barScore, { color }]}>{day.score}</Text>
              )}
              <Text style={[wc.barDay, today && wc.barDayToday]}>{day.day}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected day detail */}
      {selectedDay && selectedDay.score !== null && (
        <View style={wc.dayDetail}>
          <Text style={wc.dayDetailDay}>{selectedDay.day}</Text>
          <Text style={wc.dayDetailScore}>{selectedDay.score} / 100</Text>
          <Text style={wc.dayDetailMood}>{selectedDay.mood}</Text>
        </View>
      )}

      {/* Stats row */}
      {avgScore !== null && (
        <View style={wc.statsRow}>
          <View style={wc.statCard}>
            <Text style={wc.statNum}>{avgScore}</Text>
            <Text style={wc.statLbl}>Avg score</Text>
          </View>
          {lowestDay && (
            <View style={[wc.statCard, wc.statCardWarm]}>
              <Text style={[wc.statNum, { color: '#C1560A' }]}>{lowestDay}</Text>
              <Text style={wc.statLbl}>Lowest day</Text>
            </View>
          )}
          {bestDay && (
            <View style={[wc.statCard, wc.statCardGreen]}>
              <Text style={[wc.statNum, { color: '#0F6E56' }]}>{bestDay}</Text>
              <Text style={wc.statLbl}>Best day</Text>
            </View>
          )}
        </View>
      )}

      {/* Tara insight */}
      {taraInsight && (
        <View style={wc.insightCard}>
          <View style={wc.insightHeader}>
            <View style={wc.taraOrb}><Text style={wc.taraOrbText}>✦</Text></View>
            <Text style={wc.insightLabel}>TARA NOTICES</Text>
          </View>
          <Text style={wc.insightText}>{taraInsight}</Text>
        </View>
      )}

      {weekData.every(d => d.score === null) && (
        <View style={wc.emptyState}>
          <Text style={wc.emptyText}>Complete your morning check-in to start tracking your week</Text>
        </View>
      )}
    </View>
  );
}

const wc = StyleSheet.create({
  container:       { paddingVertical: 4 },
  chartRow:        { flexDirection: 'row', gap: 6, alignItems: 'flex-end',
                     height: 100, marginBottom: 8 },
  barWrap:         { flex: 1, alignItems: 'center', gap: 3 },
  barTrack:        { flex: 1, width: '100%', backgroundColor: '#E8E3D8',
                     borderRadius: 4, justifyContent: 'flex-end', overflow: 'hidden' },
  bar:             { width: '100%', borderRadius: 4 },
  barScore:        { fontSize: 9, fontWeight: '700' },
  barDay:          { fontSize: 9, color: '#9A8060' },
  barDayToday:     { color: '#F5A623', fontWeight: '700' },
  dayDetail:       { flexDirection: 'row', alignItems: 'center', gap: 10,
                     backgroundColor: '#FFF8F0', borderRadius: 10,
                     padding: 10, marginBottom: 8, borderWidth: 0.5,
                     borderColor: '#F0C878' },
  dayDetailDay:    { fontSize: 13, fontWeight: '700', color: '#1F2937' },
  dayDetailScore:  { fontSize: 13, color: '#C1560A', fontWeight: '600' },
  dayDetailMood:   { fontSize: 20 },
  statsRow:        { flexDirection: 'row', gap: 8, marginBottom: 10 },
  statCard:        { flex: 1, backgroundColor: '#E8E3D8', borderRadius: 10,
                     padding: 10, alignItems: 'center' },
  statCardWarm:    { backgroundColor: '#FFF8F0', borderWidth: 0.5, borderColor: '#F0C878' },
  statCardGreen:   { backgroundColor: '#E1F5EE' },
  statNum:         { fontSize: 18, fontWeight: '800', color: '#1F2937' },
  statLbl:         { fontSize: 8, color: '#9A8060', marginTop: 2 },
  insightCard:     { backgroundColor: '#FFF8F0', borderRadius: 12, padding: 12,
                     borderLeftWidth: 2, borderLeftColor: '#C1560A' },
  insightHeader:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  taraOrb:         { width: 22, height: 22, borderRadius: 11,
                     backgroundColor: '#C1560A', alignItems: 'center',
                     justifyContent: 'center' },
  taraOrbText:     { fontSize: 10, color: '#fff' },
  insightLabel:    { fontSize: 9, color: '#C1560A', fontWeight: '700', letterSpacing: 1 },
  insightText:     { fontSize: 12, color: '#3A1A08', fontStyle: 'italic', lineHeight: 18 },
  emptyState:      { padding: 20, alignItems: 'center' },
  emptyText:       { fontSize: 12, color: '#9A8060', textAlign: 'center',
                     fontStyle: 'italic', lineHeight: 18 },
});