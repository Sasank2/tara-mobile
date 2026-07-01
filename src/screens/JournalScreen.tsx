import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, TextInput,
  Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { journalAPI } from '../services/api';
import { COLORS, MOODS } from '../constants';

const MOOD_COLORS: Record<string, { bg: string; text: string }> = {
  Good: { bg: '#EAF3DE', text: '#3B6D11' },
  Calm: { bg: '#E6F1FB', text: '#185FA5' },
  Happy: { bg: '#EAF3DE', text: '#3B6D11' },
  Anxious: { bg: '#FBEAF0', text: '#993556' },
  Low: { bg: '#FAEEDA', text: '#854F0B' },
  Motivated: { bg: '#EEEDFE', text: '#534AB7' },
  Tired: { bg: '#F5F5F5', text: '#6B6B6B' },
  Emotional: { bg: '#FBEAF0', text: '#993556' },
  Confused: { bg: '#F5F5F5', text: '#6B6B6B' },
};

export default function JournalScreen() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState('Good');
  const [saving, setSaving] = useState(false);

  const fetchEntries = async () => {
    try {
      const res = await journalAPI.getEntries();
      setEntries(res.data.data?.entries || []);
    } catch (e) {
      console.log('Journal fetch error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEntries(); }, []);

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      await journalAPI.createEntry({
        content: content.trim(),
        mood: selectedMood,
        prompt: 'What am I feeling right now?',
      });
      setContent('');
      setSelectedMood('Good');
      setModalVisible(false);
      fetchEntries();
    } catch (e) {
      console.log('Save error', e);
    } finally {
      setSaving(false);
    }
  };

  const streak = entries.length > 0 ? Math.min(entries.length, 7) : 0;

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={COLORS.purple} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Journal</Text>
          <Text style={styles.subtitle}>{entries.length} entries this month</Text>
        </View>
        <TouchableOpacity style={styles.newBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.newBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{streak}</Text>
            <Text style={styles.statLabel}>Day streak</Text>
          </View>
          <View style={[styles.statItem, styles.statBorder]}>
            <Text style={styles.statNum}>{entries.length}</Text>
            <Text style={styles.statLabel}>Total entries</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{entries[0]?.mood || '—'}</Text>
            <Text style={styles.statLabel}>Last mood</Text>
          </View>
        </View>

        {/* Today prompt */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Today's reflection</Text>
          <View style={styles.promptCard}>
            <Text style={styles.promptLabel}>✦ Tara asks</Text>
            <Text style={styles.promptText}>
              What conversation or connection have you been avoiding that might actually lighten your heart?
            </Text>
            <TouchableOpacity style={styles.writeBtn} onPress={() => setModalVisible(true)}>
              <Text style={styles.writeBtnText}>Write now</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Past entries */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Past entries</Text>
          {entries.length === 0 ? (
            <Text style={styles.emptyText}>No entries yet. Write your first one above.</Text>
          ) : (
            entries.map((entry) => {
              const moodColor = MOOD_COLORS[entry.mood] || { bg: '#F5F5F5', text: '#6B6B6B' };
              return (
                <View key={entry.id} style={styles.entryCard}>
                  <View style={styles.entryTop}>
                    <Text style={styles.entryDate}>{entry.entryDate}</Text>
                    <View style={[styles.moodTag, { backgroundColor: moodColor.bg }]}>
                      <Text style={[styles.moodTagText, { color: moodColor.text }]}>{entry.mood}</Text>
                    </View>
                  </View>
                  {entry.prompt && (
                    <Text style={styles.entryPrompt}>"{entry.prompt}"</Text>
                  )}
                  <Text style={styles.entryContent} numberOfLines={2}>{entry.content}</Text>
                </View>
              );
            })
          )}
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>

      {/* New entry modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          style={styles.modal}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New entry</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving || !content.trim()}>
              <Text style={[styles.saveText, (!content.trim() || saving) && styles.saveTextDisabled]}>
                {saving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalPromptWrap}>
            <Text style={styles.modalPrompt}>What am I feeling right now?</Text>
          </View>

          <TextInput
            style={styles.textArea}
            value={content}
            onChangeText={setContent}
            placeholder="Start writing..."
            placeholderTextColor={COLORS.textTertiary}
            multiline
            autoFocus
            textAlignVertical="top"
          />

          <View style={styles.moodPicker}>
            <Text style={styles.moodPickerLabel}>Mood</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.moodPickerRow}>
                {MOODS.map((m) => (
                  <TouchableOpacity
                    key={m.label}
                    style={[
                      styles.moodPickerChip,
                      selectedMood === m.label && { backgroundColor: m.color, borderColor: m.textColor },
                    ]}
                    onPress={() => setSelectedMood(m.label)}
                  >
                    <Text style={[styles.moodPickerText, selectedMood === m.label && { color: m.textColor }]}>
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingTop: 52, paddingHorizontal: 18, paddingBottom: 14, borderBottomWidth: 0.5, borderBottomColor: COLORS.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  title: { fontSize: 22, fontWeight: '500', color: COLORS.textPrimary },
  subtitle: { fontSize: 11, color: COLORS.textTertiary, marginTop: 2 },
  newBtn: { backgroundColor: COLORS.bgSecondary, borderWidth: 0.5, borderColor: COLORS.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 7 },
  newBtnText: { fontSize: 13, color: COLORS.textPrimary },
  scroll: { flex: 1 },
  statsRow: { flexDirection: 'row', paddingVertical: 16, marginHorizontal: 18, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  statItem: { flex: 1, alignItems: 'center' },
  statBorder: { borderLeftWidth: 0.5, borderRightWidth: 0.5, borderColor: COLORS.border },
  statNum: { fontSize: 22, fontWeight: '500', color: COLORS.textPrimary },
  statLabel: { fontSize: 10, color: COLORS.textTertiary, marginTop: 2 },
  section: { padding: 18, paddingTop: 14 },
  sectionLabel: { fontSize: 10, color: COLORS.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  promptCard: { backgroundColor: COLORS.purpleLight, borderRadius: 14, padding: 16 },
  promptLabel: { fontSize: 11, color: COLORS.purple, fontWeight: '500', marginBottom: 6 },
  promptText: { fontSize: 14, color: '#3C3489', lineHeight: 21, marginBottom: 14 },
  writeBtn: { backgroundColor: COLORS.purple, borderRadius: 10, padding: 10, alignItems: 'center' },
  writeBtnText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  emptyText: { fontSize: 14, color: COLORS.textTertiary, textAlign: 'center', marginTop: 20 },
  entryCard: { backgroundColor: COLORS.bgSecondary, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 0.5, borderColor: COLORS.border },
  entryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  entryDate: { fontSize: 11, color: COLORS.textTertiary },
  moodTag: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  moodTagText: { fontSize: 11 },
  entryPrompt: { fontSize: 11, color: COLORS.textTertiary, fontStyle: 'italic', marginBottom: 5 },
  entryContent: { fontSize: 13, color: COLORS.textPrimary, lineHeight: 19 },
  modal: { flex: 1, backgroundColor: COLORS.white },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 0.5, borderBottomColor: COLORS.border, paddingTop: 24 },
  cancelText: { fontSize: 16, color: COLORS.textSecondary },
  modalTitle: { fontSize: 16, fontWeight: '500', color: COLORS.textPrimary },
  saveText: { fontSize: 16, color: COLORS.purple, fontWeight: '500' },
  saveTextDisabled: { opacity: 0.4 },
  modalPromptWrap: { backgroundColor: COLORS.purpleLight, margin: 16, borderRadius: 10, padding: 12 },
  modalPrompt: { fontSize: 13, color: '#3C3489', fontStyle: 'italic' },
  textArea: { flex: 1, padding: 18, fontSize: 15, color: COLORS.textPrimary, lineHeight: 24 },
  moodPicker: { borderTopWidth: 0.5, borderTopColor: COLORS.border, padding: 14 },
  moodPickerLabel: { fontSize: 11, color: COLORS.textTertiary, marginBottom: 8 },
  moodPickerRow: { flexDirection: 'row', gap: 8 },
  moodPickerChip: { backgroundColor: COLORS.bgSecondary, borderWidth: 0.5, borderColor: COLORS.border, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 },
  moodPickerText: { fontSize: 12, color: COLORS.textSecondary },
});
