/**
 * Share Dialog Component for Phase 10
 * UI component for sharing files and albums with users or public links
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Modal,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { AccessLevel, SharingRequest } from '@/types/sharing';
import { useAdvancedSharing } from '@/hooks/useAdvancedSharing';

interface ShareDialogProps {
  visible: boolean;
  onClose: () => void;
  fileName?: string;
  albumName?: string;
  onShare?: (request: SharingRequest) => void;
}

/**
 * ShareDialog Component
 */
export function ShareDialog({
  visible,
  onClose,
  fileName,
  albumName,
  onShare,
}: ShareDialogProps) {
  const { shareFile, createPublicShareLink, revokeLink, isSharing, error } = useAdvancedSharing(
    'current-user-id'
  );

  // State
  const [shareMode, setShareMode] = useState<'user' | 'link'>('user');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [permission, setPermission] = useState<AccessLevel>(AccessLevel.VIEWER);
  const [expirationDays, setExpirationDays] = useState('30');
  const [enablePassword, setEnablePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const slideAnimation = React.useRef(new Animated.Value(0)).current;

  // Show/hide animation
  React.useEffect(() => {
    if (visible) {
      Animated.timing(slideAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnimation]);

  /**
   * Handle share with user
   */
  const handleShareWithUser = useCallback(async () => {
    if (!recipientEmail.trim()) {
      alert('Please enter recipient email');
      return;
    }

    const request: SharingRequest = {
      recipientEmail,
      permission,
      expiresAt: new Date(Date.now() + parseInt(expirationDays) * 24 * 60 * 60 * 1000),
      message: `I'm sharing ${fileName || albumName} with you`,
    };

    try {
      if (fileName) {
        await shareFile(fileName, recipientEmail, permission);
      }

      onShare?.(request);
      resetForm();
      onClose();
    } catch (err) {
      alert(`Failed to share: ${(err as Error).message}`);
    }
  }, [recipientEmail, permission, expirationDays, fileName, albumName, shareFile, onShare, onClose]);

  /**
   * Handle create public link
   */
  const handleCreatePublicLink = useCallback(async () => {
    try {
      const result = await createPublicShareLink(fileName || albumName || 'File', {
        expirationDays: parseInt(expirationDays),
        password: enablePassword ? password : undefined,
      });

      if (result.ok && result.value) {
        setShareLink(result.value.publicUrl);
      } else {
        alert(`Failed to create link: ${result.error?.message}`);
      }
    } catch (err) {
      alert(`Failed to create link: ${(err as Error).message}`);
    }
  }, [fileName, albumName, expirationDays, enablePassword, password, createPublicShareLink]);

  /**
   * Handle revoke link
   */
  const handleRevokeLink = useCallback(async () => {
    if (!shareLink) return;

    try {
      await revokeLink(shareLink);
      setShareLink(null);
      alert('Link revoked successfully');
    } catch (err) {
      alert(`Failed to revoke link: ${(err as Error).message}`);
    }
  }, [shareLink, revokeLink]);

  /**
   * Copy link to clipboard
   */
  const handleCopyLink = useCallback(() => {
    if (shareLink) {
      // In real app, would use Clipboard API
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  }, [shareLink]);

  /**
   * Reset form
   */
  const resetForm = useCallback(() => {
    setShareMode('user');
    setRecipientEmail('');
    setPermission(AccessLevel.VIEWER);
    setExpirationDays('30');
    setEnablePassword(false);
    setPassword('');
    setShareLink(null);
  }, []);

  /**
   * Handle close
   */
  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const translateY = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {fileName ? `Share "${fileName}"` : albumName ? `Share Album "${albumName}"` : 'Share'}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Mode Tabs */}
          <View style={styles.modeTabs}>
            <TouchableOpacity
              style={[styles.modeTab, shareMode === 'user' && styles.modeTabActive]}
              onPress={() => setShareMode('user')}
            >
              <Text style={[styles.modeTabText, shareMode === 'user' && styles.modeTabTextActive]}>
                Share with User
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeTab, shareMode === 'link' && styles.modeTabActive]}
              onPress={() => setShareMode('link')}
            >
              <Text style={[styles.modeTabText, shareMode === 'link' && styles.modeTabTextActive]}>
                Public Link
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {shareMode === 'user' ? (
              // Share with User Mode
              <View style={styles.section}>
                {/* Email Input */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Recipient Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="user@example.com"
                    value={recipientEmail}
                    onChangeText={setRecipientEmail}
                    editable={!isSharing}
                    keyboardType="email-address"
                  />
                </View>

                {/* Permission Level */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Permission Level</Text>
                  <View style={styles.permissionButtons}>
                    {[AccessLevel.VIEWER, AccessLevel.EDITOR, AccessLevel.ADMIN].map(level => (
                      <TouchableOpacity
                        key={level}
                        style={[styles.permButton, permission === level && styles.permButtonActive]}
                        onPress={() => setPermission(level)}
                      >
                        <Text
                          style={[
                            styles.permButtonText,
                            permission === level && styles.permButtonTextActive,
                          ]}
                        >
                          {level}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Expiration */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Expires In (days)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="30"
                    value={expirationDays}
                    onChangeText={setExpirationDays}
                    editable={!isSharing}
                    keyboardType="number-pad"
                  />
                </View>

                {/* Error */}
                {error && <Text style={styles.errorText}>{error.message}</Text>}

                {/* Share Button */}
                <TouchableOpacity
                  style={[styles.button, styles.buttonPrimary, isSharing && styles.buttonDisabled]}
                  onPress={handleShareWithUser}
                  disabled={isSharing}
                >
                  {isSharing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Share</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              // Public Link Mode
              <View style={styles.section}>
                {/* Expiration */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Link Expires In (days)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="30"
                    value={expirationDays}
                    onChangeText={setExpirationDays}
                    editable={!isSharing && !shareLink}
                    keyboardType="number-pad"
                  />
                </View>

                {/* Password Protection */}
                <View style={styles.fieldGroup}>
                  <View style={styles.checkboxRow}>
                    <TouchableOpacity
                      style={styles.checkbox}
                      onPress={() => setEnablePassword(!enablePassword)}
                    >
                      {enablePassword && <View style={styles.checkboxFill} />}
                    </TouchableOpacity>
                    <Text style={styles.label}>Require Password</Text>
                  </View>

                  {enablePassword && (
                    <TextInput
                      style={styles.input}
                      placeholder="Enter password (optional)"
                      value={password}
                      onChangeText={setPassword}
                      editable={!isSharing && !shareLink}
                      secureTextEntry
                    />
                  )}
                </View>

                {/* Generated Link */}
                {shareLink && (
                  <View style={styles.linkCard}>
                    <Text style={styles.linkLabel}>Share Link</Text>
                    <View style={styles.linkContainer}>
                      <Text style={styles.linkText} numberOfLines={2}>
                        {shareLink}
                      </Text>
                      <TouchableOpacity onPress={handleCopyLink}>
                        <Text style={styles.copyButton}>{linkCopied ? '✓ Copied' : 'Copy'}</Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={[styles.button, styles.buttonDanger]}
                      onPress={handleRevokeLink}
                    >
                      <Text style={styles.buttonText}>Revoke Link</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Error */}
                {error && <Text style={styles.errorText}>{error.message}</Text>}

                {/* Create Button */}
                {!shareLink && (
                  <TouchableOpacity
                    style={[styles.button, styles.buttonPrimary, isSharing && styles.buttonDisabled]}
                    onPress={handleCreatePublicLink}
                    disabled={isSharing}
                  >
                    {isSharing ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Create Link</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: '50%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 24,
    color: '#666',
  },
  modeTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modeTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  modeTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  modeTabText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  modeTabTextActive: {
    color: '#007AFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    gap: 16,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  permissionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  permButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    alignItems: 'center',
  },
  permButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  permButtonText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
  },
  permButtonTextActive: {
    color: '#fff',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxFill: {
    width: 12,
    height: 12,
    backgroundColor: '#007AFF',
    borderRadius: 3,
  },
  linkCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  linkLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
  },
  linkContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  linkText: {
    flex: 1,
    fontSize: 12,
    color: '#007AFF',
    fontFamily: 'Menlo',
  },
  copyButton: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#007AFF',
  },
  buttonDanger: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
  },
});
