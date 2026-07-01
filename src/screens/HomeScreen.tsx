import EmotionalTab from '../components/EmotionalTab';
import PremiumModal from '../components/PremiumModal';
import MorningCheckInModal from '../components/MorningCheckInModal';
import WeeklyMoodChart from '../components/WeeklyMoodChart';
import AstroInsights from '../components/AstroInsights';
import SleepTracker from '../components/SleepTracker';
import StreakTracker from '../components/StreakTracker';
import BodyTensionModal from '../components/BodyTensionModal';
import LunarCycleTracker from '../components/LunarCycleTracker';
import { seedTestData, clearTestData } from '../utils/seedTestData';
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
  Animated, Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { homeAPI, moodAPI } from '../services/api';
import { MOODS } from '../constants';

console.log('Component check:', {
  WeeklyMoodChart: typeof WeeklyMoodChart,
  AstroInsights:   typeof AstroInsights,
  SleepTracker:    typeof SleepTracker,
  StreakTracker:    typeof StreakTracker,
  BodyTensionModal: typeof BodyTensionModal,
  LunarCycleTracker: typeof LunarCycleTracker,
});

const { width, height } = Dimensions.get('window');

const PLANETS = [
  { emoji: '🪐', size: 20, startX: width * 0.15, duration: 22000, delay: 0 },
  { emoji: '🌍', size: 16, startX: width * 0.7,  duration: 18000, delay: 3000 },
  { emoji: '🌙', size: 14, startX: width * 0.4,  duration: 25000, delay: 6000 },
  { emoji: '✨', size: 10, startX: width * 0.85, duration: 15000, delay: 9000 },
  { emoji: '🌟', size: 9,  startX: width * 0.25, duration: 20000, delay: 12000 },
];

const TABS       = ['Today', 'Career', 'Love', 'Health', 'Emotional'];
const ORANGE     = '#F5A623';
const CREAM      = '#F2EFE8';
const DARK_CREAM = '#E8E3D8';
const DARK       = '#1F2937';

const MOON_QUESTIONS: Record<string, {
  glyph: string; transit: string; question: string; options: string[];
}> = {
  Pisces:      { glyph:'☽', transit:'Moon in Pisces',      question:'How vivid were your dreams last night?',            options:['Very vivid','A little','Barely','No dreams'] },
  Aries:       { glyph:'☽', transit:'Moon in Aries',       question:'Are you feeling restless or driven this morning?',  options:['Restless','Driven','Both','Neither'] },
  Taurus:      { glyph:'☽', transit:'Moon in Taurus',      question:'What does your body need most right now?',          options:['Rest','Food','Movement','Quiet'] },
  Gemini:      { glyph:'☽', transit:'Moon in Gemini',      question:'How is your mind feeling this morning?',            options:['Racing','Clear','Scattered','Curious'] },
  Cancer:      { glyph:'☽', transit:'Moon in Cancer',      question:'How emotionally open are you feeling?',             options:['Very open','Guarded','Tender','Numb'] },
  Leo:         { glyph:'☽', transit:'Moon in Leo',         question:'Are you feeling seen or invisible today?',          options:['Seen','Invisible','Performing','Authentic'] },
  Virgo:       { glyph:'☽', transit:'Moon in Virgo',       question:'What feels unfinished or unsettled?',               options:['Work tasks','A conversation','My body','Nothing'] },
  Libra:       { glyph:'☽', transit:'Moon in Libra',       question:'Are you feeling balanced or pulled in two directions?', options:['Balanced','Pulled','Indecisive','Clear'] },
  Scorpio:     { glyph:'☽', transit:'Moon in Scorpio',     question:'What truth are you sitting with this morning?',     options:['Something personal','Something relational','Avoiding something','I feel clear'] },
  Sagittarius: { glyph:'☽', transit:'Moon in Sagittarius', question:'Are you craving freedom or meaning today?',         options:['Freedom','Meaning','Adventure','Stillness'] },
  Capricorn:   { glyph:'☽', transit:'Moon in Capricorn',   question:'What are you building or protecting today?',        options:['My career','My health','A relationship','My peace'] },
  Aquarius:    { glyph:'☽', transit:'Moon in Aquarius',    question:'Are you feeling connected or detached today?',      options:['Connected','Detached','Observant','Inspired'] },
};

function todayStr() { return new Date().toISOString().split('T')[0]; }

function getScoreLabel(score: number): string {
  if (score >= 85) return 'Glowing ✨';
  if (score >= 70) return 'Feeling clear';
  if (score >= 55) return 'Steady flow';
  if (score >= 40) return 'Take it slow';
  return 'Rest & restore';
}

export default function HomeScreen({ setActiveTab: setMainTab }: any) {
  const [activeTab, setActiveTab]             = useState('Today');
  const [homeData, setHomeData]               = useState<any>(null);
  const [loading, setLoading]                 = useState(true);
  const [refreshing, setRefreshing]           = useState(false);
  const [selectedMood, setSelectedMood]       = useState<string | null>(null);
  const [moodResponse, setMoodResponse]       = useState<string | null>(null);
  const [expandedCard, setExpandedCard]       = useState<string | null>(null);
  const [showPremium, setShowPremium]         = useState(false);
  const [premiumFeature, setPremiumFeature]   = useState('');
  const [homeMode, setHomeMode]               = useState<'wellness' | 'astro'>('wellness');
  const [showCheckIn, setShowCheckIn]         = useState(false);
  const [showBodyTension, setShowBodyTension] = useState(false);
  const [todayScore, setTodayScore]           = useState<number | null>(null);
  const [scoreLabel, setScoreLabel]           = useState('Daily score');

  const moodAnim = useRef(new Animated.Value(0)).current;
  const planetY  = useRef(PLANETS.map(() => new Animated.Value(-40))).current;
  const planetX  = useRef(PLANETS.map((p) => new Animated.Value(p.startX))).current;

  useEffect(() => {
    PLANETS.forEach((planet, i) => {
      const animate = () => {
        planetY[i].setValue(-40);
        planetX[i].setValue(planet.startX);
        const driftX = (Math.random() - 0.5) * 60;
        Animated.parallel([
          Animated.timing(planetY[i], { toValue: height + 40, duration: planet.duration, useNativeDriver: true }),
          Animated.timing(planetX[i], { toValue: planet.startX + driftX, duration: planet.duration, useNativeDriver: true }),
        ]).start(() => animate());
      };
      setTimeout(() => animate(), planet.delay);
    });
  }, []);

  useEffect(() => {
    const checkToday = async () => {
      try {
        const saved = await AsyncStorage.getItem(`checkin_${todayStr()}`);
        if (saved) {
          const data = JSON.parse(saved);
          setTodayScore(data.score);
          setScoreLabel(getScoreLabel(data.score));
        } else {
          setTimeout(() => setShowCheckIn(true), 1200);
        }
      } catch {
        setTimeout(() => setShowCheckIn(true), 1200);
      }
    };
    checkToday();
  }, []);

  const handleCheckInComplete = (data: any) => {
    setTodayScore(data.score);
    setScoreLabel(getScoreLabel(data.score));
    setShowCheckIn(false);
  };

  const fetchHome = async () => {
    try {
      const res = await homeAPI.getHome();
      setHomeData(res.data.data);
    } catch (e) { console.log('Home fetch error', e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchHome(); }, []);

  const handleMoodSelect = async (mood: string) => {
    setSelectedMood(mood);
    moodAnim.setValue(0);
    try {
      await moodAPI.saveMood({ mood, stressLevel: 'Medium', energyLevel: 'Medium', sleepQuality: 'Good' });
    } catch {}
    const responses: Record<string, string> = {
      Good:      'Great energy today! Your Gemini Sun is shining bright.',
      Happy:     'Beautiful! Ride this wave and share your joy.',
      Calm:      'Perfect for deep focus. Your Pisces Moon is at peace.',
      Anxious:   'I hear you. Your Pisces Moon absorbs a lot. Breathe slowly.',
      Low:       'It is okay to feel this way. Your sensitivity is your strength.',
      Confused:  'Clarity will come. Write down what is on your mind.',
      Motivated: 'Channel this into one important task today.',
      Tired:     'Rest is productive too. Be gentle with yourself.',
      Emotional: 'Feel it fully. Your Pisces Moon needs this release.',
    };
    setMoodResponse(responses[mood] || 'Thank you for checking in.');
    Animated.spring(moodAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  console.log('Types:', 
  typeof WeeklyMoodChart,
  typeof AstroInsights, 
  typeof SleepTracker,
  typeof StreakTracker,
  typeof BodyTensionModal,
  typeof LunarCycleTracker
);

  if (loading) return (
    <View style={s.loading}>
      <ActivityIndicator color={ORANGE} size="large" />
    </View>
  );

  const guidance = homeData?.todaysGuidance;
  const greeting = homeData?.greeting;
  const astro    = homeData?.astrologyHeader;

  const today   = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'short' });
  const dateStr = `${today.getDate()} ${today.toLocaleDateString('en-US', { month: 'short' })}`;

  const currentMoonSign = astro?.moonSign || astro?.moonSignTransit || 'Pisces';
  const planetQuestion  = MOON_QUESTIONS[currentMoonSign] ?? MOON_QUESTIONS['Pisces'];

  const StoryCard = ({ id, icon, title, text, tags, cardStyle, titleColor, textColor }: any) => {
    const isExpanded = expandedCard === id;
    return (
      <TouchableOpacity
        style={[s.blueprintCard, cardStyle]}
        onPress={() => {
          if (isExpanded) { setExpandedCard(null); }
          else if (id === 'core') { setExpandedCard(id); }
          else { setPremiumFeature(title); setShowPremium(true); }
        }}
        activeOpacity={0.85}>
        <Text style={s.blueprintCardIcon}>{icon}</Text>
        <Text style={[s.blueprintCardTitle, { color: titleColor || DARK }]}>{title}</Text>
        <Text style={[s.blueprintCardText, { color: textColor || '#6B7280' }]}
          numberOfLines={isExpanded ? undefined : 2}>{text}</Text>
        {isExpanded && tags && (
          <View style={s.blueprintTags}>
            {tags.map((t: string) => (
              <View key={t} style={[s.blueprintTag, {
                borderColor: titleColor + '40', backgroundColor: titleColor + '15',
              }]}>
                <Text style={[s.blueprintTagText, { color: titleColor }]}>{t}</Text>
              </View>
            ))}
          </View>
        )}
        <Text style={[s.blueprintArrow, { color: titleColor || ORANGE }]}>
          {isExpanded ? '∧' : '›'}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Today': return (
        <View>
          <Text style={s.sectionLabel}>YOUR COSMIC BLUEPRINT</Text>
          <View style={s.blueprintRow}>
            <StoryCard
              id="core" icon="✦" title="Core identity"
              cardStyle={s.blueprintCardCream}
              titleColor={DARK} textColor="#6B7280"
              text={`You are a ${astro?.sunSign||'Gemini'} Sun with a ${astro?.moonSignNatal||'Pisces'} Moon and ${astro?.ascendant||'Leo'} Rising — curious, deeply feeling, magnetic.`}
              tags={['Air · Mutable', 'Mercury ruled']}
            />
            <StoryCard
              id="emotional" icon="🌙" title="Emotional world"
              cardStyle={s.blueprintCardOrange}
              titleColor="#fff" textColor="rgba(255,255,255,0.8)"
              text={`Your ${astro?.moonSignNatal||'Pisces'} Moon absorbs emotions deeply. You need solitude and creative space to feel grounded.`}
              tags={['Empathic', 'Intuitive']}
            />
          </View>

          <View style={s.divider} />
          <Text style={s.sectionLabel}>THIS WEEK</Text>
          <WeeklyMoodChart />

          <View style={s.divider} />
          <Text style={s.sectionLabel}>TARA'S PATTERNS</Text>
          <AstroInsights
            currentMoonSign={currentMoonSign}
            sunSign={astro?.sunSign || 'Gemini'}
          />

          <View style={s.divider} />
          <Text style={s.sectionLabel}>SLEEP THIS WEEK</Text>
          <SleepTracker moonSign={currentMoonSign} />

          <View style={s.divider} />
          <Text style={s.sectionLabel}>YOUR STREAKS</Text>
          <StreakTracker />

          <View style={s.divider} />
          <Text style={s.sectionLabel}>BODY CHECK-IN</Text>
          <TouchableOpacity
            style={s.bodyBtn}
            onPress={() => setShowBodyTension(true)}
            activeOpacity={0.85}>
            <View style={s.bodyBtnLeft}>
              <Text style={s.bodyBtnEmoji}>🫀</Text>
              <View>
                <Text style={s.bodyBtnTitle}>Where are you holding tension?</Text>
                <Text style={s.bodyBtnSub}>Tap for targeted relief techniques</Text>
              </View>
            </View>
            <Text style={s.bodyBtnArrow}>›</Text>
          </TouchableOpacity>

          <View style={s.divider} />
          <Text style={s.sectionLabel}>LUNAR CYCLE</Text>
          <LunarCycleTracker />

          <View style={s.divider} />
          <Text style={s.sectionLabel}>FEELING TODAY?</Text>
          <View style={s.moodRow}>
            {MOODS.map((m) => (
              <TouchableOpacity
                key={m.label}
                style={[s.moodChip, selectedMood === m.label && {
                  backgroundColor: ORANGE, borderColor: ORANGE,
                }]}
                onPress={() => handleMoodSelect(m.label)}>
                <Text style={[s.moodText, selectedMood === m.label && { color: '#fff' }]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {moodResponse && (
            <Animated.View style={[s.moodCard, {
              opacity: moodAnim,
              transform: [{ translateY: moodAnim.interpolate({ inputRange:[0,1], outputRange:[10,0] }) }],
            }]}>
              <View style={s.moodCardTop}>
                <View style={s.taraAvatar}><Text style={s.taraAvatarText}>✦</Text></View>
                <Text style={s.taraLabel}>Tara</Text>
              </View>
              <Text style={s.moodCardText}>{moodResponse}</Text>
              {(selectedMood === 'Low' || selectedMood === 'Anxious' || selectedMood === 'Emotional') && (
                <TouchableOpacity style={s.supportBtn} onPress={() => setActiveTab('Emotional')}>
                  <Text style={s.supportBtnText}>See full support + exercises →</Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          )}

          <View style={s.divider} />
          <Text style={s.sectionLabel}>ASK TARA</Text>
          {['Why do I feel this way today?', 'Is today good for career decisions?', 'How is my relationship energy?'].map((q) => (
            <TouchableOpacity key={q} style={s.qqCard}
              onPress={() => setMainTab && setMainTab('Ask Tara')}>
              <Text style={s.qqText}>{q}</Text>
              <Text style={s.qqArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      );

      case 'Career': return (
        <View>
          <Text style={s.sectionLabel}>CAREER ENERGY TODAY</Text>
          <View style={s.mainCard}>
            <Text style={s.cardTitle}>Work & Growth</Text>
            <Text style={s.bodyText}>{guidance?.focusGuidance || 'Focus your energy on meaningful work today.'}</Text>
          </View>
          <View style={s.insightCard}>
            <View style={[s.insightDot, { backgroundColor: ORANGE }]} />
            <View style={s.insightBody}>
              <Text style={s.insightTitle}>Today's focus</Text>
              <Text style={s.insightText}>{guidance?.practicalStep || 'Finish one important task before noon.'}</Text>
            </View>
          </View>
          <View style={s.insightCard}>
            <View style={[s.insightDot, { backgroundColor: DARK_CREAM }]} />
            <View style={s.insightBody}>
              <Text style={s.insightTitle}>What to avoid</Text>
              <Text style={s.insightText}>{guidance?.avoidGuidance || 'Avoid scattered energy and impulsive decisions.'}</Text>
            </View>
          </View>
          <TouchableOpacity style={s.primaryBtn} onPress={() => setMainTab && setMainTab('Ask Tara')}>
            <Text style={s.primaryBtnText}>Ask Tara about your career →</Text>
          </TouchableOpacity>
        </View>
      );

      case 'Love': return (
        <View>
          <Text style={s.sectionLabel}>LOVE ENERGY TODAY</Text>
          <View style={s.mainCard}>
            <Text style={s.cardTitle}>Connection & Heart</Text>
            <Text style={s.bodyText}>Your Pisces Moon makes you naturally attuned. Someone close may be waiting for you to notice what they have not said.</Text>
          </View>
          <View style={s.insightCard}>
            <View style={[s.insightDot, { backgroundColor: ORANGE }]} />
            <View style={s.insightBody}>
              <Text style={s.insightTitle}>Emotional connection</Text>
              <Text style={s.insightText}>Good day for honest and soft conversations.</Text>
            </View>
          </View>
          <TouchableOpacity style={s.primaryBtn} onPress={() => setMainTab && setMainTab('Ask Tara')}>
            <Text style={s.primaryBtnText}>Ask Tara about love →</Text>
          </TouchableOpacity>
        </View>
      );

      case 'Health': return (
        <View>
          <Text style={s.sectionLabel}>WELLNESS ENERGY TODAY</Text>
          <View style={s.mainCard}>
            <Text style={s.cardTitle}>Body & Mind</Text>
            <Text style={s.bodyText}>{guidance?.wellnessAction || 'Take a mindful walk while listening to something that inspires you.'}</Text>
          </View>
          <View style={s.insightCard}>
            <View style={[s.insightDot, { backgroundColor: ORANGE }]} />
            <View style={s.insightBody}>
              <Text style={s.insightTitle}>Body focus</Text>
              <Text style={s.insightText}>Light movement and breathing will restore your energy today.</Text>
            </View>
          </View>
          <TouchableOpacity
            style={s.bodyBtn}
            onPress={() => setShowBodyTension(true)}
            activeOpacity={0.85}>
            <View style={s.bodyBtnLeft}>
              <Text style={s.bodyBtnEmoji}>🫀</Text>
              <View>
                <Text style={s.bodyBtnTitle}>Body tension relief</Text>
                <Text style={s.bodyBtnSub}>Targeted techniques for your body</Text>
              </View>
            </View>
            <Text style={s.bodyBtnArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.primaryBtn} onPress={() => setMainTab && setMainTab('Ask Tara')}>
            <Text style={s.primaryBtnText}>Ask Tara about wellness →</Text>
          </TouchableOpacity>
        </View>
      );

      case 'Emotional': return <EmotionalTab />;
      default: return null;
    }
  };

  return (
    <View style={s.container}>
      <MorningCheckInModal
        visible={showCheckIn}
        onClose={() => setShowCheckIn(false)}
        onComplete={handleCheckInComplete}
        userName={greeting?.name || 'friend'}
        todayPlanet={planetQuestion}
      />
      <BodyTensionModal
        visible={showBodyTension}
        onClose={() => setShowBodyTension(false)}
      />

      <View style={s.planetLayer} pointerEvents="none">
        {PLANETS.map((planet, i) => (
          <Animated.Text key={i} style={[s.planet, {
            fontSize: planet.size, opacity: 0.08,
            transform: [{ translateX: planetX[i] }, { translateY: planetY[i] }],
          }]}>
            {planet.emoji}
          </Animated.Text>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchHome(); }}
          />
        }>

        <View style={s.topBar}>
          <View style={s.topIcon}>
            <Text style={s.topIconText}>✦</Text>
          </View>
          <View style={s.toggle}>
            <TouchableOpacity
              style={[s.toggleBtn, homeMode === 'wellness' && s.toggleBtnActiveWellness]}
              onPress={() => setHomeMode('wellness')}>
              <Text style={[s.toggleBtnText, homeMode === 'wellness' && s.toggleBtnTextActive]}>
                Wellness
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.toggleBtn, homeMode === 'astro' && s.toggleBtnActiveAstro]}
              onPress={() => setHomeMode('astro')}>
              <Text style={[s.toggleBtnText, homeMode === 'astro' && s.toggleBtnTextActive]}>
                Astro
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {true && (
          <View style={{ flexDirection:'row', gap:8, paddingHorizontal:20, marginBottom:8 }}>
            <TouchableOpacity
              style={{ backgroundColor:'#1D9E75', borderRadius:8, padding:8, flex:1 }}
              onPress={async () => { await seedTestData(); fetchHome(); }}>
              <Text style={{ color:'#fff', fontSize:11, textAlign:'center', fontWeight:'600' }}>
                🌱 Seed test data
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ backgroundColor:'#D4537E', borderRadius:8, padding:8, flex:1 }}
              onPress={async () => {
                await clearTestData();
                setTodayScore(null);
                setScoreLabel('Daily score');
              }}>
              <Text style={{ color:'#fff', fontSize:11, textAlign:'center', fontWeight:'600' }}>
                🗑️ Clear data
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={s.heroSection}>
          <View style={s.scoreBlock}>
            {todayScore !== null ? (
              <Text style={s.scoreNumber}>{todayScore}</Text>
            ) : (
              <TouchableOpacity onPress={() => setShowCheckIn(true)} activeOpacity={0.8}>
                <Text style={s.scoreNumberEmpty}>–</Text>
                <Text style={s.scoreEmptyHint}>Tap to check in</Text>
              </TouchableOpacity>
            )}
            <View style={s.energyPill}>
              <Text style={s.energyPillText}>
                {todayScore !== null ? scoreLabel.toUpperCase() : 'CHECK IN'}
              </Text>
            </View>
          </View>
          <View style={s.dateBlock}>
            <Text style={s.dateBold}>{dayName},</Text>
            <Text style={s.dateBold}>{dateStr}</Text>
            <Text style={s.dateSubtitle}>
              {todayScore !== null ? scoreLabel : 'Daily score'}
            </Text>
          </View>
        </View>

        <View style={s.nameSection}>
          <View>
            <Text style={s.nameText}>{greeting?.name || 'Sasank'},</Text>
            <Text style={s.cityText}>Hyderabad</Text>
          </View>
          {homeMode === 'astro' && (
            <View style={s.astroInfo}>
              <TouchableOpacity onPress={() => setMainTab('Chart')}>
                <Text style={[s.astroInfoText, s.astroInfoClickable]}>
                  ☀ {astro?.sunSign || 'Gemini'} Sun
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setMainTab('Chart')}>
                <Text style={[s.astroInfoText, s.astroInfoClickable]}>
                  ☽ {astro?.moonSignNatal || 'Pisces'} Moon
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setMainTab('Chart')}>
                <Text style={[s.astroInfoText, s.astroInfoClickable]}>
                  ↑ {astro?.ascendant || 'Leo'} Rising
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {homeMode === 'astro' && (
          <View style={s.astroModeStrip}>
            {[
              { glyph:'☀', sign: astro?.sunSign     || 'Gemini',  label:'SUN'  },
              { glyph:'☽', sign: currentMoonSign,                  label:'MOON' },
              { glyph:'♂', sign: astro?.marsSign    || 'Scorpio', label:'MARS' },
              { glyph:'♃', sign: astro?.jupiterSign || 'Cancer',  label:'JUP'  },
            ].map((p, i, arr) => (
              <React.Fragment key={p.label}>
                <View style={s.astroModePlanet}>
                  <Text style={s.astroModeGlyph}>{p.glyph}</Text>
                  <Text style={s.astroModeSign}>{p.sign.slice(0,3).toUpperCase()}</Text>
                  <Text style={s.astroModeLabel}>{p.label}</Text>
                </View>
                {i < arr.length - 1 && <View style={s.astroModeSep} />}
              </React.Fragment>
            ))}
          </View>
        )}

        {homeMode === 'astro' && (
          <View style={s.transitSection}>
            <Text style={s.sectionLabel}>TODAY'S SKY</Text>
            <View style={s.transitCard}>
              <View style={s.transitCardHead}>
                <View style={[s.transitDot, { backgroundColor: ORANGE }]} />
                <Text style={s.transitTitle}>
                  {planetQuestion.transit.toUpperCase()} · TODAY
                </Text>
              </View>
              <Text style={s.transitBody}>
                {planetQuestion.transit.includes('Pisces')
                  ? 'Emotions run deeper than usual. Lean into intuition over logic today.'
                  : planetQuestion.transit.includes('Aries')
                  ? 'Restless energy in the air — channel it into action before noon.'
                  : `The ${planetQuestion.transit} shapes your mood and decisions today.`}
              </Text>
            </View>
          </View>
        )}

        {homeMode === 'wellness' && todayScore === null && (
          <TouchableOpacity
            style={s.checkInPrompt}
            onPress={() => setShowCheckIn(true)}
            activeOpacity={0.85}>
            <View style={s.checkInPromptLeft}>
              <Text style={s.checkInPromptTitle}>Good morning ✦</Text>
              <Text style={s.checkInPromptSub}>Complete your check-in to unlock today's score</Text>
            </View>
            <Text style={s.checkInPromptArrow}>›</Text>
          </TouchableOpacity>
        )}

        <View style={s.divider} />

        <View style={s.focusSection}>
          <Text style={s.sectionLabel}>TODAY'S FOCUS</Text>
          <Text style={s.focusBold}>{guidance?.focusArea || 'Communication'}</Text>
          <Text style={s.focusLight}>{guidance?.whatTodayMeans?.slice(0, 30) || '& Inner Clarity'}</Text>
          {homeMode === 'astro' && (
            <Text style={s.focusWhy}>
              {planetQuestion.transit} · {astro?.sunSign || 'Gemini'} season
            </Text>
          )}
        </View>

        <View style={s.divider} />

        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={s.tabScroll}
          contentContainerStyle={{ paddingHorizontal:16, paddingVertical:10, gap:8 }}>
          {TABS.map((tab) => (
            <TouchableOpacity key={tab}
              style={[s.tab, activeTab === tab && s.tabActive]}
              onPress={() => setActiveTab(tab)}>
              <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={s.contentPad}>
          {renderTabContent()}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <PremiumModal
        visible={showPremium}
        onClose={() => setShowPremium(false)}
        feature={premiumFeature}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container:               { flex:1, backgroundColor:CREAM },
  loading:                 { flex:1, alignItems:'center', justifyContent:'center', backgroundColor:CREAM },
  planetLayer:             { position:'absolute', top:0, left:0, right:0, bottom:0, zIndex:0, overflow:'hidden' },
  planet:                  { position:'absolute', top:0, left:0 },
  topBar:                  { flexDirection:'row', justifyContent:'space-between', alignItems:'center',
                             paddingHorizontal:20, paddingTop:56, paddingBottom:8 },
  topIcon:                 { width:40, height:40, borderRadius:20, backgroundColor:DARK_CREAM,
                             alignItems:'center', justifyContent:'center' },
  topIconText:             { fontSize:16, color:DARK },
  toggle:                  { flexDirection:'row', backgroundColor:DARK_CREAM,
                             borderRadius:20, padding:4, alignItems:'center' },
  toggleBtn:               { paddingHorizontal:14, paddingVertical:6, borderRadius:16 },
  toggleBtnActiveWellness: { backgroundColor:DARK },
  toggleBtnActiveAstro:    { backgroundColor:'#C1560A' },
  toggleBtnText:           { fontSize:12, color:'#9CA3AF' },
  toggleBtnTextActive:     { color:'#fff', fontWeight:'600' },
  heroSection:             { flexDirection:'row', alignItems:'flex-end',
                             paddingHorizontal:20, paddingBottom:4 },
  scoreBlock:              { flexDirection:'row', alignItems:'flex-end', gap:8 },
  scoreNumber:             { fontSize:96, fontWeight:'900', color:DARK, lineHeight:104 },
  scoreNumberEmpty:        { fontSize:96, fontWeight:'900', color:DARK_CREAM, lineHeight:104 },
  scoreEmptyHint:          { fontSize:11, color:ORANGE, fontWeight:'600',
                             letterSpacing:0.3, marginTop:-8 },
  energyPill:              { backgroundColor:ORANGE, borderRadius:12, paddingHorizontal:8,
                             paddingVertical:4, marginBottom:16, transform:[{rotate:'-90deg'}] },
  energyPillText:          { fontSize:7, color:'#fff', fontWeight:'700', letterSpacing:0.5 },
  dateBlock:               { marginLeft:'auto' as any, alignItems:'flex-end', paddingBottom:12 },
  dateBold:                { fontSize:18, fontWeight:'800', color:DARK },
  dateSubtitle:            { fontSize:12, color:'#9CA3AF', marginTop:2 },
  nameSection:             { flexDirection:'row', justifyContent:'space-between',
                             alignItems:'flex-start', paddingHorizontal:20, paddingBottom:12 },
  nameText:                { fontSize:30, fontWeight:'900', color:DARK },
  cityText:                { fontSize:30, fontWeight:'900', color:ORANGE },
  astroInfo:               { alignItems:'flex-end', gap:3 },
  astroInfoClickable:      { textDecorationLine:'underline', opacity:0.8 },
  astroInfoText:           { fontSize:11, color:'#9CA3AF' },
  astroModeStrip:          { flexDirection:'row', alignItems:'center',
                             justifyContent:'space-around', backgroundColor:'#1A0E06',
                             marginHorizontal:20, marginBottom:10, borderRadius:12,
                             paddingVertical:12, paddingHorizontal:8 },
  astroModePlanet:         { alignItems:'center', gap:2 },
  astroModeGlyph:          { fontSize:18, color:'#F5C87A' },
  astroModeSign:           { fontSize:8, color:'#F5E8D0', letterSpacing:0.5 },
  astroModeLabel:          { fontSize:7, color:'#6A5040', letterSpacing:0.5 },
  astroModeSep:            { width:0.5, height:28, backgroundColor:'#3A2010' },
  transitSection:          { paddingHorizontal:20, paddingBottom:8 },
  transitCard:             { backgroundColor:'#FFF8F0', borderRadius:12, padding:12,
                             borderWidth:0.5, borderColor:'#F0C878', marginTop:8 },
  transitCardHead:         { flexDirection:'row', alignItems:'center', gap:6, marginBottom:6 },
  transitDot:              { width:6, height:6, borderRadius:3 },
  transitTitle:            { fontSize:9, color:ORANGE, fontWeight:'700', letterSpacing:1 },
  transitBody:             { fontSize:12, color:'#3A1A08', lineHeight:18, fontStyle:'italic' },
  checkInPrompt:           { flexDirection:'row', alignItems:'center', backgroundColor:'#FFF8F0',
                             marginHorizontal:20, marginBottom:10, borderRadius:12, padding:14,
                             borderWidth:1, borderColor:ORANGE+'40' },
  checkInPromptLeft:       { flex:1 },
  checkInPromptTitle:      { fontSize:14, fontWeight:'700', color:DARK, marginBottom:2 },
  checkInPromptSub:        { fontSize:11, color:'#9CA3AF' },
  checkInPromptArrow:      { fontSize:20, color:ORANGE },
  divider:                 { height:1, backgroundColor:'#DDD9CF',
                             marginHorizontal:20, marginVertical:8 },
  focusSection:            { paddingHorizontal:20, paddingVertical:12 },
  focusBold:               { fontSize:26, fontWeight:'900', color:DARK, marginTop:4 },
  focusLight:              { fontSize:26, fontWeight:'300', color:'#9CA3AF' },
  focusWhy:                { fontSize:10, color:ORANGE, marginTop:5,
                             fontStyle:'italic', letterSpacing:0.3 },
  tabScroll:               { flexGrow:0, borderBottomWidth:1, borderBottomColor:'#DDD9CF' },
  tab:                     { paddingHorizontal:14, paddingVertical:8, borderBottomWidth:2.5,
                             borderBottomColor:'transparent', marginBottom:-1 },
  tabActive:               { borderBottomColor:ORANGE },
  tabText:                 { fontSize:13, color:'#9CA3AF', fontWeight:'500' },
  tabTextActive:           { color:ORANGE, fontWeight:'700' },
  contentPad:              { paddingHorizontal:16, paddingTop:12 },
  sectionLabel:            { fontSize:10, color:'#9CA3AF', fontWeight:'700',
                             letterSpacing:0.8, marginBottom:10, marginTop:4 },
  blueprintRow:            { flexDirection:'row', gap:10, marginBottom:4 },
  blueprintCard:           { flex:1, borderRadius:20, padding:14, minHeight:120 },
  blueprintCardCream:      { backgroundColor:DARK_CREAM },
  blueprintCardOrange:     { backgroundColor:ORANGE },
  blueprintCardIcon:       { fontSize:20, marginBottom:8 },
  blueprintCardTitle:      { fontSize:15, fontWeight:'900', marginBottom:4 },
  blueprintCardText:       { fontSize:12, lineHeight:17 },
  blueprintTags:           { flexDirection:'row', flexWrap:'wrap', gap:4, marginTop:8 },
  blueprintTag:            { paddingHorizontal:8, paddingVertical:3,
                             borderRadius:10, borderWidth:1 },
  blueprintTagText:        { fontSize:10, fontWeight:'500' },
  blueprintArrow:          { fontSize:16, fontWeight:'600', marginTop:8, textAlign:'right' },
  mainCard:                { backgroundColor:'#fff', borderRadius:20, padding:18,
                             marginBottom:12, shadowColor:'#000',
                             shadowOffset:{width:0,height:2}, shadowOpacity:0.04,
                             shadowRadius:8, elevation:2 },
  cardTitle:               { fontSize:20, fontWeight:'800', color:DARK, marginBottom:8 },
  bodyText:                { fontSize:13, color:'#6B7280', lineHeight:20 },
  bodyBtn:                 { flexDirection:'row', alignItems:'center', backgroundColor:'#fff',
                             borderRadius:14, padding:14, marginBottom:4,
                             borderWidth:0.5, borderColor:'#E0D8CC' },
  bodyBtnLeft:             { flexDirection:'row', alignItems:'center', gap:12, flex:1 },
  bodyBtnEmoji:            { fontSize:24 },
  bodyBtnTitle:            { fontSize:13, fontWeight:'600', color:DARK, marginBottom:2 },
  bodyBtnSub:              { fontSize:11, color:'#9A8060' },
  bodyBtnArrow:            { fontSize:18, color:ORANGE },
  moodRow:                 { flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:12 },
  moodChip:                { paddingHorizontal:14, paddingVertical:7, borderRadius:20,
                             backgroundColor:DARK_CREAM, borderWidth:1, borderColor:DARK_CREAM },
  moodText:                { fontSize:12, color:'#6B7280' },
  moodCard:                { backgroundColor:'#FFF3E0', borderRadius:16, padding:14,
                             marginBottom:16, borderWidth:1, borderColor:ORANGE+'40' },
  moodCardTop:             { flexDirection:'row', alignItems:'center', gap:8, marginBottom:6 },
  taraAvatar:              { width:28, height:28, borderRadius:14, backgroundColor:DARK,
                             alignItems:'center', justifyContent:'center' },
  taraAvatarText:          { fontSize:12, color:'#fff' },
  taraLabel:               { fontSize:11, color:ORANGE, fontWeight:'600' },
  moodCardText:            { fontSize:12, color:'#374151', lineHeight:18 },
  supportBtn:              { marginTop:10, backgroundColor:ORANGE, borderRadius:10,
                             padding:10, alignItems:'center' },
  supportBtnText:          { fontSize:11, color:'#fff', fontWeight:'600' },
  qqCard:                  { backgroundColor:'#fff', borderRadius:14, padding:14,
                             marginBottom:8, flexDirection:'row',
                             justifyContent:'space-between', alignItems:'center',
                             shadowColor:'#000', shadowOffset:{width:0,height:1},
                             shadowOpacity:0.04, shadowRadius:4, elevation:1 },
  qqText:                  { fontSize:13, color:DARK, flex:1 },
  qqArrow:                 { fontSize:18, color:ORANGE },
  insightCard:             { flexDirection:'row', gap:12, paddingBottom:14,
                             marginBottom:14, borderBottomWidth:0.5,
                             borderBottomColor:'#DDD9CF' },
  insightDot:              { width:8, height:8, borderRadius:4, marginTop:4, flexShrink:0 },
  insightBody:             { flex:1 },
  insightTitle:            { fontSize:14, color:DARK, marginBottom:4, fontWeight:'500' },
  insightText:             { fontSize:12, color:'#6B7280', lineHeight:18 },
  primaryBtn:              { backgroundColor:DARK, borderRadius:14, padding:14,
                             alignItems:'center', marginTop:8 },
  primaryBtnText:          { color:'#fff', fontSize:13, fontWeight:'600' },
});