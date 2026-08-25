import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useInventoryStore } from '../../store/useInventoryStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Colors, Typography, Spacing, BorderRadius, Shadow, FISH_CATEGORIES, CategoryColors } from '../../theme';
import { DELTA_STATE_ZONES, FISH_UNITS } from '../../utils/constants';
import { Product } from '../../database/types';

interface Props {
  navigation: any;
  route: { params?: { product?: Product } };
}

export const AddProductScreen: React.FC<Props> = ({ navigation, route }) => {
  const editProduct = route.params?.product;
  const isEditing = !!editProduct;

  const { addProduct, editProduct: updateProd } = useInventoryStore();
  const { profile } = useAuthStore();

  const [name, setName] = useState(editProduct?.name ?? '');
  const [fishSpecies, setFishSpecies] = useState(editProduct?.fish_species ?? '');
  const [catchDate, setCatchDate] = useState(editProduct?.catch_date ?? '');
  const [category, setCategory] = useState(editProduct?.category ?? FISH_CATEGORIES[0]);
  const [quantity, setQuantity] = useState(String(editProduct?.quantity ?? ''));
  const [unit, setUnit] = useState(editProduct?.unit ?? 'kg');
  const [price, setPrice] = useState(String(editProduct?.price_per_unit ?? ''));
  const [description, setDescription] = useState(editProduct?.description ?? '');
  const [location, setLocation] = useState(editProduct?.location ?? profile?.zone ?? '');
  const [fisherName, setFisherName] = useState(editProduct?.fisher_name ?? profile?.name ?? '');
  const [fisherPhone, setFisherPhone] = useState(editProduct?.fisher_phone ?? profile?.phone ?? '');
  const [isAvailable, setIsAvailable] = useState(editProduct?.is_available ?? true);
  const [saving, setSaving] = useState(false);

  const validate = (): string | null => {
    if (!name.trim()) return 'Product name is required';
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) return 'Valid quantity is required';
    if (!price || isNaN(Number(price)) || Number(price) <= 0) return 'Valid price is required';
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) { Alert.alert('Validation Error', err); return; }

    setSaving(true);
    try {
      const data = {
        name: name.trim(),
        category,
        fish_species: fishSpecies.trim() || undefined,
        catch_date: catchDate.trim() || undefined,
        quantity: parseFloat(quantity),
        unit,
        price_per_unit: parseFloat(price),
        description: description.trim() || undefined,
        location: location || undefined,
        fisher_name: fisherName.trim() || undefined,
        fisher_phone: fisherPhone.trim() || undefined,
        is_available: isAvailable,
      };

      if (isEditing && editProduct) {
        await updateProd(editProduct.id, data);
        Alert.alert('Updated!', 'Product updated and queued for sync', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await addProduct(data);
        Alert.alert('Saved!', 'Product saved locally and will sync when online', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
    setSaving(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditing ? 'Edit Product' : 'Add Catch'}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
          {/* Basic Info */}
          <Text style={styles.sectionLabel}>Basic Information</Text>
          <View style={styles.card}>
            <InputField label="Product Name *" value={name} onChangeText={setName} placeholder="e.g. Fresh Catfish" />
            <InputField label="Fish Species / Local Name" value={fishSpecies} onChangeText={setFishSpecies} placeholder="e.g. Obokun, Clarias gariepinus" />
            <InputField label="Catch Date" value={catchDate} onChangeText={setCatchDate} placeholder="e.g. YYYY-MM-DD" />
            <InputField label="Description" value={description} onChangeText={setDescription} placeholder="Optional details about this product" multiline />
          </View>

          {/* Category */}
          <Text style={styles.sectionLabel}>Fish Category *</Text>
          <View style={styles.categoryGrid}>
            {FISH_CATEGORIES.map((cat) => {
              const color = CategoryColors[cat] ?? Colors.primary;
              const selected = category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catBtn, selected && { backgroundColor: color, borderColor: color }]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.catText, selected && { color: Colors.textInverse }]}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Quantity & Price */}
          <Text style={styles.sectionLabel}>Quantity & Price *</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <InputField label="Quantity" value={quantity} onChangeText={setQuantity} placeholder="0" keyboardType="numeric" />
              </View>
              <View style={{ width: 120 }}>
                <Text style={styles.fieldLabel}>Unit</Text>
                <View style={styles.unitPicker}>
                  {FISH_UNITS.map((u) => (
                    <TouchableOpacity
                      key={u}
                      style={[styles.unitBtn, unit === u && styles.unitBtnActive]}
                      onPress={() => setUnit(u)}
                    >
                      <Text style={[styles.unitText, unit === u && styles.unitTextActive]}>{u}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
            <InputField
              label="Price per unit (₦) *"
              value={price}
              onChangeText={setPrice}
              placeholder="0.00"
              keyboardType="numeric"
              prefix="₦"
            />
            {quantity && price && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Value:</Text>
                <Text style={styles.totalValue}>
                  ₦{(parseFloat(quantity || '0') * parseFloat(price || '0')).toLocaleString('en-NG')}
                </Text>
              </View>
            )}
          </View>

          {/* Location */}
          <Text style={styles.sectionLabel}>Location</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Zone in Delta State</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.zoneScroll}>
              <View style={styles.zoneRow}>
                {DELTA_STATE_ZONES.map((z) => (
                  <TouchableOpacity
                    key={z}
                    style={[styles.zoneBtn, location === z && styles.zoneBtnActive]}
                    onPress={() => setLocation(z)}
                  >
                    <Text style={[styles.zoneText, location === z && styles.zoneTextActive]}>{z}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Fisher Info */}
          <Text style={styles.sectionLabel}>Your Contact Info</Text>
          <View style={styles.card}>
            <InputField label="Fisher Name" value={fisherName} onChangeText={setFisherName} placeholder="Your name" />
            <InputField label="Phone Number" value={fisherPhone} onChangeText={setFisherPhone} placeholder="+234..." keyboardType="phone-pad" />
            <View style={styles.switchRow}>
              <View>
                <Text style={styles.fieldLabel}>Available for Sale</Text>
                <Text style={styles.switchSub}>Toggle off to hide from marketplace</Text>
              </View>
              <Switch value={isAvailable} onValueChange={setIsAvailable} trackColor={{ true: Colors.primary, false: Colors.border }} />
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Ionicons name={saving ? 'sync' : 'checkmark-circle'} size={20} color={Colors.textInverse} />
            <Text style={styles.saveBtnText}>
              {saving ? 'Saving...' : isEditing ? 'Update Product' : 'Save Catch'}
            </Text>
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ── Reusable input field ────────────────────────────────────────────────────
interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'phone-pad';
  multiline?: boolean;
  prefix?: string;
}

const InputField: React.FC<InputFieldProps> = ({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline, prefix }) => (
  <View style={inputStyles.container}>
    <Text style={inputStyles.label}>{label}</Text>
    <View style={[inputStyles.inputWrapper, multiline && { height: 80, alignItems: 'flex-start' }]}>
      {prefix && <Text style={inputStyles.prefix}>{prefix}</Text>}
      <TextInput
        style={[inputStyles.input, multiline && { textAlignVertical: 'top', paddingTop: 8 }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  </View>
);

const inputStyles = StyleSheet.create({
  container: { marginBottom: Spacing.md },
  label: { ...Typography.labelMD, color: Colors.textSecondary, marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.background, borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: Spacing.md,
  },
  prefix: { ...Typography.bodyMD, color: Colors.textMuted, marginRight: 4 },
  input: { flex: 1, paddingVertical: Spacing.md, ...Typography.bodyMD, color: Colors.textPrimary },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  backBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
    borderRadius: BorderRadius.md, backgroundColor: Colors.background,
  },
  headerTitle: { ...Typography.headingSM, color: Colors.textPrimary },

  form: { padding: Spacing.base, gap: 4 },

  sectionLabel: {
    ...Typography.labelSM, color: Colors.textSecondary,
    marginTop: Spacing.lg, marginBottom: Spacing.sm,
  },

  card: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.xl,
    padding: Spacing.base, ...Shadow.sm,
  },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  catBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  catText: { ...Typography.labelSM, color: Colors.textSecondary, textTransform: 'none', letterSpacing: 0, fontSize: 13 },

  row: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },

  fieldLabel: { ...Typography.labelMD, color: Colors.textSecondary, marginBottom: 6 },

  unitPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  unitBtn: {
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.background,
  },
  unitBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  unitText: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },
  unitTextActive: { color: Colors.textInverse },

  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.successLight, padding: Spacing.md, borderRadius: BorderRadius.md, marginTop: Spacing.sm,
  },
  totalLabel: { ...Typography.labelMD, color: Colors.success },
  totalValue: { ...Typography.headingSM, color: Colors.success, fontWeight: '800' },

  zoneScroll: { marginTop: 4 },
  zoneRow: { flexDirection: 'row', gap: Spacing.sm, paddingBottom: 4 },
  zoneBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.background,
  },
  zoneBtnActive: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  zoneText: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600', fontSize: 12 },
  zoneTextActive: { color: Colors.textInverse },

  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm },
  switchSub: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },

  saveBtn: {
    backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, borderRadius: BorderRadius.full, paddingVertical: Spacing.lg,
    marginTop: Spacing.xl, ...Shadow.colored(Colors.primary),
  },
  saveBtnText: { ...Typography.labelLG, color: Colors.textInverse },
});
