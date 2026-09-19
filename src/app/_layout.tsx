import { Stack } from 'expo-router';
import 'react-native-reanimated';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen
        name="index"
        options={{
          title: 'Tarefas',
          headerLargeTitle: true,
        }}
      />
    </Stack>
  );
}
