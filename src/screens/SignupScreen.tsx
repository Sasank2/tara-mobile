import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { userAPI } from '../services/api';

const FIREBASE_API_KEY = 'AIzaSyBjgzE1qZzv7EAd1HJOKTw-04uMkFC75_Y';
const ORANGE = '#F5A623';
const CREAM = '#F2EFE8';
const DARK_CREAM = '#E8E3D8';
const DARK = '#1F2937';

export default function SignupScreen({ onSignup, onGoToLogin }: { onSignup: () => void; onGoToLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!email.trim() || !password || !confirmPassword) {
      Alert.alert('Missing info', 'Please fill in all fields');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Passwords don\'t match', 'Please make sure both passwords are the same');
      return false;
    }
    return true;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // 1. Create Firebase account
      const res = await axios.post(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
        { email: email.trim(), password, returnSecureToken: true }
      );

      const { idToken, refreshToken } = res.data;
      await AsyncStorage.setItem('token', idToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);

      // 2. Trigger backend auto-registration
      await userAPI.getUser();

      onSignup();
    } catch (e: any) {
      const errorCode = e?.response?.data?.error?.message;
      let message = 'Could not create account. Please try again.';
      if (errorCode === 'EMAIL_EXISTS') message = 'An account with this email already exists.';
      else if (errorCode === 'INVALID_EMAIL') message = 'Please enter a valid email address.';
      else if (errorCode === 'WEAK_PASSWORD') message = 'Password should be at least 6 characters.';
      Alert.alert('Sign up failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        <View style={s.header}>
          <Text style={s.wordmark}>Tara</Text>
          <Text style={s.title}>Create your account</Text>
          <Text style={s.subtitle}>Begin your journey of self-understanding</Text>
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
            placeholder="At least 6 characters"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
          />

          <Text style={s.label}>Confirm password</Text>
          <TextInput
            style={s.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter your password"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
          />

          <TouchableOpacity style={s.button} onPress={handleSignup} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Create account →</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={s.loginLink} onPress={onGoToLogin}>
            <Text style={s.loginLinkText}>
              Already have an account? <Text style={s.loginLinkBold}>Sign in</Text>
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
  header: { alignItems: 'center', marginBottom: 40 },
  wordmark: { fontSize: 30, fontWeight: '500', color: DARK, letterSpacing: 8, marginBottom: 16, fontStyle: 'italic' },
  title: { fontSize: 22, fontWeight: '800', color: DARK, marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  form: {},
  label: { fontSize: 12, color: '#9CA3AF', fontWeight: '600', marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: DARK_CREAM,
    borderRadius: 14, padding: 14, fontSize: 15, color: DARK,
  },
  button: { backgroundColor: DARK, borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 28 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  loginLink: { alignItems: 'center', marginTop: 20, padding: 8 },
  loginLinkText: { fontSize: 13, color: '#6B7280' },
  loginLinkBold: { color: ORANGE, fontWeight: '700' },
});
