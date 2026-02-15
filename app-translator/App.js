import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, PanResponder, Animated, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';

// นำเข้าโมดูลเรียกหน้าต่างอัดหน้าจอที่เราเพิ่งสร้าง (Native Bridge)
import { showBroadcastPicker } from './modules/screen-recorder';

export default function App() {
  // --- State สำหรับ UI ---
  const [sourceLang, setSourceLang] = useState('ja');
  const [targetLang, setTargetLang] = useState('th');
  const [isScrollEnabled, setIsScrollEnabled] = useState(true);

  // --- State สำหรับขนาดและตำแหน่ง ---
  const containerSize = useRef({ width: 0, height: 0 }); // ขนาดพื้นที่สีดำ
  const pan = useRef(new Animated.ValueXY()).current; // ตำแหน่ง (X, Y) ของกล่อง
  const currentPan = useRef({ x: 0, y: 0 }); // คอยจำตำแหน่งล่าสุด

  // อัปเดตตำแหน่งล่าสุดตลอดเวลา
  useEffect(() => {
    const listener = pan.addListener((value) => {
      currentPan.current = value;
    });
    return () => pan.removeAllListeners();
  }, []);

  const [boxSize, setBoxSize] = useState({ width: 220, height: 100 }); // ขนาดกล่องที่แสดงผล
  const currentSize = useRef({ width: 220, height: 100 }); // ความจำขนาดล่าสุด
  const startSize = useRef({ width: 220, height: 100 }); // ขนาดตอนเริ่มยืดหด

  // --- ฟังก์ชันที่ 1: ระบบลากย้ายกล่อง (Move) ---
  const moveResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsScrollEnabled(false); // ปิดเลื่อนจอ
        pan.setOffset({ x: currentPan.current.x, y: currentPan.current.y });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (e, gestureState) => {
        let newX = gestureState.dx;
        let newY = gestureState.dy;

        // คำนวณขอบเขตไม่ให้ลากทะลุจอ
        const maxX = containerSize.current.width - currentSize.current.width;
        const maxY = containerSize.current.height - currentSize.current.height;

        const offsetX = pan.x._offset;
        const offsetY = pan.y._offset;

        let clampedX = Math.max(-offsetX, Math.min(newX, maxX - offsetX));
        let clampedY = Math.max(-offsetY, Math.min(newY, maxY - offsetY));

        pan.setValue({ x: clampedX, y: clampedY });
      },
      onPanResponderRelease: () => {
        pan.flattenOffset();
        setIsScrollEnabled(true); // เปิดเลื่อนจอ
      },
      onPanResponderTerminate: () => setIsScrollEnabled(true)
    })
  ).current;

  // --- ฟังก์ชันที่ 2: ระบบย่อขยายกล่อง (Resize) ---
  const resizeResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: () => {
        setIsScrollEnabled(false); // ปิดเลื่อนจอ
        // จำขนาดล่าสุดไว้ก่อนเริ่มดึง
        startSize.current = { width: currentSize.current.width, height: currentSize.current.height };
      },
      onPanResponderMove: (e, gestureState) => {
        let newWidth = startSize.current.width + gestureState.dx;
        let newHeight = startSize.current.height + gestureState.dy;

        // ป้องกันกล่องเล็กเกินไป
        newWidth = Math.max(100, newWidth);
        newHeight = Math.max(60, newHeight);

        // ป้องกันขยายทะลุขอบจอ
        const maxWidth = containerSize.current.width - currentPan.current.x;
        const maxHeight = containerSize.current.height - currentPan.current.y;
        
        newWidth = Math.min(newWidth, maxWidth);
        newHeight = Math.min(newHeight, maxHeight);

        // เซฟค่าใหม่
        currentSize.current = { width: newWidth, height: newHeight };
        setBoxSize({ width: newWidth, height: newHeight });
      },
      onPanResponderRelease: () => setIsScrollEnabled(true),
      onPanResponderTerminate: () => setIsScrollEnabled(true)
    })
  ).current;

  return (
    <ScrollView 
      contentContainerStyle={styles.scrollContainer} 
      scrollEnabled={isScrollEnabled} 
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.header}>🎮 Screen Translator</Text>

      {/* --- ส่วนเลือกภาษา --- */}
      <View style={styles.langContainer}>
        <View style={styles.pickerWrapper}>
          <Text style={styles.label}>แปลจาก:</Text>
          <Picker selectedValue={sourceLang} onValueChange={setSourceLang} style={styles.picker}>
            <Picker.Item label="🇯🇵 ญี่ปุ่น" value="ja" />
            <Picker.Item label="🇺🇸 อังกฤษ" value="en" />
          </Picker>
        </View>
        <View style={styles.pickerWrapper}>
          <Text style={styles.label}>เป็น:</Text>
          <Picker selectedValue={targetLang} onValueChange={setTargetLang} style={styles.picker}>
            <Picker.Item label="🇹🇭 ไทย" value="th" />
            <Picker.Item label="🇺🇸 อังกฤษ" value="en" />
          </Picker>
        </View>
      </View>

      {/* --- ส่วนพื้นที่จำลองหน้าจอเกม --- */}
      <View 
        style={styles.previewArea} 
        onLayout={(e) => { 
          // คำนวณขนาดพื้นที่สีดำอัตโนมัติ
          containerSize.current = e.nativeEvent.layout; 
        }}
      >
        <Text style={styles.previewText}>ลากและย่อขยายกล่องได้เลย (ไม่หลุดกรอบแน่นอน)</Text>
        
        <Animated.View 
          style={[
            styles.boundingBox, 
            { 
              width: boxSize.width, 
              height: boxSize.height, 
              transform: [{ translateX: pan.x }, { translateY: pan.y }] 
            }
          ]}
        >
          {/* พื้นที่สำหรับจิ้มแล้วลาก (Move) */}
          <View style={styles.dragZone} {...moveResponder.panHandlers}>
            <Text style={styles.boxText}>กรอบข้อความ</Text>
          </View>

          {/* ปุ่มมุมขวาล่างสำหรับยืดหด (Resize) */}
          <View style={styles.resizeHandle} {...resizeResponder.panHandlers}>
            <Text style={{color: '#fff', fontSize: 12}}>↘</Text>
          </View>
        </Animated.View>
      </View>

      {/* --- ปุ่มเริ่มอัดหน้าจอ --- */}
      <TouchableOpacity 
        style={styles.recordButton} 
        onPress={() => { 
          console.log('กำลังเรียก iOS Native Module...'); 
          showBroadcastPicker(); 
        }}
      >
        <Text style={styles.recordButtonText}>🔴 เริ่มอัดหน้าจอและแปลเลย!</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, backgroundColor: '#1E1E1E', alignItems: 'center', paddingTop: 50 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 15 },
  langContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '90%', backgroundColor: '#2C2C2C', padding: 10, borderRadius: 10, marginBottom: 15 },
  pickerWrapper: { flex: 1 },
  label: { color: '#AAAAAA', fontSize: 14, marginBottom: 5 },
  picker: { color: '#FFFFFF', backgroundColor: '#3C3C3C' },
  previewArea: { 
    width: '95%', flex: 1, minHeight: 350, backgroundColor: '#000000', 
    borderColor: '#444', borderWidth: 2, borderRadius: 10, 
    justifyContent: 'center', alignItems: 'center', marginBottom: 20, 
    overflow: 'hidden' 
  },
  previewText: { color: '#555', position: 'absolute', top: 10, fontSize: 12 },
  boundingBox: { 
    borderColor: '#00FF00', borderWidth: 2, borderStyle: 'dashed', 
    backgroundColor: 'rgba(0, 255, 0, 0.1)', position: 'absolute', 
    top: 0, left: 0 
  },
  dragZone: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  resizeHandle: { 
    position: 'absolute', bottom: 0, right: 0, width: 40, height: 40, 
    backgroundColor: 'rgba(0, 255, 0, 0.8)', borderTopLeftRadius: 15, 
    justifyContent: 'center', alignItems: 'center' 
  },
  boxText: { color: '#00FF00', fontWeight: 'bold', fontSize: 14, opacity: 0.7 },
  recordButton: { 
    backgroundColor: '#FF3B30', paddingVertical: 15, paddingHorizontal: 30, 
    borderRadius: 25, shadowColor: '#FF3B30', shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.5, shadowRadius: 5 
  },
  recordButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
});