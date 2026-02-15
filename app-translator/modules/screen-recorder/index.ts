import { requireNativeModule } from 'expo-modules-core';

// ดึงโมดูล Swift ที่เราตั้งชื่อไว้ว่า "ScreenRecorder" เข้ามา
const ScreenRecorder = requireNativeModule('ScreenRecorder');

// สร้างฟังก์ชันส่งออกไปให้ App.js ใช้
export function showBroadcastPicker() {
  return ScreenRecorder.showBroadcastPicker();
}
