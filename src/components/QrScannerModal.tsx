import React, { useState, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { OtpAuthParams } from '../types/account';
import { parseOtpAuthUri } from '../utils/parseOtpAuthUri';
import { ColorScheme } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface QrScannerModalProps {
  visible: boolean;
  onScanned: (params: OtpAuthParams) => void;
  onClose: () => void;
  colors: ColorScheme;
}

export function QrScannerModal({ visible, onScanned, onClose, colors }: QrScannerModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [error, setError] = useState<string | null>(null);
  const scannedRef = useRef(false);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scannedRef.current) return;
    scannedRef.current = true;

    const params = parseOtpAuthUri(data);
    if (params) {
      setError(null);
      onScanned(params);
    } else {
      setError('Invalid QR code. Please scan a valid authenticator QR code.');
      setTimeout(() => {
        scannedRef.current = false;
        setError(null);
      }, 2000);
    }
  };

  const handleClose = () => {
    scannedRef.current = false;
    setError(null);
    onClose();
  };

  const renderContent = () => {
    if (!permission) {
      return null;
    }

    if (!permission.granted) {
      return (
        <View style={[styles.permissionContainer, { backgroundColor: colors.background }]}>
          <Text style={[styles.permissionTitle, { color: colors.textPrimary }]}>
            Camera Permission
          </Text>
          <Text style={[styles.permissionText, { color: colors.textSecondary }]}>
            Camera access is needed to scan QR codes
          </Text>
          <Pressable
            onPress={requestPermission}
            style={({ pressed }) => [
              styles.permissionButton,
              { backgroundColor: colors.accent, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </Pressable>
          <Pressable onPress={handleClose} style={styles.cancelButton}>
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.cameraContainer}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={handleBarcodeScanned}
        />
        <View style={styles.overlay}>
          <Pressable onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeIcon}>✕</Text>
          </Pressable>
          <View style={styles.scanArea}>
            <View style={[styles.scanFrame, { borderColor: colors.accent }]} />
          </View>
          <View style={styles.bottomBar}>
            <Text style={styles.hint}>
              {error || 'Point at a QR code'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      {renderContent()}
    </Modal>
  );
}

const styles = StyleSheet.create({
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  permissionText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  permissionButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    padding: spacing.md,
  },
  cancelText: {
    fontSize: 14,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  closeButton: {
    alignSelf: 'flex-end',
    margin: spacing.lg,
    marginTop: 60,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  scanArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderRadius: 20,
  },
  bottomBar: {
    alignItems: 'center',
    paddingBottom: 80,
  },
  hint: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    overflow: 'hidden',
  },
});
