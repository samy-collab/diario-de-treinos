import { useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { Button, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';

import { createAccount, signInWithEmail } from '@/services/tasks';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleLogin() {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      setErrorMessage(null);
      await signInWithEmail(email.trim(), password);
      router.replace('/');
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateAccount() {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      setErrorMessage(null);
      await createAccount(email.trim(), password);
      router.replace('/');
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  function validateForm() {
    if (!email.trim() || !password) {
      setErrorMessage('Informe o e-mail e a senha.');
      return false;
    }

    return true;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Entrar' }} />
      <View style={styles.content}>
        <Text style={styles.eyebrow}>FIREBASE AUTHENTICATION</Text>
        <Text style={styles.title}>Entre para continuar</Text>
        <Text style={styles.description}>
          Use seu e-mail e senha para acessar suas tarefas.
        </Text>

        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="seu@email.com"
          style={styles.input}
          value={email}
        />
        <TextInput
          autoCapitalize="none"
          autoComplete="password"
          onChangeText={setPassword}
          placeholder="Senha"
          secureTextEntry
          style={styles.input}
          value={password}
        />

        <Button
          disabled={isLoading}
          onPress={() => void handleLogin()}
          title={isLoading ? 'Aguarde...' : 'Entrar'}
          color="#2563eb"
        />
        <View style={styles.buttonSpacing}>
          <Button
            disabled={isLoading}
            onPress={() => void handleCreateAccount()}
            title="Criar conta"
            color="#475569"
          />
        </View>

        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
      </View>
    </SafeAreaView>
  );
}

function getErrorMessage(error: unknown) {
  if (!(error instanceof Error)) return 'Não foi possível concluir a operação.';

  if (error.message.includes('auth/invalid-credential')) {
    return 'E-mail ou senha inválidos.';
  }

  if (error.message.includes('auth/email-already-in-use')) {
    return 'Este e-mail já possui uma conta.';
  }

  if (error.message.includes('auth/weak-password')) {
    return 'A senha precisa ter pelo menos 6 caracteres.';
  }

  return error.message;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8fafc',
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  eyebrow: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  title: {
    color: '#0f172a',
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 10,
  },
  description: {
    color: '#64748b',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 28,
  },
  input: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 12,
    minHeight: 50,
    paddingHorizontal: 14,
  },
  buttonSpacing: {
    marginTop: 8,
  },
  error: {
    color: '#b91c1c',
    lineHeight: 20,
    marginTop: 16,
  },
});
