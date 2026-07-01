import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

import HomeScreen from './HomeScreen';
import ChartScreen from './ChartScreen';
import AskTaraScreen from './AskTaraScreen';
import JournalScreen from './JournalScreen';
import ProfileScreen from './ProfileScreen';

export type TabName = 'Home' | 'Chart' | 'Ask Tara' | 'Journal' | 'Profile';

export default function MainScreen({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<TabName>('Home');

  const renderScreen = () => {
    switch (activeTab) {
      case 'Home': return <HomeScreen setActiveTab={setActiveTab} />;
      case 'Chart': return <ChartScreen />;
      case 'Ask Tara': return <AskTaraScreen />;
      case 'Journal': return <JournalScreen />;
      case 'Profile': return <ProfileScreen onLogout={onLogout} />;
      default: return <HomeScreen setActiveTab={setActiveTab} />;
    }
  };

  return (
    <View style={s.container}>
      <View style={s.content}>
        {renderScreen()}
      </View>
      <View style={s.nav}>
        <TouchableOpacity style={s.navItem} onPress={() => setActiveTab('Home')}>
          <Text style={[s.navIcon, activeTab === 'Home' && s.navIconActive]}>⌂</Text>
          <Text style={[s.navLabel, activeTab === 'Home' && s.navLabelActive]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.navItem} onPress={() => setActiveTab('Chart')}>
          <Text style={[s.navIcon, activeTab === 'Chart' && s.navIconActive]}>✦</Text>
          <Text style={[s.navLabel, activeTab === 'Chart' && s.navLabelActive]}>Chart</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.askBtn} onPress={() => setActiveTab('Ask Tara')}>
          <Text style={s.askBtnText}>✦ Ask</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.navItem} onPress={() => setActiveTab('Journal')}>
          <Text style={[s.navIcon, activeTab === 'Journal' && s.navIconActive]}>▣</Text>
          <Text style={[s.navLabel, activeTab === 'Journal' && s.navLabelActive]}>Journal</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.navItem} onPress={() => setActiveTab('Profile')}>
          <Text style={[s.navIcon, activeTab === 'Profile' && s.navIconActive]}>○</Text>
          <Text style={[s.navLabel, activeTab === 'Profile' && s.navLabelActive]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7F5' },
  content: { flex: 1 },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 28,
    backgroundColor: '#F8F7F5',
    borderTopWidth: 0.5,
    borderTopColor: '#E5E7EB',
  },
  navItem: { alignItems: 'center', gap: 2, flex: 1 },
  navIcon: { fontSize: 20, color: '#9CA3AF' },
  navIconActive: { color: '#7C3AED' },
  navLabel: { fontSize: 9, color: '#9CA3AF' },
  navLabelActive: { color: '#7C3AED', fontWeight: '700' },
  askBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: '#4ADE80',
    marginHorizontal: 4,
  },
  askBtnText: { fontSize: 12, color: '#fff', fontWeight: '700' },
});
