import ExpoModulesCore
import ReplayKit // ดึงระบบอัดหน้าจอของ Apple มาใช้

public class ScreenRecorderModule: Module {
  public func definition() -> ModuleDefinition {
    // ชื่อโมดูลที่จะส่งไปให้ React Native รู้จัก
    Name("ScreenRecorder")

    // สร้างฟังก์ชันสำหรับเรียกหน้าต่างอัดหน้าจอ
    Function("showBroadcastPicker") {
      // บังคับให้โค้ดทำงานบนหน้าจอหลัก (Main Thread)
      DispatchQueue.main.async {
        let pickerView = RPSystemBroadcastPickerView(frame: .zero)
        pickerView.showsMicrophoneButton = false // ปิดปุ่มไมค์ เพราะเราเอาแค่ภาพ
        
        // ทริค: สั่งจำลองการ "กดปุ่ม" เพื่อให้หน้าต่างเด้งขึ้นมาทันทีโดยไม่ต้องรอให้ผู้ใช้กดซ้ำ
        for view in pickerView.subviews {
          if let button = view as? UIButton {
            button.sendActions(for: .allTouchEvents)
            break
          }
        }
      }
    }
  }
}
