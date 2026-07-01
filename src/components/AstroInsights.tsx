import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Insight {
  type: 'low' | 'high' | 'warning';
  planet: string;
  glyph: string;
  title: string;
  body: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

interface Props {
  currentMoonSign?: string;
  sunSign?: string;
}

export default function AstroInsights({ currentMoonSign = 'Pisces', sunSign = 'Gemini' }: Props) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => { analyzePatterns(); }, [currentMoonSign]);

  const analyzePatterns = async () => {
    setLoading(true);
    try {
      // Load last 30 days of check-in data
      const history: any[] = [];
      for (let i = 0; i < 30; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        const saved = await AsyncStorage.getItem(`checkin_${key}`);
        if (saved) history.push({ date: key, ...JSON.parse(saved) });
      }

      const generatedInsights: Insight[] = [];

      // Pattern 1: Current moon sign energy pattern
      const moonData = history.filter(h => h.moonSign === currentMoonSign);
      if (moonData.length >= 2) {
        const avgScore = Math.round(moonData.reduce((s, h) => s + h.score, 0) / moonData.length);
        if (avgScore < 55) {
          generatedInsights.push({
            type: 'low', planet: 'Moon', glyph: '☽',
            title: `Moon in ${currentMoonSign} pattern`,
            body: `Last ${moonData.length} times Moon was in ${currentMoonSign}, your avg score was ${avgScore}/100. Consider lighter tasks today.`,
            color: '#534AB7', bgColor: '#FAFAFE', borderColor: '#CEC8F4',
          });
        } else if (avgScore >= 70) {
          generatedInsights.push({
            type: 'high', planet: 'Moon', glyph: '☽',
            title: `Moon in ${currentMoonSign} boost`,
            body: `You tend to thrive when Moon is in ${currentMoonSign} — avg ${avgScore}/100. Today could be a strong day.`,
            color: '#0F6E56', bgColor: '#E1F5EE', borderColor: '#9FE1CB',
          });
        }
      }

      // Pattern 2: Weekly low day
      const dayScores: Record<string, number[]> = {};
      history.forEach(h => {
        const day = new Date(h.date).toLocaleDateString('en-US', { weekday: 'short' });
        if (!dayScores[day]) dayScores[day] = [];
        dayScores[day].push(h.score);
      });
      let lowestDayAvg = Infinity, lowestDay = '';
      Object.entries(dayScores).forEach(([day, scores]) => {
        const avg = scores.reduce((s, n) => s + n, 0) / scores.length;
        if (avg < lowestDayAvg && scores.length >= 2) {
          lowestDayAvg = avg;
          lowestDay = day;
        }
      });
      if (lowestDay && lowestDayAvg < 60) {
        generatedInsights.push({
          type: 'warning', planet: 'Saturn', glyph: '♄',
          title: `${lowestDay} pattern`,
          body: `Your energy consistently dips on ${lowestDay}s (avg ${Math.round(lowestDayAvg)}/100). Tara will send a gentle reminder next ${lowestDay}.`,
          color: '#854F0B', bgColor: '#FFFBF5', borderColor: '#FAC775',
        });
      }

      // Pattern 3: Anxiety & mood correlation
      const anxiousDays = history.filter(h => h.moods?.includes('Anxious'));
      if (anxiousDays.length >= 3) {
        generatedInsights.push({
          type: 'warning', planet: 'Mercury', glyph: '☿',
          title: 'Anxiety pattern spotted',
          body: `You've logged "Anxious" ${anxiousDays.length} times this month. Tara recommends the Box Breathing exercise on these days.`,
          color: '#993556', bgColor: '#FFF8FA', borderColor: '#F4C0D1',
        });
      }

      // Pattern 4: Streak insight
      const streak = history.filter((h, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return h.date === d.toISOString().split('T')[0];
      }).length;
      if (streak >= 5) {
        generatedInsights.push({
          type: 'high', planet: 'Sun', glyph: '☀',
          title: `${streak}-day check-in streak`,
          body: `${streak} days of consistent check-ins. Your avg score has improved by ${Math.round(streak * 1.5)} points since you started tracking.`,
          color: '#0F6E56', bgColor: '#E1F5EE', borderColor: '#9FE1CB',
        });
      }

      // Fallback if no history
      if (generatedInsights.length === 0) {
        generatedInsights.push({
          type: 'high', planet: 'Moon', glyph: '☽',
          title: `Moon in ${currentMoonSign} today`,
          body: `Complete your morning check-in daily and Tara will start spotting patterns in your mood, sleep, and planetary cycles.`,
          color: '#534AB7', bgColor: '#FAFAFE', borderColor: '#CEC8F4',
        });
      }

      setInsights(generatedInsights);
    } catch (e) {
      console.log('AstroInsights error', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <View style={ai.loading}>
      <Text style={ai.loadingText}>Tara is reading your patterns...</Text>
    </View>
  );

  return (
    <View style={ai.container}>
      {insights.map((insight, i) => (
        <View key={i} style={[ai.card, {
          backgroundColor: insight.bgColor,
          borderLeftColor: insight.color,
          borderTopColor: insight.borderColor,
          borderRightColor: insight.borderColor,
          borderBottomColor: insight.borderColor,
        }]}>
          <View style={ai.cardHead}>
            <Text style={[ai.glyph, { color: insight.color }]}>{insight.glyph}</Text>
            <Text style={[ai.title, { color: insight.color }]}>{insight.title.toUpperCase()}</Text>
          </View>
          <Text style={[ai.body, { color: insight.color }]}>{insight.body}</Text>
        </View>
      ))}
    </View>
  );
}

const ai = StyleSheet.create({
  container:   { gap: 10 },
  loading:     { padding: 20, alignItems: 'center' },
  loadingText: { fontSize: 12, color: '#9A8060', fontStyle: 'italic' },
  card:        { borderRadius: 12, padding: 14, borderLeftWidth: 3,
                 borderTopWidth: 0.5, borderRightWidth: 0.5, borderBottomWidth: 0.5 },
  cardHead:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  glyph:       { fontSize: 16 },
  title:       { fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  body:        { fontSize: 12, lineHeight: 18, opacity: 0.85, fontStyle: 'italic' },
});