import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
  Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { profileAPI } from '../services/api';

const ORANGE = '#F5A623';
const CREAM = '#F2EFE8';
const DARK_CREAM = '#E8E3D8';
const DARK = '#1F2937';

interface Props {
  initialData: {
    fullName: string;
    dateOfBirth: string;
    timeOfBirth: string;
    placeOfBirth: string;
  };
  onSaved: (updated: any) => void;
  onCancel: () => void;
}

export default function EditBirthDetailsScreen({ initialData, onSaved, onCancel }: Props) {
  const [fullName, setFullName] = useState(initialData.fullName || '');
  const [dateOfBirth, setDateOfBirth] = useState(initialData.dateOfBirth || '');
  const [timeOfBirth, setTimeOfBirth] = useState((initialData.timeOfBirth || '').slice(0, 5));
  const [placeOfBirth, setPlaceOfBirth] = useState(initialData.placeOfBirth || '');
  const [loading, setLoading] = useState(false);

  const hasChanges =
    fullName !== initialData.fullName ||
    dateOfBirth !== initialData.dateOfBirth ||
    timeOfBirth !== (initialData.timeOfBirth || '').slice(0, 5) ||
    placeOfBirth !== initialData.placeOfBirth;

  const handleSave = () => {
    if (!fullName || !dateOfBirth || !timeOfBirth || !placeOfBirth) {
      Alert.alert('Missing info', 'Please fill in all fields');
      return;
    }
    Alert.alert(
      'Update birth details?',
      'Changing your birth details will regenerate your Astral and Vedic charts based on the new information. This may take a moment.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Update & regenerate', style: 'destructive', onPress: submit },
      ]
    );
  };

  const submit = async () => {
    setLoading(true);
    try {
      const res = await profileAPI.updateBirthProfile({
        fullName, dateOfBirth, timeOfBirth, placeOfBirth,
      });
      onSaved(res.data?.data);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Could not update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <View style={s.header}>
          <TouchableOpacity onPress={onCancel} style={s.closeBtn}>
            <Text style={s.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.title}>Edit birth details</Text>
        <Text style={s.desc}>
          Updating these will regenerate your Astral and Vedic charts to stay accurate.
        </Text>

        <Text style={s.label}>Full name</Text>
        <TextInput style={s.input} value={fullName} onChangeText={setFullName}
          placeholder="Your name" placeholderTextColor="#9CA3AF" />

        <Text style={s.label}>Date of birth</Text>
        <TextInput style={s.input} value={dateOfBirth} onChangeText={setDateOfBirth}
          placeholder="YYYY-MM-DD" placeholderTextColor="#9CA3AF" />

        <Text style={s.label}>Time of birth</Text>
        <TextInput style={s.input} value={timeOfBirth} onChangeText={setTimeOfBirth}
          placeholder="HH:MM (24hr format)" placeholderTextColor="#9CA3AF" />

        <Text style={s.label}>Place of birth</Text>
        <TextInput style={s.input} value={placeOfBirth} onChangeText={setPlaceOfBirth}
          placeholder="City, Country" placeholderTextColor="#9CA3AF" />

        <TouchableOpacity
          style={[s.saveBtn, (!hasChanges || loading) && s.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!hasChanges || loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>Save changes</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={s.cancelBtn} onPress={onCancel}>
          <Text style={s.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 56 },
  header: { marginBottom: 8 },
  closeBtn: { alignSelf: 'flex-end', width: 32, height: 32, borderRadius: 16, backgroundColor: DARK_CREAM, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 14, color: '#6B7280' },
  title: { fontSize: 26, fontWeight: '900', color: DARK, marginTop: 12, marginBottom: 8 },
  desc: { fontSize: 14, color: '#6B7280', lineHeight: 20, marginBottom: 20 },
  label: { fontSize: 12, color: '#9CA3AF', fontWeight: '600', marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: DARK_CREAM,
    borderRadius: 14, padding: 14, fontSize: 15, color: DARK,
  },
  saveBtn: { backgroundColor: DARK, borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 28 },
  saveBtnDisabled: { backgroundColor: DARK_CREAM },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', marginTop: 14, padding: 8 },
  cancelBtnText: { fontSize: 13, color: '#9CA3AF' },
});
