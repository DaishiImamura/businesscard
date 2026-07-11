import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { GRADIENT_PRESETS } from '../types/card';

interface GradientPickerProps {
  selectedStart: string;
  selectedEnd: string;
  onSelect: (start: string, end: string) => void;
}

export default function GradientPicker({ selectedStart, selectedEnd, onSelect }: GradientPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>カードのグラデーション</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {GRADIENT_PRESETS.map((preset, index) => {
          const isSelected = preset.start === selectedStart && preset.end === selectedEnd;
          return (
            <TouchableOpacity
              key={index}
              onPress={() => onSelect(preset.start, preset.end)}
              style={[
                styles.presetItem,
                isSelected && styles.selectedItem,
              ]}
            >
              <View
                style={[
                  styles.colorCircle,
                  { backgroundColor: preset.start }
                ]}
              >
                {/* 2色の組み合わせを表現するための半分重ねたサークル */}
                <View
                  style={[
                    styles.colorCircleHalf,
                    { backgroundColor: preset.end }
                  ]}
                />
              </View>
              <Text style={[styles.presetName, isSelected && styles.selectedPresetName]}>
                {preset.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  scrollContent: {
    paddingHorizontal: 4,
    paddingVertical: 6,
    gap: 12,
  },
  presetItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    borderWidth: 1.5,
    borderColor: 'transparent',
    width: 90,
  },
  selectedItem: {
    borderColor: '#818cf8',
    backgroundColor: '#2e3b56',
  },
  colorCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  colorCircleHalf: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 19,
  },
  presetName: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 6,
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedPresetName: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
