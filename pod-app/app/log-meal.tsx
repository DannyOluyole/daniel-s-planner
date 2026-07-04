import { useState } from "react";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useAuth } from "../src/lib/AuthProvider";
import { supabase } from "../src/lib/supabase";
import { friendlyErrorMessage } from "../src/lib/errors";
import { Button } from "../src/components/Button";
import { TextField } from "../src/components/TextField";
import { colors, spacing } from "../src/theme";

export default function LogMealScreen() {
  const { session, pod } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [caption, setCaption] = useState("");
  const [shareToPod, setShareToPod] = useState(true);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoMimeType, setPhotoMimeType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Photo access is needed to attach a meal picture.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setPhotoMimeType(result.assets[0].mimeType ?? null);
    }
  }

  async function uploadPhoto(uri: string, mimeType: string | null, userId: string): Promise<string | null> {
    const response = await fetch(uri);
    const arrayBuffer = await response.arrayBuffer();
    // Don't derive the extension from the URI: on web, picked images are
    // `blob:` URLs with no file extension, so a naive string split produces
    // garbage that Supabase Storage rejects as an invalid Content-Type header.
    const contentType = mimeType || "image/jpeg";
    const ext = contentType.split("/")[1]?.split(";")[0] || "jpg";
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("meal-photos")
      .upload(path, arrayBuffer, { contentType });
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from("meal-photos").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSubmit() {
    if (!session || !pod || !name.trim()) return;
    setError(null);
    setLoading(true);
    try {
      let photoUrl: string | null = null;
      if (photoUri) {
        photoUrl = await uploadPhoto(photoUri, photoMimeType, session.user.id);
      }

      const { error: insertError } = await supabase.from("meal_logs").insert({
        pod_id: pod.id,
        user_id: session.user.id,
        name: name.trim(),
        calories: calories ? Number(calories) : null,
        protein_g: protein ? Number(protein) : null,
        carbs_g: carbs ? Number(carbs) : null,
        fat_g: fat ? Number(fat) : null,
        caption: caption.trim() || null,
        photo_url: photoUrl,
        shared_to_pod: shareToPod,
      });

      if (insertError) throw insertError;
      router.back();
    } catch (e) {
      setError(friendlyErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content}>
        <TextField label="What did you eat?" placeholder="e.g. Chicken burrito bowl" value={name} onChangeText={setName} />

        <View style={styles.row}>
          <View style={styles.rowItem}>
            <TextField label="Calories" keyboardType="number-pad" value={calories} onChangeText={setCalories} />
          </View>
          <View style={styles.rowItem}>
            <TextField label="Protein (g)" keyboardType="number-pad" value={protein} onChangeText={setProtein} />
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.rowItem}>
            <TextField label="Carbs (g)" keyboardType="number-pad" value={carbs} onChangeText={setCarbs} />
          </View>
          <View style={styles.rowItem}>
            <TextField label="Fat (g)" keyboardType="number-pad" value={fat} onChangeText={setFat} />
          </View>
        </View>

        <TextField
          label="Caption (optional)"
          placeholder="Anything you want your Pod to see"
          value={caption}
          onChangeText={setCaption}
        />

        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.preview} />
        ) : (
          <Button title="Add a photo" variant="secondary" onPress={pickPhoto} />
        )}

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Share to Pod</Text>
          <Switch value={shareToPod} onValueChange={setShareToPod} trackColor={{ true: colors.coral }} />
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <Button title="Post" onPress={handleSubmit} loading={loading} disabled={!name.trim()} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cloud,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  rowItem: {
    flex: 1,
  },
  preview: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: 16,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.ink,
  },
  error: {
    color: colors.ember,
    fontWeight: "600",
    fontSize: 14,
  },
});
