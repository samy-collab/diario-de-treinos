import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { createAccount, signIn } from '@/services/auth';

export default function LoginScreen() {
  // Estados controlados mantem os campos e o feedback sincronizados com a tela.
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Usado somente no cadastro para detectar erros de digitacao antes do Firebase.
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    // Validacoes locais evitam uma chamada de rede sabidamente invalida.
    const numericAge = Number(age);
    if (isCreatingAccount && !name.trim()) return setError('Informe seu nome.');
    if (isCreatingAccount && (!Number.isInteger(numericAge) || numericAge < 1 || numericAge > 120))
      return setError('Informe uma idade válida entre 1 e 120 anos.');
    if (!email.trim() || !password) return setError('Preencha o e-mail e a senha.');
    if (password.length < 6) return setError('A senha precisa ter pelo menos 6 caracteres.');
    // A confirmacao e uma validacao local: apenas a senha principal e enviada
    // para createAccount quando os dois campos possuem exatamente o mesmo valor.
    if (isCreatingAccount && password !== passwordConfirmation)
      return setError('As senhas não coincidem. Digite novamente.');
    try {
      setIsLoading(true);
      setError('');
      // A mesma tela atende cadastro e login; o estado define qual executar.
      if (isCreatingAccount) await createAccount(name.trim(), numericAge, email.trim(), password);
      else await signIn(email.trim(), password);
    } catch (caught) {
      setError(authErrorMessage(caught));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* Identidade visual ligada ao tema do aplicativo, em vez de dinheiro. */}
          <View style={styles.brand}>
            <Text accessibilityLabel="Pessoa levantando um halter" style={styles.logo}>
              🏋️
            </Text>
          </View>
          <Text style={styles.eyebrow}>DIÁRIO DE TREINOS</Text>
          <Text style={styles.title}>Meu Treino</Text>
          <Text style={styles.subtitle}>
            {isCreatingAccount
              ? 'Crie sua conta para acompanhar sua evolução.'
              : 'Entre para registrar seus treinos.'}
          </Text>
          {/* Nome e idade formam o perfil exibido no cabecalho depois do cadastro. */}
          {isCreatingAccount ? (
            <>
              <Text style={styles.label}>Nome</Text>
              <TextInput
                autoCapitalize="words"
                autoComplete="name"
                editable={!isLoading}
                maxLength={60}
                onChangeText={setName}
                placeholder="Como podemos chamar você?"
                style={styles.input}
                value={name}
              />
              <Text style={styles.label}>Idade</Text>
              <TextInput
                editable={!isLoading}
                keyboardType="number-pad"
                maxLength={3}
                onChangeText={setAge}
                placeholder="Ex.: 25"
                style={styles.input}
                value={age}
              />
            </>
          ) : null}
          <Text style={styles.label}>E-mail</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            editable={!isLoading}
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="voce@email.com"
            style={styles.input}
            value={email}
          />
          <Text style={styles.label}>Senha</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="password"
            editable={!isLoading}
            onChangeText={setPassword}
            placeholder="Mínimo de 6 caracteres"
            secureTextEntry
            style={styles.input}
            value={password}
          />
          {/* O campo existe apenas no modo de cadastro; no login ele nao e necessario. */}
          {isCreatingAccount ? (
            <>
              <Text style={styles.label}>Confirmar senha</Text>
              <TextInput
                autoCapitalize="none"
                autoComplete="password"
                editable={!isLoading}
                onChangeText={setPasswordConfirmation}
                placeholder="Digite a mesma senha"
                secureTextEntry
                style={styles.input}
                value={passwordConfirmation}
              />
            </>
          ) : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable
            disabled={isLoading}
            onPress={() => void handleSubmit()}
            style={styles.primaryButton}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryText}>{isCreatingAccount ? 'Criar conta' : 'Entrar'}</Text>
            )}
          </Pressable>
          <Pressable
            disabled={isLoading}
            onPress={() => {
              setError('');
              setName('');
              setAge('');
              setPasswordConfirmation('');
              setIsCreatingAccount((value) => !value);
            }}
            style={styles.linkButton}
          >
            <Text style={styles.linkText}>
              {isCreatingAccount ? 'Já tenho conta' : 'Ainda não tenho conta'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function authErrorMessage(error: unknown) {
  // Traduz codigos tecnicos do Firebase em mensagens compreensiveis.
  const message = error instanceof Error ? error.message : '';
  if (message.includes('invalid-email')) return 'Digite um e-mail válido.';
  if (message.includes('invalid-credential')) return 'E-mail ou senha incorretos.';
  if (message.includes('email-already-in-use')) return 'Este e-mail já está cadastrado.';
  if (message.includes('network-request-failed')) return 'Sem conexão. Verifique sua internet.';
  return 'Não foi possível concluir. Tente novamente.';
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#eff6ff', flex: 1 },
  flex: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', padding: 28 },
  brand: {
    alignItems: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 22,
    height: 64,
    justifyContent: 'center',
    marginBottom: 22,
    width: 64,
  },
  logo: { color: '#fff', fontSize: 34, fontWeight: '900' },
  eyebrow: { color: '#2563eb', fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
  title: { color: '#172554', fontSize: 38, fontWeight: '900', marginTop: 5 },
  subtitle: { color: '#64748b', fontSize: 16, lineHeight: 23, marginBottom: 28, marginTop: 8 },
  label: { color: '#334155', fontSize: 13, fontWeight: '700', marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderColor: '#cbd5e1',
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 16,
    minHeight: 52,
    paddingHorizontal: 15,
  },
  error: { color: '#b91c1c', marginBottom: 14 },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 52,
  },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  linkButton: { alignItems: 'center', padding: 18 },
  linkText: { color: '#1d4ed8', fontWeight: '700' },
});
