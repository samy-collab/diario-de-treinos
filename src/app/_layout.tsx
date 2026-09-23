import { Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import 'react-native-reanimated';
import { AuthProvider, useAuth } from '@/context/AuthContext';

// Ponto de entrada visual do Expo Router. O provider fica acima de todas as
// telas para que qualquer rota consiga consultar a sessao atual.
export default function RootLayout() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}

function AppNavigator() {
  const { user, isCheckingSession } = useAuth();
  // Enquanto o Firebase recupera a sessao salva, nenhuma rota e exibida.
  // Isso evita mostrar rapidamente a tela errada durante a inicializacao.
  if (isCheckingSession)
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#2563eb" size="large" />
        <Text style={styles.loadingText}>Verificando sua sessão...</Text>
      </View>
    );

  return (
    <Stack screenOptions={{ headerTintColor: '#1e3a8a', headerTitleStyle: { fontWeight: '700' } }}>
      {/* Stack.Protected controla o acesso e redireciona quando o guard muda. */}
      <Stack.Protected guard={!user}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={Boolean(user)}>
        <Stack.Screen name="index" options={{ title: 'Meu Treino', headerBackVisible: false }} />
        <Stack.Screen name="workout-form" options={{ title: 'Treino' }} />
        <Stack.Screen name="workout/[id]" options={{ title: 'Detalhes' }} />
      </Stack.Protected>
    </Stack>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
  },
  loadingText: { color: '#64748b' },
});
