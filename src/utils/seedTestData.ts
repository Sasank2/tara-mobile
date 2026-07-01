import AsyncStorage from '@react-native-async-storage/async-storage';

const MOODS_LIST = [
  ['Happy', 'Motivated'],
  ['Calm', 'Grateful'],
  ['Anxious', 'Tired'],
  ['Happy', 'Calm'],
  ['Low', 'Confused'],
  ['Motivated', 'Happy'],
  ['Tired', 'Neutral'],
];

const MOON_SIGNS = ['Pisces', 'Aries', 'Taurus', 'Gemini', 'Pisces', 'Cancer', 'Pisces'];

export async function seedTestData() {
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = d.toISOString().split('T')[0];

    const sleepQuality  = Math.floor(Math.random() * 3) + 2; // 2-4
    const hoursSlept    = Math.floor(Math.random() * 4) + 5; // 5-8
    const energyLevel   = Math.floor(Math.random() * 6) + 3; // 3-8
    const moods         = MOODS_LIST[i];
    const moonSign      = MOON_SIGNS[i];

    const sleepScore  = [0, 6, 12, 18, 24, 30][sleepQuality];
    const moodScore   = Math.min(30, moods.length * 9);
    const energyScore = Math.round((energyLevel / 10) * 25);
    const astroScore  = 8;
    const total       = sleepScore + moodScore + energyScore + astroScore;

    const checkIn = {
      date,
      sleepQuality,
      hoursSlept,
      moods,
      energyLevel,
      planetAnswer: 'A little',
      moonSign,
      score: total,
      scoreBreakdown: {
        sleep: sleepScore,
        mood: moodScore,
        energy: energyScore,
        astro: astroScore,
      },
    };

    await AsyncStorage.setItem(`checkin_${date}`, JSON.stringify(checkIn));
  }

  // Seed journal streak
  for (let i = 0; i < 3; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = d.toISOString().split('T')[0];
    await AsyncStorage.setItem(`journal_${date}`, JSON.stringify({ entry: 'test' }));
  }

  // Seed breathing exercises
  for (let i = 0; i < 5; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = d.toISOString().split('T')[0];
    await AsyncStorage.setItem(`breathing_${date}`, JSON.stringify({ count: 1 }));
  }

  console.log('✅ Test data seeded successfully');
}

export async function clearTestData() {
  const keys = await AsyncStorage.getAllKeys();
  const testKeys = keys.filter(k =>
    k.startsWith('checkin_') ||
    k.startsWith('journal_') ||
    k.startsWith('breathing_') ||
    k === 'longest_streak' ||
    k === 'cycle_data'
  );
  await AsyncStorage.multiRemove(testKeys);
  console.log('🗑️ Test data cleared');
}