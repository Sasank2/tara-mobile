import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface StreakData {
  checkInStreak: number;
  journalStreak: number;
  breathingCount: number;
  longestStreak: number;
  lastCheckin: string | null;
}

function getLast7Days(): string[] {
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  });
}

export default function StreakTracker() {
  const [streak, setStreak] = useState<StreakData>({
    checkInStreak: 0, journalStreak: 0,
    breathingCount: 0, longestStreak: 0, lastCheckin: null,
  });
  const [last7, setLast7] = useState<boolean[]>([]);

  useEffect(() => { loadStreakData(); }, []);

  const loadStreakData = async () => {
    try {
      // Calculate check-in streak
      let checkInStreak = 0;
      const days = getLast7Days().reverse(); // most recent first
      const last7Bools: boolean[] = [];

      for (const date of days) {
        const saved = await AsyncStorage.getItem(`checkin_${date}`);
        const done = !!saved;
        last7Bools.push(done);
        if (done && checkInStreak === last7Bools.filter(b => b).length - 1) {
          checkInStreak++;
        }
      }

      // Recalculate streak properly
      let streak = 0;
      for (let i = 0; i < days.length; i++) {
        const saved = await AsyncStorage.getItem(`checkin_${days[i]}`);
        if (saved) { streak++; } else { break; }
      }

      // Journal streak
      let journalStreak = 0;
      for (const date of days) {
        const saved = await AsyncStorage.getItem(`journal_${date}`);
        if (saved) { journalStreak++; } else { break; }
      }

      // Breathing exercises this week
      let breathingCount = 0;
      for (const date of getLast7Days()) {
        const saved = await AsyncStorage.getItem(`breathing_${date}`);
        if (saved) {
          const data = JSON.parse(saved);
          breathingCount += data.count || 1;
        }
      }

      // Longest streak ever
      const savedLongest = await AsyncStorage.getItem('longest_streak');
      const longestStreak = Math.max(streak, parseInt(savedLongest || '0'));
      if (streak > parseInt(savedLongest || '0')) {
        await AsyncStorage.setItem('longest_streak', streak.toString());
      }

      setStreak({ checkInStreak: streak, journalStreak, breathingCount, longestStreak, lastCheckin: days[0] });
      setLast7(last7Bools.reverse()); // back to chronological
    } catch (e) {
      console.log('StreakTracker error', e);
    }
  };

  const getStreakMessage = (n: number): string => {
    if (n === 0) return 'Start your streak today';
    if (n === 1) return 'Day 1 — every streak starts here';
    if (n < 5)  return `${n} days — you\'re building something`;
    if (n < 10) return `${n} days — this is becoming a habit`;
    if (n < 20) return `${n} days — Tara is proud of you`;
    return `${n} days — you\'re unstoppable`;
  };

  return (
    <View style={sk.container}>
      {/* Main check-in streak */}
      <View style={sk.mainCard}>
        <View style={sk.mainCardLeft}>
          <Text style={sk.fireEmoji}>{streak.checkInStreak >= 7 ? '🔥' : streak.checkInStreak >= 3 ? '✨' : '⭐'}</Text>
          <View>
            <Text style={sk.streakNum}>{streak.checkInStreak}</Text>
            <Text style={sk.streakUnit}>day streak</Text>
          </View>
        </View>
        <View style={sk.mainCardRight}>
          <Text style={sk.streakMsg}>{getStreakMessage(streak.checkInStreak)}</Text>
          {/* Last 7 day dots */}
          <View style={sk.dotRow}>
            {last7.map((done, i) => (
              <View key={i} style={[sk.dot, done ? sk.dotDone : sk.dotMissed]} />
            ))}
          </View>
          <Text style={sk.dotLabel}>Last 7 days</Text>
        </View>
      </View>

      {/* Sub-streaks */}
      <View style={sk.subRow}>
        <View style={[sk.subCard, { backgroundColor: '#E1F5EE' }]}>
          <Text style={sk.subEmoji}>📔</Text>
          <Text style={[sk.subNum, { color: '#085041' }]}>{streak.journalStreak}</Text>
          <Text style={sk.subLabel}>Journal streak</Text>
        </View>
        <View style={[sk.subCard, { backgroundColor: '#EEEDFE' }]}>
          <Text style={sk.subEmoji}>🌬</Text>
          <Text style={[sk.subNum, { color: '#3C3489' }]}>{streak.breathingCount}</Text>
          <Text style={sk.subLabel}>Breathing this week</Text>
        </View>
        <View style={[sk.subCard, { backgroundColor: '#FFF8F0' }]}>
          <Text style={sk.subEmoji}>🏆</Text>
          <Text style={[sk.subNum, { color: '#C1560A' }]}>{streak.longestStreak}</Text>
          <Text style={sk.subLabel}>Best streak</Text>
        </View>
      </View>
    </View>
  );
}

const sk = StyleSheet.create({
  container:    { paddingVertical: 4 },
  mainCard:     { backgroundColor: '#FFF8F0', borderRadius: 16, padding: 14,
                  flexDirection: 'row', gap: 16, alignItems: 'center',
                  borderWidth: 0.5, borderColor: '#F0C878', marginBottom: 10 },
  mainCardLeft: { alignItems: 'center', gap: 4 },
  fireEmoji:    { fontSize: 32 },
  streakNum:    { fontSize: 36, fontWeight: '900', color: '#1F2937',
                  lineHeight: 40, textAlign: 'center' },
  streakUnit:   { fontSize: 9, color: '#9A8060', textAlign: 'center' },
  mainCardRight:{ flex: 1 },
  streakMsg:    { fontSize: 12, color: '#3A1A08', fontStyle: 'italic',
                  lineHeight: 17, marginBottom: 8 },
  dotRow:       { flexDirection: 'row', gap: 4 },
  dot:          { width: 18, height: 18, borderRadius: 4 },
  dotDone:      { backgroundColor: '#F5A623' },
  dotMissed:    { backgroundColor: '#E8E3D8' },
  dotLabel:     { fontSize: 8, color: '#9A8060', marginTop: 3 },
  subRow:       { flexDirection: 'row', gap: 8 },
  subCard:      { flex: 1, borderRadius: 12, padding: 10, alignItems: 'center', gap: 3 },
  subEmoji:     { fontSize: 20 },
  subNum:       { fontSize: 20, fontWeight: '800' },
  subLabel:     { fontSize: 8, color: '#9A8060', textAlign: 'center' },
});