import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

const ORANGE = '#F5A623';
const CREAM = '#F2EFE8';
const DARK_CREAM = '#E8E3D8';
const DARK = '#1F2937';

export default function LoginScreen({ onLogin, onGoToSignup }: { onLogin: () => void; onGoToSignup: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.login(email.trim(), password);
      const token = res.data.idToken;
      const refreshToken = res.data.refreshToken;
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      onLogin();
    } catch (e: any) {
      Alert.alert('Login failed', 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <Text style={s.wordmark}>Tara</Text>
          <Text style={s.subtitle}>Welcome back</Text>
        </View>

        <View style={s.form}>
          <Text style={s.label}>Email</Text>
          <TextInput
            style={s.input}
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={s.label}>Password</Text>
          <TextInput
            style={s.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
          />

          <TouchableOpacity style={s.button} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Sign in →</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={s.signupLink} onPress={onGoToSignup}>
            <Text style={s.signupLinkText}>
              Don't have an account? <Text style={s.signupLinkBold}>Sign up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 28 },
  header: { alignItems: 'center', marginBottom: 48 },
  wordmark: { fontSize: 32, fontWeight: '500', color: DARK, letterSpacing: 10, marginBottom: 8, fontStyle: 'italic' },
  subtitle: { fontSize: 16, color: '#6B7280' },
  form: {},
  label: { fontSize: 12, color: '#9CA3AF', fontWeight: '600', marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: DARK_CREAM,
    borderRadius: 14, padding: 14, fontSize: 15, color: DARK,
  },
  button: { backgroundColor: DARK, borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 28 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  signupLink: { alignItems: 'center', marginTop: 20, padding: 8 },
  signupLinkText: { fontSize: 13, color: '#6B7280' },
  signupLinkBold: { color: ORANGE, fontWeight: '700' },
});
