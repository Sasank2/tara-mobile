import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert, ActivityIndicator, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userAPI, profileAPI } from '../services/api';
import EditBirthDetailsScreen from './EditBirthDetailsScreen';
import PremiumModal from '../components/PremiumModal';

export default function ProfileScreen({ onLogout }: { onLogout?: () => void }) {
  const [userData, setUserData] = useState<any>(null);
  const [birthProfile, setBirthProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dailyGuidance, setDailyGuidance] = useState(true);
  const [moodReminders, setMoodReminders] = useState(true);
  const [showEditBirth, setShowEditBirth] = useState(false);
  const [showPremium, setShowPremium] = useState(false);

  const load = async () => {
    try {
      const [userRes, profileRes] = await Promise.all([
        userAPI.getUser(),
        profileAPI.getBirthProfile().catch(() => null),
      ]);
      setUserData(userRes.data?.data);
      setBirthProfile(profileRes?.data?.data || null);
    } catch (e) {
      console.log('Profile load error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const logout = async () => {
    Alert.alert('Log out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: async () => {
        await AsyncStorage.multiRemove(['token', 'refreshToken', 'hasProfile', 'preference', 'userName']);
        onLogout && onLogout();
      }},
    ]);
  };

  const handleBirthDetailsSaved = (updated: any) => {
    setBirthProfile(updated);
    setShowEditBirth(false);
    Alert.alert('Updated', 'Your birth details and charts have been refreshed.');
  };

  const name = birthProfile?.fullName || userData?.name || 'Tara User';
  const email = userData?.email || '';
  const dob = birthProfile?.dateOfBirth
    ? new Date(birthProfile.dateOfBirth).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';
  const time = birthProfile?.timeOfBirth || '—';
  const place = birthProfile?.placeOfBirth || '—';

  if (loading) {
    return (
      <View style={[s.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color="#7C3AED" />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        <View style={s.header}>
          <View>
            <Text style={s.headlineLight}>Your</Text>
            <Text style={s.headlineBold}>profile</Text>
          </View>
          <View style={s.avatarLarge}>
            <Text style={s.avatarLargeText}>{name.charAt(0).toUpperCase()}</Text>
          </View>
        </View>

        <View style={s.nameRow}>
          <Text style={s.nameText}>{name}</Text>
          <Text style={s.emailText}>{email}</Text>
          <View style={s.badgeRow}>
            <View style={s.badgePurple}><Text style={s.badgePurpleText}>Astral</Text></View>
            <View style={s.badgeSaffron}><Text style={s.badgeSaffronText}>Vedic</Text></View>
            <View style={s.badgeGreen}><Text style={s.badgeGreenText}>Free plan</Text></View>
          </View>
        </View>

        <View style={s.section}>
          <View style={s.sectionHeaderRow}>
            <Text style={s.sectionLabel}>BIRTH DETAILS</Text>
            <TouchableOpacity onPress={() => setShowEditBirth(true)} style={s.editBtn}>
              <Text style={s.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={s.card}>
            <View style={s.row}><Text style={s.rowLabel}>Date of birth</Text><Text style={s.rowValue}>{dob}</Text></View>
            <View style={s.divider} />
            <View style={s.row}><Text style={s.rowLabel}>Time</Text><Text style={s.rowValue}>{time}</Text></View>
            <View style={s.divider} />
            <View style={s.row}><Text style={s.rowLabel}>Place</Text><Text style={s.rowValue}>{place}</Text></View>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionLabel}>PREFERENCES</Text>
          <View style={s.card}>
            <View style={s.row}>
              <Text style={s.rowLabel}>Daily guidance</Text>
              <Switch value={dailyGuidance} onValueChange={setDailyGuidance} trackColor={{ true: '#7C3AED' }} thumbColor="#fff" />
            </View>
            <View style={s.divider} />
            <View style={s.row}>
              <Text style={s.rowLabel}>Mood reminders</Text>
              <Switch value={moodReminders} onValueChange={setMoodReminders} trackColor={{ true: '#7C3AED' }} thumbColor="#fff" />
            </View>
            <View style={s.divider} />
            <View style={s.row}>
              <Text style={s.rowLabel}>Astrology preference</Text>
              <Text style={s.rowValueAccent}>Both</Text>
            </View>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionLabel}>ACCOUNT</Text>
          <View style={s.card}>
            <TouchableOpacity style={s.row}>
              <Text style={s.rowLabel}>Privacy settings</Text>
              <Text style={s.rowArrow}>›</Text>
            </TouchableOpacity>
            <View style={s.divider} />
            <TouchableOpacity style={s.row} onPress={() => setShowPremium(true)}>
              <Text style={s.rowLabel}>Subscription</Text>
              <View style={s.subscriptionRight}>
                <View style={s.badgeGreen}><Text style={s.badgeGreenText}>Free</Text></View>
                <Text style={s.rowArrow}>›</Text>
              </View>
            </TouchableOpacity>
            <View style={s.divider} />
            <TouchableOpacity style={s.row} onPress={logout}>
              <Text style={s.logoutText}>Log out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal visible={showEditBirth} animationType="slide" presentationStyle="pageSheet">
        <EditBirthDetailsScreen
          initialData={{
            fullName: birthProfile?.fullName || '',
            dateOfBirth: birthProfile?.dateOfBirth || '',
            timeOfBirth: birthProfile?.timeOfBirth || '',
            placeOfBirth: birthProfile?.placeOfBirth || '',
          }}
          onSaved={handleBirthDetailsSaved}
          onCancel={() => setShowEditBirth(false)}
        />
      </Modal>

      <PremiumModal
        visible={showPremium}
        onClose={() => setShowPremium(false)}
        feature="Subscription management"
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7F5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 8 },
  headlineLight: { fontSize: 28, fontWeight: '300', color: '#C4B5FD' },
  headlineBold: { fontSize: 28, fontWeight: '900', color: '#1F2937', marginTop: -4 },
  avatarLarge: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center' },
  avatarLargeText: { fontSize: 24, color: '#fff', fontWeight: '700' },
  nameRow: { paddingHorizontal: 20, paddingBottom: 20 },
  nameText: { fontSize: 22, fontWeight: '800', color: '#1F2937' },
  emailText: { fontSize: 13, color: '#9CA3AF', marginTop: 2, marginBottom: 10 },
  badgeRow: { flexDirection: 'row', gap: 8 },
  badgePurple: { backgroundColor: '#EDE9FE', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  badgePurpleText: { fontSize: 11, color: '#7C3AED', fontWeight: '600' },
  badgeSaffron: { backgroundColor: '#FFF3E0', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  badgeSaffronText: { fontSize: 11, color: '#C1560A', fontWeight: '600' },
  badgeGreen: { backgroundColor: '#DCFCE7', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  badgeGreenText: { fontSize: 11, color: '#065F46', fontWeight: '600' },
  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '700', letterSpacing: 0.8 },
  editBtn: { paddingHorizontal: 10, paddingVertical: 4 },
  editBtnText: { fontSize: 11, color: '#7C3AED', fontWeight: '700' },
  card: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  rowLabel: { fontSize: 14, color: '#1F2937' },
  rowValue: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  rowValueAccent: { fontSize: 14, color: '#7C3AED', fontWeight: '600' },
  rowArrow: { fontSize: 18, color: '#9CA3AF' },
  subscriptionRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  divider: { height: 0.5, backgroundColor: '#F3F4F6', marginHorizontal: 16 },
  logoutText: { fontSize: 14, color: '#EF4444', fontWeight: '600' },
});
