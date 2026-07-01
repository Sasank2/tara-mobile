import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Dimensions, Modal, StatusBar, Platform,
  Animated,
} from 'react-native';
import Svg, { Circle, Line, G, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { chartAPI, taraAPI } from '../services/api';
import { COLORS } from '../constants';

const { width: SW, height: SH } = Dimensions.get('window');
const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';

const SIGN_GLYPHS_LIST = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
const SIGN_NAMES_LIST  = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo',
                           'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];

const DEFAULT_PLANETS = [
  { name: 'Sun',     glyph: '⊙', eclipticDeg: 68,  house: 10, meaning: 'Your core identity — curious, communicative, drawn to duality.' },
  { name: 'Moon',    glyph: '☽', eclipticDeg: 218, house: 2,  meaning: 'Your emotional world — you need stability and sensory comfort to feel safe.' },
  { name: 'Mercury', glyph: '☿', eclipticDeg: 52,  house: 9,  meaning: 'How you think and communicate — quick, witty, full of ideas.' },
  { name: 'Venus',   glyph: '♀', eclipticDeg: 92,  house: 11, meaning: 'What you love — you seek emotional depth and loyal connection.' },
  { name: 'Mars',    glyph: '♂', eclipticDeg: 84,  house: 10, meaning: 'How you act — focused, strategic, built for the long game.' },
  { name: 'Jupiter', glyph: '♃', eclipticDeg: 41,  house: 8,  meaning: 'Where you grow — through transformation, depth, and shared resources.' },
  { name: 'Saturn',  glyph: '♄', eclipticDeg: 304, house: 5,  meaning: 'Your greatest teacher — discipline and structure unlock your creativity.' },
  { name: 'Uranus',  glyph: '⛢', eclipticDeg: 255, house: 4,  meaning: 'Where you break free — revolutionizing your foundations and roots.' },
  { name: 'Neptune', glyph: '♆', eclipticDeg: 78,  house: 10, meaning: 'Your spiritual longings — dissolving ego through compassion and art.' },
  { name: 'Pluto',   glyph: '♇', eclipticDeg: 192, house: 1,  meaning: 'Where you transform — your generation rewrites power and identity.' },
  { name: 'ASC',     glyph: '↑', eclipticDeg: 28,  house: 1,  meaning: 'Your rising sign — the mask you wear and how others first see you.' },
  { name: 'MC',      glyph: '↑', eclipticDeg: 298, house: 10, meaning: 'Your midheaven — your public role, career, and highest ambitions.' },
];

const ASPECTS = [
  { a: 0, b: 2, type: 'conjunction' }, { a: 0, b: 3, type: 'trine'      },
  { a: 0, b: 5, type: 'trine'      }, { a: 0, b: 6, type: 'opposition'  },
  { a: 1, b: 6, type: 'square'     }, { a: 1, b: 3, type: 'sextile'     },
  { a: 2, b: 4, type: 'conjunction'}, { a: 3, b: 5, type: 'trine'       },
  { a: 0, b: 7, type: 'square'     }, { a: 2, b: 6, type: 'opposition'  },
  { a: 4, b: 6, type: 'opposition' }, { a: 5, b: 7, type: 'sextile'     },
];

const ASPECT_STYLE: Record<string, { stroke: string; activeStroke: string; dash: string; width: number }> = {
  conjunction: { stroke: 'rgba(0,0,0,0.12)', activeStroke: 'rgba(20,10,0,0.75)',  dash: '',    width: 0.8 },
  opposition:  { stroke: 'rgba(0,0,0,0.10)', activeStroke: 'rgba(20,10,0,0.65)',  dash: '4 3', width: 0.7 },
  trine:       { stroke: 'rgba(0,0,0,0.10)', activeStroke: 'rgba(193,86,10,0.7)', dash: '',    width: 0.7 },
  square:      { stroke: 'rgba(0,0,0,0.10)', activeStroke: 'rgba(193,86,10,0.6)', dash: '3 3', width: 0.6 },
  sextile:     { stroke: 'rgba(0,0,0,0.08)', activeStroke: 'rgba(20,10,0,0.45)',  dash: '2 4', width: 0.6 },
};

const CARD_PALETTES = [
  { color: COLORS.purple, borderColor: '#CEC8F4', bgColor: '#FAFAFE' },
  { color: '#1D9E75',     borderColor: '#9FE1CB', bgColor: '#F8FFFE' },
  { color: '#BA7517',     borderColor: '#FAC775', bgColor: '#FFFBF5' },
  { color: '#D4537E',     borderColor: '#F4C0D1', bgColor: '#FFF8FA' },
];

interface BlueprintCard {
  title: string;
  emoji: string;
  body: string;
  color: string;
  borderColor: string;
  bgColor: string;
}

function toRad(d: number) { return (d * Math.PI) / 180; }
function pX(cx: number, r: number, deg: number) { return cx + r * Math.cos(toRad(deg - 90)); }
function pY(cy: number, r: number, deg: number) { return cy + r * Math.sin(toRad(deg - 90)); }
function signToName(deg: number) { return SIGN_NAMES_LIST[Math.floor(((deg % 360) + 360) % 360 / 30)]; }

// ─── Natal Wheel ──────────────────────────────────────────────────────────────
function NatalWheel({ size, planets, activePlanet, ascDeg = 28, onPlanetPress }: {
  size: number; planets: typeof DEFAULT_PLANETS;
  activePlanet: number | null; ascDeg?: number;
  onPlanetPress?: (i: number) => void;
}) {
  const cx = size / 2, cy = size / 2, s = size / 320;
  const R1 = size/2-1*s, R2 = size/2-20*s, R3 = size/2-44*s, R4 = size/2-68*s;
  const R5 = size/2-100*s, R6 = size/2-118*s, R7 = size/2-148*s, RC = 12*s;

  function eclToWheel(deg: number) { return (deg + (180 - ascDeg) + 360) % 360; }
  const angles = planets.map(p => eclToWheel(p.eclipticDeg));
  const activeAspIdxs = activePlanet !== null
    ? ASPECTS.map((a, i) => (a.a === activePlanet || a.b === activePlanet) ? i : -1).filter(i => i >= 0)
    : null;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={cx} cy={cy} r={R1} fill="#FAF7F2" />
      {Array.from({ length: 360 }).map((_, i) => {
        const deg = eclToWheel(i);
        const isMajor = i % 10 === 0, isMid = i % 5 === 0;
        const inner = isMajor ? R2+5*s : isMid ? R2+2.5*s : R2;
        return <Line key={'tk'+i} x1={pX(cx,R1-1,deg)} y1={pY(cy,R1-1,deg)} x2={pX(cx,inner,deg)} y2={pY(cy,inner,deg)}
          stroke={isMajor?'rgba(0,0,0,0.45)':'rgba(0,0,0,0.2)'} strokeWidth={isMajor?0.7:0.4} />;
      })}
      <Circle cx={cx} cy={cy} r={R1} fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth={0.8} />
      <Circle cx={cx} cy={cy} r={R2} fill="none" stroke="rgba(0,0,0,0.3)"  strokeWidth={0.5} />
      <Circle cx={cx} cy={cy} r={R3} fill="none" stroke="rgba(0,0,0,0.3)"  strokeWidth={0.5} />
      <Circle cx={cx} cy={cy} r={R4} fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth={0.5} />
      <Circle cx={cx} cy={cy} r={R5} fill="none" stroke="rgba(0,0,0,0.2)"  strokeWidth={0.4} />
      <Circle cx={cx} cy={cy} r={R6} fill="none" stroke="rgba(0,0,0,0.3)"  strokeWidth={0.6} />
      <Circle cx={cx} cy={cy} r={R7} fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth={0.4} />
      {Array.from({ length: 12 }).map((_, i) => {
        const deg = eclToWheel(i * 30);
        return <Line key={'sd'+i} x1={pX(cx,R2,deg)} y1={pY(cy,R2,deg)} x2={pX(cx,R5,deg)} y2={pY(cy,R5,deg)}
          stroke="rgba(0,0,0,0.3)" strokeWidth={0.5} />;
      })}
      {SIGN_GLYPHS_LIST.map((glyph, i) => {
        const mid = eclToWheel(i*30+15), r = (R3+R4)/2;
        return <SvgText key={'sg'+i} x={pX(cx,r,mid)} y={pY(cy,r,mid)+4*s}
          textAnchor="middle" fontSize={12*s} fill="rgba(0,0,0,0.75)">{glyph}</SvgText>;
      })}
      {Array.from({ length: 12 }).map((_, i) => {
        const deg = eclToWheel(i * 30);
        return <Line key={'hl'+i} x1={pX(cx,R5,deg)} y1={pY(cy,R5,deg)} x2={pX(cx,RC+2,deg)} y2={pY(cy,RC+2,deg)}
          stroke="rgba(0,0,0,0.18)" strokeWidth={0.5} />;
      })}
      {Array.from({ length: 12 }).map((_, i) => {
        const mid = eclToWheel(i*30+15), r = (R5+R6)/2+4*s;
        return <SvgText key={'hn'+i} x={pX(cx,r,mid)} y={pY(cy,r,mid)+3*s}
          textAnchor="middle" fontSize={8*s} fill="rgba(0,0,0,0.35)" fontWeight="300">{i+1}</SvgText>;
      })}
      <Line x1={pX(cx,R5,180)} y1={pY(cy,R5,180)} x2={pX(cx,R5,0)}  y2={pY(cy,R5,0)}  stroke="rgba(0,0,0,0.4)" strokeWidth={0.8} />
      <Line x1={pX(cx,R5,270)} y1={pY(cy,R5,270)} x2={pX(cx,R5,90)} y2={pY(cy,R5,90)} stroke="rgba(0,0,0,0.4)" strokeWidth={0.8} />
      {[{label:'AC',deg:180},{label:'DC',deg:0},{label:'MC',deg:270},{label:'IC',deg:90}].map(ax => (
        <SvgText key={ax.label} x={pX(cx,R4+6*s,ax.deg)} y={pY(cy,R4+6*s,ax.deg)+3*s}
          textAnchor="middle" fontSize={7*s} fill="rgba(0,0,0,0.6)" fontWeight="600" letterSpacing={0.5}>
          {ax.label}
        </SvgText>
      ))}
      {ASPECTS.map((asp, i) => {
        const isActive = activeAspIdxs === null || activeAspIdxs.includes(i);
        const style = ASPECT_STYLE[asp.type];
        return <Line key={'asp'+i}
          x1={pX(cx,R7,angles[asp.a])} y1={pY(cy,R7,angles[asp.a])}
          x2={pX(cx,R7,angles[asp.b])} y2={pY(cy,R7,angles[asp.b])}
          stroke={isActive ? style.activeStroke : style.stroke}
          strokeWidth={(isActive ? style.width*1.2 : style.width*0.7)*s}
          strokeDasharray={style.dash} />;
      })}
      {planets.map((p, i) => {
        if (p.name === 'MC') return null;
        const angle = angles[i], isActive = activePlanet === i;
        const isFaded = activePlanet !== null && !isActive, r = (R4+R5)/2;
        return (
          <G key={p.name} onPress={() => onPlanetPress?.(i)}>
            {isActive && <Circle cx={pX(cx,r,angle)} cy={pY(cy,r,angle)} r={9*s} fill="rgba(193,86,10,0.12)" />}
            <Line x1={pX(cx,R4,angle)} y1={pY(cy,R4,angle)} x2={pX(cx,R4+5*s,angle)} y2={pY(cy,R4+5*s,angle)}
              stroke={isActive?'#C1560A':'rgba(0,0,0,0.4)'} strokeWidth={isActive?1.2:0.7} />
            <SvgText x={pX(cx,r,angle)} y={pY(cy,r,angle)+4*s} textAnchor="middle" fontSize={11*s}
              fill={isActive?'#C1560A':isFaded?'rgba(0,0,0,0.15)':'rgba(0,0,0,0.8)'}
              fontWeight={isActive?'700':'400'}>{p.glyph}</SvgText>
          </G>
        );
      })}
      <Circle cx={cx} cy={cy} r={RC} fill="#FAF7F2" stroke="rgba(0,0,0,0.2)" strokeWidth={0.5} />
      <Circle cx={cx} cy={cy} r={3*s} fill="rgba(0,0,0,0.4)" />
    </Svg>
  );
}

// ─── Big 3 ────────────────────────────────────────────────────────────────────
function Big3Header({ sunSign, moonSign, rising }: { sunSign: string; moonSign: string; rising: string }) {
  const glyph = (s: string) => SIGN_GLYPHS_LIST[SIGN_NAMES_LIST.findIndex(n => n.toLowerCase() === s?.toLowerCase())] || '♊';
  return (
    <View style={b3.row}>
      {[{label:'SUN',sign:sunSign||'Gemini'},{label:'MOON',sign:moonSign||'Taurus'},{label:'RISING',sign:rising||'Scorpio'}]
        .map((item, i, arr) => (
          <React.Fragment key={item.label}>
            <View style={b3.col}>
              <View style={b3.circle}><Text style={b3.glyph}>{glyph(item.sign)}</Text></View>
              <Text style={b3.label}>{item.label}</Text>
              <Text style={b3.sign}>{item.sign}</Text>
            </View>
            {i < arr.length-1 && <View style={b3.divider} />}
          </React.Fragment>
        ))}
    </View>
  );
}

const b3 = StyleSheet.create({
  row:    { flexDirection:'row', backgroundColor:'#FAF7F2', borderBottomWidth:1, borderBottomColor:'#E0D8CC' },
  col:    { flex:1, alignItems:'center', paddingVertical:14, gap:3 },
  divider:{ width:0.5, backgroundColor:'#E0D8CC', marginVertical:12 },
  circle: { width:42, height:42, borderRadius:21, backgroundColor:'#EDE8E0', alignItems:'center', justifyContent:'center', marginBottom:2 },
  glyph:  { fontSize:20, color:'#2A1A0A' },
  label:  { fontSize:8, color:'#9A8060', letterSpacing:1.5, fontWeight:'600' },
  sign:   { fontSize:14, color:'#1A0E06', fontFamily:SERIF },
});

// ─── Premium Paywall Modal ────────────────────────────────────────────────────
function PremiumModal({ visible, onClose, cardTitle }: {
  visible: boolean; onClose: () => void; cardTitle: string;
}) {
  const PLANS = [
    { id: 'monthly', label: 'Monthly',  price: '₹399', sub: 'per month',      badge: '' },
    { id: 'yearly',  label: 'Yearly',   price: '₹2,999', sub: '₹250/month',   badge: 'BEST VALUE' },
    { id: 'lifetime',label: 'Lifetime', price: '₹4,999', sub: 'one time',      badge: '' },
  ];
  const [selected, setSelected] = useState('yearly');

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={pm.overlay}>
        <View style={pm.sheet}>
          {/* Handle */}
          <View style={pm.handle} />

          {/* Close */}
          <TouchableOpacity style={pm.closeBtn} onPress={onClose}>
            <Text style={pm.closeText}>✕</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={pm.headerWrap}>
            <View style={pm.starRow}>
              {['✦','✦','✦'].map((s,i) => (
                <Text key={i} style={[pm.star, {opacity: 0.4 + i*0.3}]}>{s}</Text>
              ))}
            </View>
            <Text style={pm.title}>Unlock Your Full Reading</Text>
            <Text style={pm.sub}>
              Get Tara's complete insight on{'\n'}
              <Text style={pm.subBold}>{cardTitle}</Text>
              {' '}and your entire natal chart
            </Text>
          </View>

          {/* What you get */}
          <View style={pm.perksWrap}>
            {[
              { icon: '📖', text: 'Deep-dive reading for all 4 chart themes' },
              { icon: '🪐', text: 'Full planetary breakdown — all 10 planets' },
              { icon: '✦',  text: 'Daily letter from Tara based on transits' },
              { icon: '💬', text: 'Unlimited questions to Tara' },
              { icon: '🔮', text: 'Vedic Dasha timeline + predictions' },
            ].map((perk, i) => (
              <View key={i} style={pm.perkRow}>
                <Text style={pm.perkIcon}>{perk.icon}</Text>
                <Text style={pm.perkText}>{perk.text}</Text>
              </View>
            ))}
          </View>

          {/* Plans */}
          <View style={pm.plansRow}>
            {PLANS.map(plan => (
              <TouchableOpacity key={plan.id}
                style={[pm.planCard, selected === plan.id && pm.planCardActive]}
                onPress={() => setSelected(plan.id)}>
                {plan.badge ? (
                  <View style={pm.badge}><Text style={pm.badgeText}>{plan.badge}</Text></View>
                ) : <View style={pm.badgePlaceholder} />}
                <Text style={[pm.planLabel, selected === plan.id && pm.planLabelActive]}>
                  {plan.label}
                </Text>
                <Text style={[pm.planPrice, selected === plan.id && pm.planPriceActive]}>
                  {plan.price}
                </Text>
                <Text style={[pm.planSub, selected === plan.id && pm.planSubActive]}>
                  {plan.sub}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* CTA */}
          <TouchableOpacity style={pm.cta} onPress={onClose}>
            <Text style={pm.ctaText}>
              UNLOCK {PLANS.find(p => p.id === selected)?.label?.toUpperCase()} · {PLANS.find(p => p.id === selected)?.price}
            </Text>
          </TouchableOpacity>

          <Text style={pm.fine}>
            Cancel anytime · Renews automatically · Secure payment
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const pm = StyleSheet.create({
  overlay:          { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'flex-end' },
  sheet:            { backgroundColor:'#FAF7F2', borderTopLeftRadius:24, borderTopRightRadius:24,
                      paddingBottom:36, paddingHorizontal:20 },
  handle:           { width:36, height:4, backgroundColor:'#D8CEC0', borderRadius:2,
                      alignSelf:'center', marginTop:10, marginBottom:8 },
  closeBtn:         { position:'absolute', top:16, right:20, width:30, height:30,
                      borderRadius:15, backgroundColor:'#EDE8E0',
                      alignItems:'center', justifyContent:'center', zIndex:10 },
  closeText:        { fontSize:12, color:'#5A4030', fontWeight:'600' },
  headerWrap:       { alignItems:'center', paddingTop:8, paddingBottom:16 },
  starRow:          { flexDirection:'row', gap:8, marginBottom:8 },
  star:             { fontSize:16, color:'#C1560A' },
  title:            { fontSize:22, fontWeight:'700', color:'#1A0E06',
                      fontFamily:SERIF, textAlign:'center', marginBottom:6 },
  sub:              { fontSize:13, color:'#9A8060', textAlign:'center', lineHeight:20 },
  subBold:          { color:'#C1560A', fontWeight:'600' },
  perksWrap:        { backgroundColor:'#FFF8F0', borderRadius:14,
                      padding:14, marginBottom:16, gap:8 },
  perkRow:          { flexDirection:'row', alignItems:'center', gap:10 },
  perkIcon:         { fontSize:15, width:24 },
  perkText:         { fontSize:13, color:'#3A1A08', lineHeight:18, flex:1 },
  plansRow:         { flexDirection:'row', gap:8, marginBottom:16 },
  planCard:         { flex:1, backgroundColor:'#EDE8E0', borderRadius:14,
                      padding:10, alignItems:'center', borderWidth:1.5,
                      borderColor:'transparent', gap:2 },
  planCardActive:   { backgroundColor:'#FFF3E0', borderColor:'#C1560A' },
  badge:            { backgroundColor:'#C1560A', borderRadius:6,
                      paddingHorizontal:6, paddingVertical:2, marginBottom:2 },
  badgePlaceholder: { height:18, marginBottom:2 },
  badgeText:        { fontSize:7, color:'#fff', fontWeight:'700', letterSpacing:0.5 },
  planLabel:        { fontSize:11, color:'#9A8060', fontWeight:'600', letterSpacing:0.5 },
  planLabelActive:  { color:'#C1560A' },
  planPrice:        { fontSize:16, fontWeight:'700', color:'#1A0E06' },
  planPriceActive:  { color:'#C1560A' },
  planSub:          { fontSize:9, color:'#9A8060' },
  planSubActive:    { color:'#C1560A' },
  cta:              { backgroundColor:'#C1560A', borderRadius:22,
                      paddingVertical:15, alignItems:'center', marginBottom:10 },
  ctaText:          { fontSize:13, color:'#fff', fontWeight:'700', letterSpacing:1 },
  fine:             { fontSize:10, color:'#B8A890', textAlign:'center', letterSpacing:0.3 },
});

// ─── Blueprint Card (with fade + premium lock) ────────────────────────────────
function BlueprintCard({ card, index, isPremium, onUnlock }: {
  card: BlueprintCard; index: number;
  isPremium: boolean; onUnlock: (title: string) => void;
}) {
  const isFreeCard = index === 0;
  const isLocked   = !isPremium && !isFreeCard;
  const teaser     = card.body.slice(0, 120);

  return (
    <View style={[bpc.card, {
      borderLeftColor:   card.color,
      borderTopColor:    card.borderColor,
      borderRightColor:  card.borderColor,
      borderBottomColor: card.borderColor,
      backgroundColor:   card.bgColor,
    }]}>

      {/* Header */}
      <View style={bpc.cardHeader}>
        <Text style={[bpc.cardTitle, { color: card.color }]}>
          {card.emoji}  {card.title}
        </Text>
        {isLocked && (
          <View style={[bpc.lockBadge, {
            backgroundColor: card.color + '18',
            borderColor: card.color + '40',
          }]}>
            <Text style={[bpc.lockBadgeText, { color: card.color }]}>🔒 Premium</Text>
          </View>
        )}
        {isFreeCard && (
          <View style={bpc.freeBadge}>
            <Text style={bpc.freeBadgeText}>FREE</Text>
          </View>
        )}
      </View>

      {/* Body */}
      <View style={bpc.bodyWrap}>
        <Text style={[
          bpc.body,
          isFreeCard && bpc.bodyElaborate,
          isLocked && bpc.bodyLocked,
        ]}>
          {isLocked ? teaser + '...' : card.body}
        </Text>
        {isLocked && (
          <View style={[bpc.fadeOverlay, { backgroundColor: card.bgColor }]} />
        )}
      </View>

      {/* Free card CTA — nudge toward premium */}
      {isFreeCard && !isPremium && (
        <TouchableOpacity
          style={[bpc.nudgeBtn, { borderColor: card.color + '60' }]}
          onPress={() => onUnlock('your full reading')}>
          <Text style={[bpc.nudgeBtnText, { color: card.color }]}>
            ✦  Read your emotional world, superpower & shadow →
          </Text>
        </TouchableOpacity>
      )}

      {/* Locked card unlock button */}
      {isLocked && (
        <TouchableOpacity
          style={[bpc.unlockBtn, { borderColor: card.color }]}
          onPress={() => onUnlock(card.title)}>
          <Text style={[bpc.unlockBtnText, { color: card.color }]}>
            Read full {card.title.toLowerCase()} ›
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const bpc = StyleSheet.create({
  card:           { borderRadius:12, padding:16, marginBottom:10,
                    borderLeftWidth:3, borderTopWidth:0.5,
                    borderRightWidth:0.5, borderBottomWidth:0.5 },
  cardHeader:     { flexDirection:'row', justifyContent:'space-between',
                    alignItems:'center', marginBottom:10 },
  cardTitle:      { fontSize:14, fontWeight:'500' },

  freeBadge:      { backgroundColor:'#E8F5EE', borderRadius:8,
                    paddingHorizontal:7, paddingVertical:3,
                    borderWidth:0.5, borderColor:'#9FE1CB' },
  freeBadgeText:  { fontSize:9, color:'#0F6E56', fontWeight:'700', letterSpacing:0.5 },

  lockBadge:      { flexDirection:'row', alignItems:'center', borderRadius:8,
                    paddingHorizontal:7, paddingVertical:3, borderWidth:0.5 },
  lockBadgeText:  { fontSize:9, fontWeight:'600', letterSpacing:0.3 },

  bodyWrap:       { position:'relative' },
  body:           { fontSize:13, lineHeight:21, fontFamily:SERIF,
                    fontStyle:'italic', color:'#3A2010' },
  bodyElaborate:  { fontSize:14, lineHeight:24 },   // larger for free card
  bodyLocked:     { color:'rgba(58,32,16,0.45)' },
  fadeOverlay:    { position:'absolute', bottom:0, left:0, right:0,
                    height:36, opacity:0.92 },

  nudgeBtn:       { marginTop:14, paddingVertical:10, paddingHorizontal:14,
                    borderRadius:10, borderWidth:1, backgroundColor:'rgba(255,255,255,0.6)' },
  nudgeBtnText:   { fontSize:12, fontWeight:'500', letterSpacing:0.2, lineHeight:18 },

  unlockBtn:      { marginTop:10, paddingVertical:8, paddingHorizontal:12,
                    borderRadius:10, borderWidth:1, alignSelf:'flex-start' },
  unlockBtnText:  { fontSize:11, fontWeight:'600', letterSpacing:0.3 },
});

// ─── Blueprint Section ────────────────────────────────────────────────────────
function BlueprintSection({ cards, loading, isPremium, onUnlock }: {
  cards: BlueprintCard[] | null; loading: boolean;
  isPremium: boolean; onUnlock: (title: string) => void;
}) {
  if (loading) {
    return (
      <View style={bps.loadingWrap}>
        <ActivityIndicator color="#C1560A" size="small" />
        <Text style={bps.loadingText}>Tara is reading your chart...</Text>
      </View>
    );
  }
  if (!cards) return null;
  return (
    <View style={bps.wrap}>
      {cards.map((card, i) => (
        <BlueprintCard
          key={i} card={card} index={i}
          isPremium={isPremium} onUnlock={onUnlock}
        />
      ))}
    </View>
  );
}

const bps = StyleSheet.create({
  loadingWrap: { alignItems:'center', paddingVertical:24, gap:10 },
  loadingText: { fontSize:12, color:'#9A8060', fontStyle:'italic', fontFamily:SERIF },
  wrap:        { paddingHorizontal:18, paddingBottom:8 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ChartScreen({ navigation }: any) {
  const [mode, setMode]                 = useState<'astral' | 'vedic'>('astral');
  const [westernData, setWesternData]   = useState<any>(null);
  const [vedicData, setVedicData]       = useState<any>(null);
  const [loading, setLoading]           = useState(true);
  const [planets, setPlanets]           = useState(DEFAULT_PLANETS);
  const [activePlanet, setActivePlanet] = useState<number | null>(null);
  const [fullscreen, setFullscreen]     = useState(false);
  const [blueprintCards, setBlueprintCards] = useState<BlueprintCard[] | null>(null);
  const [blueprintLoading, setBlueprintLoading] = useState(false);
  const [showPaywall, setShowPaywall]   = useState(false);
  const [paywallCard, setPaywallCard]   = useState('');
  const [isPremium, setIsPremium]       = useState(false); // hook up to your auth/subscription

  useEffect(() => { loadChart(); }, []);

  const loadChart = async () => {
    try {
      const [w, v] = await Promise.all([
        chartAPI.getWesternChart(),
        chartAPI.getVedicChart(),
      ]);
      setWesternData(w.data.data);
      setVedicData(v.data.data);
      const d = w.data.data;
      if (d?.planets?.length) {
        setPlanets(d.planets.map((p: any) => ({
          name:        p.name,
          glyph:       p.glyph || DEFAULT_PLANETS.find(dp => dp.name === p.name)?.glyph || '●',
          eclipticDeg: p.longitude || p.degree || DEFAULT_PLANETS.find(dp => dp.name === p.name)?.eclipticDeg || 0,
          house:       p.house || 1,
          meaning:     DEFAULT_PLANETS.find(dp => dp.name === p.name)?.meaning || '',
        })));
      }
      generateBlueprint(d);
    } catch (e) {
      console.log('Chart error', e);
      generateBlueprint(null);
    } finally {
      setLoading(false);
    }
  };

  const generateBlueprint = async (chart: any) => {
  setBlueprintLoading(true);
  try {
    const prompt = `You are Tara, a warm astrology guide. Based on this birth chart, write exactly 4 personal insight cards.
Respond ONLY with a raw JSON array — no markdown, no backticks, no extra text.

Each object has: title (2-4 words), emoji (one), body (string)

IMPORTANT RULES:
- Card 1 "Core identity": Write 4-5 sentences. This is the FREE card shown in full. Make it deeply personal, specific to their actual Sun/Moon/Rising combination. Reference how these three interact with each other. Make it so good they want to read the rest.
- Cards 2, 3, 4: Write 3 sentences each. These are locked behind premium.
- Never use the words "energy", "universe", "vibe", "journey"
- Always reference actual planet names and signs
- Warm, poetic, intimate tone — like a wise friend who knows astrology

Chart data:
Sun in ${chart?.sunSign || 'Gemini'} (House ${chart?.sunHouse || '10'})
Moon in ${chart?.moonSign || 'Taurus'} (House ${chart?.moonHouse || '2'})
Rising ${chart?.ascendant || 'Scorpio'}
Mercury in ${chart?.mercurySign || 'Gemini'}
Venus in ${chart?.venusSign || 'Cancer'}
Mars in ${chart?.marsSign || 'Capricorn'}
Jupiter in ${chart?.jupiterSign || 'Pisces'}
Saturn in ${chart?.saturnSign || 'Sagittarius'}

Cards to write:
1. title: "Core identity", emoji: "✦" — elaborate, 4-5 sentences, Sun/Moon/Rising interaction
2. title: "Emotional world", emoji: "🌙" — Moon sign depth, 3 sentences  
3. title: "Your superpower", emoji: "⚡" — Jupiter/Venus/strongest placement, 3 sentences
4. title: "Your shadow", emoji: "🪐" — Saturn/Mars/challenge, 3 sentences`;

    const res   = await taraAPI.chat({ question: prompt });
    const raw   = res.data?.data?.shortAnswer || res.data?.data;
    const text  = typeof raw === 'string' ? raw : JSON.stringify(raw);
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed: { title: string; emoji: string; body: string }[] = JSON.parse(clean);
    setBlueprintCards(parsed.slice(0,4).map((c,i) => ({ ...c, ...CARD_PALETTES[i%CARD_PALETTES.length] })));
  } catch {
    const c = chart;
    setBlueprintCards([
      {
        title: 'Core identity', emoji: '✦',
        body: `You are a ${c?.sunSign||'Gemini'} Sun, ${c?.moonSign||'Taurus'} Moon, ${c?.ascendant||'Scorpio'} Rising — and that combination is rarer and more complex than it sounds. Your ${c?.sunSign||'Gemini'} Sun wants to stay curious, keep moving, collect experiences like stamps in a passport. But your ${c?.moonSign||'Taurus'} Moon quietly resists — it wants to root somewhere, build something solid, feel the weight of continuity. Your ${c?.ascendant||'Scorpio'} Rising means the world first meets your intensity before it meets your warmth. You are not what people expect when they get to know you — and that surprise is one of your greatest gifts.`,
        ...CARD_PALETTES[0],
      },
      {
        title: 'Emotional world', emoji: '🌙',
        body: `Your ${c?.moonSign||'Taurus'} Moon needs beauty, stillness, and physical comfort to feel emotionally safe. You don't process feelings quickly — you need time to sit with them, like letting bread rise. Disruption doesn't just inconvenience you; it destabilises something deep.`,
        ...CARD_PALETTES[1],
      },
      {
        title: 'Your superpower', emoji: '⚡',
        body: `Jupiter in ${c?.jupiterSign||'Pisces'} makes you almost eerily perceptive — you read between the lines of what people say without trying. Your Venus in ${c?.venusSign||'Cancer'} means people feel held by you before you've said a word. You expand others just by being present.`,
        ...CARD_PALETTES[2],
      },
      {
        title: 'Your shadow', emoji: '🪐',
        body: `Saturn in ${c?.saturnSign||'Sagittarius'} asks you to earn your convictions — not inherit them. Mars in ${c?.marsSign||'Capricorn'} gives you immense drive but makes rest feel like failure. Your deepest growth comes when you learn that slowing down is not the same as stopping.`,
        ...CARD_PALETTES[3],
      },
    ]);
  } finally {
    setBlueprintLoading(false);
  }
};

  const handleUnlock = (cardTitle: string) => {
    setPaywallCard(cardTitle);
    setShowPaywall(true);
  };

  if (loading) {
    return <View style={st.loading}><ActivityIndicator color={COLORS.purple} size="large" /></View>;
  }

  const isVedic = mode === 'vedic';
  const CSIZE   = SW - 32;
  const FS_SIZE = Math.min(SH - 200, SW - 16);
  const active  = activePlanet !== null ? planets[activePlanet] : null;
  const ascDeg  = planets.find(p => p.name === 'ASC')?.eclipticDeg ?? 28;

  const activeAspectLabels = activePlanet !== null
    ? [...new Set(ASPECTS
        .filter(a => a.a === activePlanet || a.b === activePlanet)
        .map(a => a.type.charAt(0).toUpperCase() + a.type.slice(1)))]
    : [];

  return (
    <>
      {/* Premium Paywall */}
      <PremiumModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        cardTitle={paywallCard}
      />

      {/* Fullscreen chart modal */}
      <Modal visible={fullscreen} animationType="fade"
        statusBarTranslucent onRequestClose={() => setFullscreen(false)}>
        <View style={st.fsWrap}>
          <StatusBar barStyle="dark-content" backgroundColor="#FAF7F2" />
          <TouchableOpacity style={st.fsClose} onPress={() => setFullscreen(false)}>
            <Text style={st.fsCloseText}>✕</Text>
          </TouchableOpacity>
          <Text style={st.fsTitle}>NATAL CHART</Text>
          <NatalWheel size={FS_SIZE} planets={planets} activePlanet={activePlanet}
            ascDeg={ascDeg} onPlanetPress={i => setActivePlanet(p => p === i ? null : i)} />
          {active ? (
            <View style={st.fsCard}>
              <Text style={st.fsCardPlanet}>
                {active.glyph}  {active.name} · House {active.house} · {signToName(active.eclipticDeg)}
              </Text>
              <Text style={st.fsCardMeaning}>{active.meaning}</Text>
              {activeAspectLabels.length > 0 && (
                <Text style={st.fsCardAspects}>{activeAspectLabels.join(' · ')}</Text>
              )}
            </View>
          ) : (
            <Text style={st.fsTapHint}>Tap any planet glyph to explore</Text>
          )}
        </View>
      </Modal>

      <ScrollView style={[st.container, isVedic && st.containerVedic]} showsVerticalScrollIndicator={false}>

        {/* Big 3 */}
        <View style={{ paddingTop: 52 }}>
          <Big3Header
            sunSign={westernData?.sunSign   || 'Gemini'}
            moonSign={westernData?.moonSign  || 'Taurus'}
            rising={westernData?.ascendant   || 'Scorpio'}
          />
        </View>

        {/* Toggle */}
        <View style={st.toggleWrap}>
          <View style={[st.toggle, isVedic && st.toggleVedic]}>
            {(['astral','vedic'] as const).map(m => (
              <TouchableOpacity key={m}
                style={[st.toggleOpt,
                  !isVedic && m==='astral' && st.toggleOptActive,
                  isVedic  && m==='vedic'  && st.toggleOptActiveVedic]}
                onPress={() => { setMode(m); setActivePlanet(null); }}>
                <Text style={[st.toggleText,
                  !isVedic && m==='astral' && st.toggleTextActive,
                  isVedic  && m==='vedic'  && st.toggleTextActiveVedic]}>
                  {m === 'astral' ? 'Astral' : 'Vedic'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {!isVedic ? (
          <View style={st.chartSection}>

            {/* Planet pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={st.pillRow} style={st.pillScroll}>
              {planets.filter(p => p.name !== 'ASC' && p.name !== 'MC').map(p => {
                const i = planets.indexOf(p);
                return (
                  <TouchableOpacity key={p.name}
                    style={[st.pill, activePlanet === i && st.pillActive]}
                    onPress={() => setActivePlanet(prev => prev === i ? null : i)}>
                    <Text style={[st.pillText, activePlanet === i && st.pillTextActive]}>
                      {p.glyph} {p.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Info card */}
            {active && active.name !== 'ASC' && active.name !== 'MC' ? (
              <View style={st.infoCard}>
                <View style={st.infoCardTop}>
                  <Text style={st.infoCardTitle}>
                    {active.glyph}  {active.name} · House {active.house} · {signToName(active.eclipticDeg)}
                  </Text>
                  <TouchableOpacity onPress={() => setActivePlanet(null)}>
                    <Text style={st.infoCardX}>✕</Text>
                  </TouchableOpacity>
                </View>
                <Text style={st.infoCardBody}>{active.meaning}</Text>
                {activeAspectLabels.length > 0 && (
                  <Text style={st.infoCardAspects}>{activeAspectLabels.join(' · ')}</Text>
                )}
              </View>
            ) : (
              <Text style={st.tapHint}>Tap a planet to see its meaning</Text>
            )}

            {/* Wheel */}
            <TouchableOpacity onPress={() => setFullscreen(true)} activeOpacity={0.97} style={st.wheelWrap}>
              <NatalWheel size={CSIZE} planets={planets} activePlanet={activePlanet}
                ascDeg={ascDeg} onPlanetPress={i => setActivePlanet(p => p === i ? null : i)} />
              <View style={st.expandBtn}><Text style={st.expandText}>⤢</Text></View>
            </TouchableOpacity>

            {/* Legend */}
            <View style={st.legend}>
              {[
                {l:'Conjunction',c:'rgba(20,10,0,0.7)',d:false},
                {l:'Opposition',c:'rgba(20,10,0,0.6)',d:true},
                {l:'Trine',c:'rgba(193,86,10,0.7)',d:false},
                {l:'Square',c:'rgba(193,86,10,0.6)',d:false},
              ].map(item => (
                <View key={item.l} style={st.legendItem}>
                  <View style={[st.legendLine,{borderColor:item.c,borderStyle:item.d?'dashed':'solid'}]} />
                  <Text style={st.legendText}>{item.l}</Text>
                </View>
              ))}
            </View>

          </View>
        ) : (
          <View style={st.vedicWrap}>
            <Text style={st.vedicLabel}>North Indian birth chart</Text>
            <Svg width={300} height={220} viewBox="0 0 300 220">
              <G fill="#FFF3E0" stroke="#F5C07A" strokeWidth={1}>
                <Line x1={0} y1={0} x2={300} y2={220} /><Line x1={300} y1={0} x2={0} y2={220} />
                <Line x1={150} y1={0} x2={0} y2={110} /><Line x1={150} y1={0} x2={300} y2={110} />
                <Line x1={0} y1={110} x2={150} y2={220} /><Line x1={300} y1={110} x2={150} y2={220} />
              </G>
              <G fontSize={9}>
                <SvgText x={150} y={38}  textAnchor="middle" fill="#7A3800" fontWeight="500">1 · Leo</SvgText>
                <SvgText x={150} y={50}  textAnchor="middle" fill="#C1560A">Lagna ↑</SvgText>
                <SvgText x={232} y={58}  textAnchor="middle" fill="#7A3800">2 · Virgo</SvgText>
                <SvgText x={272} y={110} textAnchor="middle" fill="#7A3800">3 · Libra</SvgText>
                <SvgText x={232} y={162} textAnchor="middle" fill="#7A3800">4 · Scorpio</SvgText>
                <SvgText x={150} y={198} textAnchor="middle" fill="#7A3800">5 · Sagittarius</SvgText>
                <SvgText x={68}  y={162} textAnchor="middle" fill="#7A3800">6 · Capricorn</SvgText>
                <SvgText x={68}  y={174} textAnchor="middle" fill="#BA7517">♄ ℞ ☊</SvgText>
                <SvgText x={28}  y={110} textAnchor="middle" fill="#7A3800">7 · Aquarius</SvgText>
                <SvgText x={28}  y={122} textAnchor="middle" fill="#C1560A">☽ Moon</SvgText>
                <SvgText x={68}  y={58}  textAnchor="middle" fill="#7A3800">8 · Pisces</SvgText>
                <SvgText x={68}  y={70}  textAnchor="middle" fill="#C1560A">♂ Mars</SvgText>
                <SvgText x={150} y={85}  textAnchor="middle" fill="#7A3800">9 · Aries</SvgText>
                <SvgText x={210} y={93}  textAnchor="middle" fill="#7A3800">10 · Taurus</SvgText>
                <SvgText x={210} y={115} textAnchor="middle" fill="#7A3800">11 · Gemini</SvgText>
                <SvgText x={210} y={127} textAnchor="middle" fill="#C1560A">☀ ♃</SvgText>
                <SvgText x={90}  y={110} textAnchor="middle" fill="#7A3800">12 · Cancer</SvgText>
                <SvgText x={90}  y={122} textAnchor="middle" fill="#BA7517">☋ Ketu</SvgText>
              </G>
            </Svg>
          </View>
        )}

        {/* Tara's Reading section header */}
        <View style={st.blueprintHeader}>
          <View style={st.blueprintHeaderRow}>
            <View>
              <Text style={st.blueprintTitle}>Tara's reading</Text>
              <Text style={st.blueprintSub}>Written from your natal chart</Text>
            </View>
            {!isPremium && (
              <TouchableOpacity
                style={st.unlockAllBtn}
                onPress={() => handleUnlock('your full chart')}>
                <Text style={st.unlockAllText}>🔒 Unlock all</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {isVedic ? (
          <View style={{ paddingHorizontal:18, paddingBottom:8 }}>
            {[
              { title:'Nakshatra story', emoji:'✦', body:'Shatbhisha — the hundred physicians. Independent, secretive, drawn to healing hidden truths in yourself and others.', ...CARD_PALETTES[0] },
              { title:'Current Dasha',  emoji:'🪐', body:'Saturn Mahadasha until 2031 — building slowly, but building something that lasts.', ...CARD_PALETTES[2] },
            ].map((card, i) => (
              <BlueprintCard key={i} card={card} index={0}
                isPremium={isPremium} onUnlock={handleUnlock} />
            ))}
          </View>
        ) : (
          <BlueprintSection
            cards={blueprintCards}
            loading={blueprintLoading}
            isPremium={isPremium}
            onUnlock={handleUnlock}
          />
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  container:             { flex:1, backgroundColor:'#FAF7F2' },
  containerVedic:        { backgroundColor:'#FFFAF4' },
  loading:               { flex:1, alignItems:'center', justifyContent:'center' },
  toggleWrap:            { alignItems:'center', paddingVertical:12 },
  toggle:                { flexDirection:'row', backgroundColor:'#EDE8E0', borderRadius:20,
                           padding:3, borderWidth:0.5, borderColor:'#D8CEC0' },
  toggleVedic:           { backgroundColor:'#FFE8CC', borderColor:'#F5C07A' },
  toggleOpt:             { paddingHorizontal:28, paddingVertical:7, borderRadius:16 },
  toggleOptActive:       { backgroundColor:'#2A1A0A' },
  toggleOptActiveVedic:  { backgroundColor:'#C1560A' },
  toggleText:            { fontSize:13, color:'#9A8060' },
  toggleTextActive:      { color:'#fff', fontWeight:'500' },
  toggleTextActiveVedic: { color:'#fff', fontWeight:'500' },
  chartSection:          { paddingBottom:4 },
  pillScroll:            { paddingLeft:16 },
  pillRow:               { flexDirection:'row', gap:6, paddingRight:16, paddingVertical:6 },
  pill:                  { backgroundColor:'#EDE8E0', borderRadius:14, paddingHorizontal:10,
                           paddingVertical:5, borderWidth:1, borderColor:'transparent' },
  pillActive:            { backgroundColor:'#FFF3E0', borderColor:'#C1560A' },
  pillText:              { fontSize:10, color:'#5A4030', fontWeight:'600', letterSpacing:0.3 },
  pillTextActive:        { color:'#C1560A' },
  infoCard:              { marginHorizontal:16, marginBottom:8, backgroundColor:'#FFF3E0',
                           borderRadius:10, borderLeftWidth:2, borderLeftColor:'#C1560A', padding:12 },
  infoCardTop:           { flexDirection:'row', justifyContent:'space-between', marginBottom:5 },
  infoCardTitle:         { fontSize:10, color:'#C1560A', fontWeight:'700', letterSpacing:0.8 },
  infoCardX:             { fontSize:11, color:'#9A8060', paddingLeft:8 },
  infoCardBody:          { fontSize:12, color:'#3A1A08', lineHeight:18, fontFamily:SERIF, fontStyle:'italic' },
  infoCardAspects:       { fontSize:9, color:'#9A8060', marginTop:5, letterSpacing:0.3 },
  tapHint:               { fontSize:10, color:'#B8A890', textAlign:'center', paddingVertical:8 },
  wheelWrap:             { marginHorizontal:16, position:'relative' },
  expandBtn:             { position:'absolute', top:10, right:10, backgroundColor:'rgba(250,247,242,0.9)',
                           borderRadius:13, width:26, height:26, alignItems:'center',
                           justifyContent:'center', borderWidth:0.5, borderColor:'rgba(0,0,0,0.12)' },
  expandText:            { fontSize:11, color:'rgba(0,0,0,0.4)' },
  legend:                { flexDirection:'row', flexWrap:'wrap', gap:10, justifyContent:'center',
                           paddingVertical:10, paddingHorizontal:16 },
  legendItem:            { flexDirection:'row', alignItems:'center', gap:5 },
  legendLine:            { width:18, borderBottomWidth:1.5 },
  legendText:            { fontSize:9, color:'#9A8060', letterSpacing:0.2 },
  blueprintHeader:       { paddingHorizontal:18, paddingTop:20, paddingBottom:10,
                           borderTopWidth:0.5, borderTopColor:'#E0D8CC', marginTop:8 },
  blueprintHeaderRow:    { flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  blueprintTitle:        { fontSize:16, fontWeight:'500', color:'#1A0E06', fontFamily:SERIF },
  blueprintSub:          { fontSize:10, color:'#9A8060', marginTop:2, letterSpacing:0.3 },
  unlockAllBtn:          { backgroundColor:'#FFF3E0', borderRadius:10, paddingHorizontal:12,
                           paddingVertical:7, borderWidth:1, borderColor:'#C1560A' },
  unlockAllText:         { fontSize:11, color:'#C1560A', fontWeight:'600', letterSpacing:0.3 },
  fsWrap:                { flex:1, backgroundColor:'#FAF7F2', alignItems:'center',
                           justifyContent:'center', paddingTop:48 },
  fsClose:               { position:'absolute', top:52, right:20, width:34, height:34,
                           borderRadius:17, backgroundColor:'#EDE8E0',
                           alignItems:'center', justifyContent:'center', zIndex:10 },
  fsCloseText:           { fontSize:13, color:'#2A1A0A', fontWeight:'600' },
  fsTitle:               { position:'absolute', top:60, alignSelf:'center',
                           fontSize:9, color:'#9A8060', letterSpacing:2 },
  fsCard:                { marginTop:10, marginHorizontal:20, backgroundColor:'#FFF3E0',
                           borderRadius:10, borderLeftWidth:2, borderLeftColor:'#C1560A',
                           padding:12, width:SW-40 },
  fsCardPlanet:          { fontSize:10, color:'#C1560A', fontWeight:'700', letterSpacing:0.8, marginBottom:4 },
  fsCardMeaning:         { fontSize:12, color:'#3A1A08', lineHeight:18, fontFamily:SERIF, fontStyle:'italic' },
  fsCardAspects:         { fontSize:9, color:'#9A8060', marginTop:5, letterSpacing:0.3 },
  fsTapHint:             { marginTop:12, fontSize:10, color:'#B8A890', letterSpacing:0.5 },
  vedicWrap:             { padding:16, alignItems:'center' },
  vedicLabel:            { fontSize:10, color:'#C1560A', textTransform:'uppercase',
                           letterSpacing:0.5, marginBottom:8, alignSelf:'flex-start' },
});