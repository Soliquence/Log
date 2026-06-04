import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
} from "react-native";

const TABS = ["Notes", "Todos", "Journal", "Settings"];

export default function Index() {
  const [active, setActive] = useState<string>(TABS[0]);
  const [isOnline] = useState<boolean>(false); // placeholder; will wire to netinfo

  const renderContent = () => {
    switch (active) {
      case "Notes":
        return (
          <View style={styles.contentInner}>
            <Text style={styles.h2}>Notes</Text>
            <Text style={styles.placeholder}>Your notes will appear here.</Text>
          </View>
        );
      case "Todos":
        return (
          <View style={styles.contentInner}>
            <Text style={styles.h2}>Todos</Text>
            <Text style={styles.placeholder}>Your tasks will appear here.</Text>
          </View>
        );
      case "Journal":
        return (
          <View style={styles.contentInner}>
            <Text style={styles.h2}>Journal</Text>
            <Text style={styles.placeholder}>Daily entries will appear here.</Text>
          </View>
        );
      default:
        return (
          <View style={styles.contentInner}>
            <Text style={styles.h2}>Settings</Text>
            <Text style={styles.placeholder}>App preferences and sync settings.</Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.title}>Log</Text>
        <View style={styles.syncArea}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isOnline ? "#2ecc71" : "#e74c3c" },
            ]}
          />
          <Text style={styles.syncText}>{isOnline ? "Online" : "Offline"}</Text>
        </View>
      </View>

      <View style={styles.tabBar}>
        {TABS.map((t) => (
          <TouchableOpacity key={t} onPress={() => setActive(t)} style={styles.tabButton}>
            <Text style={[styles.tabText, active === t && styles.tabActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>{renderContent()}</ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  title: { fontSize: 20, fontWeight: "700" },
  syncArea: { flexDirection: "row", alignItems: "center" },
  statusDot: { width: 10, height: 10, borderRadius: 6, marginRight: 8 },
  syncText: { fontSize: 12, color: "#666" },
  tabBar: { flexDirection: "row", paddingVertical: 8, paddingHorizontal: 8 },
  tabButton: { flex: 1, alignItems: "center", paddingVertical: 8 },
  tabText: { color: "#333" },
  tabActive: { color: "#007aff", fontWeight: "600" },
  content: { padding: 16 },
  contentInner: { minHeight: 300 },
  h2: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
  placeholder: { color: "#666" },
});
