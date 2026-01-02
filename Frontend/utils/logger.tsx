import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal } from 'react-native';

// Simple in-app logger
class InAppLogger {
  private logs: string[] = [];
  private maxLogs = 200;
  private listeners: Array<() => void> = [];

  log(message: string, tag?: string) {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${tag ? `[${tag}] ` : ''}${message}`;
    this.logs.push(logMessage);
    
    // Giữ tối đa maxLogs logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    
    // Cũng log ra console
    console.log(logMessage);
    
    // Notify listeners
    this.listeners.forEach(listener => listener());
  }

  getLogs(): string[] {
    return [...this.logs];
  }

  clear() {
    this.logs = [];
    this.listeners.forEach(listener => listener());
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
}

export const inAppLogger = new InAppLogger();

// Component để hiển thị logs trong app
export function LogViewer() {
  const [logs, setLogs] = useState<string[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!visible) return;
    
    const unsubscribe = inAppLogger.subscribe(() => {
      setLogs(inAppLogger.getLogs());
    });
    
    // Update logs initially
    setLogs(inAppLogger.getLogs());
    
    return unsubscribe;
  }, [visible]);

  if (!visible) {
    return (
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setVisible(true)}
      >
        <Text style={styles.toggleButtonText}>📋 Logs</Text>
      </TouchableOpacity>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={() => setVisible(false)}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>📋 App Logs</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.clearButton]}
              onPress={() => {
                inAppLogger.clear();
                setLogs([]);
              }}
            >
              <Text style={styles.buttonText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.closeButton]}
              onPress={() => setVisible(false)}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView 
          style={styles.logContainer}
          contentContainerStyle={styles.logContent}
        >
          {logs.length === 0 ? (
            <Text style={styles.emptyText}>No logs yet...</Text>
          ) : (
            logs.map((log, index) => (
              <Text key={index} style={styles.logText}>
                {log}
              </Text>
            ))
          )}
        </ScrollView>
        <View style={styles.footer}>
          <Text style={styles.footerText}>{logs.length} log entries</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  clearButton: {
    backgroundColor: '#ff4444',
  },
  closeButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  logContainer: {
    flex: 1,
  },
  logContent: {
    padding: 10,
  },
  logText: {
    color: '#0f0',
    fontSize: 11,
    fontFamily: 'monospace',
    marginBottom: 3,
    lineHeight: 16,
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 50,
  },
  footer: {
    padding: 10,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  footerText: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
  },
  toggleButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 25,
    zIndex: 9998,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

