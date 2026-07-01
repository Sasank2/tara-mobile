import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function NavBar({ active, navigation }: { active: string; navigation: any }) {
  return (
    <View style={s.nav}>
      <TouchableOpacity style={s.navItem} onPress={() => navigation.navigate('Home')}>
        <Text style={[s.navIcon, active === 'Home' && s.active]}>⌂</Text>
        <Text style={[s.navLabel, active === 'Home' && s.activeLabel]}>Home</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.navItem} onPress={() => navigation.navigate('Chart')}>
        <Text style={[s.navIcon, active === 'Chart' && s.active]}>✦</Text>
        <Text style={[s.navLabel, active === 'Chart' && s.activeLabel]}>Chart</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.askBtn} onPress={() => navigation.navigate('Ask Tara')}>
        <Text style={s.askBtnText}>✦ Ask</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.navItem} onPress={() => navigation.navigate('Journal')}>
        <Text style={[s.navIcon, active === 'Journal' && s.active]}>▣</Text>
        <Text style={[s.navLabel, active === 'Journal' && s.activeLabel]}>Journal</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.navItem} onPress={() => navigation.navigate('Profile')}>
        <Text style={[s.navIcon, active === 'Profile' && s.active]}>○</Text>
        <Text style={[s.navLabel, active === 'Profile' && s.activeLabel]}>Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
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
  active: { color: '#7C3AED' },
  navLabel: { fontSize: 9, color: '#9CA3AF' },
  activeLabel: { color: '#7C3AED', fontWeight: '700' },
  askBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: '#4ADE80',
    marginHorizontal: 4,
  },
  askBtnText: { fontSize: 12, color: '#fff', fontWeight: '700' },
});
