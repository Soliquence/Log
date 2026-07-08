import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

const TABS = ["Todos", "Settings"] as const;
type Tab = (typeof TABS)[number];

type TodoChecklistItem = {
  id: string;
  label: string;
  completed: boolean;
};

type TodoItem = {
  id: string;
  title: string;
  category?: string;
  tags: string[];
  notes?: string;
  items: TodoChecklistItem[];
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "@logapp:data";

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const now = () => new Date().toISOString();
const formatDate = (iso: string) => new Date(iso).toLocaleString(undefined, {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export default function Index() {
  const [active, setActive] = useState<Tab>(TABS[0]);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [draftCategory, setDraftCategory] = useState("");
  const [draftTags, setDraftTags] = useState("");
  const [draftChecklist, setDraftChecklist] = useState("");
  const [checklistInputs, setChecklistInputs] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    saveData();
  }, [todos]);

  const loadData = async () => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (!json) return;
      const stored = JSON.parse(json);
      setTodos(
        (stored.todos ?? []).map((todo: Partial<TodoItem>) => ({
          ...todo,
          title: todo.title ?? "Untitled todo",
          category: todo.category ?? "General",
          tags: Array.isArray(todo.tags) ? todo.tags : [],
          notes: todo.notes ?? "",
          items: Array.isArray(todo.items) ? todo.items : [],
          completed: Boolean(todo.completed),
          createdAt: todo.createdAt ?? now(),
          updatedAt: todo.updatedAt ?? now(),
        }))
      );
    } catch (error) {
      console.warn("Failed to load saved data", error);
    }
  };

  const saveData = async () => {
    try {
      const payload = JSON.stringify({
        todos: todos.map((todo) => ({
          ...todo,
          tags: Array.isArray(todo.tags) ? todo.tags : [],
          notes: todo.notes ?? "",
          items: Array.isArray(todo.items) ? todo.items : [],
        })),
      });
      await AsyncStorage.setItem(STORAGE_KEY, payload);
    } catch (error) {
      console.warn("Failed to save data", error);
    }
  };

  const addTodo = () => {
    const title = draftTitle.trim() || "New todo";
    const item: TodoItem = {
      id: createId(),
      title,
      category: draftCategory.trim() || "General",
      tags: draftTags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      notes: draftBody.trim(),
      items: draftChecklist
        .split(/\r?\n/)
        .map((label) => label.trim())
        .filter(Boolean)
        .map((label) => ({ id: createId(), label, completed: false })),
      completed: false,
      createdAt: now(),
      updatedAt: now(),
    };
    setTodos((prev) => [item, ...prev]);
    setDraftTitle("");
    setDraftCategory("");
    setDraftTags("");
    setDraftBody("");
    setDraftChecklist("");
    setEditingId(item.id);
  };

  const updateItem = (itemId: string, updates: Partial<TodoItem>) => {
    const timestamp = now();
    setTodos((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, ...updates, updatedAt: timestamp } : item
      )
    );
  };

  const addChecklistItem = (todoId: string, label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === todoId
          ? {
              ...todo,
              items: [...todo.items, { id: createId(), label: trimmed, completed: false }],
              updatedAt: now(),
            }
          : todo
      )
    );
    setChecklistInputs((prev) => ({ ...prev, [todoId]: "" }));
  };

  const updateChecklistItem = (todoId: string, itemId: string, label: string) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === todoId
          ? {
              ...todo,
              items: todo.items.map((item) =>
                item.id === itemId ? { ...item, label, completed: item.completed } : item
              ),
              updatedAt: now(),
            }
          : todo
      )
    );
  };

  const toggleChecklistItem = (todoId: string, itemId: string) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === todoId
          ? {
              ...todo,
              items: todo.items.map((item) =>
                item.id === itemId
                  ? { ...item, completed: !item.completed }
                  : item
              ),
              updatedAt: now(),
            }
          : todo
      )
    );
  };

  const deleteChecklistItem = (todoId: string, itemId: string) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === todoId
          ? {
              ...todo,
              items: todo.items.filter((item) => item.id !== itemId),
              updatedAt: now(),
            }
          : todo
      )
    );
  };

  const deleteItem = (itemId: string) => {
    setTodos((prev) => prev.filter((item) => item.id !== itemId));
    if (editingId === itemId) setEditingId(null);
  };

  const toggleCompleted = (itemId: string) => {
    setTodos((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, completed: !item.completed, updatedAt: now() }
          : item
      )
    );
  };

  const clearStorage = () => {
    Alert.alert("Clear all data", "This will delete all notes, todos, and journal entries.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          setTodos([]);
          await AsyncStorage.removeItem(STORAGE_KEY);
        },
      },
    ]);
  };

  const activeItems = useMemo(() => {
    if (active === "Todos") return todos;
    return [];
  }, [active, todos]);

  const renderTodoEditor = () => (
    <View style={styles.editor}>
      <TextInput
        style={styles.input}
        placeholder="Todo title"
        value={draftTitle}
        onChangeText={setDraftTitle}
        returnKeyType="done"
      />
      <TextInput
        style={styles.input}
        placeholder="Category (e.g. Work, Home, Health)"
        value={draftCategory}
        onChangeText={setDraftCategory}
      />
      <TextInput
        style={styles.input}
        placeholder="Tags (comma separated)"
        value={draftTags}
        onChangeText={setDraftTags}
      />
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Notes for this todo (optional)"
        value={draftBody}
        onChangeText={setDraftBody}
        multiline
      />
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Checklist items, one per line"
        value={draftChecklist}
        onChangeText={setDraftChecklist}
        multiline
      />
      <TouchableOpacity style={styles.primaryButton} onPress={addTodo}>
        <Text style={styles.primaryButtonText}>Add Todo</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTodos = () => (
    <>
      <Text style={styles.h2}>Todos</Text>
      {renderTodoEditor()}
      {todos.length === 0 ? (
        <Text style={styles.placeholder}>Create a task to stay organized.</Text>
      ) : (
        todos.map((todo) => (
          <View key={todo.id} style={styles.card}>
            <View style={styles.todoRowTop}>
              <Pressable onPress={() => toggleCompleted(todo.id)} style={[styles.checkbox, todo.completed && styles.checkboxChecked]}>
                {todo.completed ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
              </Pressable>
              <TextInput
                style={[styles.cardTitleInput, todo.completed && styles.completedText]}
                value={todo.title}
                onChangeText={(value) => updateItem(todo.id, { title: value })}
                placeholder="Todo title"
              />
              <Pressable onPress={() => deleteItem(todo.id)} style={styles.cardAction}>
                <Ionicons name="trash-outline" size={18} color="#c0392b" />
              </Pressable>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>{todo.category || "General"}</Text>
              {todo.tags.length ? (
                <Text style={styles.metaText}>{todo.tags.map((tag) => `#${tag}`).join(" ")}</Text>
              ) : null}
            </View>
            {todo.notes ? (
              <Text style={styles.cardNote}>{todo.notes}</Text>
            ) : null}
            {todo.items?.length ? (
              <View style={styles.checklist}>
                {todo.items?.map((item) => (
                  <View key={item.id} style={styles.checklistRow}>
                    <Pressable
                      onPress={() => toggleChecklistItem(todo.id, item.id)}
                      style={[styles.checkbox, item.completed && styles.checkboxChecked]}
                    >
                      {item.completed ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
                    </Pressable>
                    <TextInput
                      style={[styles.checklistInput, item.completed && styles.completedText]}
                      value={item.label}
                      onChangeText={(value) => updateChecklistItem(todo.id, item.id, value)}
                      placeholder="Checklist item"
                    />
                    <Pressable onPress={() => deleteChecklistItem(todo.id, item.id)} style={styles.cardAction}>
                      <Ionicons name="close-outline" size={18} color="#c0392b" />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : null}
            <View style={styles.checklistInputRow}>
              <TextInput
                style={[styles.input, styles.checklistAddInput]}
                placeholder="Add checklist item"
                value={checklistInputs[todo.id] ?? ""}
                onChangeText={(value) => setChecklistInputs((prev) => ({ ...prev, [todo.id]: value }))}
              />
              <TouchableOpacity
                style={styles.addChecklistButton}
                onPress={() => addChecklistItem(todo.id, checklistInputs[todo.id] ?? "")}
              >
                <Text style={styles.addChecklistButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.smallText}>Created {formatDate(todo.createdAt)}</Text>
              <Text style={styles.smallText}>Edited {formatDate(todo.updatedAt)}</Text>
            </View>
          </View>
        ))
      )}
    </>
  );

  const renderSettings = () => (
    <View style={styles.settingsInner}>
      <Text style={styles.h2}>Settings</Text>
      <Text style={styles.settingLabel}>Sync status</Text>
      <View style={styles.syncRow}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: isOnline ? "#2ecc71" : "#e74c3c" },
          ]}
        />
        <Text style={styles.syncText}>{isOnline ? "Online" : "Offline"}</Text>
      </View>
      <Text style={styles.settingLabel}>Local items</Text>
      <Text style={styles.settingText}>{todos.length} todos</Text>
      <TouchableOpacity style={styles.clearButton} onPress={clearStorage}>
        <Text style={styles.clearButtonText}>Clear all local data</Text>
      </TouchableOpacity>
      <Text style={styles.smallText}>
        Cloud sync is coming soon. This app saves your data locally and is ready for a network layer.
      </Text>
    </View>
  );

  const renderEditor = (
    onSave: () => void,
    titlePlaceholder: string,
    bodyPlaceholder: string,
    singleLine = false
  ) => (
    <View style={styles.editor}>
      <TextInput
        style={styles.input}
        placeholder={titlePlaceholder}
        value={draftTitle}
        onChangeText={setDraftTitle}
        returnKeyType="done"
      />
      {!singleLine ? (
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder={bodyPlaceholder}
          value={draftBody}
          onChangeText={setDraftBody}
          multiline
        />
      ) : null}
      <TouchableOpacity style={styles.primaryButton} onPress={onSave}>
        <Text style={styles.primaryButtonText}>Add {active.slice(0, -1)}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    if (active === "Todos") return renderTodos();
    return renderSettings();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Log</Text>
          <View style={styles.syncArea}>
            <View style={[styles.statusDot, { backgroundColor: isOnline ? "#2ecc71" : "#e74c3c" }]} />
            <Text style={styles.syncText}>{isOnline ? "Online" : "Offline"}</Text>
          </View>
        </View>

        <View style={styles.tabBar}>
          {TABS.map((tab) => (
            <TouchableOpacity key={tab} onPress={() => setActive(tab)} style={styles.tabButton}>
              <Text style={[styles.tabText, active === tab && styles.tabActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.content}>{renderContent()}</ScrollView>
      </KeyboardAvoidingView>
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
  title: { fontSize: 22, fontWeight: "700" },
  syncArea: { flexDirection: "row", alignItems: "center" },
  statusDot: { width: 10, height: 10, borderRadius: 6, marginRight: 8 },
  syncText: { fontSize: 12, color: "#666" },
  tabBar: { flexDirection: "row", paddingVertical: 8, paddingHorizontal: 8, backgroundColor: "#fafafa" },
  tabButton: { flex: 1, alignItems: "center", paddingVertical: 10 },
  tabText: { color: "#333" },
  tabActive: { color: "#007aff", fontWeight: "600" },
  content: { padding: 16, paddingBottom: 32 },
  h2: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  placeholder: { color: "#666", marginTop: 8 },
  editor: { marginBottom: 24 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  textArea: { minHeight: 100, textAlignVertical: "top" },
  primaryButton: {
    backgroundColor: "#007aff",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: { color: "#fff", fontWeight: "700" },
  card: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: "600", flex: 1 },
  cardBody: {
    borderWidth: 1,
    borderColor: "#f0f0f0",
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    backgroundColor: "#fafafa",
    textAlignVertical: "top",
  },
  cardAction: { marginLeft: 12 },
  todoRowTop: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  cardTitleInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    paddingVertical: 0,
    color: "#333",
  },
  checklist: { marginTop: 12 },
  checklistRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  checklistInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 10,
    fontSize: 15,
    marginRight: 8,
    backgroundColor: "#fff",
  },
  checklistAddInput: { flex: 1, marginRight: 12, marginBottom: 0 },
  checklistInputRow: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  addChecklistButton: {
    backgroundColor: "#34c759",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  addChecklistButtonText: { color: "#fff", fontWeight: "700" },
  metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" },
  metaLabel: { fontSize: 13, color: "#007aff", fontWeight: "600" },
  metaText: { fontSize: 13, color: "#444", marginLeft: 8 },
  todoRow: { flexDirection: "row", alignItems: "center" },
  cardNote: { marginTop: 8, color: "#555", fontSize: 14, lineHeight: 20 },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    backgroundColor: "#fff",
  },
  checkboxChecked: {
    backgroundColor: "#007aff",
    borderColor: "#007aff",
  },
  completedText: { textDecorationLine: "line-through", color: "#999" },
  settingsInner: { minHeight: 320 },
  settingLabel: { marginTop: 12, fontSize: 14, color: "#444", fontWeight: "600" },
  settingText: { marginTop: 4, fontSize: 14, color: "#555" },
  syncRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  clearButton: {
    marginTop: 24,
    backgroundColor: "#f44336",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  clearButtonText: { color: "#fff", fontWeight: "700" },
  smallText: { marginTop: 16, color: "#666", lineHeight: 20 },
});
