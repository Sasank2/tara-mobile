import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, Animated, ScrollView,
} from 'react-native';

const ORANGE = '#F5A623';
const CREAM = '#F2EFE8';
const DARK_CREAM = '#E8E3D8';
const DARK = '#1F2937';

const FEATURES = [
  { icon: '✦', text: 'Full blueprint readings — all 8 sections' },
  { icon: '⭐', text: 'Deep Nakshatra & Mahadasha analysis' },
  { icon: '🪐', text: 'Weekly cosmic forecast personalized to you' },
  { icon: '💬', text: 'Unlimited AI guidance from Tara' },
  { icon: '📓', text: 'Unlimited journal entries' },
  { icon: '🧘', text: 'Full library of guided exercises' },
];

const PLANS = [
  { id: 'monthly', label: 'Monthly', price: '₹499', sub: 'per month', badge: null },
  { id: 'yearly', label: 'Yearly', price: '₹3,999', sub: '₹333/month', badge: 'Best value' },
  { id: 'lifetime', label: 'Lifetime', price: '₹9,999', sub: 'one-time payment', badge: null },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  feature?: string; // which feature triggered the paywall
}

export default function PremiumModal({ visible, onClose, feature }: Props) {
  const slideAnim = useRef(new Animated.Value(600)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [selectedPlan, setSelectedPlan] = React.useState('yearly');

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 600, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      {/* Backdrop */}
      <Animated.View style={[s.backdrop, { opacity: fadeAnim }]}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}>
        {/* Handle */}
        <View style={s.handle} />

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <TouchableOpacity style={s.closeBtn} onPress={onClose}>
            <Text style={s.closeBtnText}>✕</Text>
          </TouchableOpacity>

          {/* Trial badge */}
          <View style={s.trialBadge}>
            <Text style={s.trialBadgeText}>✦ 7 days free trial</Text>
          </View>

          <Text style={s.title}>Unlock Tara{'\n'}Premium</Text>
          {feature && (
            <Text style={s.subtitle}>
              {feature} and much more — get the full depth of your cosmic blueprint.
            </Text>
          )}

          {/* Chakra illustration */}
          <View style={s.chakraWrap}>
            <View style={s.chakraOuter}>
              <View style={s.chakraMiddle}>
                <View style={s.chakraInner}>
                  <Text style={s.chakraText}>✦</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Features */}
          <View style={s.featuresWrap}>
            {FEATURES.map((f, i) => (
              <View key={i} style={s.featureRow}>
                <View style={s.featureIcon}>
                  <Text style={s.featureIconText}>{f.icon}</Text>
                </View>
                <Text style={s.featureText}>{f.text}</Text>
              </View>
            ))}
          </View>

          {/* Plan selector */}
          <View style={s.plansRow}>
            {PLANS.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                style={[s.planCard, selectedPlan === plan.id && s.planCardActive]}
                onPress={() => setSelectedPlan(plan.id)}
              >
                {plan.badge && (
                  <View style={s.planBadge}>
                    <Text style={s.planBadgeText}>{plan.badge}</Text>
                  </View>
                )}
                <Text style={[s.planLabel, selectedPlan === plan.id && { color: DARK }]}>{plan.label}</Text>
                <Text style={[s.planPrice, selectedPlan === plan.id && { color: DARK }]}>{plan.price}</Text>
                <Text style={s.planSub}>{plan.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* CTA */}
          <TouchableOpacity style={s.ctaBtn} onPress={onClose}>
            <Text style={s.ctaBtnText}>Start 7-Day Free Trial</Text>
          </TouchableOpacity>

          <Text style={s.ctaNote}>
            Try 7 days free, then pay {PLANS.find(p => p.id === selectedPlan)?.price}.{'\n'}
            Cancel anytime. No commitment.
          </Text>

          <TouchableOpacity style={s.laterBtn} onPress={onClose}>
            <Text style={s.laterBtnText}>Maybe later</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: CREAM, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 20, paddingTop: 12, maxHeight: '92%' },
  handle: { width: 40, height: 4, backgroundColor: DARK_CREAM, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  closeBtn: { alignSelf: 'flex-end', width: 32, height: 32, borderRadius: 16, backgroundColor: DARK_CREAM, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  closeBtnText: { fontSize: 14, color: '#6B7280' },
  trialBadge: { backgroundColor: ORANGE + '20', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, alignSelf: 'flex-start', marginBottom: 12, borderWidth: 1, borderColor: ORANGE + '40' },
  trialBadgeText: { fontSize: 12, color: ORANGE, fontWeight: '700' },
  title: { fontSize: 32, fontWeight: '900', color: DARK, lineHeight: 38, marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6B7280', lineHeight: 20, marginBottom: 16 },
  chakraWrap: { alignItems: 'center', marginVertical: 16 },
  chakraOuter: { width: 80, height: 80, borderRadius: 40, borderWidth: 1.5, borderColor: ORANGE, alignItems: 'center', justifyContent: 'center' },
  chakraMiddle: { width: 56, height: 56, borderRadius: 28, borderWidth: 1, borderColor: ORANGE + '60', alignItems: 'center', justifyContent: 'center' },
  chakraInner: { width: 36, height: 36, borderRadius: 18, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center' },
  chakraText: { fontSize: 16, color: '#fff' },
  featuresWrap: { gap: 10, marginBottom: 20 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: DARK_CREAM, alignItems: 'center', justifyContent: 'center' },
  featureIconText: { fontSize: 14 },
  featureText: { fontSize: 14, color: DARK, flex: 1, lineHeight: 20 },
  plansRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  planCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 12, alignItems: 'center', borderWidth: 1.5, borderColor: DARK_CREAM, position: 'relative' },
  planCardActive: { borderColor: ORANGE, backgroundColor: '#FFF3E0' },
  planBadge: { position: 'absolute', top: -10, backgroundColor: ORANGE, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  planBadgeText: { fontSize: 9, color: '#fff', fontWeight: '700' },
  planLabel: { fontSize: 11, color: '#9CA3AF', marginBottom: 4, marginTop: 6 },
  planPrice: { fontSize: 18, fontWeight: '900', color: '#9CA3AF', marginBottom: 2 },
  planSub: { fontSize: 9, color: '#9CA3AF', textAlign: 'center' },
  ctaBtn: { backgroundColor: DARK, borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 10 },
  ctaBtnText: { fontSize: 16, color: '#fff', fontWeight: '800' },
  ctaNote: { fontSize: 11, color: '#9CA3AF', textAlign: 'center', lineHeight: 18, marginBottom: 10 },
  laterBtn: { alignItems: 'center', padding: 10 },
  laterBtnText: { fontSize: 13, color: '#9CA3AF' },
});
