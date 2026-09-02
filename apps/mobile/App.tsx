import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { API_VERSION } from '@tradexa/shared';

const API_URL = 'http://localhost:3000';

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  async function login() {
    try {
      const res = await fetch(`${API_URL}/api/${API_VERSION}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message || 'Login failed');
        return;
      }
      await SecureStore.setItemAsync('tradexa_token', data.accessToken);
      setToken(data.accessToken);
      setMessage('Logged in. Same backend as the web app.');
    } catch (e: any) {
      setMessage(e.message);
    }
  }

  async function logout() {
    await SecureStore.deleteItemAsync('tradexa_token');
    setToken(null);
    setMessage('Logged out');
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Tradexa</Text>
      <StatusBar style="auto" />

      {token ? (
        <View>
          <Text style={styles.ok}>Authenticated</Text>
          <TouchableOpacity style={styles.button} onPress={logout}>
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity style={styles.button} onPress={login}>
            <Text style={styles.buttonText}>Log In</Text>
          </TouchableOpacity>
        </View>
      )}

      {message ? <Text style={styles.message}>{message}</Text> : null}
      <Text style={styles.hint}>
        Phase 1 demo. Mobile and web share the same backend API and database.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: '700', textAlign: 'center', marginBottom: 24 },
  form: { gap: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  ok: { fontSize: 18, textAlign: 'center', marginBottom: 16 },
  message: { marginTop: 16, textAlign: 'center', color: '#666' },
  hint: { marginTop: 24, textAlign: 'center', color: '#888' },
});
