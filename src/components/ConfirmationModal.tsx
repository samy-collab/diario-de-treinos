import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

type ConfirmationModalProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  isLoading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

// Modal proprio para manter a mesma confirmacao no Android, iOS e navegador.
// O Alert nativo nao executa botoes quando o app roda com react-native-web.
export function ConfirmationModal({
  visible,
  title,
  message,
  confirmLabel,
  isLoading = false,
  onCancel,
  onConfirm,
}: ConfirmationModalProps) {
  return <Modal
    animationType="fade"
    onRequestClose={onCancel}
    transparent
    visible={visible}
  >
    <View style={styles.backdrop}>
      <View accessibilityViewIsModal style={styles.dialog}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        <View style={styles.actions}>
          <Pressable disabled={isLoading} onPress={onCancel} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
          <Pressable disabled={isLoading} onPress={onConfirm} style={styles.confirmButton}>
            <Text style={styles.confirmText}>{isLoading ? 'Aguarde...' : confirmLabel}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  backdrop: { alignItems: 'center', backgroundColor: 'rgba(15, 23, 42, 0.55)', flex: 1, justifyContent: 'center', padding: 24 },
  dialog: { backgroundColor: '#fff', borderRadius: 18, maxWidth: 420, padding: 22, width: '100%' },
  title: { color: '#172554', fontSize: 20, fontWeight: '900' },
  message: { color: '#475569', fontSize: 15, lineHeight: 22, marginTop: 9 },
  actions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end', marginTop: 24 },
  cancelButton: { alignItems: 'center', borderColor: '#cbd5e1', borderRadius: 11, borderWidth: 1, flex: 1, minHeight: 46, justifyContent: 'center' },
  cancelText: { color: '#475569', fontWeight: '800' },
  confirmButton: { alignItems: 'center', backgroundColor: '#dc2626', borderRadius: 11, flex: 1, minHeight: 46, justifyContent: 'center' },
  confirmText: { color: '#fff', fontWeight: '800' },
});
